export const SCHEMA = "maglasync/free/v2";
export const LEGACY_SCHEMA = "maglasync/free/v1";
export const STORAGE_KEY = "maglaSyncState";
export const MAX_MESSAGE_CHARS = 16000;
export const MAX_MESSAGES = 400;
export const MAX_RECENT_MESSAGES = 24;
export const MAX_CHECKPOINTS = 150;
export const CONTEXT_CHAR_LIMIT = 12000;

const SUPPORTED_PLATFORMS = new Set(["chatgpt", "claude", "gemini"]);

export function defaultState() {
  return {
    schema: SCHEMA,
    project: null,
    chatBindings: [],
    messages: [],
    checkpoints: [],
    settings: { captureEnabled: true, saveFullHistory: false },
    integrityTip: "0".repeat(64),
    nextSequence: 1,
    updatedAt: new Date(0).toISOString()
  };
}

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function cleanText(value, limit = MAX_MESSAGE_CHARS) {
  return String(value || "").replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim().slice(0, limit);
}

export function safeProject(input = {}) {
  const name = cleanText(input.name, 80);
  const goal = cleanText(input.goal, 1200);
  const rules = cleanText(input.rules, 2400);
  if (!name || !goal) throw new Error("Project name and goal are required.");
  return {
    id: cleanText(input.id, 80) || `project_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`,
    name,
    goal,
    rules,
    goalVersion: positiveInteger(input.goalVersion, 1),
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function safeSettings(input = {}) {
  return {
    captureEnabled: input.captureEnabled !== false,
    saveFullHistory: input.saveFullHistory === true
  };
}

export function getChatBinding(state, chatId) {
  const id = cleanText(chatId, 200);
  return (Array.isArray(state?.chatBindings) ? state.chatBindings : []).find((binding) => binding.chatId === id) || null;
}

export function isChatAttached(state, chatId, platform = "") {
  const binding = getChatBinding(state, chatId);
  if (!binding || !state?.project || binding.projectId !== state.project.id) return false;
  if (platform && binding.platform !== cleanText(platform, 32)) return false;
  return binding.goalVersion === positiveInteger(state.project.goalVersion, 1);
}

export function attachChat(state, input = {}) {
  if (!state?.project) throw new Error("Create the project before connecting a chat.");
  const chatId = cleanText(input.chatId, 200);
  const platform = cleanText(input.platform, 32);
  if (!chatId || !SUPPORTED_PLATFORMS.has(platform) || !chatId.startsWith(`${platform}:`)) {
    throw new Error("This is not a supported AI chat.");
  }
  const now = new Date().toISOString();
  const existing = getChatBinding(state, chatId);
  const binding = {
    chatId,
    platform,
    projectId: state.project.id,
    branchId: "main",
    goalVersion: positiveInteger(state.project.goalVersion, 1),
    connectedAt: existing?.connectedAt || now,
    updatedAt: now
  };
  const next = structuredClone(state);
  next.chatBindings = [...(next.chatBindings || []).filter((item) => item.chatId !== chatId), binding];
  next.updatedAt = now;
  return { state: next, binding };
}

export async function detachChat(state, chatId, { purge = true } = {}) {
  const id = cleanText(chatId, 200);
  const next = structuredClone(state);
  next.chatBindings = (next.chatBindings || []).filter((binding) => binding.chatId !== id);
  if (purge) {
    next.messages = (next.messages || []).filter((message) => message.chatId !== id);
    next.checkpoints = (next.checkpoints || []).filter((checkpoint) => checkpoint.chatId !== id);
    await rechain(next);
  }
  next.updatedAt = new Date().toISOString();
  return next;
}

export async function compactHistory(state) {
  const next = structuredClone(state);
  if (!next.settings?.saveFullHistory) next.messages = (next.messages || []).slice(-MAX_RECENT_MESSAGES);
  next.checkpoints = (next.checkpoints || []).slice(-MAX_CHECKPOINTS);
  await rechain(next);
  next.updatedAt = new Date().toISOString();
  return next;
}

export async function migrateState(input) {
  if (!input || ![SCHEMA, LEGACY_SCHEMA].includes(input.schema)) throw new Error("Unknown MaglaSync data format.");
  const isLegacy = input.schema === LEGACY_SCHEMA;
  const next = structuredClone(input);
  next.schema = SCHEMA;
  next.project = next.project ? safeProject({ ...next.project, goalVersion: positiveInteger(next.project.goalVersion, 1) }) : null;
  next.chatBindings = Array.isArray(next.chatBindings) ? next.chatBindings.map((binding) => ({
    chatId: cleanText(binding.chatId, 200),
    platform: cleanText(binding.platform, 32),
    projectId: cleanText(binding.projectId, 80),
    branchId: cleanText(binding.branchId, 40) || "main",
    goalVersion: positiveInteger(binding.goalVersion, 1),
    connectedAt: binding.connectedAt || new Date(0).toISOString(),
    updatedAt: binding.updatedAt || binding.connectedAt || new Date(0).toISOString()
  })).filter((binding) => binding.chatId && SUPPORTED_PLATFORMS.has(binding.platform)) : [];
  next.messages = isLegacy ? [] : (Array.isArray(next.messages) ? next.messages : []);
  next.checkpoints = isLegacy ? [] : (Array.isArray(next.checkpoints) ? next.checkpoints : []);
  next.settings = safeSettings(next.settings);
  next.nextSequence = positiveInteger(next.nextSequence, 1);
  await rechain(next);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function extractMaglaSyncUpdates(text) {
  const updates = [];
  const pattern = /```maglasync\s*([\s\S]*?)```/gi;
  for (const match of String(text || "").matchAll(pattern)) {
    try {
      const raw = JSON.parse(match[1]);
      const update = {
        summary: cleanText(raw.summary, 800),
        decisions: list(raw.decisions),
        verified: list(raw.verified),
        blockers: list(raw.blockers),
        nextSteps: list(raw.nextSteps),
        constraints: list(raw.constraints)
      };
      if (update.summary || Object.values(update).some((value) => Array.isArray(value) && value.length)) updates.push(update);
    } catch {
      // A malformed model block is ignored and remains visible in the recent-message buffer.
    }
  }
  return updates;
}

function list(value) {
  return Array.isArray(value) ? value.map((item) => cleanText(item, 600)).filter(Boolean).slice(0, 30) : [];
}

export async function appendCaptured(state, captured) {
  const next = structuredClone(state);
  if (!next.project) return { state: next, addedMessages: 0, addedCheckpoints: 0, rejectedMessages: Array.isArray(captured) ? captured.length : 0 };
  next.chatBindings = Array.isArray(next.chatBindings) ? next.chatBindings : [];
  next.settings = safeSettings(next.settings);
  const known = new Set((next.messages || []).map((message) => message.fingerprint));
  const knownCheckpoints = new Set((next.checkpoints || []).map((checkpoint) => checkpoint.fingerprint));
  let addedMessages = 0;
  let addedCheckpoints = 0;
  let rejectedMessages = 0;
  let tip = next.integrityTip || "0".repeat(64);
  let sequence = positiveInteger(next.nextSequence, 1);

  for (const item of Array.isArray(captured) ? captured : []) {
    const role = item.role === "assistant" ? "assistant" : "user";
    const text = cleanText(item.text);
    const platform = cleanText(item.platform, 32);
    const chatId = cleanText(item.chatId, 200);
    const ordinal = Number.isInteger(item.ordinal) && item.ordinal >= 0 ? item.ordinal : 0;
    const binding = getChatBinding(next, chatId);
    if (!text || !platform || !chatId || !binding || !isChatAttached(next, chatId, platform)) {
      rejectedMessages += 1;
      continue;
    }
    const fingerprint = await sha256(canonical({ projectId: next.project.id, branchId: binding.branchId, platform, chatId, role, ordinal, text }));
    if (known.has(fingerprint)) continue;
    const body = {
      id: `msg_${fingerprint.slice(0, 16)}`,
      projectId: next.project.id,
      branchId: binding.branchId,
      goalVersion: binding.goalVersion,
      platform,
      chatId,
      role,
      ordinal,
      text,
      capturedAt: item.capturedAt || new Date().toISOString(),
      sequence: sequence++,
      fingerprint,
      previousHash: tip
    };
    body.hash = await sha256(canonical(body));
    tip = body.hash;
    next.messages.push(body);
    known.add(fingerprint);
    addedMessages += 1;

    if (role === "assistant") {
      for (const update of extractMaglaSyncUpdates(text)) {
        const updateFingerprint = await sha256(canonical({ projectId: next.project.id, branchId: binding.branchId, chatId, goalVersion: binding.goalVersion, update }));
        if (knownCheckpoints.has(updateFingerprint)) continue;
        const checkpointBody = {
          id: `cp_${updateFingerprint.slice(0, 16)}`,
          projectId: next.project.id,
          branchId: binding.branchId,
          goalVersion: binding.goalVersion,
          platform,
          chatId,
          capturedAt: body.capturedAt,
          sequence: sequence++,
          fingerprint: updateFingerprint,
          update,
          sourceMessageFingerprint: body.fingerprint,
          previousHash: tip
        };
        checkpointBody.hash = await sha256(canonical(checkpointBody));
        tip = checkpointBody.hash;
        next.checkpoints.push(checkpointBody);
        knownCheckpoints.add(updateFingerprint);
        addedCheckpoints += 1;
      }
    }
  }

  const messageLimit = next.settings.saveFullHistory ? MAX_MESSAGES : MAX_RECENT_MESSAGES;
  next.messages = next.messages.slice(-messageLimit);
  next.checkpoints = next.checkpoints.slice(-MAX_CHECKPOINTS);
  next.nextSequence = sequence;
  await rechain(next);
  next.updatedAt = new Date().toISOString();
  return { state: next, addedMessages, addedCheckpoints, rejectedMessages };
}

export async function verifyState(state) {
  const errors = [];
  if (!state || ![SCHEMA, LEGACY_SCHEMA].includes(state.schema)) return ["Unknown MaglaSync data format."];
  const messages = Array.isArray(state.messages) ? state.messages : [];
  const checkpoints = Array.isArray(state.checkpoints) ? state.checkpoints : [];
  if (!Array.isArray(state.messages)) errors.push("Message history is not a list.");
  if (!Array.isArray(state.checkpoints)) errors.push("Checkpoint history is not a list.");
  if (state.schema === SCHEMA) {
    if (!Array.isArray(state.chatBindings)) errors.push("Connected chat list is not a list.");
    const bindingIds = new Set();
    for (const binding of Array.isArray(state.chatBindings) ? state.chatBindings : []) {
      if (!binding.chatId || bindingIds.has(binding.chatId)) errors.push("Connected chat identity is invalid or duplicated.");
      bindingIds.add(binding.chatId);
      if (!SUPPORTED_PLATFORMS.has(binding.platform) || !binding.chatId.startsWith(`${binding.platform}:`)) errors.push(`Unsupported connected chat ${binding.chatId || "unknown"}.`);
      if (state.project && binding.projectId !== state.project.id) errors.push(`Wrong project binding at ${binding.chatId}.`);
    }
  }
  let tip = "0".repeat(64);
  const combined = [...messages, ...checkpoints].sort((a, b) => a.sequence - b.sequence);
  const sequences = new Set();
  for (const entry of combined) {
    if (!Number.isInteger(entry.sequence) || sequences.has(entry.sequence)) errors.push(`Invalid sequence at ${entry.id}.`);
    sequences.add(entry.sequence);
    if (entry.previousHash !== tip) errors.push(`History break at ${entry.id}.`);
    const body = { ...entry };
    delete body.hash;
    if (await sha256(canonical(body)) !== entry.hash) errors.push(`Changed record ${entry.id}.`);
    tip = entry.hash;
  }
  if (combined.length && state.integrityTip !== tip) errors.push("The saved chain tip does not match history.");
  return errors;
}

async function rechain(state) {
  let tip = "0".repeat(64);
  const combined = [...(state.messages || []), ...(state.checkpoints || [])].sort((a, b) => a.sequence - b.sequence);
  for (const entry of combined) {
    entry.previousHash = tip;
    const body = { ...entry };
    delete body.hash;
    entry.hash = await sha256(canonical(body));
    tip = entry.hash;
  }
  state.integrityTip = tip;
}

function bullets(title, items) {
  return items?.length ? `${title}:\n${items.map((item) => `- ${item}`).join("\n")}` : "";
}

export function buildContext(state, { currentChatId = "", allowUnattached = false } = {}) {
  if (!state.project) return "";
  const currentGoalVersion = positiveInteger(state.project.goalVersion, 1);
  const eligibleBindings = (state.chatBindings || []).filter((binding) => binding.projectId === state.project.id && binding.goalVersion === currentGoalVersion);
  const eligibleChatIds = new Set(eligibleBindings.map((binding) => binding.chatId));
  if (currentChatId && !allowUnattached && !eligibleChatIds.has(currentChatId)) return "";
  const eligibleCheckpoints = (state.checkpoints || []).filter((checkpoint) => eligibleChatIds.has(checkpoint.chatId));
  const latest = eligibleCheckpoints.at(-1)?.update;
  const recent = (state.messages || [])
    .filter((message) => eligibleChatIds.has(message.chatId) && message.chatId !== currentChatId)
    .slice(-12)
    .map((message) => `${message.role === "assistant" ? "AI" : "USER"}: ${stripUpdateBlock(message.text)}`)
    .filter((line) => line.length > 6);
  const sections = [
    `[MAGLASYNC CONTEXT — ${state.project.name}]`,
    `Goal (version ${currentGoalVersion}):\n${state.project.goal}`,
    state.project.rules ? `Rules that must be preserved:\n${state.project.rules}` : "",
    latest?.summary ? `Latest reported project state:\n${latest.summary}` : "",
    bullets("Decisions", latest?.decisions),
    bullets("Reported completed results — review before relying on them", latest?.verified),
    bullets("Blockers", latest?.blockers),
    bullets("Next steps", latest?.nextSteps),
    bullets("Additional constraints", latest?.constraints),
    recent.length ? `Recent context from chats explicitly connected to this project:\n${recent.join("\n\n")}` : "",
    `Continuity rule: never present an intention as completed work. MaglaSync does not independently verify AI claims. When this conversation materially changes the project, end the relevant response with exactly one structured update in this form:\n\n\`\`\`maglasync\n{"summary":"current factual state","decisions":[],"verified":[],"blockers":[],"nextSteps":[],"constraints":[]}\n\`\`\`\n\nOnly put completed facts in verified when this conversation contains concrete support.`,
    `[END MAGLASYNC CONTEXT]`
  ].filter(Boolean);
  const context = sections.join("\n\n");
  return context.length <= CONTEXT_CHAR_LIMIT ? context : `${context.slice(0, CONTEXT_CHAR_LIMIT - 120)}\n\n[Context shortened by MaglaSync]\n[END MAGLASYNC CONTEXT]`;
}

export function stripUpdateBlock(text) {
  return cleanText(String(text || "").replace(/```maglasync\s*[\s\S]*?```/gi, ""), 2400);
}

export function publicSnapshot(state) {
  return {
    schema: state.schema,
    project: state.project,
    chatBindings: state.chatBindings || [],
    messages: state.messages || [],
    checkpoints: state.checkpoints || [],
    settings: safeSettings(state.settings),
    integrityTip: state.integrityTip,
    nextSequence: state.nextSequence,
    updatedAt: state.updatedAt
  };
}

function positiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
