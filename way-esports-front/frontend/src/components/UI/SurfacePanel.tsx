import styled from 'styled-components';
import Card from './Card';
import { designTokens } from '../../styles/designTokens';

const SurfacePanel = styled(Card).attrs({ variant: 'outlined' })`
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(251, 247, 240, 0.92) 100%)'
      : designTokens.surface.panel};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : designTokens.surface.border)};
  box-shadow: ${({ theme }) => (theme.isLight ? theme.shadows.medium : 'none')};
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
