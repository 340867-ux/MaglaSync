import test from "node:test";
import assert from "node:assert/strict";
import {
  LEGACY_SCHEMA, MAX_RECENT_MESSAGES, appendCaptured, attachChat, buildContext,
  defaultState, detachChat, extractMaglaSyncUpdates, isChatAttached, migrateState,
  safeProject, verifyState
} from "../shared/core.js";

function withProject() {
  const state = defaultState();
  state.project = safeProject({ id: "project_test", name: "Apartment", goal: "Buy safely", rules: "Never send money without approval" });
  return state;
}

function withAttachedChat(chatId = "chatgpt:/c/1", platform = "chatgpt") {
  return attachChat(withProject(), { chatId, platform }).state;
}

test("starts private: no chat is connected and extended history is off", () => {
  const state = withProject();
  assert.deepEqual(state.chatBindings, []);
  assert.equal(state.settings.saveFullHistory, false);
  assert.equal(isChatAttached(state, "chatgpt:/c/1", "chatgpt"), false);
});

test("rejects every message from a chat the user did not connect", async () => {
  const result = await appendCaptured(withProject(), [
    { platform: "chatgpt", chatId: "chatgpt:/c/private", role: "user", ordinal: 0, text: "Private conversation" }
  ]);
  assert.equal(result.addedMessages, 0);
  assert.equal(result.rejectedMessages, 1);
  assert.equal(result.state.messages.length, 0);
});

test("captures connected chat messages, deduplicates, and verifies the chain", async () => {
  const initial = withAttachedChat();
  const first = await appendCaptured(initial, [{ platform: "chatgpt", chatId: "chatgpt:/c/1", role: "user", ordinal: 0, text: "Compare these two apartments." }]);
  assert.equal(first.addedMessages, 1);
  const duplicate = await appendCaptured(first.state, [{ platform: "chatgpt", chatId: "chatgpt:/c/1", role: "user", ordinal: 0, text: "Compare these two apartments." }]);
  assert.equal(duplicate.addedMessages, 0);
  assert.deepEqual(await verifyState(duplicate.state), []);
});

test("rejects a platform mismatch even when the chat id exists", async () => {
  const result = await appendCaptured(withAttachedChat(), [
    { platform: "claude", chatId: "chatgpt:/c/1", role: "user", ordinal: 0, text: "Wrong source" }
  ]);
  assert.equal(result.addedMessages, 0);
  assert.equal(result.rejectedMessages, 1);
});

test("preserves intentionally repeated messages at different positions", async () => {
  const result = await appendCaptured(withAttachedChat("chatgpt:/c/repeat"), [
    { platform: "chatgpt", chatId: "chatgpt:/c/repeat", role: "user", ordinal: 0, text: "Continue" },
    { platform: "chatgpt", chatId: "chatgpt:/c/repeat", role: "user", ordinal: 2, text: "Continue" }
  ]);
  assert.equal(result.addedMessages, 2);
  assert.deepEqual(await verifyState(result.state), []);
});

test("extracts structured assistant updates only from a connected chat", async () => {
  const text = `Done.\n\n\`\`\`maglasync\n{"summary":"Two offers received","decisions":["Inspect both"],"verified":["Offer A is $100k"],"blockers":[],"nextSteps":["Book inspection"],"constraints":["Budget $120k"]}\n\`\`\``;
  const updates = extractMaglaSyncUpdates(text);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].verified[0], "Offer A is $100k");
  const state = withAttachedChat("claude:/chat/2", "claude");
  const captured = await appendCaptured(state, [{ platform: "claude", chatId: "claude:/chat/2", role: "assistant", text }]);
  assert.equal(captured.addedCheckpoints, 1);
  assert.deepEqual(await verifyState(captured.state), []);
});

test("ignores malformed update blocks but keeps the recent source message", async () => {
  const state = withAttachedChat("gemini:/app/3", "gemini");
  const captured = await appendCaptured(state, [{ platform: "gemini", chatId: "gemini:/app/3", role: "assistant", text: "```maglasync\nnot-json\n```" }]);
  assert.equal(captured.addedMessages, 1);
  assert.equal(captured.addedCheckpoints, 0);
});

test("keeps only a short recent buffer unless extended history is explicitly enabled", async () => {
  const messages = Array.from({ length: 30 }, (_, ordinal) => ({
    platform: "chatgpt", chatId: "chatgpt:/c/buffer", role: "user", ordinal, text: `Message ${ordinal}`
  }));
  const short = await appendCaptured(withAttachedChat("chatgpt:/c/buffer"), messages);
  assert.equal(short.state.messages.length, MAX_RECENT_MESSAGES);
  const fullState = withAttachedChat("chatgpt:/c/buffer");
  fullState.settings.saveFullHistory = true;
  const full = await appendCaptured(fullState, messages);
  assert.equal(full.state.messages.length, 30);
});

test("generated context uses only explicitly connected chats", async () => {
  let state = attachChat(withAttachedChat("chatgpt:/c/old"), { chatId: "claude:/chat/new", platform: "claude" }).state;
  state = (await appendCaptured(state, [{ platform: "chatgpt", chatId: "chatgpt:/c/old", role: "assistant", text: "Inspect the title documents." }])).state;
  const context = buildContext(state, { currentChatId: "claude:/chat/new" });
  assert.match(context, /Inspect the title documents/);
  state.chatBindings = state.chatBindings.filter((binding) => binding.chatId !== "chatgpt:/c/old");
  assert.doesNotMatch(buildContext(state, { currentChatId: "claude:/chat/new" }), /Inspect the title documents/);
});

test("generated context preserves goal, rules, and warns that AI claims are not verified", () => {
  const state = withAttachedChat("chatgpt:/c/new");
  const context = buildContext(state, { currentChatId: "chatgpt:/c/new" });
  assert.match(context, /Buy safely/);
  assert.match(context, /Never send money without approval/);
  assert.match(context, /does not independently verify AI claims/);
  assert.match(context, /```maglasync/);
});

test("current chat is not echoed back into its own context", async () => {
  const captured = await appendCaptured(withAttachedChat("chatgpt:/c/same"), [{ platform: "chatgpt", chatId: "chatgpt:/c/same", role: "user", text: "unique-current-message" }]);
  assert.doesNotMatch(buildContext(captured.state, { currentChatId: "chatgpt:/c/same" }), /unique-current-message/);
});

test("a changed project goal makes old chat connections stale and fail closed", async () => {
  const state = withAttachedChat();
  state.project.goalVersion += 1;
  assert.equal(isChatAttached(state, "chatgpt:/c/1", "chatgpt"), false);
  const result = await appendCaptured(state, [{ platform: "chatgpt", chatId: "chatgpt:/c/1", role: "user", text: "Must not save" }]);
  assert.equal(result.addedMessages, 0);
  assert.equal(buildContext(result.state, { currentChatId: "chatgpt:/c/1" }), "");
});

test("disconnecting a chat removes its local records and repairs the remaining chain", async () => {
  const captured = await appendCaptured(withAttachedChat(), [{ platform: "chatgpt", chatId: "chatgpt:/c/1", role: "user", text: "Remove me" }]);
  const detached = await detachChat(captured.state, "chatgpt:/c/1", { purge: true });
  assert.equal(detached.chatBindings.length, 0);
  assert.equal(detached.messages.length, 0);
  assert.deepEqual(await verifyState(detached), []);
});

test("editing a captured record is detected", async () => {
  const captured = await appendCaptured(withAttachedChat(), [{ platform: "chatgpt", chatId: "chatgpt:/c/1", role: "user", text: "Original" }]);
  captured.state.messages[0].text = "Changed";
  assert.match((await verifyState(captured.state)).join(" "), /Changed record/);
});

test("legacy backups migrate with old chats disconnected and old conversation records removed", async () => {
  const captured = await appendCaptured(withAttachedChat(), [
    { platform: "chatgpt", chatId: "chatgpt:/c/1", role: "user", text: "Legacy message" }
  ]);
  const legacy = captured.state;
  legacy.schema = LEGACY_SCHEMA;
  delete legacy.chatBindings;
  legacy.settings = { autoLoad: true, captureEnabled: true };
  assert.deepEqual(await verifyState(legacy), []);
  const migrated = await migrateState(legacy);
  assert.deepEqual(migrated.chatBindings, []);
  assert.deepEqual(migrated.messages, []);
  assert.deepEqual(migrated.checkpoints, []);
  assert.equal(migrated.settings.saveFullHistory, false);
  assert.deepEqual(await verifyState(migrated), []);
});

test("duplicate connected-chat identities are detected", async () => {
  const state = withAttachedChat();
  state.chatBindings.push(structuredClone(state.chatBindings[0]));
  assert.match((await verifyState(state)).join(" "), /duplicated/);
});

test("project requires a useful name and goal", () => {
  assert.throws(() => safeProject({ name: "", goal: "" }), /required/);
});
