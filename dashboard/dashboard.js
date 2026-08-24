import { buildContext, publicSnapshot } from "../shared/core.js";

const extensionApi = globalThis.browser ?? globalThis.chrome;

let currentState = null;
const $ = (selector) => document.querySelector(selector);

$("#project-form").addEventListener("submit", saveProject);
$("#capture-enabled").addEventListener("change", saveSettings);
$("#save-full-history").addEventListener("change", saveSettings);
$("#copy-context").addEventListener("click", copyContext);
$("#refresh").addEventListener("click", render);
$("#export").addEventListener("click", exportBackup);
$("#import").addEventListener("change", importBackup);
$("#delete").addEventListener("click", deleteAll);

async function call(message) {
  const response = await extensionApi.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error || "MaglaSync could not complete that action.");
  return response;
}

async function render() {
  try {
    const { state, integrityErrors } = await call({ type: "GET_STATE" });
    currentState = state;
    $("#integrity").textContent = integrityErrors.length ? `Integrity warning · ${integrityErrors.length}` : "Integrity checked";
    $("#integrity").classList.toggle("bad", Boolean(integrityErrors.length));
    if (state.project) {
      $("#name").value = state.project.name;
      $("#goal").value = state.project.goal;
      $("#rules").value = state.project.rules || "";
    }
    $("#capture-enabled").checked = state.settings.captureEnabled;
    $("#save-full-history").checked = state.settings.saveFullHistory;
    const active = activeChatIds(state);
    const messages = state.messages.filter((message) => active.has(message.chatId));
    const checkpoints = state.checkpoints.filter((checkpoint) => active.has(checkpoint.chatId));
    $("#message-count").textContent = messages.length;
    $("#checkpoint-count").textContent = checkpoints.length;
    $("#chat-count").textContent = active.size;
    renderConnections(state);
    renderLatest(checkpoints.at(-1)?.update);
    renderActivity(messages.slice(-30).reverse());
  } catch (error) {
    toast(error.message, true);
  }
}

async function saveProject(event) {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  try {
    const previousGoalVersion = currentState?.project?.goalVersion || 0;
    const { state } = await call({
      type: "SAVE_PROJECT",
      project: { name: $("#name").value, goal: $("#goal").value, rules: $("#rules").value }
    });
    currentState = state;
    toast(state.project.goalVersion > previousGoalVersion && previousGoalVersion
      ? "Project goal changed. Reconnect each project chat before continuing."
      : "Project saved. Open a supported AI chat and connect it yourself.");
    render();
  } catch (error) { toast(error.message, true); }
}

async function saveSettings() {
  try {
    await call({
      type: "SET_SETTINGS",
      settings: {
        captureEnabled: $("#capture-enabled").checked,
        saveFullHistory: $("#save-full-history").checked
      }
    });
    toast($("#save-full-history").checked ? "Extended history enabled for connected chats" : "Only the short recent buffer will be kept");
    render();
  } catch (error) { toast(error.message, true); }
}

function renderLatest(update) {
  const root = $("#latest-state");
  if (!update) {
    root.className = "empty";
    root.textContent = "No project update has been saved yet. Connect a project chat and continue working normally.";
    return;
  }
  root.className = "state-grid";
  root.replaceChildren();
  if (update.summary) root.append(block("Current state", [update.summary], true));
  for (const [title, items] of [["Decisions",update.decisions],["Reported complete",update.verified],["Blockers",update.blockers],["Next steps",update.nextSteps],["Constraints",update.constraints]]) {
    if (items?.length) root.append(block(title, items));
  }
}

function activeChatIds(state) {
  const goalVersion = state.project?.goalVersion || 1;
  return new Set((state.chatBindings || [])
    .filter((binding) => binding.projectId === state.project?.id && binding.goalVersion === goalVersion)
    .map((binding) => binding.chatId));
}

function renderConnections(state) {
  const root = $("#connections");
  root.replaceChildren();
  if (!state.chatBindings?.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No chat is connected. Open a supported AI chat and click Connect chat.";
    root.append(empty);
    return;
  }
  for (const binding of state.chatBindings) {
    const row = document.createElement("article");
    row.className = "connection";
    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = binding.platform === "chatgpt" ? "ChatGPT" : binding.platform === "claude" ? "Claude" : "Gemini";
    const detail = document.createElement("span");
    const stale = binding.goalVersion !== (state.project?.goalVersion || 1);
    detail.textContent = stale ? "Project changed · reconnect this chat before use" : `Connected ${new Date(binding.connectedAt).toLocaleDateString()}`;
    info.append(title, detail);
    const remove = document.createElement("button");
    remove.className = "danger compact";
    remove.textContent = "Disconnect";
    remove.addEventListener("click", () => removeConnection(binding.chatId));
    row.append(info, remove);
    root.append(row);
  }
}

async function removeConnection(chatId) {
  if (!confirm("Disconnect this chat and remove its locally saved MaglaSync records?")) return;
  try {
    await call({ type: "DETACH_CHAT", chatId });
    toast("Chat disconnected and its local records removed");
    render();
  } catch (error) { toast(error.message, true); }
}

function block(title, items, summary = false) {
  const node = document.createElement("div");
  node.className = summary ? "state-summary" : "state-block";
  if (summary) { node.textContent = items[0]; return node; }
  const heading = document.createElement("h3");
  heading.textContent = title;
  const list = document.createElement("ul");
  for (const item of items) { const li = document.createElement("li"); li.textContent = item; list.append(li); }
  node.append(heading, list);
  return node;
}

function renderActivity(messages) {
  const root = $("#activity");
  root.replaceChildren();
  if (!messages.length) { const empty = document.createElement("div"); empty.className = "empty"; empty.textContent = "No messages captured yet."; root.append(empty); return; }
  for (const message of messages) {
    const row = document.createElement("article"); row.className = "message";
    const meta = document.createElement("div"); meta.className = "message-meta";
    const role = document.createElement("strong"); role.textContent = message.role === "assistant" ? "AI" : "You";
    meta.append(role, document.createTextNode(`${message.platform} · ${new Date(message.capturedAt).toLocaleString()}`));
    const text = document.createElement("div"); text.className = "message-text"; text.textContent = message.text;
    row.append(meta, text); root.append(row);
  }
}

async function copyContext() {
  if (!currentState?.project) return toast("Create the project first.", true);
  await navigator.clipboard.writeText(buildContext(currentState));
  toast("Current MaglaSync context copied");
}

function exportBackup() {
  if (!currentState) return;
  const blob = new Blob([JSON.stringify(publicSnapshot(currentState), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = `maglasync-backup-${new Date().toISOString().slice(0,10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Backup downloaded");
}

async function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 8_000_000) throw new Error("This backup is larger than 8 MB.");
    const state = JSON.parse(await file.text());
    if (!confirm("Restore this backup? It will replace the current local MaglaSync project.")) return;
    await call({ type: "IMPORT_STATE", state });
    toast("Backup restored and verified");
    render();
  } catch (error) { toast(error.message || "Could not restore backup", true); }
  finally { event.target.value = ""; }
}

async function deleteAll() {
  if (!confirm("Delete the MaglaSync project, captured messages, and checkpoints from this browser? Download a backup first if you may need them.")) return;
  try { await call({ type: "DELETE_ALL" }); toast("All local MaglaSync data deleted"); render(); }
  catch (error) { toast(error.message, true); }
}

function toast(message, error = false) {
  const node = $("#toast"); node.textContent = message; node.className = `toast show${error ? " error" : ""}`;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => { node.className = "toast"; }, 3000);
}

render();
