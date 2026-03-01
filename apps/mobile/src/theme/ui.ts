export const ui = {
  color: {
    bg: '#F1F0EC',
    surface: '#FAFAF8',
    card: '#FFFFFF',
    textPrimary: '#263E58',
    textSecondary: '#4C5B69',
    textMuted: '#BDB9AE',
    textOnPrimary: '#FFFFFF',
    primary: '#DE3D32',
    primaryShadow: '#8E2D26',
    accent: '#2C4056',
    border: '#E1E0DA',
    borderStrong: '#2C4056',
    topRule: '#13171C',
    error: '#B42318',
    errorBg: '#FEE4E2',
    errorBorder: '#FDA29B',
    successBg: '#E8F3EC',
    successText: '#1F5B3A'
  },
  radius: {
    sm: 12,
    md: 14,
    lg: 18,
    xl: 28,
    pill: 999
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32
  },
  type: {
    title: 34,
    heading: 28,
    body: 16,
    small: 13,
    tiny: 11
  },
  field: {
    height: 62,
    paddingX: 18
  },
  button: {
    height: 54,
    textSize: 15,
    letterSpacing: 0.4
  },
  shadow: {
    soft: {
      shadowColor: '#101828',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3
    },
    strong: {
      shadowColor: '#2C7A18',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 14,
      elevation: 4
    }
  }
} as const;
