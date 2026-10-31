// Loads the content of a drawer when it opens. One request at a time: opening again cancels the last.
const controllers = new WeakMap();

function message(body, build) {
  body.replaceChildren(build());
}

function loading(label) {
  const element = document.createElement('div');
  element.className = 'si-loading';
  element.setAttribute('role', 'status');
  const spinner = document.createElement('span');
  spinner.className = 'si-spinner';
  spinner.setAttribute('aria-hidden', 'true');
  element.append(spinner, label);
  return element;
}

function failure(title) {
  const element = document.createElement('div');
  element.className = 'si-empty si-empty--danger si-empty--compact';
  element.setAttribute('role', 'alert');
  const heading = document.createElement('p');
  heading.className = 'si-empty__title';
  heading.textContent = title;
  element.append(heading);
  return element;
}

/** The server is the application itself: its HTML is trusted as any page it renders. */
export async function loadDrawer(drawer, url = drawer.dataset.siLoad) {
  const body = drawer.querySelector('[data-si-drawer-body]');
  if (!body || !url) return;
  controllers.get(drawer)?.abort();
  const controller = new AbortController();
  controllers.set(drawer, controller);
  message(body, () => loading(drawer.dataset.siLoadingLabel ?? ''));
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    if (!response.ok) throw new Error(String(response.status));
    body.innerHTML = await response.text();
  } catch (error) {
    if (error.name !== 'AbortError') message(body, () => failure(drawer.dataset.siErrorTitle ?? ''));
  }
}

export function initDrawers(root = document) {
  root.addEventListener('click', (event) => {
    const opener = event.target.closest?.('[data-si-open]');
    const drawer = opener && root.getElementById?.(opener.dataset.siOpen);
    if (drawer?.dataset.siLoad) loadDrawer(drawer, opener.dataset.siLoadUrl);
  });
}
