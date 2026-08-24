(() => {
  const extensionApi = globalThis.browser ?? globalThis.chrome;
  const platform = detectPlatform();
  if (!platform || document.getElementById("maglasync-dock")) return;

  const seen = new Set();
  const loadedKeys = new Set();
  let currentUrl = location.href;
  let scanTimer = null;
  let state = null;

  const adapters = {
    chatgpt: {
      messageSelectors: ["[data-message-author-role]"],
      role(node) { return node.getAttribute("data-message-author-role"); },
      composerSelectors: ["#prompt-textarea", "textarea[data-id='root']", "div[contenteditable='true']"]
    },
    claude: {
      messageSelectors: ["[data-testid='user-message']", "[data-testid='assistant-message']", ".font-claude-message"],
      role(node) { return node.matches("[data-testid='user-message']") ? "user" : "assistant"; },
      composerSelectors: ["div.ProseMirror[contenteditable='true']", "div[contenteditable='true']"]
    },
    gemini: {
      messageSelectors: ["user-query", "model-response", ".query-text", ".model-response-text"],
      role(node) { return node.matches("user-query, .query-text") ? "user" : "assistant"; },
      composerSelectors: ["rich-textarea .ql-editor", "div.ql-editor[contenteditable='true']", "textarea"]
    }
  };

  const dock = createDock();
  document.documentElement.appendChild(dock);
  refreshContext();

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener("popstate", handleNavigation);
  extensionApi.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.maglaSyncState) refreshContext();
  });
  setInterval(handleNavigation, 1000);
  scheduleScan();

  function detectPlatform() {
    if (location.hostname === "chatgpt.com") return "chatgpt";
    if (location.hostname === "claude.ai") return "claude";
    if (location.hostname === "gemini.google.com") return "gemini";
    return "";
  }

  function chatId() {
    return `${platform}:${location.pathname}${location.search}`.slice(0, 200);
  }

  function createDock() {
    const node = document.createElement("aside");
    node.id = "maglasync-dock";
    node.setAttribute("aria-label", "MaglaSync status");
    node.innerHTML = `
      <div class="maglasync-head">
        <div class="maglasync-brand"><span class="maglasync-mark">M</span><span>MaglaSync</span><span class="maglasync-free">Free</span></div>
        <span class="maglasync-dot warn" data-ms-dot></span>
      </div>
      <div class="maglasync-project" data-ms-project>Checking project…</div>
      <div class="maglasync-status" data-ms-status>Connecting this chat…</div>
      <div class="maglasync-actions">
        <button class="maglasync-button" data-ms-load>Load context</button>
        <button class="maglasync-button secondary" data-ms-settings>Settings</button>
      </div>`;
    node.querySelector("[data-ms-load]").addEventListener("click", () => loadContext(true));
    node.querySelector("[data-ms-settings]").addEventListener("click", () => extensionApi.runtime.sendMessage({ type: "OPEN_DASHBOARD" }));
    return node;
  }

  async function refreshContext() {
    try {
      const response = await extensionApi.runtime.sendMessage({ type: "GET_CONTEXT", chatId: chatId(), platform });
      if (!response?.ok) throw new Error(response?.error || "Unavailable");
      state = response;
      dock.querySelector("[data-ms-project]").textContent = response.project?.name || "No project yet";
      dock.querySelector("[data-ms-status]").textContent = response.project
        ? `${response.messageCount} messages · ${response.checkpointCount} updates saved locally`
        : "Open Settings to create the free project.";
      dock.querySelector("[data-ms-dot]").classList.toggle("warn", !response.project || response.integrityErrors.length > 0);
      dock.querySelector("[data-ms-load]").disabled = !response.context;
      if (response.project && response.settings.autoLoad) setTimeout(() => loadContext(false), 900);
    } catch {
      dock.querySelector("[data-ms-status]").textContent = "MaglaSync could not read local storage.";
      dock.querySelector("[data-ms-dot]").classList.add("warn");
    }
  }

  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scanMessages, 550);
  }

  async function scanMessages() {
    if (!state?.settings?.captureEnabled || !state?.project) return;
    const adapter = adapters[platform];
    const nodes = unique(adapter.messageSelectors.flatMap((selector) => [...document.querySelectorAll(selector)]));
    const captured = [];
    for (const [ordinal, node] of nodes.entries()) {
      if (node.closest("#maglasync-dock")) continue;
      const text = normalize(node.innerText || node.textContent || "");
      const role = adapter.role(node);
      if (!text || !["user", "assistant"].includes(role)) continue;
      const quickKey = `${chatId()}|${role}|${ordinal}|${text}`;
      if (seen.has(quickKey)) continue;
      seen.add(quickKey);
      captured.push({ platform, chatId: chatId(), role, ordinal, text, capturedAt: new Date().toISOString() });
    }
    if (!captured.length) return;
    const response = await extensionApi.runtime.sendMessage({ type: "CAPTURE_MESSAGES", messages: captured });
    if (response?.ok) {
      dock.querySelector("[data-ms-status]").textContent = `${response.messageCount} messages · ${response.checkpointCount} updates saved locally`;
      dock.querySelector("[data-ms-dot]").classList.remove("warn");
    }
  }

  async function loadContext(manual) {
    if (!state?.context) return;
    const key = `${chatId()}|${state.project?.id}`;
    if (!manual && loadedKeys.has(key)) return;
    if (!manual && countMessages() > 0) return;
    const composer = findComposer();
    if (!composer) {
      if (manual) dock.querySelector("[data-ms-status]").textContent = "Open a new message box, then try again.";
      return;
    }
    if (!manual && normalize(composer.innerText || composer.value || composer.textContent || "")) return;
    const inserted = insertText(composer, state.context);
    if (inserted) {
      loadedKeys.add(key);
      dock.querySelector("[data-ms-status]").textContent = "Context loaded — review it, then press Send.";
      dock.querySelector("[data-ms-dot]").classList.remove("warn");
    }
  }

  function findComposer() {
    for (const selector of adapters[platform].composerSelectors) {
      const candidates = [...document.querySelectorAll(selector)].filter((node) => isVisible(node) && !node.closest("#maglasync-dock"));
      if (candidates.length) return candidates.at(-1);
    }
    return null;
  }

  function insertText(node, text) {
    node.focus();
    if (node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), "value")?.set;
      setter ? setter.call(node, text) : (node.value = text);
    } else if (node.isContentEditable) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(range);
      if (!document.execCommand("insertText", false, text)) node.textContent = text;
    } else {
      return false;
    }
    node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function handleNavigation() {
    if (location.href === currentUrl) return;
    currentUrl = location.href;
    seen.clear();
    loadedKeys.clear();
    state = null;
    refreshContext();
    scheduleScan();
  }

  function countMessages() {
    return unique(adapters[platform].messageSelectors.flatMap((selector) => [...document.querySelectorAll(selector)])).length;
  }

  function normalize(text) {
    return String(text).replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim().slice(0, 16000);
  }

  function unique(values) { return [...new Set(values)]; }
  function isVisible(node) {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }
})();
