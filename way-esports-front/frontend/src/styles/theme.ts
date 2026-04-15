export const theme = {
  isLight: false,
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
    primary: '#ff8a1f',
    primaryDark: '#d85d00',
    secondary: '#c9ced6',
    brand: {
      primary: '#ff8a1f'
    },
    background: '#050607',
    surface: '#0b0d10',
    accent: '#ff8a1f',
    ring: 'rgba(255, 138, 31, 0.32)',
    highlight: '#ffb15d',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    bg: {
      primary: '#050607',
      secondary: '#0b0d10',
      tertiary: '#11151a',
      elevated: '#15191f',
    },
    text: {
      primary: '#ffffff',
      secondary: '#c9ced6',
      tertiary: '#858b96',
      disabled: '#5f6670',
    },
    textSecondary: '#c9ced6',
    border: {
      light: 'rgba(255, 255, 255, 0.08)',
      medium: 'rgba(255, 255, 255, 0.14)',
      strong: 'rgba(255, 138, 31, 0.45)',
    },
    glass: {
      panel: 'rgba(8, 10, 13, 0.78)',
      panelBorder: 'rgba(255, 138, 31, 0.16)',
      panelHover: 'rgba(255, 138, 31, 0.10)',
      bar: 'rgba(5, 6, 7, 0.86)',
      barBorder: 'rgba(255, 138, 31, 0.18)',
      overlay: 'rgba(0, 0, 0, 0.72)'
    }
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
    md: '0 14px 30px rgba(0,0,0,0.48), 0 0 0 1px rgba(255,138,31,0.06)',
    medium: '0 14px 30px rgba(0,0,0,0.48), 0 0 0 1px rgba(255,138,31,0.06)',
    lg: '0 24px 52px rgba(0,0,0,0.58), 0 0 42px rgba(255,107,0,0.08)',
    large: '0 24px 52px rgba(0,0,0,0.58), 0 0 42px rgba(255,107,0,0.08)',
    glow: '0 0 0 1px rgba(255,138,31,0.18), 0 0 32px rgba(255,107,0,0.16)',
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

export const lightTheme = {
  ...theme,
  isLight: true,
  colors: {
    ...theme.colors,
    primary: '#1f1811',
    primaryDark: '#120d08',
    secondary: '#655548',
    brand: {
      primary: '#c96a16'
    },
    background: '#f6f1e8',
    surface: '#fffdf8',
    accent: '#c96a16',
    ring: '#e8d7c3',
    highlight: '#fb923c',
    bg: {
      primary: '#f6f1e8',
      secondary: '#fffdf8',
      tertiary: '#efe4d4',
      elevated: '#ffffff',
    },
    text: {
      primary: '#1f1811',
      secondary: '#625447',
      tertiary: '#857568',
      disabled: '#b7aa9d',
    },
    textSecondary: '#625447',
    border: {
      light: '#eadfce',
      medium: '#d9c9b6',
      strong: '#c2aa8f',
    },
    glass: {
      panel: 'rgba(255, 250, 243, 0.8)',
      panelBorder: 'rgba(130, 96, 59, 0.14)',
      panelHover: 'rgba(201, 106, 22, 0.08)',
      bar: 'rgba(250, 244, 235, 0.92)',
      barBorder: 'rgba(130, 96, 59, 0.12)',
      overlay: 'rgba(54, 35, 18, 0.18)'
    }
  },
  shadows: {
    ...theme.shadows,
    sm: '0 4px 10px rgba(93, 64, 34, 0.05)',
    small: '0 4px 10px rgba(93, 64, 34, 0.05)',
    md: '0 10px 24px rgba(93, 64, 34, 0.08)',
    medium: '0 10px 24px rgba(93, 64, 34, 0.08)',
    lg: '0 20px 40px rgba(93, 64, 34, 0.12)',
    large: '0 20px 40px rgba(93, 64, 34, 0.12)',
    glow: '0 0 0 1px rgba(201, 106, 22, 0.08), 0 18px 36px rgba(145, 93, 43, 0.12)',
  }
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
