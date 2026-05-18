import React from 'react';

function AppCard({ app, onClick, isSelected }) {
  return (
    <div
      onClick={onClick}
      className={isSelected ? 'app-card-selected' : ''}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(200,169,110,0.15)',
        borderRadius: '12px',
        padding: '28px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.3s ease, background 0.3s ease',
        textAlign: 'center',
      }}
      onMouseEnter={(e) => {
        if (isSelected) return;
        e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)';
        e.currentTarget.style.background = 'rgba(200,169,110,0.05)';
      }}
      onMouseLeave={(e) => {
        if (isSelected) return;
        e.currentTarget.style.borderColor = 'rgba(200,169,110,0.15)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
    >
      <div style={{
        color: isSelected ? '#e8c98e' : '#c8a96e',
        fontSize: '10px',
        letterSpacing: '0.2em',
        fontWeight: isSelected ? 400 : 300,
        textTransform: 'uppercase',
        transition: 'color 0.3s ease, font-weight 0.3s ease',
      }}>
        {app.name}
      </div>
    </div>
  );
}

export default AppCard;
