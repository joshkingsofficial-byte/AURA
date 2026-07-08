import React, { useState, useEffect } from 'react';

export default function NewsApp() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Using RSS to JSON proxy — no API key needed
    const BBC_RSS = 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/rss.xml&count=10';

    fetch(BBC_RSS)
      .then(r => r.json())
      .then(data => {
        if (data.items) {
          setArticles(data.items);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load news');
        setLoading(false);
      });
  }, []);

  function timeAgo(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const mins = Math.floor((now - then) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#c8a96e', letterSpacing: '0.3em', fontSize: '12px' }}>
      READING THE WORLD
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
        <div style={{ fontSize: '10px', letterSpacing: '0.4em', color: '#c8a96e', marginBottom: '8px' }}>BRIEFING</div>
        <div style={{ fontSize: '13px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>BBC NEWS</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(200,169,110,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        {articles.map((article, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.02)',
            padding: '20px 24px',
            borderBottom: i < articles.length - 1 ? '1px solid rgba(200,169,110,0.06)' : 'none',
            cursor: 'default',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,169,110,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: 200, flex: 1, paddingRight: '16px' }}>
                {article.title}
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(200,169,110,0.4)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                {timeAgo(article.pubDate)}
              </div>
            </div>
            {article.description && (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 200, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {article.description.replace(/<[^>]*>/g, '')}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
