export const designTokens = {
  radius: {
    card: '24px',
    cardMobile: '18px',
    field: '16px',
    button: '16px',
    buttonLarge: '20px',
    pill: '999px'
  },
  space: {
    section: '24px',
    sectionMobile: '16px',
    page: 'clamp(18px, 2vw, 32px)',
    gap: '14px',
    gapMobile: '10px'
  },
  layout: {
    contentWidth: '1440px'
  },
  surface: {
    panel: 'linear-gradient(180deg, rgba(17, 20, 24, 0.94) 0%, rgba(8, 10, 13, 0.98) 100%)',
    panelElevated: 'linear-gradient(180deg, rgba(26, 30, 36, 0.96) 0%, rgba(10, 12, 15, 0.99) 100%)',
    panelSoft: 'rgba(255, 255, 255, 0.035)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 170, 94, 0.28)'
  },
  shadow: {
    soft: '0 18px 40px rgba(0, 0, 0, 0.24)',
    medium: '0 28px 64px rgba(0, 0, 0, 0.34)',
    glow: '0 0 0 1px rgba(255, 170, 94, 0.14), 0 24px 48px rgba(0, 0, 0, 0.34)'
  }
} as const;

export type DesignTokens = typeof designTokens;
