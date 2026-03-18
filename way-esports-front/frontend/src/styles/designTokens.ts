export const designTokens = {
  radius: {
    card: '16px',
    cardMobile: '12px',
    pill: '999px'
  },
  space: {
    section: '20px',
    sectionMobile: '14px',
    gap: '12px',
    gapMobile: '10px'
  },
  surface: {
    panel: 'linear-gradient(180deg, rgba(16, 18, 22, 0.94) 0%, rgba(10, 12, 16, 0.96) 100%)',
    panelSoft: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.12)'
  }
} as const;

export type DesignTokens = typeof designTokens;
