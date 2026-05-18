import React from 'react';
import AppCard from './AppCard';

export const APPS = [
  { id: 'spotify',  name: 'Spotify',  icon: '🎵', color: 'from-green-500 to-green-700' },
  { id: 'youtube',  name: 'YouTube',  icon: '📺', color: 'from-red-500 to-red-700' },
  { id: 'lights',   name: 'Lights',   icon: '💡', color: 'from-yellow-500 to-orange-500' },
  { id: 'weather',  name: 'Weather',  icon: '🌤️', color: 'from-blue-400 to-blue-600' },
  { id: 'recipe',   name: 'Recipes',  icon: '🍳', color: 'from-pink-500 to-rose-600' },
  { id: 'news',     name: 'News',     icon: '📰', color: 'from-gray-600 to-gray-800' },
  { id: 'notes',    name: 'Notes',    icon: '✅', color: 'from-indigo-500 to-purple-600' },
  { id: 'timer',    name: 'Timer',    icon: '⏰', color: 'from-teal-500 to-cyan-600' },
  { id: 'photos',   name: 'Photos',   icon: '📸', color: 'from-purple-500 to-pink-500' },
  { id: 'memory',   name: 'Memory',   icon: '💭', color: 'from-violet-500 to-purple-700' },
  { id: 'calendar', name: 'Calendar', icon: '📅', color: 'from-blue-500 to-indigo-600' },
  { id: 'email',    name: 'Email',    icon: '✉️', color: 'from-sky-500 to-blue-600' },
  { id: 'settings', name: 'Settings', icon: '⚙️', color: 'from-gray-500 to-gray-700' },
  { id: 'vision',   name: 'Vision',   icon: '👁', color: 'from-amber-500 to-yellow-600' },
];

function AppGrid({ onAppClick, selectedAppIndex, selectionMode }) {
  return (
    <div>
      <h3 className="text-white text-xl font-light mb-4">Apps</h3>
      <div className="grid grid-cols-4 gap-4">
        {APPS.map((app, index) => (
          <AppCard
            key={app.id}
            app={app}
            onClick={() => onAppClick(app.id)}
            isSelected={selectionMode && selectedAppIndex === index}
          />
        ))}
      </div>
    </div>
  );
}

export default AppGrid;
