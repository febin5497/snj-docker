export const COLORS = {
  bg: '#0f1423',
  card: '#1a2035',
  cardBorder: 'rgba(100,140,200,0.2)',
  primary: '#4a90d9',
  accent: '#00c864',
  danger: '#ff4444',
  warning: '#ffd93d',
  text: '#ffffff',
  textSecondary: '#8899aa',
  textMuted: '#556677',
  input: '#141c2e',
  inputBorder: 'rgba(100,140,200,0.2)',
  white: '#ffffff',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FONTS = {
  regular: { fontSize: 14, color: COLORS.text },
  small: { fontSize: 12, color: COLORS.textSecondary },
  large: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
};

export const CARD = {
  backgroundColor: COLORS.card,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: COLORS.cardBorder,
  padding: 16,
};

export const INPUT = {
  backgroundColor: COLORS.input,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: COLORS.inputBorder,
  color: COLORS.text,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 15,
};

export const BTN = {
  primary: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  danger: {
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
};