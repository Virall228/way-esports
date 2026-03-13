import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  title: string;
  subtitle: string;
  rightText?: string;
  rightColor?: string;
  to?: string;
};

const baseStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 10,
  alignItems: 'center',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '10px 12px',
  textDecoration: 'none',
  color: 'inherit'
};

const TournamentHistoryRow: React.FC<Props> = ({ title, subtitle, rightText, rightColor = '#ffb074', to }) => {
  if (to) {
    return (
      <Link to={to} style={baseStyle}>
        <div>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: 4 }}>{subtitle}</div>
        </div>
        {rightText ? <div style={{ color: rightColor, fontWeight: 700 }}>{rightText}</div> : null}
      </Link>
    );
  }

  return (
    <div style={baseStyle}>
      <div>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: 4 }}>{subtitle}</div>
      </div>
      {rightText ? <div style={{ color: rightColor, fontWeight: 700 }}>{rightText}</div> : null}
    </div>
  );
};

export default TournamentHistoryRow;

