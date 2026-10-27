import "./styles/main.css";
import "./styles/branding.css";
import licenseNotices from "../resources/THIRD_PARTY_NOTICES.txt?raw";
import { getPlatform } from "./platform/index.js";
import { normalizeError } from "./platform/contract.js";
import {
  routes,
  routeFromHash,
  loadTheme,
  applyTheme,
  nextCard,
} from "./app/state.js";

const platform = await getPlatform();
const build = __BUILD__;
const log = [];
let card = 0;
let renderRevision = 0;
let online = (await platform.network.getStatus()).connected;
const titles = {
  home: "Your app. Everywhere.",
  capabilities: "Know your possibilities.",
  interactions: "Make something happen.",
  diagnostics: "Under the surface.",
  settings: "Make yourself at home.",
};
const subtitles = {
  home: "One shared experience. Built for wherever you go.",
  capabilities: "Real support, real permissions. Nothing simulated.",
  interactions: "Explore the small details that make an app feel native.",
  diagnostics: "A clear view of this build and its environment.",
  settings: "A few thoughtful defaults. A space that feels like yours.",
};
const app = document.querySelector("#app");
function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function button(text, action, className = "button") {
  const node = el("button", text, className);
  node.type = "button";
  node.addEventListener("click", action);
  return node;
}
function panel(title, description) {
  const node = el("section", undefined, "card");
  node.append(el("h2", title), el("p", description, "muted"));
  return node;
}
function badge(text) {
  return el("span", text, "badge");
}
function record(text) {
  log.unshift(`${new Date().toLocaleTimeString()} · ${text}`);
  log.splice(20);
}
function announce(text) {
  document.querySelector("#result").textContent = text;
}
async function run(label, action) {
  announce(`${label}: working…`);
  try {
    const value = await action();
    const result = `${label}: success${value ? " · " + JSON.stringify(value) : ""}`;
    announce(result);
    record(`${label}: success`);
  } catch (error) {
    const failure = normalizeError(error);
    announce(`${label}: ${failure.code} · ${failure.message}`);
    record(`${label}: ${failure.code}`);
  }
}
applyTheme(loadTheme(localStorage));
app.innerHTML =
  '<aside class="sidebar"><a class="brand" href="#/home"><img src="' +
  import.meta.env.BASE_URL +
  'icon.svg" alt="" width="38" height="38"><span></span></a><div class="nav-label">WORKSPACE</div><nav aria-label="Main navigation"></nav><div class="sidebar-bottom"><span class="status-dot"></span><span id="connection"></span><p>ONE CODEBASE. EVERY PLATFORM.</p></div></aside><div class="workspace"><header class="topbar"><span>THE UNIVERSAL PLAYGROUND</span><span class="build-tag"></span></header><main id="content" tabindex="-1"></main><footer>Crafted with vanilla JavaScript <span>Simple by design. Native by nature.</span></footer></div><div id="result" role="status" aria-live="polite"></div>';
document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("main").focus();
});
document.querySelector(".brand span").textContent = build.name;
document.querySelector(".build-tag").textContent =
  `v${build.version} / ${build.channel}`;
const glyphs = ["◈", "▦", "↗", "◎", "⚙"];
for (const [index, route] of routes.entries()) {
  const link = el("a");
  link.href = `#/${route}`;
  const icon = el("span", glyphs[index], "nav-icon");
  icon.setAttribute("aria-hidden", "true");
  link.append(icon, el("span", route[0].toUpperCase() + route.slice(1)));
  document.querySelector("nav").append(link);
}
function networkStatus() {
  document.querySelector("#connection").textContent = online
    ? "Connected & ready"
    : "Offline · core UI ready";
  document.querySelector(".status-dot").classList.toggle("offline", !online);
  const summary = document.querySelector("#home-network-status");
  if (summary) summary.textContent = online ? "Online" : "Offline";
}
networkStatus();
platform.network.subscribe((status) => {
  online = status.connected;
  networkStatus();
  record(online ? "Network connected" : "Network offline");
});
async function render() {
  const revision = ++renderRevision;
  const route = routeFromHash(location.hash);
  for (const link of document.querySelectorAll("nav a")) {
    if (link.hash === `#/${route}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  const main = document.querySelector("main");
  const append = (...nodes) => {
    if (revision === renderRevision) main.append(...nodes);
  };
  main.replaceChildren();
  const intro = el("div", undefined, "intro");
  intro.append(
    el(
      "div",
      route === "home" ? "HELLO, WORLD" : route.toUpperCase(),
      "eyebrow",
    ),
    el("h1", titles[route]),
    el("p", subtitles[route], "subtitle"),
  );
  append(intro);
  if (route === "home") {
    const hero = el("section", undefined, "hero");
    const copy = el("div");
    copy.append(
      badge("ONE APP. SIX DESTINATIONS."),
      el("h2", "Small foundation.\nEndless possibilities."),
      el(
        "p",
        "A thoughtful starting point for the web, your phone, and your desktop. The same app, with the right capabilities for each.",
      ),
    );
    copy.append(
      button(
        "Explore interactions ↗",
        () => {
          location.hash = "/interactions";
        },
        "button primary",
      ),
    );
    const orbit = el("div", undefined, "orbit");
    orbit.setAttribute("aria-hidden", "true");
    orbit.innerHTML =
      '<div class="orbit-ring"></div><div class="orbit-core">U<span>●</span></div><span class="satellite s1">WEB</span><span class="satellite s2">MOBILE</span><span class="satellite s3">DESKTOP</span>';
    hero.append(copy, orbit);
    append(hero);
    const stats = el("div", undefined, "stats");
    for (const [value, label] of [
      [platform.id, "CURRENT PLATFORM"],
      [build.version, "APP VERSION"],
      [online ? "Online" : "Offline", "NETWORK STATUS"],
    ]) {
      const stat = el("section", undefined, "stat");
      const detail = el("strong", value);
      if (label === "NETWORK STATUS") detail.id = "home-network-status";
      stat.append(el("span", label, "eyebrow"), detail);
      stats.append(stat);
    }
    append(stats);
    const heading = el("div", undefined, "section-heading");
    heading.append(
      el("h2", "Take a look around"),
      el("span", "YOUR STARTING POINT", "muted"),
    );
    append(heading);
    const grid = el("div", undefined, "grid");
    for (const [route, title, description] of [
      [
        "capabilities",
        "Discover your device",
        "See what works here, and what needs permission.",
      ],
      [
        "interactions",
        "Try a little interaction",
        "Swipe, share, and explore native features.",
      ],
      [
        "diagnostics",
        "See the details",
        "Build information and a transparent event log.",
      ],
    ]) {
      const node = panel(title, description);
      node.append(
        button(
          "Open " + title.toLowerCase() + " ↗",
          () => {
            location.hash = "/" + route;
          },
          "text-button",
        ),
      );
      grid.append(node);
    }
    append(grid);
  }
  if (route === "capabilities") {
    const table = el("table");
    const caption = el("caption", "Platform capabilities · " + platform.id);
    table.append(caption);
    const head = el("thead");
    const tr = el("tr");
    for (const name of ["Feature", "Support", "Permission"])
      tr.append(el("th", name));
    head.append(tr);
    table.append(head);
    const body = el("tbody");
    const caps = await platform.capabilities.list();
    for (const [name, value] of Object.entries(caps)) {
      const row = el("tr");
      const feature = el("td", name);
      if (value.reason) feature.append(el("small", value.reason));
      row.append(
        feature,
        el("td", value.supported ? "Supported" : "Unsupported"),
        el("td", value.permission),
      );
      body.append(row);
    }
    table.append(body);
    const wrapper = el("div", undefined, "table-wrap card");
    wrapper.append(table);
    append(
      wrapper,
      el(
        "p",
        "Permissions are requested only when you try a feature. Denied access can be changed in system or browser settings.",
        "muted",
      ),
    );
  }
  if (route === "interactions") {
    const carousel = panel(
      "A little movement",
      "Swipe or drag the card, or use the arrow buttons.",
    );
    const slide = el("div", undefined, "slide");
    slide.tabIndex = 0;
    slide.setAttribute("aria-label", "Carousel; use left and right arrow keys");
    const names = [
      "One shared canvas",
      "Native where it matters",
      "Ready for your next idea",
    ];
    const update = () => {
      slide.textContent = `0${card + 1} / 03 · ${names[card]}`;
    };
    const move = (delta) => {
      card = nextCard(card, delta, names.length);
      update();
    };
    let start;
    slide.addEventListener("pointerdown", (event) => {
      start = event.clientX;
      slide.setPointerCapture(event.pointerId);
    });
    slide.addEventListener("pointerup", (event) => {
      if (Math.abs(event.clientX - start) > 40)
        move(event.clientX < start ? 1 : -1);
    });
    slide.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    });
    update();
    const controls = el("div", undefined, "controls");
    controls.append(
      button("← Previous", () => move(-1)),
      button("Next →", () => move(1)),
    );
    carousel.append(slide, controls);
    append(carousel);
    const grid = el("div", undefined, "grid");
    const caps = await platform.capabilities.list();
    const demos = [
      [
        "haptics",
        "Feel the feedback",
        "A brief vibration, where supported.",
        () => platform.haptics.vibrate({ durationMs: 50 }),
      ],
      [
        "notifications",
        "A friendly hello",
        "Local notifications only. No push server.",
        () =>
          platform.notifications.show({
            title: build.name,
            body: "Hello from your shared app.",
          }),
      ],
      [
        "clipboard",
        "Copy something good",
        "Write a short greeting to your clipboard.",
        () => platform.clipboard.writeText("Hello from " + build.name),
      ],
      [
        "files",
        "Pick a file",
        "Select a file. Only metadata stays on screen.",
        () => platform.files.pick({ accept: [] }),
      ],
      [
        "share",
        "Pass it along",
        "Open your system share sheet.",
        () =>
          platform.share.show({
            title: build.name,
            text: "One app. Everywhere.",
          }),
      ],
      [
        "device",
        "Meet your device",
        "Read non-identifying runtime information.",
        () => platform.device.getInfo(),
      ],
      [
        "network",
        "Check the connection",
        "Ask the platform for its current network state.",
        () => platform.network.getStatus(),
      ],
    ];
    for (const [key, title, description, action] of demos) {
      const node = panel(title, description);
      node.append(badge(caps[key]?.supported ? "Available" : "Unsupported"));
      const trigger = button("Try " + key + " ↗", () => run(key, action));
      trigger.disabled = !caps[key]?.supported;
      node.append(trigger);
      grid.append(node);
    }
    append(grid);
  }
  if (route === "diagnostics") {
    const node = panel(
      "Build & runtime",
      "No personal identifiers, telemetry, or remote logging.",
    );
    const data = {
      ...build,
      platform: platform.id,
      device: await platform.device.getInfo(),
      capabilities: await platform.capabilities.list(),
    };
    node.append(
      el("pre", JSON.stringify(data, null, 2)),
      button("Copy diagnostics", () =>
        run("Diagnostics", () =>
          platform.clipboard.writeText(JSON.stringify(data, null, 2)),
        ),
      ),
    );
    const events = panel(
      "Session events",
      "A short, in-memory log. Cleared when the app closes.",
    );
    events.append(
      el("pre", log.join("\n") || "No events yet. Try an interaction."),
    );
    append(node, events);
  }
  if (route === "settings") {
    const theme = panel(
      "Choose your atmosphere",
      "System follows your device’s appearance preference.",
    );
    const group = el("div", undefined, "controls");
    for (const value of ["light", "dark", "system"]) {
      const control = button(value[0].toUpperCase() + value.slice(1), () => {
        applyTheme(value);
        render();
      });
      control.setAttribute("aria-pressed", loadTheme(localStorage) === value);
      group.append(control);
    }
    theme.append(group);
    const about = panel(
      "A foundation you can make your own",
      "Vanilla JavaScript · Vite · Capacitor · Electron. App and original icon artwork licensed under MIT. Dependency licenses are included with distributions.",
    );
    about.append(
      el(
        "p",
        "Reduced motion follows your device settings. No analytics. No account required.",
      ),
      button("Reset demo state", () => {
        localStorage.removeItem("theme");
        card = 0;
        log.length = 0;
        applyTheme("system");
        render();
        announce("Demo state reset.");
      }),
    );
    const licenses = el("details");
    licenses.append(
      el("summary", "Dependency licenses"),
      el("pre", licenseNotices),
    );
    about.append(licenses);
    append(theme, about);
  }
}
window.addEventListener("hashchange", () => {
  render().catch((error) =>
    announce("View unavailable: " + normalizeError(error).message),
  );
  document.querySelector("main").focus();
});
try {
  await render();
} catch (error) {
  announce("View unavailable: " + normalizeError(error).message);
}
