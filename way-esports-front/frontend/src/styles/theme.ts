export const theme = {
  fonts: {
    title: "'Orbitron', monospace",
    body: "'Exo 2', sans-serif",
    accent: "'Chakra Petch', monospace",
  },
  fontWeights: {
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
    extraBold: 800,
    black: 900,
    normal: 400,
    semibold: 600,
  },
  colors: {
    primary: '#ffffff',
    primaryDark: '#e5e5e5',
    secondary: '#8b8b8b',
    background: '#141414',
    surface: '#1f1f1f',
    white: '#ffffff',
    text: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      disabled: '#525252'
    },
    textSecondary: '#a3a3a3',
    accent: '#404040',
    warning: '#fbbf24',
    error: '#ef4444',
    success: '#4ade80',
    info: '#60a5fa',
    border: '#2a2a2a',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  borderRadius: {
    sm: '4px',
    small: '4px',
    md: '8px',
    medium: '8px',
    lg: '12px',
    large: '16px',
    xl: '16px',
    full: '50%',
    round: '50%',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    small: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 4px 6px -1px rgba(0,0,0,0.45), 0 2px 4px -1px rgba(0,0,0,0.35)',
    medium: '0 4px 6px -1px rgba(0,0,0,0.45), 0 2px 4px -1px rgba(0,0,0,0.35)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.4)',
    large: '0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.4)',
    glow: '0 0 0 1px rgba(255,255,255,0.05), 0 0 24px rgba(255,255,255,0.06)'
  },
  transitions: {
    fast: '0.2s ease',
    medium: '0.3s ease',
    slow: '0.5s ease'
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    button: { fontSize: '16px', fontWeight: 600 },
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
  font-weight: ${theme.fontWeights.semiBold};
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
  font-weight: ${theme.fontWeights.semiBold};
  letter-spacing: 1px;
`; 