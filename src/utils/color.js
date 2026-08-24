// Converts a "#rrggbb" (or shorthand "#rgb") hex color into an rgba() string
// at the given alpha, so a company's brand color can be used as a light
// tinted card background while the solid hex drives the border/text.
export const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(59, 130, 246, ${alpha})`; // fallback: default blue
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
