import React, { useState, useEffect } from 'react';

export default function TasksApp() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8766/tasks')
      .then(r => r.json())
      .then(data => { setTasks(data); setLoading(false); })
      .catch(() => { setError('Could not connect to AURA backend'); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#c8a96e', letterSpacing: '0.3em', fontSize: '12px' }}>
      READING YOUR TASKS
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
        <div style={{ fontSize: '10px', letterSpacing: '0.4em', color: '#c8a96e', marginBottom: '8px' }}>TASKS</div>
        <div style={{ fontSize: '13px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>
          {tasks.length} PENDING
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(200,169,110,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        {tasks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(200,169,110,0.4)', letterSpacing: '0.2em', fontSize: '12px' }}>
            NOTHING TO DO
          </div>
        ) : (
          tasks.map((task, i) => (
            <div key={task.id} style={{
              background: 'rgba(255,255,255,0.02)',
              padding: '20px 24px',
              borderBottom: i < tasks.length - 1 ? '1px solid rgba(200,169,110,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              cursor: 'default',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,169,110,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            >
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                border: '1px solid rgba(200,169,110,0.5)',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: 200, letterSpacing: '0.02em' }}>
                  {task.title}
                </div>
                {task.due && (
                  <div style={{ fontSize: '11px', color: 'rgba(200,169,110,0.5)', marginTop: '4px', letterSpacing: '0.1em' }}>
                    DUE {new Date(task.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()}
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
