/** Homepage screen reel. One phone, a Y-axis turn between screens, and a still swap when motion is reduced. */

const INTERVAL = 5600;

function reduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function mountReel(root: HTMLElement): void {
  if (root.dataset.reelMounted) return;
  root.dataset.reelMounted = 'true';
  const stage = root.querySelector<HTMLElement>('[data-reel-stage]');
  const nameEl = root.querySelector<HTMLElement>('[data-reel-name]');
  const countEl = root.querySelector<HTMLElement>('[data-reel-count]');
  const live = root.querySelector<HTMLElement>('[data-reel-live]');
  const templates = [...root.querySelectorAll<HTMLTemplateElement>('template[data-reel-template]')];
  const labels = templates.map((tpl) => tpl.dataset.label ?? '');
  const total = labels.length;
  if (!stage || total < 2) return;

  let index = 0;
  let hover = false;
  let timer = 0;

  const announce = (user: boolean): void => {
    const label = labels[index] ?? '';
    if (nameEl) nameEl.textContent = label;
    if (countEl) countEl.textContent = `${index + 1} of ${total}`;
    if (user && live) live.textContent = `${label}, screen ${index + 1} of ${total}`;
  };

  const build = (i: number): HTMLElement => {
    const slide = document.createElement('div');
    slide.className = 'reel-slide';
    const tpl = templates[i];
    if (tpl) slide.append(tpl.content.cloneNode(true));
    return slide;
  };

  const go = (next: number, dir: 1 | -1, user: boolean): void => {
    const reduce = reduced();
    const wrapped = (next + total) % total;
    if (wrapped === index) return;
    index = wrapped;
    const incoming = build(index);
    const previous = [...stage.querySelectorAll<HTMLElement>('.reel-slide')];
    previous.slice(0, -1).forEach((extra) => extra.remove());
    const current = previous.at(-1) ?? null;
    if (!current) {
      stage.append(incoming);
      announce(user);
      return;
    }
    if (reduce) {
      current.replaceWith(incoming);
      announce(user);
      return;
    }
    current.classList.remove('is-in-next', 'is-in-prev');
    incoming.classList.add(dir > 0 ? 'is-in-next' : 'is-in-prev');
    current.classList.add(dir > 0 ? 'is-out-next' : 'is-out-prev');
    stage.append(incoming);
    const drop = (): void => {
      if (current.isConnected) current.remove();
    };
    current.addEventListener('animationend', drop, { once: true });
    window.setTimeout(drop, 900);
    announce(user);
  };

  const tick = (): void => {
    const focused = root.contains(document.activeElement);
    if (hover || focused || document.hidden || reduced()) return;
    go(index + 1, 1, false);
  };

  const arm = (): void => {
    window.clearInterval(timer);
    if (reduced()) return;
    timer = window.setInterval(tick, INTERVAL);
  };

  root.addEventListener('mouseenter', () => {
    hover = true;
  });
  root.addEventListener('mouseleave', () => {
    hover = false;
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(index + 1, 1, true);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(index - 1, -1, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      go(0, -1, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      go(total - 1, 1, true);
    }
  });
  root.querySelector('[data-reel-prev]')?.addEventListener('click', () => go(index - 1, -1, true));
  root.querySelector('[data-reel-next]')?.addEventListener('click', () => go(index + 1, 1, true));
  document.addEventListener('visibilitychange', arm);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.addEventListener('change', arm);
  announce(false);
  arm();
}
