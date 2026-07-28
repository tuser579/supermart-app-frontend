export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 26, fontWeight: '700' as const, lineHeight: 34 },
  h3: { fontSize: 22, fontWeight: '600' as const, lineHeight: 30 },
  h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  price: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  priceLarge: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  overline: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14, letterSpacing: 1 },
};

export type Typography = typeof typography;
