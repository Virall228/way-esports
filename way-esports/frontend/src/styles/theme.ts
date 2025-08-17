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
    primary: '#ff6b00',
    primaryDark: '#E55A00',
    secondary: '#ff4757',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    white: '#ffffff',
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      disabled: '#666666'
    },
    textSecondary: '#cccccc',
    accent: '#ff6b00',
    warning: '#ffd700',
    error: '#ff4757',
    success: '#00ff00',
    info: '#2196F3',
    border: '#333333',
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
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.2)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.3)',
    large: '0 8px 16px rgba(0, 0, 0, 0.2)',
    glow: '0 0 20px rgba(255, 107, 0, 0.3)'
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