export const theme = {
  isLight: false,
  colors: {
    black: '#000000',
    white: '#ffffff',
    gray: {
      50: '#f7f8fa',
      100: '#eceff3',
      200: '#dce1e8',
      300: '#bdc6d2',
      400: '#98a2b3',
      500: '#667085',
      600: '#475467',
      700: '#344054',
      800: '#1f2937',
      900: '#101828'
    },
    primary: '#f59a4a',
    primaryDark: '#b85d14',
    secondary: '#c9d0da',
    brand: {
      primary: '#f59a4a'
    },
    background: '#040506',
    surface: '#0b0e12',
    accent: '#f59a4a',
    ring: 'rgba(245, 154, 74, 0.24)',
    highlight: '#ffc78f',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    bg: {
      primary: '#040506',
      secondary: '#0a0d11',
      tertiary: '#11151a',
      elevated: '#171c23'
    },
    text: {
      primary: '#f5f7fa',
      secondary: '#c9d0da',
      tertiary: '#8c97a8',
      disabled: '#667085'
    },
    textSecondary: '#c9d0da',
    border: {
      light: 'rgba(255, 255, 255, 0.06)',
      medium: 'rgba(255, 255, 255, 0.12)',
      strong: 'rgba(255, 255, 255, 0.2)',
      accent: 'rgba(245, 154, 74, 0.34)'
    },
    glass: {
      panel: 'rgba(10, 13, 17, 0.74)',
      panelBorder: 'rgba(255, 255, 255, 0.08)',
      panelHover: 'rgba(255, 255, 255, 0.05)',
      bar: 'rgba(7, 9, 12, 0.84)',
      barBorder: 'rgba(255, 255, 255, 0.08)',
      overlay: 'rgba(0, 0, 0, 0.68)'
    }
  },
  fonts: {
    primary: "'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    secondary: "'JetBrains Mono', 'Courier New', monospace",
    accent: "'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    title: "'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'SF Pro Text', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Fira Code', monospace",
    brand: "'Orbitron', sans-serif"
  },
  fontWeights: {
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    semibold: 600,
    bold: 700,
    extraBold: 800,
    black: 900,
    normal: 400
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
    sm: '6px',
    small: '6px',
    md: '12px',
    medium: '16px',
    lg: '20px',
    large: '24px',
    xl: '28px',
    full: '9999px',
    round: '50%'
  },
  shadows: {
    sm: '0 10px 24px rgba(0, 0, 0, 0.16)',
    small: '0 10px 24px rgba(0, 0, 0, 0.16)',
    md: '0 20px 42px rgba(0, 0, 0, 0.22), 0 1px 0 rgba(255, 255, 255, 0.03) inset',
    medium: '0 20px 42px rgba(0, 0, 0, 0.22), 0 1px 0 rgba(255, 255, 255, 0.03) inset',
    lg: '0 30px 72px rgba(0, 0, 0, 0.34), 0 1px 0 rgba(255, 255, 255, 0.04) inset',
    large: '0 30px 72px rgba(0, 0, 0, 0.34), 0 1px 0 rgba(255, 255, 255, 0.04) inset',
    glow: '0 0 0 1px rgba(245, 154, 74, 0.12), 0 26px 56px rgba(0, 0, 0, 0.38), 0 8px 24px rgba(245, 154, 74, 0.08)'
  },
  transitions: {
    fast: '180ms cubic-bezier(0.22, 1, 0.36, 1)',
    medium: '280ms cubic-bezier(0.22, 1, 0.36, 1)',
    slow: '420ms cubic-bezier(0.22, 1, 0.36, 1)',
    default: '280ms cubic-bezier(0.22, 1, 0.36, 1)'
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
    button: { fontSize: '14px', fontWeight: 600 },
    caption: { fontSize: '12px', fontWeight: 400 }
  },
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px'
  }
};

export const lightTheme = {
  ...theme,
  isLight: true,
  colors: {
    ...theme.colors,
    primary: '#2d2115',
    primaryDark: '#171009',
    secondary: '#6d604f',
    brand: {
      primary: '#c96a16'
    },
    background: '#f6f1e8',
    surface: '#fffdf8',
    accent: '#c96a16',
    ring: 'rgba(201, 106, 22, 0.14)',
    highlight: '#fb923c',
    bg: {
      primary: '#f6f1e8',
      secondary: '#fffdf8',
      tertiary: '#efe4d4',
      elevated: '#ffffff'
    },
    text: {
      primary: '#1f1811',
      secondary: '#625447',
      tertiary: '#857568',
      disabled: '#b7aa9d'
    },
    textSecondary: '#625447',
    border: {
      light: '#eadfce',
      medium: '#d9c9b6',
      strong: '#c2aa8f',
      accent: 'rgba(201, 106, 22, 0.24)'
    },
    glass: {
      panel: 'rgba(255, 250, 243, 0.82)',
      panelBorder: 'rgba(130, 96, 59, 0.14)',
      panelHover: 'rgba(201, 106, 22, 0.08)',
      bar: 'rgba(250, 244, 235, 0.92)',
      barBorder: 'rgba(130, 96, 59, 0.12)',
      overlay: 'rgba(54, 35, 18, 0.18)'
    }
  },
  shadows: {
    ...theme.shadows,
    sm: '0 10px 24px rgba(93, 64, 34, 0.05)',
    small: '0 10px 24px rgba(93, 64, 34, 0.05)',
    md: '0 16px 34px rgba(93, 64, 34, 0.08)',
    medium: '0 16px 34px rgba(93, 64, 34, 0.08)',
    lg: '0 24px 48px rgba(93, 64, 34, 0.12)',
    large: '0 24px 48px rgba(93, 64, 34, 0.12)',
    glow: '0 0 0 1px rgba(201, 106, 22, 0.08), 0 18px 36px rgba(145, 93, 43, 0.12)'
  }
};

export const titleStyles = `
  font-family: ${theme.fonts.title};
  font-weight: ${theme.fontWeights.semibold};
  letter-spacing: 0.02em;
`;

export const bodyStyles = `
  font-family: ${theme.fonts.body};
  font-weight: ${theme.fontWeights.regular};
  line-height: 1.65;
`;

export const buttonStyles = `
  font-family: ${theme.fonts.accent};
  font-weight: ${theme.fontWeights.semibold};
  letter-spacing: 0.02em;
`;

export const inputStyles = `
  font-family: ${theme.fonts.body};
  font-weight: ${theme.fontWeights.regular};
`;

export const labelStyles = `
  font-family: ${theme.fonts.accent};
  font-weight: ${theme.fontWeights.medium};
  letter-spacing: 0.04em;
`;

export const statusStyles = `
  font-family: ${theme.fonts.accent};
  font-weight: ${theme.fontWeights.medium};
  letter-spacing: 0.03em;
`;

export const amountStyles = `
  font-family: ${theme.fonts.title};
  font-weight: ${theme.fontWeights.semibold};
  letter-spacing: 0.02em;
`;
