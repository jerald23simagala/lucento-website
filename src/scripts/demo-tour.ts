// Coach-mark tour for the phone demo. The simulator owns the story state and
// emits `sim-step` whenever the phone re-renders. This module only points at
// the current control and lets the visitor move ahead with Next.
import { findStepHit, STORIES, type SimStepDetail } from '../demo/simulator';

function bars(spot: HTMLElement): HTMLElement[] {
  return ['t', 'l', 'r', 'b'].map((name) => spot.querySelector<HTMLElement>(`[data-bar="${name}"]`)).filter((el): el is HTMLElement => el !== null);
}

function cover(spot: HTMLElement, width: number, height: number): void {
  const [top, left, right, bottom] = bars(spot);
  if (!top || !left || !right || !bottom) return;
  top.style.cssText = `display:block;left:0;top:0;width:${width}px;height:${height}px`;
  left.style.cssText = 'display:none';
  right.style.cssText = 'display:none';
  bottom.style.cssText = 'display:none';
}

function reveal(spot: HTMLElement, screen: HTMLElement, hit: HTMLElement): boolean {
  const sr = screen.getBoundingClientRect();
  const tr = hit.getBoundingClientRect();
  const pad = 7;
  let x = Math.round(tr.left - sr.left - pad);
  let y = Math.round(tr.top - sr.top - pad);
  let w = Math.round(tr.width + pad * 2);
  let h = Math.round(tr.height + pad * 2);
  if (x < 0) {
    w += x;
    x = 0;
  }
  if (y < 0) {
    h += y;
    y = 0;
  }
  const sw = sr.width;
  const sh = sr.height;
  if (x + w > sw) w = sw - x;
  if (y + h > sh) h = sh - y;
  if (w < 12 || h < 12) {
    cover(spot, sw, sh);
    return false;
  }
  const [top, left, right, bottom] = bars(spot);
  if (!top || !left || !right || !bottom) return false;
  top.style.cssText = `display:block;left:0;top:0;width:${sw}px;height:${y}px`;
  left.style.cssText = `display:block;left:0;top:${y}px;width:${x}px;height:${h}px`;
  right.style.cssText = `display:block;left:${x + w}px;top:${y}px;width:${Math.max(0, sw - (x + w))}px;height:${h}px`;
  bottom.style.cssText = `display:block;left:0;top:${y + h}px;width:${sw}px;height:${Math.max(0, sh - (y + h))}px`;
  return true;
}

function bringIntoView(screen: HTMLElement, hit: HTMLElement): void {
  const scroller = hit.closest('.ls-scroll');
  if (!(scroller instanceof HTMLElement) || !screen.contains(scroller)) return;
  const box = scroller.getBoundingClientRect();
  const tr = hit.getBoundingClientRect();
  if (tr.top < box.top + 8) scroller.scrollTop += tr.top - box.top - 16;
  else if (tr.bottom > box.bottom - 8) scroller.scrollTop += tr.bottom - box.bottom + 16;
}

function clearInert(screen: HTMLElement): void {
  screen.querySelectorAll<HTMLElement>('[data-tour-inert]').forEach((el) => {
    el.inert = false;
    delete el.dataset.tourInert;
  });
  screen.querySelectorAll('[aria-describedby="tour-body"]').forEach((el) => el.removeAttribute('aria-describedby'));
}

function inertExcept(screen: HTMLElement, hit: HTMLElement | null): void {
  clearInert(screen);
  if (!hit || !screen.contains(hit)) return;
  let node: HTMLElement = hit;
  while (node.parentElement && node.parentElement !== screen) {
    const parent = node.parentElement;
    for (const sib of parent.children) {
      if (sib === node || !(sib instanceof HTMLElement)) continue;
      sib.inert = true;
      sib.dataset.tourInert = '1';
    }
    node = parent;
  }
  for (const sib of screen.children) {
    if (sib === hit || sib.contains(hit) || !(sib instanceof HTMLElement)) continue;
    sib.inert = true;
    sib.dataset.tourInert = '1';
  }
  hit.setAttribute('aria-describedby', 'tour-body');
}

export function mountTour(root: HTMLElement): void {
  const select = root.querySelector<HTMLSelectElement>('[data-tour="story"]');
  const screen = root.querySelector<HTMLElement>('[data-sim="screen"]');
  const phone = root.querySelector<HTMLElement>('.ld-phone');
  const stage = root.querySelector<HTMLElement>('.ld-stage');
  const bubble = root.querySelector<HTMLElement>('[data-tour="bubble"]');
  const spot = root.querySelector<HTMLElement>('[data-tour="spot"]');
  const titleEl = root.querySelector<HTMLElement>('[data-tour="title"]');
  const bodyEl = root.querySelector<HTMLElement>('[data-tour="body"]');
  const countEl = root.querySelector<HTMLElement>('[data-tour="count"]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-tour="next"]');
  const skipBtn = root.querySelector<HTMLButtonElement>('[data-tour="skip"]');
  const reopen = root.querySelector<HTMLButtonElement>('[data-tour="reopen"]');
  const live = root.querySelector<HTMLElement>('[data-sim="live"]');
  if (!select || !screen || !phone || !stage || !bubble || !spot || !titleEl || !bodyEl || !countEl || !nextBtn || !skipBtn || !reopen) return;

  const order = (root.dataset.stories ?? '').split(',').filter(Boolean);
  let story = select.value;
  let tourIndex = 0;
  let tourOn = true;
  let focusKey = '';
  let primed = false;
  let hinted: HTMLElement | null = null;
  let hintedIndex = -1;
  let hintedStory = '';
  root.classList.add('is-guided');

  const stepsOf = (): { title: string; body: string; target?: string }[] => STORIES[story]?.steps ?? [];

  const place = (): void => {
    if (!tourOn) return;
    const storyDef = STORIES[story];
    if (!storyDef) return;
    const steps = stepsOf();
    const finale = tourIndex >= steps.length;
    const step = steps[tourIndex];
    const fromSim = !finale && tourIndex === hintedIndex && story === hintedStory && hinted?.isConnected ? hinted : null;
    const hit = fromSim ?? (!finale && step?.target ? findStepHit(screen, step.target) : null);
    const key = `${story}:${tourIndex}:${finale ? 'done' : 'step'}`;
    if (hit && key !== focusKey) bringIntoView(screen, hit);

    const pr = phone.getBoundingClientRect();
    const sr = screen.getBoundingClientRect();
    spot.hidden = false;
    spot.style.top = `${sr.top - pr.top}px`;
    spot.style.left = `${sr.left - pr.left}px`;
    spot.style.width = `${sr.width}px`;
    spot.style.height = `${sr.height}px`;
    if (!hit) cover(spot, sr.width, sr.height);
    else reveal(spot, screen, hit);

    titleEl.textContent = finale ? 'Done' : step?.title ?? '';
    bodyEl.textContent = finale ? storyDef.finale : step?.body ?? '';
    countEl.textContent = finale ? `${steps.length} of ${steps.length}` : `${tourIndex + 1} of ${steps.length}`;
    nextBtn.textContent = finale ? 'Next guide' : 'Next';
    bubble.hidden = false;
    reopen.hidden = true;

    const stageRect = stage.getBoundingClientRect();
    const anchor = (hit ?? screen).getBoundingClientRect();
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const preferAbove = anchor.top + anchor.height / 2 > sr.top + sr.height * 0.55;
    let top = preferAbove ? anchor.top - stageRect.top - bh - 10 : anchor.bottom - stageRect.top + 10;
    const maxTop = Math.max(8, stageRect.height - bh - 8);
    if (top < 8) top = 8;
    if (top > maxTop) top = maxTop;
    let left = anchor.left + anchor.width / 2 - stageRect.left - bw / 2;
    left = Math.max(8, Math.min(left, stageRect.width - bw - 8));
    bubble.style.top = `${Math.round(top)}px`;
    bubble.style.left = `${Math.round(left)}px`;
    bubble.style.right = 'auto';

    inertExcept(screen, hit);

    if (key === focusKey) return;
    const message = finale
      ? `Done. ${storyDef.finale}`
      : `Step ${tourIndex + 1} of ${steps.length}: ${step?.title ?? ''}. ${step?.body ?? ''}`;
    if (live) live.textContent = message;
    focusKey = key;
    if (!primed) {
      primed = true;
      return;
    }
    const active = document.activeElement;
    const typing =
      (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) &&
      screen.contains(active);
    if (!typing) bubble.focus();
  };

  const exitTour = (): void => {
    tourOn = false;
    root.classList.remove('is-guided');
    clearInert(screen);
    spot.hidden = true;
    bubble.hidden = true;
    reopen.hidden = false;
    if (live) live.textContent = 'Guide closed.';
    select.focus();
  };

  root.addEventListener('sim-step', (event) => {
    const detail = (event as CustomEvent<SimStepDetail>).detail;
    if (!detail) return;
    hinted = detail.target;
    hintedIndex = detail.index;
    hintedStory = detail.story;
    if (detail.story !== story) {
      story = detail.story;
      tourIndex = detail.index;
      tourOn = true;
      focusKey = '';
      root.classList.add('is-guided');
      if (select.value !== story) select.value = story;
    } else if (detail.index > tourIndex) {
      tourIndex = detail.index;
      focusKey = '';
    }
    if (tourOn) place();
  });

  select.addEventListener('change', () => {
    story = select.value;
    tourIndex = 0;
    tourOn = true;
    focusKey = '';
    root.classList.add('is-guided');
    root.dispatchEvent(new CustomEvent('sim-choose', { detail: { story: select.value } }));
  });

  nextBtn.addEventListener('click', () => {
    if (tourIndex >= stepsOf().length) {
      const next = order[(order.indexOf(story) + 1) % order.length] ?? story;
      story = next;
      tourIndex = 0;
      focusKey = '';
      select.value = next;
      root.dispatchEvent(new CustomEvent('sim-choose', { detail: { story: next } }));
      return;
    }
    tourIndex += 1;
    focusKey = '';
    place();
  });

  skipBtn.addEventListener('click', () => exitTour());
  reopen.addEventListener('click', () => {
    tourOn = true;
    focusKey = '';
    root.classList.add('is-guided');
    place();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !tourOn) return;
    event.preventDefault();
    exitTour();
  });

  const reposition = (): void => {
    if (tourOn) place();
  };
  window.addEventListener('resize', reposition);
  screen.addEventListener('scroll', reposition, true);
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(reposition);
    observer.observe(phone);
  }
}
