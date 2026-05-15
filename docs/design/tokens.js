// Grow Logs — design tokens (dark only)
// Warm-leaning deep navy surfaces. Cream ink with a hint of warmth.
// One bold lifted coral that's never afraid to be the loudest thing on the
// page. Cream-coloured hard borders are the signature on chunky elements.

// Tint helper — turns a hex (#RRGGBB) into rgba() with the given alpha.
// Used by Notion-style tinted buttons/chips so the bg tracks the accent.
function glTint(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
window.glTint = glTint;

const DARK_PALETTE = {
  // surfaces — deep warm navy
  bg:           '#16142A',   // page canvas
  bgSubtle:     '#100E22',   // sectioned blocks
  surface:      '#211F38',   // cards
  surface2:     '#2A2842',   // nested / inset
  border:       '#322F4D',   // soft hairline
  borderStrong: '#F2EAD3',   // cream hard outline — signature on stat cards / chunky buttons
  borderInput:  '#3F3D5B',   // input border (between soft and hard)
  shadow:       '0 1px 2px rgba(0,0,0,0.5), 0 8px 24px -10px rgba(0,0,0,0.55)',
  shadowLg:     '0 2px 4px rgba(0,0,0,0.55), 0 28px 48px -20px rgba(0,0,0,0.70)',
  shadowHard:   '4px 4px 0 #F2EAD3',     // playful cream offset shadow on chunky buttons

  // ink — warm cream-white
  text:        '#F5F1E6',    // primary
  textMuted:   '#A8ACC4',    // labels, secondary
  textFaint:   '#727694',    // hints, disabled

  // accent — calm sage-mint (growth, alive, not alarming)
  primary:     '#6FC8A0',
  primaryHover:'#88D4B2',
  primarySoft: '#1B2E26',
  primaryInk:  '#0C1A14',

  // semantic tags
  workBg:      '#272C4C',    // soft indigo-on-navy
  workFg:      '#A6B0E0',
  learnBg:     '#2C2447',    // soft violet-on-navy (knowledge / study)
  learnFg:     '#BFA8E5',

  // states
  success:     '#5DAF7A',
  successSoft: '#1E3329',
  warning:     '#E0AE52',
  warningSoft: '#3A2C12',
  danger:      '#E8675B',
  dangerSoft:  '#3A1C18',

  // category swatches — eucalyptus leads, friends supplied
  swatch: ['#6FC8A0', '#7C8FE0', '#BFA8E5', '#E0AE52', '#E8866F', '#5FB8CD'],
};

window.GL_TOKENS = {
  // Dark-only. Both keys point at the same palette so any component that
  // still receives `theme="light"` resolves identically.
  dark: DARK_PALETTE,
  light: DARK_PALETTE,

  type: {
    sans: '"Inter", "Inter Tight", ui-sans-serif, system-ui, -apple-system, sans-serif',
    mono: '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',

    scale: [
      { name: 'Display',  px: 64, lh: 1.02, tracking: '-0.035em', weight: 700, use: 'Marketing hero, onboarding' },
      { name: 'H1',       px: 40, lh: 1.08, tracking: '-0.025em', weight: 700, use: 'Page titles' },
      { name: 'H2',       px: 28, lh: 1.18, tracking: '-0.020em', weight: 700, use: 'Section headers' },
      { name: 'H3',       px: 20, lh: 1.30, tracking: '-0.010em', weight: 600, use: 'Card titles' },
      { name: 'Body L',   px: 17, lh: 1.60, tracking: '0',        weight: 400, use: 'Long-form entries' },
      { name: 'Body',     px: 15, lh: 1.55, tracking: '0',        weight: 400, use: 'Default UI body' },
      { name: 'Caption',  px: 13, lh: 1.45, tracking: '0.005em',  weight: 500, use: 'Labels, metadata' },
      { name: 'Overline', px: 11, lh: 1.40, tracking: '0.10em',   weight: 700, use: 'Section eyebrows' },
    ],

    metric: {
      display: { px: 64, weight: 700, tracking: '-0.035em', font: 'sans' },
      large:   { px: 44, weight: 700, tracking: '-0.025em', font: 'sans' },
      regular: { px: 26, weight: 700, tracking: '-0.015em', font: 'sans' },
    },
  },

  space: {
    cardPad: 28,
    cardPadLg: 36,
    radius: 12,
    radiusSm: 8,
    radiusLg: 16,
    radiusPill: 999,
  },
};
