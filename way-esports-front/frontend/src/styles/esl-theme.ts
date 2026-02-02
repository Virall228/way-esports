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
    
    // Polished monochrome + subtle accent (inspired by polished-clone-studio)
    primary: '#ffffff',
    primaryDark: '#e5e5e5',
    secondary: '#a3a3a3',
    background: '#0a0a0a',
    surface: '#111111',
    accent: '#f1f1f1',
    ring: '#2a2a2a',
    highlight: '#d4d4d4',
    
    // Functional colors
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Backgrounds
    bg: {
      primary: '#0a0a0a',
      secondary: '#111111',
      tertiary: '#161616',
      elevated: '#1f1f1f',
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
      light: '#222222',
      medium: '#2f2f2f',
      strong: '#3a3a3a',
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
    button: { fontSize: '14px', fontWeight: 700 },
    caption: { fontSize: '12px', fontWeight: 400 }
  },
  
  breakpoints: {
    mobile: '320px',
    tablet: '481px',
    desktop: '1025px',
    wide: '1441px',
  },
};

export const GlobalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
    scroll-behavior: smooth;
  }

  body {
    font-family: ${eslTheme.fonts.primary};
    background-color: ${eslTheme.colors.bg.primary};
    color: ${eslTheme.colors.text.primary};
    line-height: 1.5;
    overflow-x: hidden;
    min-height: 100vh;
    min-height: 100dvh;
    overscroll-behavior-y: none;
  }

  #root {
    --sat: env(safe-area-inset-top);
    --sar: env(safe-area-inset-right);
    --sab: env(safe-area-inset-bottom);
    --sal: env(safe-area-inset-left);
    --app-height: 100vh;

    min-height: 100vh;
    min-height: 100dvh;
    min-height: var(--app-height);
    background: linear-gradient(135deg, 
      ${eslTheme.colors.bg.primary} 0%, 
      ${eslTheme.colors.bg.secondary} 100%);
  }

  img, svg, video, canvas {
    max-width: 100%;
    height: auto;
  }

  h1 {
    font-size: clamp(1.5rem, 4vw, 2.75rem);
    line-height: 1.1;
  }

  h2 {
    font-size: clamp(1.25rem, 3vw, 2rem);
    line-height: 1.15;
  }

  h3 {
    font-size: clamp(1.125rem, 2.2vw, 1.5rem);
    line-height: 1.2;
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
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  /* Link reset */
  a {
    color: inherit;
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  @media (hover: hover) and (pointer: fine) {
    a:hover {
      color: ${eslTheme.colors.text.primary};
    }
  }

  @media (hover: none) and (pointer: coarse) {
    a:active {
      color: ${eslTheme.colors.text.primary};
    }
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
