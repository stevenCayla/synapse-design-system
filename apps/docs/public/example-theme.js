// Applies the theme requested in the URL (?theme=dark) before the first paint of an example page,
// and tells the documentation page how tall the example is.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') === 'dark' ? 'dark' : 'light';

addEventListener('load', () => {
  if (parent === window) return;
  const report = () => parent.postMessage({ exampleHeight: document.body.offsetHeight }, location.origin);
  report();
  new ResizeObserver(report).observe(document.body);
});
