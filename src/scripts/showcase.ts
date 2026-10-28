type Mode = 'five' | 'snap';

function modeFor(width: number): Mode {
  return width < 768 ? 'snap' : 'five';
}

/** Relative size: the focused phone is largest; the others stay visible and recede. */
function relativeScale(distance: number): number {
  if (distance <= 1) return 1 - distance * 0.18;
  if (distance <= 2) return 0.82 - (distance - 1) * 0.16;
  if (distance <= 3) return 0.66 - (distance - 2) * 0.12;
  return Math.max(0.42, 0.54 - (distance - 3) * 0.06);
}

export function mountShowcase(root: HTMLElement): void {
  if (root.dataset.mounted === 'true') return;
  if (!document.documentElement.classList.contains('js-motion')) return;
  root.dataset.mounted = 'true';

  const pin = root.querySelector<HTMLElement>('[data-pin]');
  const stage = root.querySelector<HTMLElement>('[data-stage]');
  const track = root.querySelector<HTMLElement>('[data-track]');
  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  const live = root.querySelector<HTMLElement>('[data-live]');
  const step = root.querySelector<HTMLElement>('[data-step]');
  const title = root.querySelector<HTMLElement>('[data-sync-title]');
  const body = root.querySelector<HTMLElement>('[data-sync-body]');
  const kicker = root.querySelector<HTMLElement>('[data-sync-kicker]');
  const count = slides.length;
  if (!pin || !stage || !track || count === 0) return;

  const snapQuery = window.matchMedia('(max-width: 767px)');
  let mode: Mode = modeFor(window.innerWidth);
  let current = -1;
  let ready = false;
  let frame = 0;
  let observer: IntersectionObserver | null = null;

  const readMode = (): Mode => (snapQuery.matches ? 'snap' : 'five');

  const progress = (): number => {
    const scrollable = pin.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    const scrolled = Math.min(Math.max(-pin.getBoundingClientRect().top, 0), scrollable);
    return scrolled / scrollable;
  };

  const clearMotion = (): void => {
    slides.forEach((slide) => {
      slide.style.transform = '';
      slide.style.opacity = '';
      slide.style.zIndex = '';
      slide.style.width = '';
      slide.style.left = '';
      slide.style.top = '';
      slide.style.pointerEvents = '';
      const link = slide.querySelector<HTMLElement>('a');
      if (link) link.tabIndex = 0;
    });
  };

  const announce = (index: number): void => {
    const slide = slides[index];
    if (!slide) return;
    if (ready && index === current) return;
    slides.forEach((item, itemIndex) => {
      if (itemIndex === index) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
    root.querySelectorAll<HTMLElement>('[data-dot]').forEach((control) => {
      if (Number(control.dataset.goto) === index) control.setAttribute('aria-current', 'true');
      else control.removeAttribute('aria-current');
    });
    if (step) step.textContent = String(index + 1);
    if (kicker) kicker.textContent = slide.dataset.kicker ?? '';
    if (title) title.textContent = slide.dataset.title ?? '';
    if (body) body.textContent = slide.dataset.body ?? '';
    if (ready && live && index !== current) {
      live.textContent = `Screen ${index + 1} of ${count}: ${slide.dataset.title ?? ''}. ${slide.dataset.body ?? ''}`;
    }
    current = index;
  };

  const layoutPinned = (): void => {
    const indexFloat = progress() * (count - 1);
    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    const pad = 10;
    const gap = 14;
    const heightCap = Math.min(300, Math.max(120, stageHeight * (9 / 16) * 0.92));
    let widest = 0;
    for (let step = 0; step <= count - 1; step += 0.25) {
      let sum = 0;
      for (let index = 0; index < count; index += 1) sum += relativeScale(Math.abs(index - step));
      widest = Math.max(widest, sum);
    }
    const room = Math.max(0, stageWidth - pad * 2 - gap * (count - 1));
    const phone = room > 0 && widest > 0 ? Math.min(heightCap, room / widest) : heightCap;
    const phonePx = `${phone.toFixed(2)}px`;
    const distances = slides.map((_, index) => Math.abs(index - indexFloat));
    const widths = distances.map((distance) => phone * relativeScale(distance));
    const centers: number[] = [];
    let cursor = 0;
    widths.forEach((width) => {
      centers.push(cursor + width / 2);
      cursor += width + gap;
    });
    const total = Math.max(0, cursor - gap);
    const startIndex = Math.floor(indexFloat);
    const endIndex = Math.min(count - 1, startIndex + 1);
    const blend = indexFloat - startIndex;
    const focusCenter = (centers[startIndex] ?? 0) * (1 - blend) + (centers[endIndex] ?? 0) * blend;
    const minShift = pad;
    const maxShift = stageWidth - pad - total;
    const shift = maxShift >= minShift ? Math.min(Math.max(stageWidth / 2 - focusCenter, minShift), maxShift) : (stageWidth - total) / 2;

    slides.forEach((slide, index) => {
      const distance = distances[index] ?? 0;
      const scale = relativeScale(distance);
      if (slide.style.width !== phonePx) slide.style.width = phonePx;
      slide.style.opacity = '1';
      slide.style.pointerEvents = '';
      slide.style.zIndex = String(Math.round(40 - distance * 10));
      slide.style.transformOrigin = 'center center';
      const centerX = shift + (centers[index] ?? 0);
      const dx = centerX - stageWidth / 2;
      const dy = Math.min(distance, 2) * 6;
      slide.style.transform = `translate3d(calc(-50% + ${dx.toFixed(2)}px), calc(-50% + ${dy.toFixed(2)}px), 0) scale(${scale.toFixed(4)})`;
      const link = slide.querySelector<HTMLElement>('a');
      if (link) link.tabIndex = 0;
    });
    announce(Math.min(count - 1, Math.max(0, Math.round(indexFloat))));
  };

  const apply = (): void => {
    mode = readMode();
    root.dataset.mode = mode;
    if (mode === 'snap') return;
    layoutPinned();
    ready = true;
  };

  const watchSnap = (): void => {
    observer?.disconnect();
    if (!track) return;
    observer = new IntersectionObserver(
      (entries) => {
        if (readMode() !== 'snap') return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.index);
        if (Number.isNaN(index)) return;
        announce(index);
        ready = true;
      },
      { root: track, threshold: [0.55, 0.75] },
    );
    slides.forEach((slide) => observer?.observe(slide));
  };

  const scrollToIndex = (index: number): void => {
    const next = readMode();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (next === 'snap') {
      slides[index]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      return;
    }
    const scrollable = pin.offsetHeight - window.innerHeight;
    const top = window.scrollY + pin.getBoundingClientRect().top + (count === 1 ? 0 : (index / (count - 1)) * scrollable);
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  };

  const onScroll = (): void => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      if (readMode() === 'snap') return;
      apply();
    });
  };

  const onResize = (): void => {
    const next = readMode();
    if (next === 'snap') {
      clearMotion();
      watchSnap();
    } else {
      observer?.disconnect();
      observer = null;
    }
    apply();
  };

  root.addEventListener('click', (event) => {
    const control = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-goto]');
    if (!control || !root.contains(control)) return;
    event.preventDefault();
    const index = Number(control.dataset.goto);
    if (Number.isNaN(index)) return;
    scrollToIndex(index);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  snapQuery.addEventListener('change', onResize);

  if (readMode() === 'snap') {
    root.dataset.mode = 'snap';
    clearMotion();
    watchSnap();
    announce(0);
    ready = true;
  } else {
    apply();
  }

  const hashIndex = slides.findIndex((slide) => `#${slide.id}` === window.location.hash);
  if (hashIndex > 0) scrollToIndex(hashIndex);
}
