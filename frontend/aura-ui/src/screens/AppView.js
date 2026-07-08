import React, { useState } from 'react';
import YouTubeApp from '../apps/YouTubeApp';
import WeatherApp from '../apps/WeatherApp';
import LightsApp from '../apps/LightsApp';
import NewsApp from '../apps/NewsApp';
import RecipeApp from '../apps/RecipeApp';
import TasksApp from '../apps/TasksApp';
import PhotosApp from '../apps/PhotosApp';
import CalendarApp from '../apps/CalendarApp';
import EmailApp from '../apps/EmailApp';
import SettingsApp from '../apps/SettingsApp';
import VisionApp from '../apps/VisionApp';
import MusicApp from '../apps/MusicApp';

function AppView({ appName, spotifyData, onBack }) {
  const [hovered, setHovered] = useState(false);

  const renderApp = () => {
    switch (appName) {
      case 'music':
      case 'spotify':
        return <MusicApp onBack={onBack} />;
      case 'youtube':
        return <YouTubeApp onBack={onBack} />;
      case 'weather':
        return <WeatherApp onBack={onBack} />;
      case 'lights':
        return <LightsApp onBack={onBack} />;
      case 'news':
        return <NewsApp onBack={onBack} />;
      case 'recipe':
        return <RecipeApp onBack={onBack} />;
      case 'tasks':
        return <TasksApp onBack={onBack} />;
      case 'photos':
        return <PhotosApp onBack={onBack} />;
      case 'calendar':
        return <CalendarApp onBack={onBack} />;
      case 'email':
        return <EmailApp onBack={onBack} />;
      case 'settings':
        return <SettingsApp onBack={onBack} />;
      case 'vision':
        return <VisionApp onBack={onBack} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-8">
      {renderApp()}

      {/* Global back control — always present, fits AURA's visual language */}
      <div
        onClick={onBack}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          padding: '28px 32px',
          cursor: 'pointer',
          userSelect: 'none',
          zIndex: 100,
        }}
      >
        <div style={{
          fontSize: '9px',
          letterSpacing: '0.4em',
          color: hovered ? 'rgba(200,169,110,0.55)' : 'rgba(200,169,110,0.2)',
          transition: 'color 0.3s ease',
          whiteSpace: 'nowrap',
        }}>
          ← GO BACK
        </div>
      </div>
    </div>
  );
}

export default AppView;
