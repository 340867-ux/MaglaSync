import test from "node:test";
import assert from "node:assert/strict";
import {
  appendCaptured, buildContext, defaultState, extractMaglaSyncUpdates,
  safeProject, verifyState
} from "../shared/core.js";

function withProject() {
  const state = defaultState();
  state.project = safeProject({ id: "project_test", name: "Apartment", goal: "Buy safely", rules: "Never send money without approval" });
  return state;
}

test("captures messages, deduplicates them, and verifies the chain", async () => {
  const first = await appendCaptured(withProject(), [{ platform: "chatgpt", chatId: "chatgpt:/c/1", role: "user", ordinal: 0, text: "Compare these two apartments." }]);
  assert.equal(first.addedMessages, 1);
  const duplicate = await appendCaptured(first.state, [{ platform: "chatgpt", chatId: "chatgpt:/c/1", role: "user", ordinal: 0, text: "Compare these two apartments." }]);
  assert.equal(duplicate.addedMessages, 0);
  assert.deepEqual(await verifyState(duplicate.state), []);
});

test("preserves intentionally repeated messages at different positions", async () => {
  const result = await appendCaptured(withProject(), [
    { platform: "chatgpt", chatId: "chatgpt:/repeat", role: "user", ordinal: 0, text: "Continue" },
    { platform: "chatgpt", chatId: "chatgpt:/repeat", role: "user", ordinal: 2, text: "Continue" }
  ]);
  assert.equal(result.addedMessages, 2);
  assert.deepEqual(await verifyState(result.state), []);
});

test("extracts structured assistant updates", async () => {
  const text = `Done.\n\n\`\`\`maglasync\n{"summary":"Two offers received","decisions":["Inspect both"],"verified":["Offer A is $100k"],"blockers":[],"nextSteps":["Book inspection"],"constraints":["Budget $120k"]}\n\`\`\``;
  const updates = extractMaglaSyncUpdates(text);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].verified[0], "Offer A is $100k");
  const captured = await appendCaptured(withProject(), [{ platform: "claude", chatId: "claude:/chat/2", role: "assistant", text }]);
  assert.equal(captured.addedCheckpoints, 1);
  assert.deepEqual(await verifyState(captured.state), []);
});

test("ignores malformed update blocks but keeps the source message", async () => {
  const captured = await appendCaptured(withProject(), [{ platform: "gemini", chatId: "gemini:/app/3", role: "assistant", text: "```maglasync\nnot-json\n```" }]);
  assert.equal(captured.addedMessages, 1);
  assert.equal(captured.addedCheckpoints, 0);
});

test("generated context preserves goal, rules, and strict update protocol", async () => {
  const captured = await appendCaptured(withProject(), [{ platform: "chatgpt", chatId: "chatgpt:/old", role: "assistant", text: "We should inspect the title." }]);
  const context = buildContext(captured.state, { currentChatId: "chatgpt:/new" });
  assert.match(context, /Buy safely/);
  assert.match(context, /Never send money without approval/);
  assert.match(context, /never present an intention as completed work/);
  assert.match(context, /```maglasync/);
});

test("current chat is not echoed back into its own context", async () => {
  const captured = await appendCaptured(withProject(), [{ platform: "chatgpt", chatId: "chatgpt:/same", role: "user", text: "unique-current-message" }]);
  assert.doesNotMatch(buildContext(captured.state, { currentChatId: "chatgpt:/same" }), /unique-current-message/);
});

test("editing a captured record is detected", async () => {
  const captured = await appendCaptured(withProject(), [{ platform: "chatgpt", chatId: "chatgpt:/c/1", role: "user", text: "Original" }]);
  captured.state.messages[0].text = "Changed";
  assert.match((await verifyState(captured.state)).join(" "), /Changed record/);
});

test("project requires a useful name and goal", () => {
  assert.throws(() => safeProject({ name: "", goal: "" }), /required/);
});
