import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    fonts: {
      title: string;
      body: string;
      accent: string;
    };
    fontWeights: {
      light: number;
      regular: number;
      medium: number;
      semiBold: number;
      bold: number;
      extraBold: number;
      black: number;
      normal: number;
      semibold: number;
    };
    colors: {
      primary: string;
      primaryDark: string;
      secondary: string;
      background: string;
      surface: string;
      white: string;
      black: string;
      gray: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      text: {
        primary: string;
        secondary: string;
        tertiary: string;
        disabled: string;
      };
      textSecondary: string;
      accent: string;
      warning: string;
      error: string;
      success: string;
      info: string;
      bg: {
        primary: string;
        secondary: string;
        tertiary: string;
        elevated: string;
      };
      border: {
        light: string;
        medium: string;
        strong: string;
      };
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    borderRadius: {
      sm: string;
      small: string;
      md: string;
      medium: string;
      lg: string;
      large: string;
      xl: string;
      full: string;
    };
    shadows: {
      sm: string;
      small: string;
      md: string;
      medium: string;
      lg: string;
      large: string;
      glow: string;
    };
    transitions: {
      fast: string;
      medium: string;
      slow: string;
    };
    typography: {
      fontFamily: string;
      fontSizes: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        xxl: string;
      };
      fontWeights: {
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
      };
      h1: { fontSize: string; fontWeight: number };
      h2: { fontSize: string; fontWeight: number };
      h3: { fontSize: string; fontWeight: number };
      h4: { fontSize: string; fontWeight: number };
      h5: { fontSize: string; fontWeight: number };
      h6: { fontSize: string; fontWeight: number };
      body1: { fontSize: string; fontWeight: number };
      body2: { fontSize: string; fontWeight: number };
      button: { fontSize: string; fontWeight: number };
      caption: { fontSize: string; fontWeight: number };
    };
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
      wide: string;
    };
  }
}
