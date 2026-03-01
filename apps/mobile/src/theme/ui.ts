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
    sm: 10,
    md: 12,
    lg: 16,
    xl: 24,
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
    height: 52,
    textSize: 14,
    letterSpacing: 2.2
  },
  shadow: {
    soft: {
      shadowColor: '#A59D8E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 0,
      elevation: 2
    },
    strong: {
      shadowColor: '#8E2D26',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.7,
      shadowRadius: 0,
      elevation: 3
    }
  }
} as const;
