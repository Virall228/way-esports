export const theme = {
  colors: {
    black: '#000000',
    white: '#ffffff',
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    primary: '#ffffff',
    primaryDark: '#e5e5e5',
    secondary: '#a3a3a3',
    background: '#0a0a0a',
    surface: '#111111',
    accent: '#f1f1f1',
    ring: '#2a2a2a',
    highlight: '#d4d4d4',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    bg: {
      primary: '#0a0a0a',
      secondary: '#111111',
      tertiary: '#161616',
      elevated: '#1f1f1f',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      tertiary: '#737373',
      disabled: '#525252',
    },
    textSecondary: '#a3a3a3',
    border: {
      light: '#222222',
      medium: '#2f2f2f',
      strong: '#3a3a3a',
    },
  },
  fonts: {
    primary: "'Exo 2', sans-serif",
    secondary: "'JetBrains Mono', 'Courier New', monospace",
    accent: "'Chakra Petch', sans-serif",
    title: "'Orbitron', sans-serif",
    body: "'Exo 2', sans-serif",
    mono: "'Fira Code', monospace"
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  borderRadius: {
    none: '0',
    sm: '2px',
    small: '2px',
    md: '4px',
    medium: '4px',
    lg: '6px',
    large: '6px',
    xl: '10px',
    full: '9999px',
    round: '50%',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    small: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0,0,0,0.45), 0 2px 4px -1px rgba(0,0,0,0.35)',
    medium: '0 4px 6px -1px rgba(0,0,0,0.45), 0 2px 4px -1px rgba(0,0,0,0.35)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.4)',
    large: '0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.4)',
    glow: '0 0 0 1px rgba(255,255,255,0.05), 0 0 24px rgba(255,255,255,0.06)',
  },
  transitions: {
    fast: '150ms ease',
    medium: '300ms ease',
    slow: '500ms ease',
    default: '300ms ease',
  },
  typography: {
    fontFamily: "'Exo 2', sans-serif",
    fontSizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px',
      xxl: '32px'
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    h1: { fontSize: '32px', fontWeight: 700 },
    h2: { fontSize: '28px', fontWeight: 700 },
    h3: { fontSize: '24px', fontWeight: 600 },
    h4: { fontSize: '20px', fontWeight: 600 },
    h5: { fontSize: '18px', fontWeight: 600 },
    h6: { fontSize: '16px', fontWeight: 600 },
    body1: { fontSize: '16px', fontWeight: 400 },
    body2: { fontSize: '14px', fontWeight: 400 },
    button: { fontSize: '14px', fontWeight: 700 },
    caption: { fontSize: '12px', fontWeight: 400 }
  },
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },
};

export const titleStyles = `
  font-family: ${theme.fonts.title};
  font-weight: ${theme.fontWeights.semibold};
  letter-spacing: 1px;
  text-transform: uppercase;
`;

export const bodyStyles = `
  font-family: ${theme.fonts.body};
  font-weight: ${theme.fontWeights.regular};
  line-height: 1.6;
`;

export const buttonStyles = `
  font-family: ${theme.fonts.title};
  font-weight: ${theme.fontWeights.medium};
  letter-spacing: 1px;
  text-transform: uppercase;
`;

export const inputStyles = `
  font-family: ${theme.fonts.body};
  font-weight: ${theme.fontWeights.regular};
`;

export const labelStyles = `
  font-family: ${theme.fonts.title};
  font-weight: ${theme.fontWeights.medium};
  letter-spacing: 0.8px;
  text-transform: uppercase;
`;

export const statusStyles = `
  font-family: ${theme.fonts.accent};
  font-weight: ${theme.fontWeights.regular};
  letter-spacing: 0.5px;
`;

export const amountStyles = `
  font-family: ${theme.fonts.title};
  font-weight: ${theme.fontWeights.semibold};
  letter-spacing: 1px;
`;