import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --sat: env(safe-area-inset-top);
    --sab: env(safe-area-inset-bottom);
    --sal: env(safe-area-inset-left);
    --sar: env(safe-area-inset-right);
    --app-height: 100vh;
    --bg-pattern-opacity: 0.08;
    --bg-glow-opacity: 0.82;
    --ambient-drift-duration: 30s;
  }

  html {
    font-size: 16px;
    height: 100%;
    overflow: hidden;
    scroll-behavior: smooth;
    text-rendering: optimizeLegibility;
  }

  body[data-bg-preset='subtle'] {
    --bg-pattern-opacity: 0.04;
    --bg-glow-opacity: 0.72;
  }

  body[data-bg-preset='default'] {
    --bg-pattern-opacity: 0.08;
    --bg-glow-opacity: 0.82;
  }

  body[data-bg-preset='strong'] {
    --bg-pattern-opacity: 0.14;
    --bg-glow-opacity: 0.92;
  }

  body {
    background-color: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-family: ${({ theme }) => theme.fonts.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
    overflow: hidden;
    width: 100%;
    min-width: 0;
    position: relative;
    height: 100%;
    overscroll-behavior: none;
    line-height: 1.6;
    letter-spacing: -0.01em;
  }

  @keyframes wayAmbientDrift {
    0% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(0, -1.5%, 0) scale(1.025);
    }
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  @keyframes wayGridShift {
    0% {
      transform: translate3d(0, 0, 0);
    }
    50% {
      transform: translate3d(-0.6%, 0.5%, 0);
    }
    100% {
      transform: translate3d(0, 0, 0);
    }
  }

  #root {
    height: 100%;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background: ${({ theme }) =>
      theme.isLight
        ? `
      radial-gradient(circle at 12% 10%, rgba(255, 221, 188, 0.38) 0%, transparent 34%),
      radial-gradient(circle at 86% 14%, rgba(255, 240, 222, 0.9) 0%, transparent 28%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(247, 239, 229, 0.98) 100%)
    `
        : `
      radial-gradient(circle at 12% 10%, rgba(255, 255, 255, 0.06) 0%, transparent 28%),
      radial-gradient(circle at 84% 12%, rgba(255, 255, 255, 0.04) 0%, transparent 22%),
      radial-gradient(circle at 50% -8%, rgba(148, 163, 184, 0.08) 0%, transparent 30%),
      linear-gradient(180deg, rgba(4, 6, 10, 0.94) 0%, rgba(7, 9, 12, 0.98) 56%, rgba(4, 5, 7, 1) 100%)
    `};
    opacity: var(--bg-glow-opacity);
    pointer-events: none;
    z-index: -2;
    transform-origin: center top;
    animation: wayAmbientDrift var(--ambient-drift-duration) ease-in-out infinite;
  }

  body::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image: ${({ theme }) =>
      theme.isLight
        ? `
      linear-gradient(90deg, rgba(122, 88, 49, 0.04) 1px, transparent 1px),
      linear-gradient(rgba(122, 88, 49, 0.04) 1px, transparent 1px)
    `
        : `
      linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
      linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px)
    `};
    background-size: 56px 56px, 56px 56px;
    background-position: 0 0, 0 0;
    opacity: var(--bg-pattern-opacity);
    pointer-events: none;
    z-index: -1;
    mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.58));
    animation: wayGridShift 28s ease-in-out infinite;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: ${({ theme }) => theme.fonts.title};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    letter-spacing: -0.03em;
    line-height: 0.98;
    margin-bottom: 0.55rem;
    text-wrap: balance;
  }

  h1 {
    font-size: clamp(2.2rem, 5vw, 4rem);
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  h2 {
    font-size: clamp(1.55rem, 3.2vw, 2.6rem);
  }

  h3 {
    font-size: clamp(1.15rem, 2.2vw, 1.55rem);
  }

  p,
  span,
  div,
  li,
  a {
    font-family: ${({ theme }) => theme.fonts.primary};
  }

  p,
  li {
    line-height: 1.62;
  }

  button {
    font-family: ${({ theme }) => theme.fonts.accent};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    letter-spacing: -0.01em;
  }

  input,
  textarea,
  select {
    font-family: ${({ theme }) => theme.fonts.primary};
    font-weight: ${({ theme }) => theme.fontWeights.regular};
  }

  label {
    font-family: ${({ theme }) => theme.fonts.accent};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    letter-spacing: -0.01em;
  }

  a {
    text-decoration: none;
    color: inherit;
    transition: color ${({ theme }) => theme.transitions.fast};
  }

  a:hover {
    color: ${({ theme }) => (theme.isLight ? '#3b82f6' : '#dbe5f1')};
  }

  img,
  picture,
  video,
  canvas,
  svg {
    display: block;
    max-width: 100%;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  *:focus-visible {
    outline: 2px solid ${({ theme }) => (theme.isLight ? 'rgba(59, 130, 246, 0.34)' : 'rgba(219, 229, 241, 0.28)')};
    outline-offset: 2px;
  }

  ::selection {
    background: ${({ theme }) => (theme.isLight ? 'rgba(59, 130, 246, 0.16)' : 'rgba(219, 229, 241, 0.16)')};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => (theme.isLight ? 'rgba(237, 226, 211, 0.82)' : 'rgba(255, 255, 255, 0.03)')};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) =>
      theme.isLight
        ? 'linear-gradient(180deg, #d0b291, #bea284)'
        : 'linear-gradient(180deg, rgba(141, 149, 163, 0.82), rgba(62, 69, 79, 0.92))'};
    border-radius: 999px;
    border: 2px solid ${({ theme }) => (theme.isLight ? 'rgba(237, 226, 211, 0.82)' : 'rgba(255, 255, 255, 0.03)')};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) =>
      theme.isLight
        ? 'linear-gradient(180deg, #c59d73, #b18051)'
        : 'linear-gradient(180deg, rgba(162, 170, 182, 0.92), rgba(74, 82, 94, 0.96))'};
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) => (theme.isLight ? '#bea284 #ede2d3' : '#606b78 rgba(255,255,255,0.03)')};
  }

  @media (max-width: 768px) {
    body::before {
      opacity: calc(var(--bg-glow-opacity) * 0.86);
    }

    body::after {
      opacity: calc(var(--bg-pattern-opacity) * 0.72);
      background-size: 42px 42px, 42px 42px, 300px 180px;
    }

    html {
      font-size: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    body::before,
    body::after {
      animation: none !important;
    }
  }
`;
