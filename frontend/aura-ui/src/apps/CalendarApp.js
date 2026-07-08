import React, { useState, useEffect } from 'react';

function toUtcDate(dateStr) {
  // Graph returns UTC datetimes without 'Z' — append it so JS parses as UTC not local
  if (!dateStr) return new Date(NaN);
  return new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = toUtcDate(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return 'TODAY';
  if (isTomorrow) return 'TOMORROW';

  return date.toLocaleDateString('en-GB', {
    weekday: 'short', month: 'short', day: 'numeric'
  }).toUpperCase();
}

function formatTime(dateStr) {
  if (!dateStr || !dateStr.includes('T')) return 'ALL DAY';
  const date = toUtcDate(dateStr);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: true
  }).toUpperCase();
}

export default function CalendarApp() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8766/calendar')
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false); })
      .catch(() => { setError('Could not connect to AURA backend'); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#c8a96e', letterSpacing: '0.3em', fontSize: '12px' }}>
      READING YOUR SCHEDULE
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
        <div style={{ fontSize: '10px', letterSpacing: '0.4em', color: '#c8a96e', marginBottom: '8px' }}>CALENDAR</div>
        <div style={{ fontSize: '13px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>
          {events.length} UPCOMING
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(200,169,110,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        {events.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(200,169,110,0.4)', letterSpacing: '0.2em', fontSize: '12px' }}>
            NOTHING SCHEDULED
          </div>
        ) : (
          events.map((event, i) => (
            <div key={event.id} style={{
              background: 'rgba(255,255,255,0.02)',
              padding: '20px 24px',
              borderBottom: i < events.length - 1 ? '1px solid rgba(200,169,110,0.06)' : 'none',
              display: 'flex',
              gap: '24px',
              alignItems: 'flex-start',
              cursor: 'default',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,169,110,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            >
              <div style={{ minWidth: '80px', textAlign: 'right' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#c8a96e', marginBottom: '4px' }}>
                  {formatDate(event.start)}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
                  {formatTime(event.start)}
                </div>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid rgba(200,169,110,0.2)', paddingLeft: '24px' }}>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: 200, marginBottom: '4px' }}>
                  {event.title}
                </div>
                {event.location && (
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
                    {event.location}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
