import React from 'react';
import SpotifyApp from '../apps/SpotifyApp';
import YouTubeApp from '../apps/YouTubeApp';
import WeatherApp from '../apps/WeatherApp';
import LightsApp from '../apps/LightsApp';
import NewsApp from '../apps/NewsApp';
import RecipeApp from '../apps/RecipeApp';
import NotesApp from '../apps/NotesApp';
import MemoryApp from '../apps/MemoryApp';
import TimerApp from '../apps/TimerApp';
import PhotosApp from '../apps/PhotosApp';
import CalendarApp from '../apps/CalendarApp';
import EmailApp from '../apps/EmailApp';
import SettingsApp from '../apps/SettingsApp';

function AppView({ appName, spotifyData, onBack }) {
  
  const renderApp = () => {
    switch (appName) {
      case 'spotify':
        return <SpotifyApp spotifyData={spotifyData} />;
      case 'youtube':
        return <YouTubeApp />;
      case 'weather':
        return <WeatherApp />;
      case 'lights':
        return <LightsApp />;
      case 'news':
        return <NewsApp />;
      case 'recipe':
        return <RecipeApp />;
      case 'notes':
        return <NotesApp />;
      case 'memory':
        return <MemoryApp />;
      case 'timer':
        return <TimerApp />;
      case 'photos':
        return <PhotosApp />;
      case 'calendar':
        return <CalendarApp />;
      case 'email':
        return <EmailApp />;
      case 'settings':
        return <SettingsApp />;
      default:
        return (
          <div className="text-white text-center">
            <h2 className="text-2xl">App not found</h2>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen p-8">
      {renderApp()}
      
      {/* Helper text */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-center text-gray-500 text-sm">
        Say "Computer, go back" to return to home
      </div>
    </div>
  );
}

export default AppView;
