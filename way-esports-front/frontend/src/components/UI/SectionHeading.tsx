import React from 'react';
import styled from 'styled-components';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  center?: boolean;
  className?: string;
}

const Root = styled.div<{ $center: boolean }>`
  display: grid;
  gap: 0.45rem;
  text-align: ${({ $center }) => ($center ? 'center' : 'left')};
  justify-items: ${({ $center }) => ($center ? 'center' : 'start')};
  margin-bottom: 1.2rem;
`;

const AccentLine = styled.span`
  width: 72px;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(245, 154, 74, 0), rgba(245, 154, 74, 0.9), rgba(255, 255, 255, 0.24));
`;

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.35rem, 2.8vw, 2.65rem);
  letter-spacing: 0.01em;
  line-height: 1.04;
`;

const Subtitle = styled.p`
  margin: 0;
  max-width: 720px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.98rem;
  line-height: 1.65;
`;

const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle, center = false, className }) => (
  <Root $center={center} className={className}>
    <AccentLine aria-hidden="true" />
    <Title>{title}</Title>
    {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
  </Root>
);

export default SectionHeading;
