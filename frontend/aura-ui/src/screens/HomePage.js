import React from 'react';
import CalendarWidget from '../components/CalendarWidget';
import AppGrid from '../components/AppGrid';

function HomePage({ onAppClick }) {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Header */}
      <div className="px-8 pt-8 flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-light">Home</h2>
      </div>

      {/* Body */}
      <div className="p-8 flex flex-col gap-8">
        {/* Calendar in glass */}
        <div className="glass rounded-3xl p-6 border border-white/10">
          <CalendarWidget />
        </div>

        {/* Apps grid */}
        <div className="glass rounded-3xl p-6 border border-white/10">
          <AppGrid onAppClick={onAppClick} />
        </div>
      </div>

      {/* Dots: Home highlighted */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-500" />
        <div className="w-6 h-2 rounded-full bg-white" />
        <div className="w-2 h-2 rounded-full bg-gray-500" />
      </div>
    </div>
  );
}

export default HomePage;
