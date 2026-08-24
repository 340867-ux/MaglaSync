(() => {
  const extensionApi = globalThis.browser ?? globalThis.chrome;
  const platform = detectPlatform();
  if (!platform || document.getElementById("maglasync-dock")) return;

  const seen = new Set();
  let currentUrl = location.href;
  let lastStableChatId = stableChatId();
  let scanTimer = null;
  let navigationBusy = false;
  let draftConnected = false;
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
  const preview = createPreview();
  document.documentElement.append(dock, preview);
  refreshContext();

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener("popstate", handleNavigation);
  window.addEventListener("hashchange", handleNavigation);
  extensionApi.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.maglaSyncState) refreshContext();
  });
  setInterval(handleNavigation, 1000);

  function detectPlatform() {
    if (location.hostname === "chatgpt.com") return "chatgpt";
    if (location.hostname === "claude.ai") return "claude";
    if (location.hostname === "gemini.google.com") return "gemini";
    return "";
  }

  function stableChatId() {
    const path = location.pathname;
    const stable = platform === "chatgpt"
      ? /\/c\/[^/?#]+/.test(path)
      : platform === "claude"
        ? /\/chat\/[^/?#]+/.test(path)
        : /^\/app\/[^/?#]+/.test(path);
    return stable ? `${platform}:${path}${location.search}`.slice(0, 200) : "";
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
      <div class="maglasync-status" data-ms-status>Checking this chat…</div>
      <div class="maglasync-actions">
        <button class="maglasync-button" data-ms-primary>Connect chat</button>
        <button class="maglasync-button secondary maglasync-hidden" data-ms-detach>Disconnect</button>
        <button class="maglasync-button secondary" data-ms-settings>Settings</button>
      </div>`;
    node.querySelector("[data-ms-primary]").addEventListener("click", handlePrimary);
    node.querySelector("[data-ms-detach]").addEventListener("click", disconnectChat);
    node.querySelector("[data-ms-settings]").addEventListener("click", () => extensionApi.runtime.sendMessage({ type: "OPEN_DASHBOARD" }));
    return node;
  }

  function createPreview() {
    const root = document.createElement("div");
    root.id = "maglasync-preview";
    root.className = "maglasync-hidden";
    root.innerHTML = `
      <div class="maglasync-preview-card" role="dialog" aria-modal="true" aria-labelledby="maglasync-preview-title">
        <div class="maglasync-preview-head">
          <div><strong id="maglasync-preview-title">Review project context</strong><span>Edit anything before it reaches the chat.</span></div>
          <button data-ms-close aria-label="Close">×</button>
        </div>
        <textarea data-ms-preview-text spellcheck="false"></textarea>
        <p>MaglaSync will place this text in the message box. It will not press Send.</p>
        <div class="maglasync-preview-actions">
          <button class="maglasync-button secondary" data-ms-cancel>Cancel</button>
          <button class="maglasync-button" data-ms-insert>Place in chat</button>
        </div>
      </div>`;
    root.querySelector("[data-ms-close]").addEventListener("click", closePreview);
    root.querySelector("[data-ms-cancel]").addEventListener("click", closePreview);
    root.querySelector("[data-ms-insert]").addEventListener("click", insertPreview);
    root.addEventListener("click", (event) => { if (event.target === root) closePreview(); });
    return root;
  }

  async function refreshContext() {
    try {
      const response = await extensionApi.runtime.sendMessage({ type: "GET_CONTEXT", chatId: stableChatId(), platform });
      if (!response?.ok) throw new Error(response?.error || "Unavailable");
      state = response;
      renderDock();
      if (response.isAttached) scheduleScan();
    } catch {
      state = null;
      setStatus("MaglaSync could not read local storage.", true);
    }
  }

  function renderDock() {
    const project = dock.querySelector("[data-ms-project]");
    const primary = dock.querySelector("[data-ms-primary]");
    const detach = dock.querySelector("[data-ms-detach]");
    const dot = dock.querySelector("[data-ms-dot]");
    project.textContent = state?.project?.name || "No project yet";
    detach.classList.add("maglasync-hidden");
    primary.disabled = false;

    if (!state?.project) {
      setStatus("Open Settings to create the free project.", true);
      primary.textContent = "Create project";
      return;
    }
    if (state.integrityErrors?.length) {
      setStatus("Saved journal needs attention. Context is locked.", true);
      primary.textContent = "Open Settings";
      return;
    }

    const chatId = stableChatId();
    if (!chatId) {
      if (draftConnected) {
        setStatus("New chat approved. Nothing is read until the chat is created.", false);
        primary.textContent = "Review context";
        detach.textContent = "Cancel";
        detach.classList.remove("maglasync-hidden");
      } else {
        setStatus("Not connected. MaglaSync is not reading this chat.", true);
        primary.textContent = "Connect new chat";
      }
      return;
    }

    if (state.staleBinding) {
      setStatus("The project goal changed. Reconnect before continuing.", true);
      primary.textContent = "Reconnect chat";
      detach.textContent = "Disconnect";
      detach.classList.remove("maglasync-hidden");
      return;
    }
    if (!state.isAttached) {
      setStatus("Not connected. MaglaSync is not reading this chat.", true);
      primary.textContent = "Connect chat";
      return;
    }

    dot.classList.remove("warn");
    setStatus(`${state.messageCount} recent messages · ${state.checkpointCount} project updates`, false);
    primary.textContent = "Review context";
    detach.textContent = "Disconnect";
    detach.classList.remove("maglasync-hidden");
  }

  async function handlePrimary() {
    if (!state?.project || state?.integrityErrors?.length) {
      await extensionApi.runtime.sendMessage({ type: "OPEN_DASHBOARD" });
      return;
    }
    const chatId = stableChatId();
    if (!chatId) {
      if (!draftConnected) {
        draftConnected = true;
        renderDock();
      }
      await openPreview();
      return;
    }
    if (!state.isAttached) {
      const response = await extensionApi.runtime.sendMessage({ type: "ATTACH_CHAT", chatId, platform });
      if (!response?.ok) return setStatus(response?.error || "Could not connect this chat.", true);
      seen.clear();
      await refreshContext();
      if (countMessages() === 0) await openPreview();
      else setStatus("Connected. Only this project chat will be saved.", false);
      scheduleScan();
      return;
    }
    await openPreview();
  }

  async function disconnectChat() {
    const chatId = stableChatId();
    if (!chatId) {
      draftConnected = false;
      closePreview();
      renderDock();
      return;
    }
    if (!confirm("Disconnect this chat and remove its locally saved MaglaSync records?")) return;
    const response = await extensionApi.runtime.sendMessage({ type: "DETACH_CHAT", chatId });
    if (!response?.ok) return setStatus(response?.error || "Could not disconnect this chat.", true);
    seen.clear();
    await refreshContext();
    setStatus("Disconnected. This chat is no longer read by MaglaSync.", true);
  }

  async function openPreview() {
    const chatId = stableChatId();
    const response = chatId && state?.isAttached
      ? await extensionApi.runtime.sendMessage({ type: "GET_CONTEXT", chatId, platform })
      : await extensionApi.runtime.sendMessage({ type: "GET_PREVIEW" });
    if (!response?.ok || response.integrityErrors?.length || !response.context) {
      return setStatus(response?.error || "No safe project context is available yet.", true);
    }
    preview.querySelector("[data-ms-preview-text]").value = response.context;
    preview.classList.remove("maglasync-hidden");
    preview.querySelector("[data-ms-preview-text]").focus();
  }

  function closePreview() {
    preview.classList.add("maglasync-hidden");
  }

  function insertPreview() {
    const composer = findComposer();
    if (!composer) return setStatus("Open a message box, then try again.", true);
    if (normalize(composer.innerText || composer.value || composer.textContent || "")) {
      return setStatus("The message box is not empty. Clear it before adding project context.", true);
    }
    const text = preview.querySelector("[data-ms-preview-text]").value.trim();
    if (!text || !insertText(composer, text)) return setStatus("Could not place context in this message box.", true);
    closePreview();
    setStatus("Context is ready. Review it once more, then press Send yourself.", false);
  }

  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scanMessages, 550);
  }

  async function scanMessages() {
    const chatId = stableChatId();
    if (!chatId || !state?.isAttached || !state?.settings?.captureEnabled || state?.integrityErrors?.length) return;
    const adapter = adapters[platform];
    const nodes = unique(adapter.messageSelectors.flatMap((selector) => [...document.querySelectorAll(selector)]));
    const captured = [];
    for (const [ordinal, node] of nodes.entries()) {
      if (node.closest("#maglasync-dock, #maglasync-preview")) continue;
      const text = normalize(node.innerText || node.textContent || "");
      const role = adapter.role(node);
      if (!text || !["user", "assistant"].includes(role)) continue;
      const quickKey = `${chatId}|${role}|${ordinal}|${text}`;
      if (seen.has(quickKey)) continue;
      captured.push({ quickKey, platform, chatId, role, ordinal, text, capturedAt: new Date().toISOString() });
    }
    if (!captured.length) return;
    const response = await extensionApi.runtime.sendMessage({
      type: "CAPTURE_MESSAGES",
      messages: captured.map(({ quickKey, ...message }) => message)
    });
    if (response?.ok && response.rejectedMessages === 0) {
      for (const message of captured) seen.add(message.quickKey);
      state.messageCount = response.messageCount;
      state.checkpointCount = response.checkpointCount;
      setStatus(`${response.messageCount} recent messages · ${response.checkpointCount} project updates`, false);
    } else {
      await refreshContext();
    }
  }

  function findComposer() {
    for (const selector of adapters[platform].composerSelectors) {
      const candidates = [...document.querySelectorAll(selector)].filter((node) => isVisible(node) && !node.closest("#maglasync-dock, #maglasync-preview"));
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

  async function handleNavigation() {
    if (location.href === currentUrl || navigationBusy) return;
    navigationBusy = true;
    try {
      const previousStableId = lastStableChatId;
      currentUrl = location.href;
      const nextStableId = stableChatId();
      lastStableChatId = nextStableId;
      seen.clear();
      if (draftConnected && !previousStableId && nextStableId) {
        const response = await extensionApi.runtime.sendMessage({ type: "ATTACH_CHAT", chatId: nextStableId, platform });
        if (response?.ok) draftConnected = false;
      } else if (previousStableId !== nextStableId) {
        draftConnected = false;
      }
      closePreview();
      await refreshContext();
      scheduleScan();
    } finally {
      navigationBusy = false;
    }
  }

  function setStatus(message, warning) {
    dock.querySelector("[data-ms-status]").textContent = message;
    dock.querySelector("[data-ms-dot]").classList.toggle("warn", Boolean(warning));
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
