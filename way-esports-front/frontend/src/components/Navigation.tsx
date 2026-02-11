import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/tournaments', label: 'Tournaments' },
    { path: '/profile', label: 'Profile' },
    { path: '/news', label: 'News' }
  ];

  return (
    <nav style={{
      backgroundColor: '#333',
      padding: '1rem',
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center'
    }}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            color: location.pathname === item.path ? '#007bff' : '#fff',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            backgroundColor: location.pathname === item.path ? '#555' : 'transparent'
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default Navigation;
