import React from 'react';
import styled from 'styled-components';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  center?: boolean;
  className?: string;
}

const Root = styled.div<{ $center: boolean }>`
  text-align: ${({ $center }) => ($center ? 'center' : 'left')};
  margin-bottom: 18px;
`;

const Title = styled.h2`
  margin: 0;
  color: #fff;
  font-size: clamp(1.2rem, 2.8vw, 2.35rem);
  letter-spacing: 0.04em;
  line-height: 1.1;
`;

const Subtitle = styled.p`
  margin: 8px 0 0;
  color: #b7bcc5;
  font-size: 0.9rem;
`;

const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle, center = false, className }) => (
  <Root $center={center} className={className}>
    <Title>{title}</Title>
    {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
  </Root>
);

export default SectionHeading;
