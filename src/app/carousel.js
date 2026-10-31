/** Project the release position slightly in the release direction, then snap at 25%. */
export function snapIndex(index, distance, velocity, width, count) {
  const projected = distance + Math.max(-1, Math.min(1, velocity)) * 100;
  const delta =
    Math.abs(projected) > width * 0.25 ? (projected < 0 ? 1 : -1) : 0;
  return Math.max(0, Math.min(count - 1, index + delta));
}
export function createCarousel({ index = 0, onChange = () => {} } = {}) {
  const names = [
    "One shared canvas",
    "Native where it matters",
    "Ready for your next idea",
  ];
  const viewport = document.createElement("div");
  viewport.className = "slide carousel-viewport";
  viewport.tabIndex = 0;
  viewport.setAttribute("role", "region");
  viewport.setAttribute("aria-roledescription", "carousel");
  viewport.setAttribute(
    "aria-label",
    "Carousel; use left and right arrow keys",
  );
  const track = document.createElement("div");
  track.className = "carousel-track";
  const slides = names.map((name, i) => {
    const slide = document.createElement("div");
    slide.className = "carousel-item";
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `${i + 1} of ${names.length}`);
    slide.textContent = name;
    track.append(slide);
    return slide;
  });
  const status = document.createElement("span");
  status.className = "carousel-status";
  status.setAttribute("aria-live", "polite");
  viewport.append(track, status);
  const controls = document.createElement("div");
  controls.className = "controls";
  const prev = document.createElement("button"),
    next = document.createElement("button");
  prev.type = next.type = "button";
  prev.className = next.className = "button";
  prev.textContent = "← Previous";
  next.textContent = "Next →";
  controls.append(prev, next);
  let gesture = null;
  const position = (offset = 0) => {
    track.style.transform = `translate3d(calc(${-index * 100}% + ${offset}px),0,0)`;
  };
  const update = () => {
    position();
    status.textContent = `0${index + 1} / 03`;
    slides.forEach((s, i) =>
      s.setAttribute("aria-hidden", String(i !== index)),
    );
    prev.disabled = index === 0;
    next.disabled = index === 2;
    onChange(index);
  };
  const move = (delta) => {
    index = Math.max(0, Math.min(2, index + delta));
    update();
  };
  prev.onclick = () => move(-1);
  next.onclick = () => move(1);
  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      move(e.key === "ArrowRight" ? 1 : -1);
    }
    if (e.key === "Home") {
      e.preventDefault();
      index = 0;
      update();
    }
    if (e.key === "End") {
      e.preventDefault();
      index = 2;
      update();
    }
  });
  viewport.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    const matrix = getComputedStyle(track).transform;
    const base =
      matrix === "none"
        ? 0
        : new DOMMatrixReadOnly(matrix).m41 + index * viewport.clientWidth;
    gesture = {
      base,
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      time: e.timeStamp,
      velocity: 0,
      offset: 0,
      axis: null,
    };
    viewport.setPointerCapture(e.pointerId);
    track.classList.add("dragging");
    position(base);
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!gesture || gesture.id !== e.pointerId) return;
    const g = gesture;
    const dx = e.clientX - g.x,
      dy = e.clientY - g.y;
    if (!g.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 6)
      g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (g.axis !== "x") return;
    g.velocity = (e.clientX - g.lastX) / Math.max(1, e.timeStamp - g.time);
    g.lastX = e.clientX;
    g.time = e.timeStamp;
    g.offset = g.base + dx;
    const resistance =
      (index === 0 && dx > 0) || (index === 2 && dx < 0) ? 0.25 : 1;
    position(g.offset * resistance);
  });
  const end = (e, cancelled = false) => {
    if (!gesture || gesture.id !== e.pointerId) return;
    const g = gesture;
    gesture = null;
    track.classList.remove("dragging");
    if (!cancelled && g.axis === "x") {
      const velocity = e.timeStamp - g.time > 100 ? 0 : g.velocity;
      index = snapIndex(
        index,
        g.base + e.clientX - g.x,
        velocity,
        viewport.clientWidth,
        3,
      );
    }
    update();
    if (viewport.hasPointerCapture(e.pointerId))
      viewport.releasePointerCapture(e.pointerId);
  };
  viewport.addEventListener("pointerup", (e) => end(e));
  viewport.addEventListener("pointercancel", (e) => end(e, true));
  viewport.addEventListener("lostpointercapture", (e) => end(e, true));
  update();
  return { viewport, controls };
}
