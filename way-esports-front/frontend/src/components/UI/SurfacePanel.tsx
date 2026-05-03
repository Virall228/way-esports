import styled from 'styled-components';
import Card from './Card';
import { designTokens } from '../../styles/designTokens';

const SurfacePanel = styled(Card).attrs({ variant: 'outlined' })`
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 248, 251, 0.95) 100%)'
      : `linear-gradient(180deg, rgba(20, 24, 29, 0.94) 0%, rgba(8, 10, 13, 0.98) 72%, rgba(12, 14, 18, 1) 100%)`};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.light)};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  border-radius: ${designTokens.radius.card};
  padding: ${designTokens.space.section};
  min-width: 0;
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(125%);

  @media (max-width: 768px) {
    border-radius: ${designTokens.radius.cardMobile};
    padding: ${designTokens.space.sectionMobile};
  }
`;

export default SurfacePanel;
