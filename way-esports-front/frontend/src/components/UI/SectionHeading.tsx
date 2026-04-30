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
  gap: 0.4rem;
  text-align: ${({ $center }) => ($center ? 'center' : 'left')};
  justify-items: ${({ $center }) => ($center ? 'center' : 'start')};
  margin-bottom: 1.15rem;
`;

const AccentLine = styled.span`
  position: relative;
  width: 72px;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(172, 180, 192, 0.72), rgba(255, 255, 255, 0.16));
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.06);

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 8px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transform: translateY(-50%);
    background: radial-gradient(circle, rgba(255,255,255,0.62), rgba(255,255,255,0) 62%);
    opacity: 0.42;
  }
`;

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.35rem, 2.8vw, 2.65rem);
  letter-spacing: 0.006em;
  line-height: 1;
  text-wrap: balance;
`;

const Subtitle = styled.p`
  margin: 0;
  max-width: 720px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.95rem;
  line-height: 1.62;
  text-wrap: pretty;
`;

const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle, center = false, className }) => (
  <Root $center={center} className={className}>
    <AccentLine aria-hidden="true" />
    <Title>{title}</Title>
    {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
  </Root>
);

export default SectionHeading;
