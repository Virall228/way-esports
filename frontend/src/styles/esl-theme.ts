export const eslTheme = {
  colors: {
    // Primary grayscale palette
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
    
    // ESL Gaming style colors
    primary: '#ffffff',
    primaryDark: '#000000',
    secondary: '#8b8b8b',
    background: '#000000',
    surface: '#0a0a0a',
    accent: '#404040',
    
    // Functional colors
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Backgrounds
    bg: {
      primary: '#000000',
      secondary: '#0a0a0a',
      tertiary: '#1a1a1a',
      elevated: '#262626',
    },
    
    // Text
    text: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      tertiary: '#737373',
      disabled: '#525252',
    },
    textSecondary: '#a3a3a3',
    
    // Borders
    border: {
      light: '#262626',
      medium: '#404040',
      strong: '#525252',
    },
  },
  
  fonts: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    secondary: "'JetBrains Mono', 'Courier New', monospace",
    accent: "'Orbitron', monospace",
    title: "'Orbitron', monospace",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  
  fontWeights: {
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    semibold: 600,
    bold: 700,
    extraBold: 800,
    extrabold: 800,
    black: 900,
    normal: 400,
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
    none: '0',
    sm: '2px',
    small: '2px',
    md: '4px',
    medium: '4px',
    lg: '8px',
    large: '8px',
    xl: '16px',
    full: '9999px',
    round: '50%',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(255, 255, 255, 0.05)',
    small: '0 1px 2px 0 rgba(255, 255, 255, 0.05)',
    md: '0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06)',
    medium: '0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06)',
    lg: '0 10px 15px -3px rgba(255, 255, 255, 0.1), 0 4px 6px -2px rgba(255, 255, 255, 0.05)',
    large: '0 10px 15px -3px rgba(255, 255, 255, 0.1), 0 4px 6px -2px rgba(255, 255, 255, 0.05)',
    glow: '0 0 20px rgba(255, 255, 255, 0.1)',
  },
  
  transitions: {
    fast: '150ms ease',
    medium: '300ms ease',
    slow: '500ms ease',
    default: '300ms ease',
  },
  
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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

export const GlobalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${eslTheme.fonts.primary};
    background-color: ${eslTheme.colors.bg.primary};
    color: ${eslTheme.colors.text.primary};
    line-height: 1.5;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    background: linear-gradient(135deg, 
      ${eslTheme.colors.bg.primary} 0%, 
      ${eslTheme.colors.bg.secondary} 100%);
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${eslTheme.colors.bg.tertiary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${eslTheme.colors.border.medium};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${eslTheme.colors.border.strong};
  }

  /* Selection styling */
  ::selection {
    background: ${eslTheme.colors.accent};
    color: ${eslTheme.colors.white};
  }

  /* Focus styles */
  *:focus {
    outline: 2px solid ${eslTheme.colors.white};
    outline-offset: 2px;
  }

  /* Button reset */
  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
    color: inherit;
  }

  /* Link reset */
  a {
    color: inherit;
    text-decoration: none;
  }

  /* Input reset */
  input, textarea, select {
    font-family: inherit;
    background: transparent;
    border: 1px solid ${eslTheme.colors.border.light};
    color: ${eslTheme.colors.text.primary};
    border-radius: ${eslTheme.borderRadius.md};
    padding: ${eslTheme.spacing.sm} ${eslTheme.spacing.md};
  }

  input:focus, textarea:focus, select:focus {
    border-color: ${eslTheme.colors.white};
    outline: none;
  }
`;
