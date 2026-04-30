import styled from 'styled-components';
import Card from './Card';

export const PageShell = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0;
  display: grid;
  gap: 1.25rem;
`;

export const PageHero = styled(Card).attrs({ variant: 'elevated' })`
  position: relative;
  overflow: hidden;
  padding: clamp(1.35rem, 3vw, 2.7rem);
  border-radius: 28px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background:
    ${({ theme }) =>
      theme.isLight
        ? `
      radial-gradient(circle at top right, rgba(255, 193, 138, 0.2), transparent 32%),
      linear-gradient(145deg, rgba(255,255,255,0.98), rgba(247, 239, 229, 0.94))
    `
        : `
      radial-gradient(circle at top right, rgba(245, 154, 74, 0.14), transparent 32%),
      radial-gradient(circle at bottom left, rgba(255,255,255,0.05), transparent 24%),
      linear-gradient(160deg, rgba(18, 22, 27, 0.96), rgba(8, 10, 13, 0.98))
    `};
  box-shadow: ${({ theme }) => theme.shadows.large};
`;

export const PageHeroLayout = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    align-items: stretch;
  }
`;

export const PageHeroContent = styled.div`
  flex: 1;
  min-width: min(100%, 340px);
`;

export const PageTitle = styled.h1`
  margin: 0 0 0.75rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.85rem, 5vw, 3.45rem);
  line-height: 0.94;
  letter-spacing: 0.006em;
`;

export const PageSubtitle = styled.p`
  margin: 0;
  max-width: 780px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: clamp(0.95rem, 1.9vw, 1.12rem);
  line-height: 1.68;
  text-wrap: pretty;
`;

export const PageToolbar = styled.div`
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  align-items: center;
`;

export const PageFilterSection = styled.div`
  display: grid;
  gap: 0.9rem;
`;

export const FilterRail = styled(Card).attrs({ variant: 'outlined' })`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  padding: 0.95rem 1rem;
  border-radius: 22px;
  background: ${({ theme }) => (theme.isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)')};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
`;

export const FilterGroup = styled.div`
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  align-items: center;
`;

export const FilterLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 0.78rem;
  font-family: ${({ theme }) => theme.fonts.accent};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const SelectField = styled.select`
  min-height: 46px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(247,240,230,0.88))'
      : 'linear-gradient(180deg, rgba(14, 17, 22, 0.96), rgba(8, 10, 13, 0.98))'};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0 0.95rem;
  min-width: 170px;
  transition: border-color ${({ theme }) => theme.transitions.fast}, box-shadow ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.strong};
    box-shadow: ${({ theme }) => (theme.isLight ? '0 0 0 4px rgba(44, 33, 22, 0.08)' : '0 0 0 4px rgba(255, 255, 255, 0.07)')};
  }

  option {
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

export const NoticeBanner = styled.div<{ $tone?: 'info' | 'success' | 'error' | 'warning' }>`
  position: relative;
  overflow: hidden;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  border: 1px solid
    ${({ $tone = 'info' }) =>
      $tone === 'success'
        ? 'rgba(52, 211, 153, 0.24)'
        : $tone === 'error'
          ? 'rgba(248, 113, 113, 0.26)'
          : $tone === 'warning'
            ? 'rgba(245, 154, 74, 0.3)'
            : 'rgba(96, 165, 250, 0.26)'};
  background:
    ${({ $tone = 'info' }) =>
      $tone === 'success'
        ? 'rgba(52, 211, 153, 0.1)'
        : $tone === 'error'
          ? 'rgba(248, 113, 113, 0.1)'
          : $tone === 'warning'
            ? 'rgba(245, 154, 74, 0.1)'
            : 'rgba(96, 165, 250, 0.1)'};
  color:
    ${({ $tone = 'info' }) =>
      $tone === 'success'
        ? '#9ff0cf'
        : $tone === 'error'
          ? '#ffc1c1'
          : $tone === 'warning'
            ? '#ffcd9b'
            : '#bfdbfe'};
  box-shadow: 0 14px 24px rgba(0, 0, 0, 0.14);

  &::after {
    content: '';
    position: absolute;
    inset: auto -12% -80% auto;
    width: 10rem;
    height: 10rem;
    border-radius: 50%;
    background:
      ${({ $tone = 'info' }) =>
        $tone === 'success'
          ? 'radial-gradient(circle, rgba(52, 211, 153, 0.18), transparent 68%)'
          : $tone === 'error'
            ? 'radial-gradient(circle, rgba(248, 113, 113, 0.18), transparent 68%)'
            : $tone === 'warning'
              ? 'radial-gradient(circle, rgba(245, 154, 74, 0.2), transparent 68%)'
              : 'radial-gradient(circle, rgba(96, 165, 250, 0.18), transparent 68%)'};
    pointer-events: none;
  }
`;

export const PageEmptyState = styled(Card).attrs({ variant: 'outlined' })`
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 0.6rem;
  justify-items: center;
  text-align: center;
  padding: 3.15rem 1.4rem;
  min-height: 220px;
  color: ${({ theme }) => theme.colors.text.secondary};
  border-radius: 24px;
  background:
    ${({ theme }) =>
      theme.isLight
        ? 'linear-gradient(180deg, rgba(255,255,255,0.86), rgba(247,240,230,0.8))'
        : 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02))'};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  box-shadow: ${({ theme }) => theme.shadows.medium};

  &::before {
    content: '';
    position: absolute;
    top: -2rem;
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245, 154, 74, 0.18), transparent 70%);
    filter: blur(2px);
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(10px);
`;

export const ModalPanel = styled(Card).attrs({ variant: 'elevated' })`
  width: min(680px, 100%);
  padding: 1.4rem;
  border-radius: 24px;
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,241,231,0.96))'
      : 'linear-gradient(180deg, rgba(16, 19, 24, 0.98), rgba(8, 10, 13, 1))'};
  border: 1px solid ${({ theme }) => theme.colors.border.light};

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.8rem;
  }
`;

export const ModalTitle = styled.h2`
  margin: 0 0 0.7rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.2rem, 2.4vw, 1.8rem);
`;

export const ModalCopy = styled.p`
  margin: 0 0 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.65;
`;

export const ModalActionRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;
