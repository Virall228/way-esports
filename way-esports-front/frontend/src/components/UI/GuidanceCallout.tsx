import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Card from './Card';
import Button from './Button';

type GuidanceTone = 'info' | 'warning' | 'success';

type GuidanceAction = {
  label: string;
  to: string;
  variant?: 'brand' | 'outline' | 'ghost';
};

type GuidanceCalloutProps = {
  tone?: GuidanceTone;
  eyebrow?: string;
  title: string;
  description?: string;
  tips?: string[];
  primaryAction?: GuidanceAction;
  secondaryAction?: GuidanceAction;
};

const toneStyles: Record<GuidanceTone, { border: string; background: string; badge: string; badgeText: string }> = {
  info: {
    border: 'rgba(96, 165, 250, 0.22)',
    background: 'linear-gradient(145deg, rgba(96, 165, 250, 0.12), rgba(15, 23, 42, 0.2))',
    badge: 'rgba(96, 165, 250, 0.14)',
    badgeText: '#bfdbfe'
  },
  warning: {
    border: 'rgba(255, 199, 143, 0.22)',
    background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.18))',
    badge: 'rgba(245, 158, 11, 0.12)',
    badgeText: '#fde68a'
  },
  success: {
    border: 'rgba(52, 211, 153, 0.22)',
    background: 'linear-gradient(145deg, rgba(52, 211, 153, 0.12), rgba(15, 23, 42, 0.18))',
    badge: 'rgba(52, 211, 153, 0.12)',
    badgeText: '#a7f3d0'
  }
};

const Root = styled(Card).attrs({ variant: 'outlined' })<{ $tone: GuidanceTone }>`
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 1rem;
  padding: 1rem 1.05rem;
  border-radius: 24px;
  border: 1px solid ${({ $tone }) => toneStyles[$tone].border};
  background: ${({ $tone }) => toneStyles[$tone].background};
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.14);

  &::after {
    content: '';
    position: absolute;
    inset: auto -12% -72% auto;
    width: 11rem;
    height: 11rem;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.12), transparent 68%);
    pointer-events: none;
  }
`;

const Header = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const Eyebrow = styled.span<{ $tone: GuidanceTone }>`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 28px;
  padding: 0.28rem 0.68rem;
  border-radius: 999px;
  background: ${({ $tone }) => toneStyles[$tone].badge};
  color: ${({ $tone }) => toneStyles[$tone].badgeText};
  border: 1px solid ${({ $tone }) => toneStyles[$tone].border};
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const Title = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  line-height: 1.35;
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.65;
  font-size: 0.92rem;
`;

const Tips = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.45rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.55;
  font-size: 0.88rem;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const ActionLink = styled(Link)`
  text-decoration: none;
`;

export const GuidanceCallout: React.FC<GuidanceCalloutProps> = ({
  tone = 'info',
  eyebrow,
  title,
  description,
  tips = [],
  primaryAction,
  secondaryAction
}) => (
  <Root $tone={tone}>
    <Header>
      {eyebrow ? <Eyebrow $tone={tone}>{eyebrow}</Eyebrow> : null}
      <Title>{title}</Title>
      {description ? <Description>{description}</Description> : null}
    </Header>

    {tips.length ? (
      <Tips>
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </Tips>
    ) : null}

    {(primaryAction || secondaryAction) ? (
      <Actions>
        {primaryAction ? (
          <ActionLink to={primaryAction.to}>
            <Button variant={primaryAction.variant || 'brand'} size="small">
              {primaryAction.label}
            </Button>
          </ActionLink>
        ) : null}
        {secondaryAction ? (
          <ActionLink to={secondaryAction.to}>
            <Button variant={secondaryAction.variant || 'outline'} size="small">
              {secondaryAction.label}
            </Button>
          </ActionLink>
        ) : null}
      </Actions>
    ) : null}
  </Root>
);

export default GuidanceCallout;
