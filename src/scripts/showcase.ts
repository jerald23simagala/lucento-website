type Mode = 'five' | 'three' | 'snap';

interface Metrics {
  phone: number;
  x1: number;
  x2: number;
  s1: number;
  s2: number;
  yStep: number;
}

function modeFor(width: number): Mode {
  if (width < 768) return 'snap';
  if (width < 1100) return 'three';
  return 'five';
}

function metricsFor(mode: Exclude<Mode, 'snap'>, stage: HTMLElement): Metrics {
  const stageWidth = stage.clientWidth;
  const stageHeight = stage.clientHeight;
  const fromHeight = stageHeight * (9 / 16);
  const phone = Math.max(148, Math.min(fromHeight, mode === 'five' ? 300 : 260, stageWidth * (mode === 'five' ? 0.28 : 0.36)));

  if (mode === 'three') {
    const neighbor = phone * 0.74;
    const x1 = Math.min(phone / 2 + neighbor / 2 + 16, stageWidth * 0.34);
    return { phone, x1, x2: x1 + phone * 0.72, s1: 0.74, s2: 0.6, yStep: 8 };
  }

  const adjacent = phone * 0.8;
  const outer = phone * 0.6;
  let x1 = phone / 2 + adjacent / 2 + 18;
  let x2 = x1 + adjacent / 2 + outer / 2 + 14;
  const span = x2 + outer / 2;
  const room = Math.max(0, stageWidth / 2 - 4);
  if (span > room && span > 0) {
    const fit = room / span;
    x1 *= fit;
    x2 *= fit;
  }
  return { phone, x1, x2, s1: 0.8, s2: 0.6, yStep: 12 };
}

function placement(slot: number, metrics: Metrics, mode: Exclude<Mode, 'snap'>): { x: number; y: number; scale: number; opacity: number; z: number } {
  const distance = Math.abs(slot);
  const sign = Math.sign(slot);
  let x = 0;
  let scale = 1;
  if (distance <= 1) {
    x = sign * distance * metrics.x1;
    scale = 1 - distance * (1 - metrics.s1);
  } else if (distance <= 2) {
    const t = distance - 1;
    x = sign * (metrics.x1 + t * (metrics.x2 - metrics.x1));
    scale = metrics.s1 - t * (metrics.s1 - metrics.s2);
  } else {
    const t = distance - 2;
    x = sign * (metrics.x2 + t * (metrics.x2 - metrics.x1) * 0.85);
    scale = Math.max(0.46, metrics.s2 - t * 0.08);
  }

  let opacity = 1;
  if (mode === 'three') {
    opacity = distance <= 1 ? 1 : Math.max(0, 1 - (distance - 1) / 0.3);
  } else if (distance > 2.15) {
    opacity = Math.max(0, 1 - (distance - 2.15) / 0.5);
  }

  return {
    x,
    y: Math.min(distance, 2.4) * metrics.yStep,
    scale,
    opacity,
    z: Math.round(40 - distance * 10),
  };
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
  const threeQuery = window.matchMedia('(max-width: 1099px)');
  let mode: Mode = modeFor(window.innerWidth);
  let current = -1;
  let ready = false;
  let frame = 0;
  let observer: IntersectionObserver | null = null;

  const readMode = (): Mode => {
    if (snapQuery.matches) return 'snap';
    if (threeQuery.matches) return 'three';
    return 'five';
  };

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

  const layoutPinned = (next: Exclude<Mode, 'snap'>): void => {
    const metrics = metricsFor(next, stage);
    const indexFloat = progress() * (count - 1);
    const places = slides.map((slide, index) => ({
      slide,
      index,
      slot: index - indexFloat,
      ...placement(index - indexFloat, metrics, next),
    }));
    if (next === 'three') {
      const nearest = [...places].sort((a, b) => Math.abs(a.slot) - Math.abs(b.slot)).slice(0, 3);
      const keep = new Set(nearest.map((item) => item.index));
      places.forEach((item) => {
        if (!keep.has(item.index)) item.opacity = 0;
      });
    }
    places.forEach((item) => {
      item.slide.style.width = `${metrics.phone}px`;
      item.slide.style.zIndex = String(item.z);
      item.slide.style.opacity = item.opacity.toFixed(3);
      item.slide.style.pointerEvents = item.opacity < 0.2 ? 'none' : '';
      item.slide.style.transform = `translate3d(calc(-50% + ${item.x.toFixed(2)}px), calc(-50% + ${item.y.toFixed(2)}px), 0) scale(${item.scale.toFixed(4)})`;
      const link = item.slide.querySelector<HTMLElement>('a');
      if (link) link.tabIndex = item.opacity < 0.35 ? -1 : 0;
    });
    announce(Math.min(count - 1, Math.max(0, Math.round(indexFloat))));
  };

  const apply = (): void => {
    mode = readMode();
    root.dataset.mode = mode;
    if (mode === 'snap') return;
    layoutPinned(mode);
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
  threeQuery.addEventListener('change', onResize);

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
