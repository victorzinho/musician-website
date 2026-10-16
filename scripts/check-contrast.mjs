// Fails when a colour in src/styles/theme.css is below its WCAG contrast minimum against --color-bg or --color-surface.
import { readFileSync } from 'node:fs';

const minimums = { ink: 4.5, muted: 4.5, blue: 4.5, 'blue-chip': 4.5, 'accent-text': 4.5, 'accent-mark': 3 };

const css = readFileSync(new URL('../src/styles/theme.css', import.meta.url), 'utf8');
const colors = Object.fromEntries(
  [...css.matchAll(/--color-([\w-]+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/gi)].map(([, name, light, dark]) => [
    name,
    { light, dark },
  ]),
);

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const failures = Object.entries(minimums).flatMap(([name, minimum]) => {
  if (!colors[name]) return [`--color-${name}: missing`];
  return ['bg', 'surface'].flatMap((background) =>
    ['light', 'dark']
      .map((theme) => [theme, contrast(colors[name][theme], colors[background][theme])])
      .filter(([, ratio]) => ratio < minimum)
      .map(([theme, ratio]) => `--color-${name} on ${background} (${theme}): ${ratio.toFixed(2)} < ${minimum}`),
  );
});

if (failures.length > 0) {
  console.error(`Contrast below minimum:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('Contrast OK');
