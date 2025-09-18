import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    font-family: ${theme.fonts.body};
    font-weight: ${theme.fontWeights.regular};
    line-height: 1.6;
    color: ${theme.colors.text};
    /* background: ${theme.colors.background}; */
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    position: relative;
  }

  /* Remove global gradients and overlays to allow custom background image */
  /*
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(255, 107, 0, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(255, 71, 87, 0.02) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(255, 215, 0, 0.02) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }

  body::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(255, 107, 0, 0.01) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 107, 0, 0.01) 1px, transparent 1px);
    background-size: 50px 50px;
    pointer-events: none;
    z-index: -1;
  }
  */

  /* CS:GO Tournament Elements */
  .csgo-bg-elements {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: -1;
    overflow: hidden;
  }

  .csgo-bg-elements::before {
    content: 'CS:GO';
    position: absolute;
    top: 10%;
    right: 5%;
    font-family: 'Orbitron', monospace;
    font-size: 14px;
    color: rgba(255, 107, 0, 0.1);
    transform: rotate(15deg);
    animation: csgoFloat 8s ease-in-out infinite;
  }

  .csgo-bg-elements::after {
    content: 'LAN';
    position: absolute;
    bottom: 15%;
    left: 3%;
    font-family: 'Orbitron', monospace;
    font-size: 12px;
    color: rgba(255, 71, 87, 0.08);
    transform: rotate(-10deg);
    animation: csgoFloat 6s ease-in-out infinite reverse;
  }

  @keyframes csgoFloat {
    0%, 100% { transform: rotate(15deg) translateY(0px); }
    50% { transform: rotate(15deg) translateY(-10px); }
  }

  /* CS:GO Tournament Icons */
  .csgo-tournament-icon {
    position: absolute;
    width: 20px;
    height: 20px;
    background: rgba(255, 107, 0, 0.05);
    border: 1px solid rgba(255, 107, 0, 0.1);
    border-radius: 50%;
    animation: tournamentPulse 4s ease-in-out infinite;
  }

  .csgo-tournament-icon:nth-child(1) {
    top: 25%;
    left: 10%;
    animation-delay: 0s;
  }

  .csgo-tournament-icon:nth-child(2) {
    top: 60%;
    right: 15%;
    animation-delay: 1s;
  }

  .csgo-tournament-icon:nth-child(3) {
    bottom: 30%;
    left: 20%;
    animation-delay: 2s;
  }

  @keyframes tournamentPulse {
    0%, 100% { 
      transform: scale(1);
      opacity: 0.3;
    }
    50% { 
      transform: scale(1.2);
      opacity: 0.6;
    }
  }

  /* CS:GO Score Elements */
  .csgo-score-element {
    position: absolute;
    font-family: 'Orbitron', monospace;
    font-size: 10px;
    color: rgba(255, 215, 0, 0.1);
    animation: scoreFade 5s ease-in-out infinite;
  }

  .csgo-score-element:nth-child(4) {
    top: 40%;
    right: 8%;
    content: '16:14';
    animation-delay: 0s;
  }

  .csgo-score-element:nth-child(5) {
    top: 70%;
    left: 5%;
    content: '13:16';
    animation-delay: 2s;
  }

  @keyframes scoreFade {
    0%, 100% { opacity: 0.1; }
    50% { opacity: 0.3; }
  }

  /* Global title styles */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${theme.fonts.title};
    font-weight: ${theme.fontWeights.semiBold};
    letter-spacing: 1px;
    margin-bottom: 1rem;
    text-transform: uppercase;
  }

  h1 {
    font-weight: ${theme.fontWeights.bold};
    font-size: 2.5rem;
    letter-spacing: 2px;
  }

  h2 {
    font-weight: ${theme.fontWeights.semiBold};
    font-size: 2rem;
    letter-spacing: 1.5px;
  }

  h3 {
    font-weight: ${theme.fontWeights.medium};
    font-size: 1.5rem;
    letter-spacing: 1px;
  }

  /* Body text styles */
  p, span, div, li, a {
    font-family: ${theme.fonts.body};
    font-weight: ${theme.fontWeights.regular};
  }

  /* Button styles */
  button {
    font-family: ${theme.fonts.title};
    font-weight: ${theme.fontWeights.medium};
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* Input styles */
  input, textarea, select {
    font-family: ${theme.fonts.body};
    font-weight: ${theme.fontWeights.regular};
  }

  /* Label styles */
  label {
    font-family: ${theme.fonts.title};
    font-weight: ${theme.fontWeights.medium};
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  /* Link styles */
  a {
    text-decoration: none;
    color: inherit;
    transition: color 0.3s ease;
  }

  a:hover {
    color: ${theme.colors.primary};
  }

  /* Focus styles */
  *:focus {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }

  /* Selection styles */
  ::selection {
    background: ${theme.colors.primary};
    color: ${theme.colors.text};
  }

  /* Scrollbar styles */
  ::-webkit-scrollbar {
    width: 12px;
  }

  ::-webkit-scrollbar-track {
    background: #000000;
    border-radius: 6px;
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #ff69b4, #ff1493, #ff69b4);
    border-radius: 6px;
    border: 2px solid #000000;
    box-shadow: 0 0 10px rgba(255, 105, 180, 0.5);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #ff1493, #ff69b4, #ff1493);
    box-shadow: 0 0 15px rgba(255, 105, 180, 0.8);
  }

  /* Firefox scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: #ff69b4 #000000;
  }

  /* Responsive typography */
  @media (max-width: 768px) {
    html {
      font-size: 14px;
    }

    h1 {
      font-size: 1.8rem;
      letter-spacing: 1.5px;
    }

    h2 {
      font-size: 1.5rem;
      letter-spacing: 1px;
    }

    h3 {
      font-size: 1.2rem;
      letter-spacing: 0.8px;
    }
  }

  @media (min-width: 769px) {
    html {
      font-size: 16px;
    }

    h1 {
      font-size: 2.5rem;
      letter-spacing: 2px;
    }

    h2 {
      font-size: 2rem;
      letter-spacing: 1.5px;
    }

    h3 {
      font-size: 1.5rem;
      letter-spacing: 1px;
    }
  }

  /* Utility classes for fonts */
  .font-title {
    font-family: ${theme.fonts.title} !important;
  }

  .font-body {
    font-family: ${theme.fonts.body} !important;
  }

  .font-weight-light {
    font-weight: ${theme.fontWeights.light} !important;
  }

  .font-weight-regular {
    font-weight: ${theme.fontWeights.regular} !important;
  }

  .font-weight-medium {
    font-weight: ${theme.fontWeights.medium} !important;
  }

  .font-weight-semibold {
    font-weight: ${theme.fontWeights.semiBold} !important;
  }

  .font-weight-bold {
    font-weight: ${theme.fontWeights.bold} !important;
  }

  .letter-spacing-tight {
    letter-spacing: 0.5px !important;
  }

  .letter-spacing-normal {
    letter-spacing: 1px !important;
  }

  .letter-spacing-wide {
    letter-spacing: 2px !important;
  }

  .text-uppercase {
    text-transform: uppercase !important;
  }
`; 