// Entry point of the component behaviours, one import and no global: `import '.../behaviors.js'`.
import { initConfirm } from './components/confirm/confirm.js';
import { initDrawers } from './components/drawer/drawer.js';
import { initMenus } from './components/menu/menu.js';
import { initDialogs } from './components/modal/modal.js';
import { initTabs } from './components/tabs/tabs.js';
import { initThemeToggle } from './components/theme-toggle/theme-toggle.js';
import { initToasts } from './components/toast/toast.js';

export { confirmDialog } from './components/confirm/confirm.js';
export { loadDrawer } from './components/drawer/drawer.js';
export { setTheme } from './components/theme-toggle/theme-toggle.js';
export { showToast } from './components/toast/toast.js';

function init() {
  initDialogs();
  initDrawers();
  initConfirm();
  initToasts();
  initTabs();
  initMenus();
  initThemeToggle();
  document.addEventListener('click', (event) => {
    const dismiss = event.target.closest?.('[data-si-dismiss]');
    if (dismiss) dismiss.closest('.si-alert')?.remove();
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
