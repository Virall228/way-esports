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
  },
  colors: {
    primary: '#ff6b00',
    secondary: '#ff4757',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#cccccc',
    accent: '#00ff00',
    warning: '#ffd700',
    error: '#ff4757',
    success: '#00ff00',
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
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.2)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.3)',
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