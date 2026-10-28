const SVG = "http://www.w3.org/2000/svg";

const svg = (name, attributes = {}) => {
  const element = document.createElementNS(SVG, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
};

export default {
  student: "Codex",
  title: "Wine spill",
  frame: false,
  width: 450,
  height: 390,
  mount(root) {
    const style = document.createElement("style");
    style.textContent = `
      :host { display: block; height: 100%; }
      .wine-scene { position: relative; width: 100%; height: 100%; }
      .illustration {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
      }
      .pour-layer {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
      }
      .wine-stream {
        opacity: 0;
        transform-box: fill-box;
        transform-origin: left center;
        transition: opacity 120ms ease, transform 180ms ease;
      }
      .wine-stream.is-visible { opacity: 1; transform: scaleX(1); }
      .bottle {
        position: absolute;
        z-index: 2;
        top: 5%;
        left: 24%;
        width: 28%;
        height: 87%;
        padding: 0;
        border: 0;
        border-radius: 48% 48% 18% 18%;
        background: transparent;
        cursor: pointer;
      }
      .bottle:hover { background: rgb(255 255 255 / 10%); }
      .bottle:focus-visible { outline: 3px solid #8f1835; outline-offset: 0.3rem; }
      .bottle.is-pouring { cursor: grabbing; }
      .sr-status {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      @media (prefers-reduced-motion: reduce) { .wine-stream { transition: none; } }
    `;

    const scene = document.createElement("section");
    scene.className = "wine-scene";
    scene.innerHTML = `
      <img class="illustration" src="/playground-assets/wine-bottle-and-glass.png" alt="Illustration of a dark wine bottle beside a red wine glass" />
      <button class="bottle" type="button" aria-pressed="false" aria-label="Start pouring wine"></button>
      <output class="sr-status" aria-live="polite">The glass is empty.</output>
    `;

    const bottle = scene.querySelector(".bottle");
    const status = scene.querySelector("output");
    let fill = 0;
    let pouring = false;
    let spilled = false;
    let frame = null;
    let lastTime = 0;

    const pourLayer = svg("svg", { class: "pour-layer", viewBox: "0 0 1162 1036", "aria-hidden": "true" });
    const clip = svg("clipPath", { id: "wine-glass-bowl-clip" });
    clip.append(svg("path", { d: "M 612 326 C 601 483 616 642 717 710 C 767 744 845 724 884 666 C 936 583 922 430 894 331 Z" }));
    const wine = svg("rect", { x: 586, y: 742, width: 366, height: 420, fill: "#8f1835", opacity: 0.76, "clip-path": "url(#wine-glass-bowl-clip)" });
    const wineSurface = svg("path", { d: "M 620 742 Q 764 758 909 742", fill: "none", stroke: "#cf3d4d", "stroke-width": 9, opacity: 0.72, "clip-path": "url(#wine-glass-bowl-clip)" });
    const stream = svg("path", {
      class: "wine-stream", d: "M 492 143 C 545 166 579 229 645 333", fill: "none", stroke: "#8f1835", "stroke-width": 17, "stroke-linecap": "round",
    });
    const label = svg("text", {
      x: 468, y: 647, fill: "#24130f", "font-size": 36, "font-family": "Georgia, serif", "font-weight": 700,
      "letter-spacing": 5, "text-anchor": "middle", opacity: 0.92,
    });
    label.textContent = "WINE";
    pourLayer.append(clip, wine, wineSurface, stream, label);
    scene.append(pourLayer);

    const updateWine = () => {
      const top = 742 - fill * 4.08;
      wine.setAttribute("y", top.toFixed(2));
      wine.setAttribute("height", (1162 - top).toFixed(2));
      wineSurface.setAttribute("d", `M 620 ${top.toFixed(2)} Q 764 ${(top + 16).toFixed(2)} 909 ${top.toFixed(2)}`);
    };

    const makeSpill = () => {
      const viewport = root.host.closest(".canvas-viewport");
      if (!viewport || viewport.querySelector(".wine-stain-overlay")) return;
      const source = root.host.getBoundingClientRect();
      const bounds = viewport.getBoundingClientRect();
      const x = Math.min(88, Math.max(12, ((source.left - bounds.left + source.width * 0.68) / bounds.width) * 100));
      const y = Math.min(88, Math.max(12, ((source.top - bounds.top + source.height * 0.54) / bounds.height) * 100));
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
      updateWine();
      if (fill >= 100 && !spilled) {
        spilled = true;
        makeSpill();
        status.textContent = "The wine glass overflowed and stained the playground.";
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
        if (!spilled) status.textContent = fill ? "The wine stopped pouring." : "The glass is empty.";
        return;
      }
      if (!spilled) status.textContent = "Wine is pouring into the glass.";
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    };

    bottle.addEventListener("click", () => setPouring(!pouring));
    updateWine();
    root.append(style, scene);
  },
};
