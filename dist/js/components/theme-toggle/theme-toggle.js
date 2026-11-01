// The theme follows the system until the person makes a choice, kept under this key.
// The script in <head> that avoids a flash at load must use the same key.
export const THEME_KEY = 'synapse-theme';

function stored() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function label(theme) {
  document.querySelectorAll('[data-si-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-label', theme === 'dark' ? button.dataset.siToLight : button.dataset.siToDark);
  });
}

export function setTheme(theme, { persist = true } = {}) {
  document.documentElement.dataset.theme = theme;
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // The choice lasts for this page only.
    }
  }
  label(theme);
}

export function initThemeToggle(root = document) {
  label(document.documentElement.dataset.theme);
  root.addEventListener('click', (event) => {
    if (!event.target.closest?.('[data-si-theme-toggle]')) return;
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (!stored()) setTheme(event.matches ? 'dark' : 'light', { persist: false });
  });
}
