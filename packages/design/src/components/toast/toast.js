// Toasts. An error stays until it is closed; the rest leave on their own, except while the pointer
// or the focus is on them, so that they can be read.
const DEFAULT_DURATION = 6000;

function close(toast) {
  clearTimeout(toast.siTimer);
  toast.remove();
}

function arm(toast) {
  const duration = Number(toast.dataset.siDuration ?? DEFAULT_DURATION);
  if (duration <= 0) return;
  const start = () => {
    clearTimeout(toast.siTimer);
    toast.siTimer = setTimeout(() => close(toast), duration);
  };
  const pause = () => clearTimeout(toast.siTimer);
  toast.addEventListener('pointerenter', pause);
  toast.addEventListener('focusin', pause);
  toast.addEventListener('pointerleave', start);
  toast.addEventListener('focusout', start);
  start();
}

/** Options: tone, duration in ms (0 stays; an error stays by default). */
export function showToast(message, options = {}) {
  const region = document.querySelector('[data-si-toast-region]');
  if (!region) throw new Error('The page has no toast region: include @si/toast.html.twig.');
  const tone = options.tone ?? '';
  const toast = document.createElement('div');
  toast.className = `si-toast${tone ? ` si-toast--${tone}` : ''}`;
  if (tone === 'danger') toast.setAttribute('role', 'alert');
  toast.dataset.siDuration = String(options.duration ?? (tone === 'danger' ? 0 : DEFAULT_DURATION));

  const text = document.createElement('span');
  text.className = 'si-toast__message';
  text.textContent = message;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'si-toast__close';
  button.dataset.siToastClose = '';
  button.setAttribute('aria-label', region.dataset.siCloseLabel ?? '');
  const icon = document.createElement('i');
  icon.className = 'bi bi-x-lg';
  icon.setAttribute('aria-hidden', 'true');
  button.append(icon);

  toast.append(text, button);
  region.append(toast);
  arm(toast);
  return toast;
}

export function initToasts(root = document) {
  root.querySelectorAll('[data-si-toast-region] .si-toast').forEach(arm);
  root.addEventListener('click', (event) => {
    const closer = event.target.closest?.('[data-si-toast-close]');
    if (closer) close(closer.closest('.si-toast'));
    const trigger = event.target.closest?.('[data-si-toast]');
    if (trigger) showToast(trigger.dataset.siToast, { tone: trigger.dataset.siToastTone });
  });
}
