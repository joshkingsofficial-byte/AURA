import React from 'react';

function SpotifyApp({ spotifyData }) {
  return (
    <div className="text-white text-center">
      <h2 className="text-4xl font-light mb-8">Spotify</h2>
      
      {spotifyData && spotifyData.playing ? (
        <div className="max-w-2xl mx-auto">
          {spotifyData.album_art && (
            <img
              src={spotifyData.album_art}
              alt="Album art"
              className="w-64 h-64 mx-auto rounded-2xl shadow-2xl mb-6"
            />
          )}
          <h3 className="text-3xl font-bold mb-2">{spotifyData.track}</h3>
          <p className="text-xl text-gray-400 mb-6">{spotifyData.artist}</p>
          <p className="text-lg text-gray-500">{spotifyData.album}</p>
          
          <div className="mt-8 text-6xl">
            {spotifyData.is_playing ? '▶️' : '⏸️'}
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-xl">
          Nothing playing right now
        </div>
      )}
    </div>
  );
}

export default SpotifyApp;
