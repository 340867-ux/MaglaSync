import { buildContext, publicSnapshot } from "../shared/core.js";

const extensionApi = globalThis.browser ?? globalThis.chrome;

let currentState = null;
const $ = (selector) => document.querySelector(selector);

$("#project-form").addEventListener("submit", saveProject);
$("#auto-load").addEventListener("change", saveSettings);
$("#capture-enabled").addEventListener("change", saveSettings);
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
    $("#auto-load").checked = state.settings.autoLoad;
    $("#capture-enabled").checked = state.settings.captureEnabled;
    $("#message-count").textContent = state.messages.length;
    $("#checkpoint-count").textContent = state.checkpoints.length;
    $("#chat-count").textContent = new Set(state.messages.map((message) => message.chatId)).size;
    renderLatest(state.checkpoints.at(-1)?.update);
    renderActivity(state.messages.slice(-30).reverse());
  } catch (error) {
    toast(error.message, true);
  }
}

async function saveProject(event) {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  try {
    const { state } = await call({
      type: "SAVE_PROJECT",
      project: { name: $("#name").value, goal: $("#goal").value, rules: $("#rules").value }
    });
    currentState = state;
    toast("Project saved. Open a supported AI chat to begin syncing.");
    render();
  } catch (error) { toast(error.message, true); }
}

async function saveSettings() {
  try {
    await call({ type: "SET_SETTINGS", settings: { autoLoad: $("#auto-load").checked, captureEnabled: $("#capture-enabled").checked } });
    toast("Sync settings saved");
  } catch (error) { toast(error.message, true); }
}

function renderLatest(update) {
  const root = $("#latest-state");
  if (!update) {
    root.className = "empty";
    root.textContent = "No structured update has been captured yet. Start a supported chat; MaglaSync will ask the AI to return project updates in a machine-readable block.";
    return;
  }
  root.className = "state-grid";
  root.replaceChildren();
  if (update.summary) root.append(block("Current state", [update.summary], true));
  for (const [title, items] of [["Decisions",update.decisions],["Verified",update.verified],["Blockers",update.blockers],["Next steps",update.nextSteps],["Constraints",update.constraints]]) {
    if (items?.length) root.append(block(title, items));
  }
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
