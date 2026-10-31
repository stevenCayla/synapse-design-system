// Applies the theme requested in the URL (?theme=dark) before the first paint of an example page.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') === 'dark' ? 'dark' : 'light';
