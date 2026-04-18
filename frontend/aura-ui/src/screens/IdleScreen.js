import React from 'react';

function IdleScreen({ isListening, isThinking, transcript, reply, spotifyData }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050508]">
      {/* OG gradient core */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[28rem] h-[28rem] rounded-full bg-purple-500/20 blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* AURA */}
        <div className="text-white/90 tracking-[0.35em] font-light text-5xl md:text-6xl lg:text-7xl mb-10">
          AURA
        </div>

        {/* Time/Date */}
        <div className="text-white font-extralight text-6xl md:text-7xl lg:text-8xl leading-none mb-4">
          {timeStr}
        </div>
        <div className="text-gray-300 text-xl md:text-2xl mb-8">
          {dateStr}
        </div>

        {/* Status */}
        {isListening && (
          <div className="text-purple-300 text-lg md:text-xl animate-pulse mb-3">
            Listening...
          </div>
        )}
        {isThinking && (
          <div className="text-blue-300 text-lg md:text-xl animate-pulse mb-3">
            Thinking...
          </div>
        )}

        {/* Transcript & Reply */}
        {transcript && !isThinking && (
          <div className="text-gray-300 text-base md:text-lg max-w-2xl mb-2">
            You: "{transcript}"
          </div>
        )}
        {reply && (
          <div className="text-white text-base md:text-lg max-w-2xl mb-6">
            {reply}
          </div>
        )}

        {/* Mini Spotify: OG glass, minimal */}
        {spotifyData && (spotifyData.playing || spotifyData.is_playing) && !isListening && !transcript && (
          <div className="mt-6 glass max-w-md w-full mx-auto rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-4">
              {spotifyData.album_art && (
                <img
                  src={spotifyData.album_art}
                  alt="Album art"
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="text-left min-w-0 flex-1">
                <div className="text-white font-medium text-sm truncate">
                  {spotifyData.track}
                </div>
                <div className="text-gray-400 text-xs truncate">
                  {spotifyData.artist}
                </div>
              </div>
              <div className="text-green-400 text-xl shrink-0">
                {spotifyData.is_playing ? '▶' : '⏸'}
              </div>
            </div>
          </div>
        )}

        {/* Hint */}
        {!isListening && !transcript && (
          <div className="text-gray-400/80 text-sm mt-12">
            Say "Computer" to begin
          </div>
        )}
      </div>

      {/* Screen indicator dots (Idle highlighted) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="w-6 h-2 rounded-full bg-white" />
        <div className="w-2 h-2 rounded-full bg-gray-500" />
        <div className="w-2 h-2 rounded-full bg-gray-500" />
      </div>
    </div>
  );
}

export default IdleScreen;
