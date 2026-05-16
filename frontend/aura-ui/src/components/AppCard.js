import React from 'react';

function AppCard({ app, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(200,169,110,0.15)',
        borderRadius: '12px',
        padding: '28px 16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        textAlign: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)';
        e.currentTarget.style.background = 'rgba(200,169,110,0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(200,169,110,0.15)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
    >
      <div style={{
        color: '#c8a96e',
        fontSize: '10px',
        letterSpacing: '0.2em',
        fontWeight: 300,
        textTransform: 'uppercase'
      }}>
        {app.name}
      </div>
    </div>
  );
}

export default AppCard;
