interface ExampleCopy {
  found: string;
  ready: string;
  totals: string;
  save: string;
  saved: string;
}

export function mountComposer(root: HTMLElement): void {
  if (root.dataset.mounted === 'true') return;
  root.dataset.mounted = 'true';
  root.classList.add('is-on');

  const live = root.querySelector<HTMLElement>('[data-composer-live]');
  const savebar = root.querySelector<HTMLElement>('[data-savebar]');
  const ready = root.querySelector<HTMLElement>('.cmp-ready');
  const totals = root.querySelector<HTMLElement>('.cmp-totals');
  const saveButton = root.querySelector<HTMLButtonElement>('[data-save]');

  const examples = new Map<string, ExampleCopy>();
  root.querySelectorAll<HTMLElement>('[data-example]').forEach((node) => {
    const id = node.dataset.example;
    if (!id) return;
    examples.set(id, {
      found: node.dataset.found ?? '',
      ready: node.dataset.ready ?? '',
      totals: node.dataset.totals ?? '',
      save: node.dataset.saveLabel ?? '',
      saved: node.dataset.saved ?? '',
    });
  });

  const show = (name: string): void => {
    root.querySelectorAll<HTMLElement>('[data-view]').forEach((view) => {
      view.hidden = view.dataset.view !== name;
    });
    const example = examples.get(name);
    if (savebar) savebar.hidden = !example;
    if (!example || !ready || !totals || !saveButton) return;
    ready.textContent = example.ready;
    totals.textContent = example.totals;
    saveButton.textContent = example.save;
    saveButton.dataset.current = name;
  };

  show('empty');

  const walletButtons = (): HTMLButtonElement[] => [...root.querySelectorAll<HTMLButtonElement>('[data-wallet]')];

  const selectWallet = (chosen: HTMLButtonElement, moveFocus: boolean): void => {
    walletButtons().forEach((button) => {
      const on = button === chosen;
      button.setAttribute('aria-checked', on ? 'true' : 'false');
      button.tabIndex = on ? 0 : -1;
    });
    if (moveFocus) chosen.focus();
  };

  root.addEventListener('keydown', (event) => {
    const current = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('[data-wallet]');
    if (!current || !root.contains(current)) return;
    const items = walletButtons();
    const index = items.indexOf(current);
    if (index < 0) return;
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    const choice = items[next];
    if (choice) selectWallet(choice, true);
  });

  root.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-pick], [data-reset], [data-save], [data-wallet]');
    if (!target || !root.contains(target)) return;

    if (target.dataset.wallet && target instanceof HTMLButtonElement) {
      selectWallet(target, false);
      return;
    }

    if (target.dataset.pick) {
      const example = examples.get(target.dataset.pick);
      show(target.dataset.pick);
      if (live && example) live.textContent = example.found;
      saveButton?.focus();
      return;
    }

    if (target.hasAttribute('data-reset')) {
      show('empty');
      if (live) live.textContent = '';
      root.querySelector<HTMLElement>('[data-pick]')?.focus();
      return;
    }

    if (target.hasAttribute('data-save')) {
      const id = saveButton?.dataset.current;
      const example = id ? examples.get(id) : undefined;
      if (!id || !example) return;
      show(`saved-${id}`);
      if (savebar) savebar.hidden = true;
      if (live) live.textContent = example.saved;
      root.querySelector<HTMLElement>(`[data-view="saved-${id}"] [data-reset]`)?.focus();
    }
  });
}
