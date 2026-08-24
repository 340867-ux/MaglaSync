const noProject = document.querySelector("#no-project");
const projectView = document.querySelector("#project");
const health = document.querySelector("#health");

document.querySelector("#start").addEventListener("click", openDashboard);
document.querySelector("#edit").addEventListener("click", openDashboard);
document.querySelector("#open-dashboard").addEventListener("click", openDashboard);
document.querySelector("#auto-load").addEventListener("change", saveSettings);
document.querySelector("#capture-enabled").addEventListener("change", saveSettings);

function openDashboard() {
  chrome.runtime.openOptionsPage();
  window.close();
}

async function saveSettings() {
  const response = await chrome.runtime.sendMessage({
    type: "SET_SETTINGS",
    settings: {
      autoLoad: document.querySelector("#auto-load").checked,
      captureEnabled: document.querySelector("#capture-enabled").checked
    }
  });
  health.classList.toggle("ok", Boolean(response?.ok));
}

async function render() {
  const response = await chrome.runtime.sendMessage({ type: "GET_STATE" });
  if (!response?.ok) return;
  const { state, integrityErrors } = response;
  noProject.classList.toggle("hidden", Boolean(state.project));
  projectView.classList.toggle("hidden", !state.project);
  health.classList.toggle("ok", integrityErrors.length === 0);
  if (!state.project) return;
  document.querySelector("#project-name").textContent = state.project.name;
  document.querySelector("#project-goal").textContent = state.project.goal;
  document.querySelector("#message-count").textContent = state.messages.length;
  document.querySelector("#checkpoint-count").textContent = state.checkpoints.length;
  document.querySelector("#auto-load").checked = state.settings.autoLoad;
  document.querySelector("#capture-enabled").checked = state.settings.captureEnabled;
}

render();

