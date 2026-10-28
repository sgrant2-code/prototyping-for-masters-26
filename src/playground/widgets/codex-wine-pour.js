const SVG = "http://www.w3.org/2000/svg";

const svg = (name, attributes = {}) => {
  const element = document.createElementNS(SVG, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
};

export default {
  student: "Codex",
  title: "Wine spill",
  width: 430,
  height: 320,
  rotate: 1,
  mount(root) {
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        height: 100%;
      }
      .wine-bar {
        position: relative;
        display: grid;
        grid-template-rows: 1fr auto;
        height: 100%;
        overflow: hidden;
        background: #f7ecdc;
        color: #2a191a;
        font-family: "IBM Plex Mono", monospace;
      }
      .wine-bar::before {
        position: absolute;
        top: -4rem;
        left: -2.5rem;
        width: 11rem;
        height: 11rem;
        border: 1px solid #6d1231;
        border-radius: 50%;
        content: "";
        opacity: 0.13;
        pointer-events: none;
      }
      .scene {
        position: relative;
        min-height: 0;
      }
      .bottle {
        position: absolute;
        z-index: 2;
        bottom: 0.8rem;
        left: 1.1rem;
        width: 8rem;
        height: 12rem;
        padding: 0;
        border: 0;
        background: none;
        cursor: pointer;
        transform-origin: 78% 94%;
      }
      .bottle svg {
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
        transform-origin: 78% 94%;
        transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .bottle.is-pouring svg { transform: rotate(24deg) translate(0.45rem, -0.1rem); }
      .bottle:focus-visible { outline: 2px solid #6d1231; outline-offset: 0.3rem; }
      .bottle:active svg { transform: scale(0.97); }
      .bottle.is-pouring:active svg { transform: rotate(24deg) translate(0.45rem, -0.1rem) scale(0.97); }
      .glass {
        position: absolute;
        right: 2.25rem;
        bottom: 1.15rem;
        width: 8.1rem;
        height: 12rem;
      }
      .glass svg {
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .wine-stream {
        position: absolute;
        z-index: 1;
        top: 2.6rem;
        left: 8.25rem;
        width: 7.2rem;
        height: 1.6rem;
        opacity: 0;
        transform: rotate(12deg) scaleX(0.2);
        transform-origin: left center;
        transition: opacity 120ms ease, transform 180ms ease;
      }
      .wine-stream.is-visible {
        opacity: 1;
        transform: rotate(12deg) scaleX(1);
      }
      .caption {
        position: relative;
        z-index: 3;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        min-height: 3.4rem;
        padding: 0.72rem 0.9rem;
        border-top: 1px solid #6d1231;
        background: #ebd4bd;
        font-size: 0.66rem;
        line-height: 1.35;
      }
      .caption p { margin: 0; }
      .caption strong {
        color: #6d1231;
        font-weight: 600;
        text-transform: uppercase;
      }
      .meter {
        width: 4.8rem;
        height: 0.42rem;
        overflow: hidden;
        border: 1px solid #6d1231;
        border-radius: 999px;
      }
      .meter-fill {
        width: 0;
        height: 100%;
        background: #6d1231;
        transition: width 80ms linear;
      }
      @media (prefers-reduced-motion: reduce) {
        .bottle svg,
        .wine-stream,
        .meter-fill { transition: none; }
      }
    `;

    const bar = document.createElement("section");
    bar.className = "wine-bar";
    bar.innerHTML = `
      <div class="scene">
        <button class="bottle" type="button" aria-pressed="false" aria-label="Start pouring wine"></button>
        <div class="wine-stream" aria-hidden="true"></div>
        <div class="glass" aria-label="Wine glass"></div>
      </div>
      <div class="caption">
        <p><strong>Click the bottle</strong><br><span class="status">Fill the glass, if you dare.</span></p>
        <div class="meter" aria-hidden="true"><div class="meter-fill"></div></div>
      </div>
    `;

    const bottle = bar.querySelector(".bottle");
    const stream = bar.querySelector(".wine-stream");
    const glass = bar.querySelector(".glass");
    const status = bar.querySelector(".status");
    const meter = bar.querySelector(".meter-fill");
    let fill = 0;
    let pouring = false;
    let spilled = false;
    let frame = null;
    let lastTime = 0;

    const bottleArt = svg("svg", { viewBox: "0 0 120 190", "aria-hidden": "true" });
    bottleArt.append(
      svg("path", { d: "M 46 10 H 76 V 39 L 88 58 V 168 Q 60 181 32 168 V 58 L 46 39 Z", fill: "#254438", stroke: "#1b3028", "stroke-width": 3 }),
      svg("path", { d: "M 41 63 Q 60 55 79 63 V 151 Q 60 160 41 151 Z", fill: "#f4ddaa", stroke: "#6d1231", "stroke-width": 2 }),
      svg("path", { d: "M 50 12 H 72 V 32 H 50 Z", fill: "#dcb67a", stroke: "#6c4a29", "stroke-width": 2 }),
      svg("path", { d: "M 38 164 Q 60 172 82 164", fill: "none", stroke: "#6d1231", "stroke-width": 5, opacity: 0.88 }),
    );
    const wineLabel = svg("text", {
      x: 60, y: 111, fill: "#6d1231", "font-size": 22, "font-family": "Georgia, serif", "font-weight": 700,
      "letter-spacing": 2, "text-anchor": "middle",
    });
    wineLabel.textContent = "WINE";
    bottleArt.append(wineLabel);
    bottle.append(bottleArt);

    const streamArt = svg("svg", { viewBox: "0 0 150 32" });
    streamArt.append(svg("path", { d: "M 0 12 C 34 7, 72 26, 150 17", fill: "none", stroke: "#6d1231", "stroke-width": 10, "stroke-linecap": "round" }));
    stream.append(streamArt);

    const glassArt = svg("svg", { viewBox: "0 0 120 190", "aria-hidden": "true" });
    const fillClip = svg("clipPath", { id: "wine-glass-clip" });
    fillClip.append(svg("path", { d: "M 25 25 H 95 L 84 122 Q 60 139 36 122 Z" }));
    const wine = svg("rect", { x: 20, y: 125, width: 80, height: 105, fill: "#6d1231", "clip-path": "url(#wine-glass-clip)" });
    glassArt.append(
      wine,
      svg("path", { d: "M 25 25 H 95 L 84 122 Q 60 139 36 122 Z", fill: "#fffaf1", "fill-opacity": 0.2, stroke: "#875f54", "stroke-width": 3 }),
      svg("path", { d: "M 60 133 V 165 M 38 170 H 82", fill: "none", stroke: "#875f54", "stroke-width": 3, "stroke-linecap": "round" }),
      svg("path", { d: "M 31 35 H 89", fill: "none", stroke: "#ffffff", "stroke-width": 2, opacity: 0.72 }),
    );
    glass.append(glassArt);

    const updateGlass = () => {
      const wineTop = 125 - fill * 0.98;
      wine.setAttribute("y", wineTop.toFixed(2));
      wine.setAttribute("height", (230 - wineTop).toFixed(2));
      meter.style.width = `${fill}%`;
    };

    const makeSpill = () => {
      const viewport = root.host.closest(".canvas-viewport");
      if (!viewport || viewport.querySelector(".wine-stain-overlay")) return;
      const source = root.host.getBoundingClientRect();
      const bounds = viewport.getBoundingClientRect();
      const x = Math.min(88, Math.max(12, ((source.left - bounds.left + source.width * 0.63) / bounds.width) * 100));
      const y = Math.min(88, Math.max(12, ((source.top - bounds.top + source.height * 0.48) / bounds.height) * 100));
      const spill = document.createElement("div");
      spill.className = "wine-stain-overlay";
      Object.assign(spill.style, {
        position: "absolute",
        inset: "0",
        zIndex: "3",
        pointerEvents: "none",
        opacity: "0",
        mixBlendMode: "multiply",
        transition: "opacity 900ms ease-out",
        background: `
          radial-gradient(ellipse 31% 10% at ${x}% ${y}%, rgb(92 9 35 / 68%) 0 44%, transparent 47%),
          radial-gradient(circle 1.35rem at ${x + 20}% ${y + 13}%, rgb(111 14 42 / 62%) 0 62%, transparent 66%),
          radial-gradient(circle 0.7rem at ${x - 18}% ${y + 24}%, rgb(111 14 42 / 56%) 0 60%, transparent 66%),
          radial-gradient(ellipse 44% 16% at ${x - 3}% ${Math.min(92, y + 38)}%, rgb(98 8 34 / 48%) 0 38%, transparent 43%)`,
      });
      viewport.append(spill);
      requestAnimationFrame(() => { spill.style.opacity = "1"; });
    };

    const tick = (now) => {
      if (!pouring) return;
      fill = Math.min(100, fill + (now - lastTime) * 0.018);
      lastTime = now;
      updateGlass();
      if (fill >= 100 && !spilled) {
        spilled = true;
        makeSpill();
        status.textContent = "Too late. Wine stains everything.";
      }
      frame = requestAnimationFrame(tick);
    };

    const setPouring = (next) => {
      pouring = next;
      bottle.classList.toggle("is-pouring", next);
      stream.classList.toggle("is-visible", next);
      bottle.setAttribute("aria-pressed", String(next));
      bottle.setAttribute("aria-label", next ? "Stop pouring wine" : "Start pouring wine");
      if (!next) {
        if (frame) cancelAnimationFrame(frame);
        frame = null;
        if (!spilled) status.textContent = fill ? "A civilized little pour." : "Fill the glass, if you dare.";
        return;
      }
      if (!spilled) status.textContent = "Click again before it spills.";
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    };

    bottle.addEventListener("click", () => setPouring(!pouring));
    updateGlass();
    root.append(style, bar);
  },
};
