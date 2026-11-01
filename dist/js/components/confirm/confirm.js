// Asks for a confirmation in the dialog of the page. Resolves to true or false,
// or to { ok: true, reason } | false with withReason.
export function confirmDialog(message, options = {}) {
  const dialog = document.querySelector('[data-si-confirm-dialog]');
  if (!dialog) return Promise.resolve(window.confirm(message));

  const part = (name) => dialog.querySelector(`[data-si-confirm-${name}]`);
  const defaults = (dialog.siDefaults ??= { title: part('title').textContent, ok: part('ok').textContent });
  const reasonField = part('reason');
  const reasonInput = reasonField.querySelector('textarea');

  part('title').textContent = options.title ?? defaults.title;
  part('ok').textContent = options.okLabel ?? defaults.ok;
  part('message').textContent = message;
  part('ok').classList.toggle('si-btn--danger', (options.tone ?? 'danger') === 'danger');
  part('ok').classList.toggle('si-btn--primary', options.tone === 'primary');
  reasonField.hidden = !options.withReason;
  reasonInput.value = '';

  return new Promise((resolve) => {
    let confirmed = false;
    const ok = () => {
      if (options.withReason && !reasonInput.value.trim()) {
        reasonInput.setAttribute('aria-invalid', 'true');
        reasonInput.focus();
        return;
      }
      reasonInput.removeAttribute('aria-invalid');
      confirmed = true;
      dialog.close();
    };
    const cancel = () => dialog.close();
    part('ok').addEventListener('click', ok);
    part('cancel').addEventListener('click', cancel);
    dialog.addEventListener('close', () => {
      part('ok').removeEventListener('click', ok);
      part('cancel').removeEventListener('click', cancel);
      if (!confirmed) resolve(false);
      else resolve(options.withReason ? { ok: true, reason: reasonInput.value.trim() } : true);
    }, { once: true });
    dialog.showModal();
  });
}

const accepted = new WeakSet();

const optionsOf = (element) => ({
  title: element.dataset.siConfirmTitle,
  okLabel: element.dataset.siConfirmOk,
  withReason: 'siConfirmReasonName' in element.dataset,
});

/**
 * data-si-confirm="message" on a form or a link asks before it goes on.
 * On a form, data-si-confirm-reason-name="reason" also asks for a reason and sends it in that field.
 */
export function initConfirm(root = document) {
  // In the capture phase: the handlers of the form itself must wait for the answer too.
  root.addEventListener('submit', async (event) => {
    const form = event.target.closest?.('form[data-si-confirm]');
    if (!form || accepted.delete(form)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const answer = await confirmDialog(form.dataset.siConfirm, optionsOf(form));
    if (answer) {
      if (answer.reason) {
        const field = document.createElement('input');
        field.type = 'hidden';
        field.name = form.dataset.siConfirmReasonName;
        field.value = answer.reason;
        form.append(field);
      }
      accepted.add(form);
      form.requestSubmit(event.submitter ?? undefined);
    }
  }, true);
  root.addEventListener('click', async (event) => {
    const link = event.target.closest?.('a[data-si-confirm]');
    if (!link) return;
    event.preventDefault();
    if (await confirmDialog(link.dataset.siConfirm, optionsOf(link))) location.assign(link.href);
  });
}
