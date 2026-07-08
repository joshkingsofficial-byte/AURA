import React, { useState, useEffect } from 'react';

export default function EmailApp() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmails = () => {
      fetch('http://localhost:8766/emails')
        .then(r => r.json())
        .then(data => {
          setEmails(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Could not connect to AURA backend');
          setLoading(false);
        });
    };
    fetchEmails();
    const id = setInterval(fetchEmails, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#c8a96e', letterSpacing: '0.3em', fontSize: '12px' }}>
      READING YOUR MESSAGES
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#c8a96e', letterSpacing: '0.3em', fontSize: '12px' }}>
      {error}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 60%, #1a0a2e 0%, #0d0515 40%, #080010 100%)',
      color: 'white',
      padding: '48px',
      fontFamily: 'inherit',
    }}>
      <div style={{ marginBottom: '48px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.4em', color: '#c8a96e', marginBottom: '8px' }}>MESSAGES</div>
        <div style={{ fontSize: '13px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>
          {emails.length} UNREAD
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(200,169,110,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        {emails.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(200,169,110,0.4)', letterSpacing: '0.2em', fontSize: '12px' }}>
            NO UNREAD MESSAGES
          </div>
        ) : (
          emails.map((email, i) => (
            <div key={email.id} style={{
              background: 'rgba(255,255,255,0.02)',
              padding: '20px 24px',
              borderBottom: i < emails.length - 1 ? '1px solid rgba(200,169,110,0.06)' : 'none',
              transition: 'background 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,169,110,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#c8a96e', fontWeight: 300 }}>
                  {email.from.replace(/<.*>/, '').trim().toUpperCase()}
                </div>
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: 200, marginBottom: '6px', letterSpacing: '0.02em' }}>
                {email.subject}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 200, letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email.snippet}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
