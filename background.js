import {
  SCHEMA, STORAGE_KEY, appendCaptured, buildContext, defaultState,
  publicSnapshot, safeProject, verifyState
} from "./shared/core.js";

let writeQueue = Promise.resolve();

async function readState() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const state = stored[STORAGE_KEY];
  if (!state || state.schema !== SCHEMA) {
    const fresh = defaultState();
    await chrome.storage.local.set({ [STORAGE_KEY]: fresh });
    return fresh;
  }
  return state;
}

function mutate(mutator) {
  const operation = writeQueue.then(async () => {
    const current = await readState();
    const next = await mutator(current);
    await chrome.storage.local.set({ [STORAGE_KEY]: next });
    return next;
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}

chrome.runtime.onInstalled.addListener(() => {
  readState().catch(() => undefined);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => sendResponse({ ok: false, error: error.message || "MaglaSync error" }));
  return true;
});

async function handleMessage(message, sender) {
  switch (message?.type) {
    case "GET_STATE": {
      const state = await readState();
      return { state: publicSnapshot(state), integrityErrors: await verifyState(state) };
    }
    case "SAVE_PROJECT": {
      const next = await mutate((state) => ({
        ...state,
        project: safeProject({ ...message.project, id: state.project?.id, createdAt: state.project?.createdAt }),
        updatedAt: new Date().toISOString()
      }));
      return { state: publicSnapshot(next) };
    }
    case "SET_SETTINGS": {
      const next = await mutate((state) => ({
        ...state,
        settings: { ...state.settings, ...message.settings },
        updatedAt: new Date().toISOString()
      }));
      return { state: publicSnapshot(next) };
    }
    case "CAPTURE_MESSAGES": {
      const next = await mutate(async (state) => (await appendCaptured(state, Array.isArray(message.messages) ? message.messages : [])).state);
      return { state: publicSnapshot(next), messageCount: next.messages.length, checkpointCount: next.checkpoints.length };
    }
    case "GET_CONTEXT": {
      const state = await readState();
      return {
        project: state.project,
        settings: state.settings,
        context: buildContext(state, { currentChatId: message.chatId || sender.tab?.url || "" }),
        messageCount: state.messages.length,
        checkpointCount: state.checkpoints.length,
        integrityErrors: await verifyState(state)
      };
    }
    case "OPEN_DASHBOARD": {
      await chrome.runtime.openOptionsPage();
      return {};
    }
    case "IMPORT_STATE": {
      const incoming = message.state;
      const errors = await verifyState(incoming);
      if (errors.length) throw new Error(`Backup failed verification: ${errors[0]}`);
      const next = await mutate(() => ({ ...incoming, updatedAt: new Date().toISOString() }));
      return { state: publicSnapshot(next) };
    }
    case "DELETE_ALL": {
      const fresh = await mutate(() => defaultState());
      return { state: fresh };
    }
    default:
      throw new Error("Unsupported MaglaSync request.");
  }
}
