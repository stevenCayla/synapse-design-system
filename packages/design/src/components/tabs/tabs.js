// Tabs with panels in the page: arrows move and select, Home and End go to the ends.
function select(tabs, tab, { focus = false } = {}) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(item.getAttribute('aria-controls'));
    if (panel) panel.hidden = !selected;
  }
  if (focus) tab.focus();
}

export function initTabs(root = document) {
  root.querySelectorAll('[data-si-tabs]').forEach((container) => {
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    for (const tab of tabs) {
      tab.addEventListener('click', () => select(tabs, tab));
      tab.addEventListener('keydown', (event) => {
        const index = tabs.indexOf(tab);
        const targets = {
          ArrowRight: tabs[(index + 1) % tabs.length],
          ArrowLeft: tabs[(index - 1 + tabs.length) % tabs.length],
          Home: tabs[0],
          End: tabs[tabs.length - 1],
        };
        const target = targets[event.key];
        if (!target) return;
        event.preventDefault();
        select(tabs, target, { focus: true });
      });
    }
  });
}
