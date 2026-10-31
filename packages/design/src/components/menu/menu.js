// Native popover: the browser handles Escape, a click outside and the return of the focus.
// This places it under its button, moves the focus inside and adds the arrow keys.
function place(menu) {
  const button = document.querySelector(`[popovertarget="${menu.id}"]`);
  if (!button) return;
  const anchor = button.getBoundingClientRect();
  const { width, height } = menu.getBoundingClientRect();
  const gap = 4;
  const left = Math.max(gap, Math.min(anchor.left, innerWidth - width - gap));
  const below = anchor.bottom + gap;
  const top = below + height > innerHeight ? Math.max(gap, anchor.top - height - gap) : below;
  menu.style.insetBlockStart = `${top}px`;
  menu.style.insetInlineStart = `${left}px`;
}

export function initMenus(root = document) {
  root.querySelectorAll('[data-si-menu]').forEach((menu) => {
    const items = () => [...menu.querySelectorAll('.si-menu__item:not(:disabled)')];
    menu.addEventListener('toggle', (event) => {
      if (event.newState !== 'open') return;
      place(menu);
      items()[0]?.focus();
    });
    menu.addEventListener('keydown', (event) => {
      const list = items();
      const index = list.indexOf(document.activeElement);
      const targets = {
        ArrowDown: list[(index + 1) % list.length],
        ArrowUp: list[(index - 1 + list.length) % list.length],
        Home: list[0],
        End: list[list.length - 1],
      };
      const target = targets[event.key];
      if (!target) return;
      event.preventDefault();
      target.focus();
    });
  });
}
