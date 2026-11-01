// Modals and drawers are native dialogs: the browser traps the focus, closes with Escape and
// gives the focus back to the element that opened them.
export function initDialogs(root = document) {
  root.addEventListener('click', (event) => {
    const opener = event.target.closest?.('[data-si-open]');
    if (opener) {
      root.getElementById?.(opener.dataset.siOpen)?.showModal();
      return;
    }
    const closer = event.target.closest?.('[data-si-close]');
    if (closer) closer.closest('dialog')?.close();
  });
}
