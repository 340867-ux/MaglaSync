export const SCHEMA = "maglasync/free/v1";
export const STORAGE_KEY = "maglaSyncState";
export const MAX_MESSAGE_CHARS = 16000;
export const MAX_MESSAGES = 400;
export const MAX_CHECKPOINTS = 150;
export const CONTEXT_CHAR_LIMIT = 12000;

export function defaultState() {
  return {
    schema: SCHEMA,
    project: null,
    messages: [],
    checkpoints: [],
    settings: { autoLoad: true, captureEnabled: true },
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
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
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
      // A malformed model block is ignored and remains visible in the saved message.
    }
  }
  return updates;
}

function list(value) {
  return Array.isArray(value) ? value.map((item) => cleanText(item, 600)).filter(Boolean).slice(0, 30) : [];
}

export async function appendCaptured(state, captured) {
  const next = structuredClone(state);
  if (!next.project) return { state: next, addedMessages: 0, addedCheckpoints: 0 };
  const known = new Set(next.messages.map((message) => message.fingerprint));
  const knownCheckpoints = new Set(next.checkpoints.map((checkpoint) => checkpoint.fingerprint));
  let addedMessages = 0;
  let addedCheckpoints = 0;
  let tip = next.integrityTip || "0".repeat(64);
  let sequence = Number.isInteger(next.nextSequence) ? next.nextSequence : 1;

  for (const item of captured) {
    const role = item.role === "assistant" ? "assistant" : "user";
    const text = cleanText(item.text);
    const platform = cleanText(item.platform, 32);
    const chatId = cleanText(item.chatId, 200);
    const ordinal = Number.isInteger(item.ordinal) && item.ordinal >= 0 ? item.ordinal : 0;
    if (!text || !platform || !chatId) continue;
    const fingerprint = await sha256(canonical({ platform, chatId, role, ordinal, text }));
    if (known.has(fingerprint)) continue;
    const body = {
      id: `msg_${fingerprint.slice(0, 16)}`,
      projectId: next.project.id,
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
        const updateFingerprint = await sha256(canonical({ chatId, update }));
        if (knownCheckpoints.has(updateFingerprint)) continue;
        const checkpointBody = {
          id: `cp_${updateFingerprint.slice(0, 16)}`,
          projectId: next.project.id,
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

  next.messages = next.messages.slice(-MAX_MESSAGES);
  next.checkpoints = next.checkpoints.slice(-MAX_CHECKPOINTS);
  next.nextSequence = sequence;
  await rechain(next);
  next.updatedAt = new Date().toISOString();
  return { state: next, addedMessages, addedCheckpoints };
}

export async function verifyState(state) {
  const errors = [];
  if (!state || state.schema !== SCHEMA) return ["Unknown MaglaSync data format."];
  let tip = "0".repeat(64);
  const combined = [...state.messages, ...state.checkpoints].sort((a, b) => a.sequence - b.sequence);
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
  const combined = [...state.messages, ...state.checkpoints].sort((a, b) => a.sequence - b.sequence);
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

export function buildContext(state, { currentChatId = "" } = {}) {
  if (!state.project) return "";
  const latest = state.checkpoints.at(-1)?.update;
  const recent = state.messages
    .filter((message) => message.chatId !== currentChatId)
    .slice(-12)
    .map((message) => `${message.role === "assistant" ? "AI" : "USER"}: ${stripUpdateBlock(message.text)}`)
    .filter((line) => line.length > 6);
  const sections = [
    `[MAGLASYNC CONTEXT — ${state.project.name}]`,
    `Goal:\n${state.project.goal}`,
    state.project.rules ? `Rules that must be preserved:\n${state.project.rules}` : "",
    latest?.summary ? `Latest project state:\n${latest.summary}` : "",
    bullets("Decisions", latest?.decisions),
    bullets("Verified results", latest?.verified),
    bullets("Blockers", latest?.blockers),
    bullets("Next steps", latest?.nextSteps),
    bullets("Additional constraints", latest?.constraints),
    recent.length ? `Recent cross-chat context:\n${recent.join("\n\n")}` : "",
    `Continuity rule: never present an intention as completed work. When this conversation materially changes the project, end the relevant response with exactly one structured update in this form:\n\n\`\`\`maglasync\n{"summary":"current factual state","decisions":[],"verified":[],"blockers":[],"nextSteps":[],"constraints":[]}\n\`\`\`\n\nOnly put completed facts in verified when the conversation contains concrete support.`,
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
    messages: state.messages,
    checkpoints: state.checkpoints,
    settings: state.settings,
    integrityTip: state.integrityTip,
    nextSequence: state.nextSequence,
    updatedAt: state.updatedAt
  };
}
