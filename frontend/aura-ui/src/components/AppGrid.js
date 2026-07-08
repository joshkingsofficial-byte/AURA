import React from 'react';
import AppCard from './AppCard';

export const APPS = [
  { id: 'music',    name: 'Music',    icon: '♪',  color: 'from-pink-500 to-rose-700' },
  { id: 'youtube',  name: 'YouTube',  icon: '📺', color: 'from-red-500 to-red-700' },
  { id: 'lights',   name: 'Lights',   icon: '💡', color: 'from-yellow-500 to-orange-500' },
  { id: 'weather',  name: 'Weather',  icon: '🌤️', color: 'from-blue-400 to-blue-600' },
  { id: 'recipe',   name: 'Recipes',  icon: '🍳', color: 'from-pink-500 to-rose-600' },
  { id: 'news',     name: 'News',     icon: '📰', color: 'from-gray-600 to-gray-800' },
  { id: 'tasks',    name: 'Tasks',    icon: '✅', color: 'from-indigo-500 to-purple-600' },
  { id: 'photos',   name: 'Photos',   icon: '📸', color: 'from-purple-500 to-pink-500' },
  { id: 'calendar', name: 'Calendar', icon: '📅', color: 'from-blue-500 to-indigo-600' },
  { id: 'email',    name: 'Email',    icon: '✉️', color: 'from-sky-500 to-blue-600' },
  { id: 'settings', name: 'Settings', icon: '⚙️', color: 'from-gray-500 to-gray-700' },
  { id: 'vision',   name: 'Vision',   icon: '👁', color: 'from-amber-500 to-yellow-600' },
];

function AppGrid({ onAppClick, selectedAppIndex, selectionMode }) {
  return (
    <div>
      <div style={{ fontSize: '10px', letterSpacing: '0.4em', color: 'rgba(200,169,110,0.5)', marginBottom: '20px', fontWeight: 300 }}>APPS</div>
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
