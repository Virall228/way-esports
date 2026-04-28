import styled from 'styled-components';
import Card from './Card';
import { designTokens } from '../../styles/designTokens';

const SurfacePanel = styled(Card).attrs({ variant: 'outlined' })`
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(251, 247, 240, 0.94) 100%)'
      : `linear-gradient(180deg, rgba(20, 24, 29, 0.94) 0%, rgba(8, 10, 13, 0.98) 64%, rgba(16, 13, 10, 0.96) 100%)`};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.light)};
  box-shadow: ${({ theme }) => theme.shadows.medium};
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
