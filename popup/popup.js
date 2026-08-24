const noProject = document.querySelector("#no-project");
const projectView = document.querySelector("#project");
const health = document.querySelector("#health");

document.querySelector("#start").addEventListener("click", openDashboard);
document.querySelector("#edit").addEventListener("click", openDashboard);
document.querySelector("#open-dashboard").addEventListener("click", openDashboard);
document.querySelector("#capture-enabled").addEventListener("change", saveSettings);
document.querySelector("#save-full-history").addEventListener("change", saveSettings);

function openDashboard() {
  extensionApi.runtime.openOptionsPage();
  window.close();
}

async function saveSettings() {
  const response = await extensionApi.runtime.sendMessage({
    type: "SET_SETTINGS",
    settings: {
      captureEnabled: document.querySelector("#capture-enabled").checked,
      saveFullHistory: document.querySelector("#save-full-history").checked
    }
  });
  health.classList.toggle("ok", Boolean(response?.ok));
}

async function render() {
  const response = await extensionApi.runtime.sendMessage({ type: "GET_STATE" });
  if (!response?.ok) return;
  const { state, integrityErrors } = response;
  noProject.classList.toggle("hidden", Boolean(state.project));
  projectView.classList.toggle("hidden", !state.project);
  health.classList.toggle("ok", integrityErrors.length === 0);
  if (!state.project) return;
  document.querySelector("#project-name").textContent = state.project.name;
  document.querySelector("#project-goal").textContent = state.project.goal;
  const goalVersion = state.project.goalVersion || 1;
  const active = new Set((state.chatBindings || [])
    .filter((binding) => binding.projectId === state.project.id && binding.goalVersion === goalVersion)
    .map((binding) => binding.chatId));
  document.querySelector("#chat-count").textContent = active.size;
  document.querySelector("#checkpoint-count").textContent = state.checkpoints.filter((checkpoint) => active.has(checkpoint.chatId)).length;
  document.querySelector("#capture-enabled").checked = state.settings.captureEnabled;
  document.querySelector("#save-full-history").checked = state.settings.saveFullHistory;
}

render();
const extensionApi = globalThis.browser ?? globalThis.chrome;
