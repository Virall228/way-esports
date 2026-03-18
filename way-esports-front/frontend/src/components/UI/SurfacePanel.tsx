import styled from 'styled-components';
import Card from './Card';
import { designTokens } from '../../styles/designTokens';

const SurfacePanel = styled(Card).attrs({ variant: 'outlined' })`
  background: ${designTokens.surface.panel};
  border: 1px solid ${designTokens.surface.border};
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
