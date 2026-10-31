// WCAG contrast between colour tokens. Translucent colours are composited over their background.
export function parseColor(value) {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((start) => parseInt(hex[1].slice(start, start + 2), 16)).concat(1);
  const rgba = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (rgba) return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] === undefined ? 1 : Number(rgba[4])];
  throw new Error(`Colour not understood: ${value}`);
}

const over = (top, bottom) => [0, 1, 2].map((index) => top[index] * top[3] + bottom[index] * (1 - top[3])).concat(1);

function luminance([red, green, blue]) {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratioOf(one, two) {
  const [high, low] = [luminance(one), luminance(two)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

/** One row per pair, background and theme. A token missing from a theme gives a null ratio. */
export function contrastReport(tokens, pairs) {
  const byPath = new Map(tokens.map((token) => [token.path, token]));
  const rows = [];
  for (const pair of pairs) {
    for (const background of pair.on) {
      for (const theme of ['light', 'dark']) {
        const value = (path) => {
          const token = byPath.get(path);
          if (!token) throw new Error(`Unknown token in contrast-pairs.json: ${path}`);
          return token[theme] ? parseColor(token[theme]) : null;
        };
        const canvas = value(pair.fg.startsWith('color.shell') ? 'color.shell.bg' : 'color.surface.default');
        const foreground = value(pair.fg);
        const backdrop = value(background);
        let ratio = null;
        if (canvas && foreground && backdrop) {
          const bottom = over(backdrop, canvas);
          ratio = ratioOf(over(foreground, bottom), bottom);
        }
        rows.push({ fg: pair.fg, on: background, theme, min: pair.min, ratio });
      }
    }
  }
  return rows;
}
