import React, { useState } from 'react';
import AppGrid from '../components/AppGrid';

function HomePage({ onAppClick }) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col px-8 py-6">
      {/* Compact header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs text-white/40 uppercase tracking-widest mb-1">AURA</div>
          <div className="text-white/60 text-sm">{date}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-light tracking-tight">{time}</div>
        </div>
      </div>

      {/* Apps — full focus */}
      <div className="flex-1">
        <AppGrid onAppClick={onAppClick} />
      </div>

      {/* Nav dots */}
      <div className="flex justify-center gap-2 mt-6">
        <div className="w-2 h-2 rounded-full bg-gray-500" />
        <div className="w-6 h-2 rounded-full bg-white" />
        <div className="w-2 h-2 rounded-full bg-gray-500" />
      </div>
    </div>
  );
}

export default HomePage;
