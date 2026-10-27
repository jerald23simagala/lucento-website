import type { AnimationItem, LottiePlayer } from 'lottie-web';

let playerPromise: Promise<LottiePlayer> | null = null;

function player(): Promise<LottiePlayer> {
  if (!playerPromise) {
    // Loaded inside this function on purpose. The player stays out of the
    // first page load, and this function is not called when the visitor
    // prefers reduced motion. The WebP in the markup is the fallback.
    playerPromise = import('lottie-web/build/player/esm/lottie_light.min.js').then(
      (mod) => mod.default,
    );
  }
  return playerPromise;
}

function bootOne(el: HTMLElement, motion: MediaQueryList): void {
  if (el.dataset.mascotReady === 'true') return;
  el.dataset.mascotReady = 'true';
  const stage = el.querySelector<HTMLElement>('[data-stage]');
  const img = el.querySelector('img');
  if (!stage || !img) return;

  let anim: AnimationItem | null = null;
  let current = '';
  let visible = false;
  let ticket = 0;

  const clear = (): void => {
    anim?.destroy();
    anim = null;
    current = '';
    stage.replaceChildren();
    el.classList.remove('is-playing');
  };

  const stop = (): void => {
    ticket += 1;
    clear();
  };

  const start = (): void => {
    const path = el.dataset.lottie ?? '';
    if (!path || !visible || motion.matches || (path === current && anim)) return;
    const mine = ticket + 1;
    ticket = mine;
    clear();
    ticket = mine;
    void player()
      .then((lottie) => {
        if (mine !== ticket || !visible || motion.matches || el.dataset.lottie !== path) return;
        const next = lottie.loadAnimation({
          container: stage,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path,
          assetsPath: '/demo/art/',
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
            focusable: false,
            progressiveLoad: true,
          },
        });
        anim = next;
        current = path;
        next.addEventListener('DOMLoaded', () => {
          if (mine === ticket) el.classList.add('is-playing');
        });
        next.addEventListener('data_failed', () => {
          if (mine === ticket) stop();
        });
      })
      .catch(() => {
        if (mine === ticket) stop();
      });
  };

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) start();
      else stop();
    },
    { rootMargin: '160px' },
  );
  io.observe(el);

  const mo = new MutationObserver(() => {
    const still = el.dataset.still;
    if (still && img.getAttribute('src') !== still) img.src = still;
    if ((el.dataset.lottie ?? '') !== current) {
      if (visible && !motion.matches) start();
      else stop();
    }
  });
  mo.observe(el, { attributes: true, attributeFilter: ['data-lottie', 'data-still'] });

  const onMotion = (): void => {
    if (motion.matches) stop();
    else if (visible) start();
  };
  motion.addEventListener('change', onMotion);
}

/** Start every mascot figure on the page. Safe to call more than once. */
export function bootMascots(): void {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) return;
  document.querySelectorAll<HTMLElement>('[data-mascot]').forEach((el) => bootOne(el, motion));
}
