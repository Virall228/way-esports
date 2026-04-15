import styled from 'styled-components';
import Card from './Card';
import { designTokens } from '../../styles/designTokens';

const SurfacePanel = styled(Card).attrs({ variant: 'outlined' })`
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(251, 247, 240, 0.92) 100%)'
      : `linear-gradient(145deg, rgba(18, 22, 29, 0.92) 0%, rgba(5, 7, 10, 0.96) 62%, rgba(28, 14, 4, 0.52) 100%)`};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.glass.panelBorder)};
  box-shadow: ${({ theme }) => (theme.isLight ? theme.shadows.medium : theme.shadows.medium)};
  border-radius: ${designTokens.radius.card};
  padding: ${designTokens.space.section};
  min-width: 0;
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: ${designTokens.radius.cardMobile};
    padding: ${designTokens.space.sectionMobile};
  }
`;

export default SurfacePanel;
