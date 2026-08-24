import {
  LEGACY_SCHEMA, SCHEMA, STORAGE_KEY, appendCaptured, attachChat, buildContext,
  compactHistory, defaultState, detachChat, getChatBinding, isChatAttached,
  migrateState, publicSnapshot, safeProject, safeSettings, verifyState
} from "./shared/core.js";

const extensionApi = globalThis.browser ?? globalThis.chrome;

let writeQueue = Promise.resolve();

async function readState() {
  const stored = await extensionApi.storage.local.get(STORAGE_KEY);
  const state = stored[STORAGE_KEY];
  if (!state) {
    const fresh = defaultState();
    await extensionApi.storage.local.set({ [STORAGE_KEY]: fresh });
    return fresh;
  }
  if (state.schema === LEGACY_SCHEMA) {
    const legacyErrors = await verifyState(state);
    if (legacyErrors.length) return state;
    const migrated = await migrateState(state);
    await extensionApi.storage.local.set({ [STORAGE_KEY]: migrated });
    return migrated;
  }
  return state;
}

function mutate(mutator, { allowInvalidCurrent = false } = {}) {
  const operation = writeQueue.then(async () => {
    const current = await readState();
    const errors = await verifyState(current);
    if (errors.length && !allowInvalidCurrent) throw new Error(`Saved journal is locked: ${errors[0]}`);
    const next = await mutator(current);
    await extensionApi.storage.local.set({ [STORAGE_KEY]: next });
    return next;
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}

extensionApi.runtime.onInstalled.addListener(() => {
  readState().catch(() => undefined);
});

extensionApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => sendResponse({ ok: false, error: error.message || "MaglaSync error" }));
  return true;
});

async function handleMessage(message) {
  switch (message?.type) {
    case "GET_STATE": {
      const state = await readState();
      return { state: publicSnapshot(state), integrityErrors: await verifyState(state) };
    }
    case "SAVE_PROJECT": {
      const next = await mutate((state) => {
        const previous = state.project;
        const project = safeProject({
          ...message.project,
          id: previous?.id,
          createdAt: previous?.createdAt,
          goalVersion: previous?.goalVersion || 1
        });
        if (previous && (project.goal !== previous.goal || project.rules !== previous.rules)) {
          project.goalVersion = (previous.goalVersion || 1) + 1;
        }
        return { ...state, project, updatedAt: new Date().toISOString() };
      });
      return { state: publicSnapshot(next) };
    }
    case "SET_SETTINGS": {
      const next = await mutate(async (state) => {
        const updated = {
          ...state,
          settings: safeSettings({ ...state.settings, ...message.settings }),
          updatedAt: new Date().toISOString()
        };
        return updated.settings.saveFullHistory ? updated : compactHistory(updated);
      });
      return { state: publicSnapshot(next) };
    }
    case "ATTACH_CHAT": {
      let binding = null;
      const next = await mutate((state) => {
        const result = attachChat(state, { chatId: message.chatId, platform: message.platform });
        binding = result.binding;
        return result.state;
      });
      return { state: publicSnapshot(next), binding };
    }
    case "DETACH_CHAT": {
      const next = await mutate((state) => detachChat(state, message.chatId, { purge: true }));
      return { state: publicSnapshot(next) };
    }
    case "CAPTURE_MESSAGES": {
      let captureResult = null;
      const next = await mutate(async (state) => {
        captureResult = await appendCaptured(state, Array.isArray(message.messages) ? message.messages : []);
        return captureResult.state;
      });
      const counts = activeCounts(next);
      return {
        state: publicSnapshot(next),
        ...counts,
        addedMessages: captureResult.addedMessages,
        addedCheckpoints: captureResult.addedCheckpoints,
        rejectedMessages: captureResult.rejectedMessages
      };
    }
    case "GET_CONTEXT": {
      const state = await readState();
      const integrityErrors = await verifyState(state);
      const chatId = String(message.chatId || "");
      const binding = getChatBinding(state, chatId);
      const attached = isChatAttached(state, chatId, message.platform);
      const staleBinding = Boolean(binding && state.project && binding.goalVersion !== (state.project.goalVersion || 1));
      return {
        project: state.project,
        settings: safeSettings(state.settings),
        binding,
        isAttached: attached,
        staleBinding,
        context: integrityErrors.length || !attached ? "" : buildContext(state, { currentChatId: chatId }),
        ...activeCounts(state),
        integrityErrors
      };
    }
    case "GET_PREVIEW": {
      const state = await readState();
      const integrityErrors = await verifyState(state);
      return {
        project: state.project,
        settings: safeSettings(state.settings),
        context: integrityErrors.length ? "" : buildContext(state, { allowUnattached: true }),
        ...activeCounts(state),
        integrityErrors
      };
    }
    case "OPEN_DASHBOARD": {
      await extensionApi.runtime.openOptionsPage();
      return {};
    }
    case "IMPORT_STATE": {
      const incoming = message.state;
      const errors = await verifyState(incoming);
      if (errors.length) throw new Error(`Backup failed verification: ${errors[0]}`);
      const migrated = await migrateState(incoming);
      const next = await mutate(() => migrated, { allowInvalidCurrent: true });
      return { state: publicSnapshot(next) };
    }
    case "DELETE_ALL": {
      const fresh = await mutate(() => defaultState(), { allowInvalidCurrent: true });
      return { state: fresh };
    }
    default:
      throw new Error("Unsupported MaglaSync request.");
  }
}

function activeCounts(state) {
  const goalVersion = state.project?.goalVersion || 1;
  const activeIds = new Set((state.chatBindings || [])
    .filter((binding) => binding.projectId === state.project?.id && binding.goalVersion === goalVersion)
    .map((binding) => binding.chatId));
  return {
    messageCount: (state.messages || []).filter((message) => activeIds.has(message.chatId)).length,
    checkpointCount: (state.checkpoints || []).filter((checkpoint) => activeIds.has(checkpoint.chatId)).length,
    chatCount: activeIds.size
  };
}
