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
    panel: 'linear-gradient(145deg, rgba(15, 18, 23, 0.94) 0%, rgba(5, 7, 10, 0.96) 100%)',
    panelSoft: 'rgba(255, 138, 31, 0.055)',
    border: 'rgba(255, 138, 31, 0.16)'
  }
} as const;

export type DesignTokens = typeof designTokens;
