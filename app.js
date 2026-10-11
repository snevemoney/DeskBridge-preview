const state = {
  screen: "hosts",
  returnTo: "hosts",
  weak: false,
  chromeHidden: false,
  chromeDx: 0,
  macros: true,
  retina: true,
  audio: true,
  lockDisplay: true,
};

const app = document.getElementById("app");

function meter() {
  if (state.weak) {
    return {
      rtt: 180,
      upload: 4,
      path: "Direct / LAN",
      codec: "Software · heavy compress",
      warn: "Weak link — expect slideshow on 4K timelines (hotel / hotspot).",
    };
  }
  return {
    rtt: 28,
    upload: state.retina ? 28 : 32,
    path: "Direct / LAN",
    codec: "Auto · prefer sharp",
    warn: null,
  };
}

function go(screen) {
  if (screen === "settings" || screen === "transfer") {
    state.returnTo = state.screen === "settings" || state.screen === "transfer"
      ? state.returnTo
      : state.screen;
  }
  state.screen = screen;
  render();
}

function render() {
  if (state.screen === "session") return renderSession();
  if (state.screen === "settings") return renderSettings();
  if (state.screen === "transfer") return renderTransfer();
  return renderHosts();
}

function renderHosts() {
  app.innerHTML = `
    <div class="screen">
      <div class="nav">
        <h1>DeskBridge</h1>
        <div class="nav-actions">
          <button class="icon-btn" title="Settings" data-go="settings">⚙</button>
          <button class="icon-btn" title="Add host" disabled title="Use Xcode app to add">＋</button>
        </div>
      </div>
      <div class="content">
        <div class="section-label">Hosts</div>
        <button class="host" data-connect>
          <strong>Home Mac mini</strong>
          <span>Apple Screen Sharing · mac-mini.local:5900</span>
          <small>Ideal: host upload ≥20 Mbps · ping &lt;50 ms</small>
        </button>
        <button class="host" data-connect>
          <strong>Windows box</strong>
          <span>RDP · 192.168.1.50:3389</span>
          <small>RDP · open port 3389 on LAN</small>
        </button>
        <div class="host disabled">
          <strong>Fluid demo <span class="badge na">N/A</span></strong>
          <span>Fluid (unsupported) · blocked</span>
          <small>Jump proprietary — DeskBridge will never implement</small>
        </div>
        <div class="section-label">Network demo</div>
        <div class="card toggle-row">
          <div>
            <strong>Simulate hotel / plane weak link</strong>
            <div style="color:var(--muted);font-size:13px;margin-top:4px">
              Surfaces the review’s slideshow failure mode. Real RTT arrives in slice 2.
            </div>
          </div>
          <button class="toggle ${state.weak ? "on" : ""}" data-weak aria-label="Toggle weak link"></button>
        </div>
        <div class="section-label">Protocols</div>
        <div class="card proto">
          <div><strong>VNC</strong><span>RFB · TightVNC / RealVNC / UltraVNC</span></div>
          <div><strong>Apple Screen Sharing</strong><span>macOS Sharing · port 5900</span></div>
          <div><strong>RDP</strong><span>Windows hosts · port 3389</span></div>
          <div><strong>Fluid (unsupported)</strong><span>Jump proprietary — blocked</span></div>
        </div>
      </div>
    </div>
  `;
  bindHosts();
}

function bindHosts() {
  app.querySelector("[data-weak]")?.addEventListener("click", () => {
    state.weak = !state.weak;
    render();
  });
  app.querySelector("[data-go='settings']")?.addEventListener("click", () => go("settings"));
  app.querySelectorAll("[data-connect]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.chromeHidden = false;
      state.chromeDx = 0;
      go("session");
    });
  });
}

function renderSession() {
  const m = meter();
  app.innerHTML = `
    <div class="session">
      <div class="remote-stub">
        <div class="glyph">🖥</div>
        <h2 style="margin:0">Remote surface</h2>
        <p class="status">Mock ready (no pixels yet)</p>
        <p>Slice 2: RFB / Screen Sharing pixels via VideoToolbox.</p>
      </div>
      ${state.chromeHidden ? `<button class="show-controls" data-show>Show controls</button>` : `
        <div class="chrome" id="chrome" style="--dx:${state.chromeDx}px">
          <div class="meta">
            <strong>Home Mac mini</strong>
            <span>${m.path} · RTT ~${m.rtt} ms · upload ~${m.upload} Mbps · ${m.codec}</span>
            ${m.warn ? `<div class="warn">${m.warn}</div>` : ""}
          </div>
          <div class="actions">
            <button title="File transfer" data-transfer>⇄</button>
            <button title="Settings" data-go="settings">⚙</button>
            <button title="Hide chrome" data-hide>👁</button>
            <button class="danger" title="Disconnect" data-disconnect>×</button>
          </div>
        </div>`}
    </div>
  `;
  bindSession();
}

function bindSession() {
  app.querySelector("[data-show]")?.addEventListener("click", () => {
    state.chromeHidden = false;
    render();
  });
  app.querySelector("[data-hide]")?.addEventListener("click", () => {
    state.chromeHidden = true;
    render();
  });
  app.querySelector("[data-disconnect]")?.addEventListener("click", () => go("hosts"));
  app.querySelector("[data-transfer]")?.addEventListener("click", () => go("transfer"));
  app.querySelector("[data-go='settings']")?.addEventListener("click", () => go("settings"));

  const chrome = app.querySelector("#chrome");
  if (!chrome) return;
  let startX = 0;
  let origin = state.chromeDx;
  chrome.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    origin = state.chromeDx;
    chrome.setPointerCapture(e.pointerId);
  });
  chrome.addEventListener("pointermove", (e) => {
    if (!chrome.hasPointerCapture(e.pointerId)) return;
    state.chromeDx = origin + (e.clientX - startX);
    chrome.style.setProperty("--dx", `${state.chromeDx}px`);
  });
  chrome.addEventListener("pointerup", () => {
    const w = app.clientWidth;
    if (state.chromeDx < -w * 0.15) state.chromeDx = -w * 0.28;
    else if (state.chromeDx > w * 0.15) state.chromeDx = w * 0.28;
    else state.chromeDx = 0;
    chrome.style.setProperty("--dx", `${state.chromeDx}px`);
  });
}

function renderSettings() {
  const macroMap = state.macros
    ? ["Option-Space", "Option-Tab", "Option-Q"]
    : ["Globe-Cmd-Space", "Globe-Cmd-Tab", "Globe-Cmd-Q"];
  const backTo = state.returnTo || "hosts";
  app.innerHTML = `
    <div class="screen">
      <div class="nav">
        <h1>Session settings</h1>
        <div class="nav-actions">
          <button class="icon-btn" data-back>✕</button>
        </div>
      </div>
      <div class="content">
        <div class="card toggle-row"><div><strong>Retina</strong></div><button class="toggle ${state.retina ? "on" : ""}" data-k="retina"></button></div>
        <div class="card toggle-row"><div><strong>Audio</strong></div><button class="toggle ${state.audio ? "on" : ""}" data-k="audio"></button></div>
        <div class="card toggle-row"><div><strong>Lock host display</strong></div><button class="toggle ${state.lockDisplay ? "on" : ""}" data-k="lockDisplay"></button></div>
        <div class="card toggle-row"><div><strong>Option macros for stolen shortcuts</strong><div style="color:var(--muted);font-size:12px;margin-top:4px">iPadOS hijacks Cmd-Space / Tab / Q</div></div><button class="toggle ${state.macros ? "on" : ""}" data-k="macros"></button></div>
        <div class="card">
          <div class="row"><span>Cmd-Space → host Spotlight</span><span>${macroMap[0]}</span></div>
          <div class="row"><span>Cmd-Tab → host app switcher</span><span>${macroMap[1]}</span></div>
          <div class="row"><span>Cmd-Q → quit host app</span><span>${macroMap[2]}</span></div>
        </div>
        <p class="footnote">Jump’s menu pill could not be hidden — DeskBridge chrome can.</p>
        <button class="primary" data-back>Done</button>
      </div>
    </div>
  `;
  app.querySelectorAll("[data-k]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state[btn.dataset.k] = !state[btn.dataset.k];
      render();
    });
  });
  app.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => go(backTo));
  });
}

function renderTransfer() {
  app.innerHTML = `
    <div class="screen">
      <div class="nav">
        <h1>File transfer</h1>
        <div class="nav-actions"><button class="icon-btn" data-back>✕</button></div>
      </div>
      <div class="content">
        <div class="card" style="color:var(--muted);font-size:13px">
          Built-in iPad ↔ host channel — Jump gap from the review (08:27). Slice 1 is a mock queue.
        </div>
        <div class="section-label">Queue</div>
        <div class="card">
          <div class="transfer-item"><span>↑</span><div><strong>project-notes.md</strong><div style="color:var(--muted);font-size:12px">iPad → host</div></div><span class="badge">Ready</span></div>
          <div class="transfer-item"><span>↓</span><div><strong>timeline-proxy.mov</strong><div style="color:var(--muted);font-size:12px">host → iPad</div></div><span class="badge done">Mock done</span></div>
        </div>
        <button class="primary" data-back>Done</button>
      </div>
    </div>
  `;
  app.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => go("session"));
  });
}

render();
