/**
 * Archived UI prototype (mock data only). Not bundled.
 * Canonical wired Spotify UI: src/components/widgets/FloatingSpotifyWidget.jsx
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Search,
  ChevronLeft,
  Disc,
  Library,
  Maximize2,
} from 'lucide-react';

// --- Mock Data --- (hex in prototype data only)
const PLAYLISTS = [
  { id: 'daily', title: 'Daily Mix 1', desc: 'Made for you', color: '#1DB954', img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80' },
  { id: 'synth', title: 'Synthwave Night', desc: 'Retro vibes', color: '#FF00CC', img: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&q=80' },
  { id: 'focus', title: 'Deep Focus', desc: 'Ambient beats', color: '#34ACE0', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80' },
  { id: 'rock', title: 'Solid Rock', desc: 'Classic anthems', color: '#F1C40F', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&q=80' },
];

const SONGS = [
  { id: 1, title: 'Super Mario Beats', artist: 'Koji Kondo Remix', duration: '2:45', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80' },
  { id: 2, title: 'Neon Jungle', artist: 'Cyber-Phonk', duration: '3:12', img: 'https://images.unsplash.com/photo-1506466010722-395aa2bef877?w=800&q=80' },
  { id: 3, title: 'The Last Star', artist: 'Orbital Voyager', duration: '4:01', img: 'https://images.unsplash.com/photo-1464802686167-b939a67e06a1?w=800&q=80' },
  { id: 4, title: 'Midnight City', artist: 'M83', duration: '4:03', img: 'https://images.unsplash.com/photo-1514525253344-a8135a43cf3e?w=800&q=80' },
];

const SongRow = ({ song, isPlaying, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02, x: 8 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex w-full items-center gap-4 rounded-[2rem] border-4 p-4 transition-all ${
      isPlaying
        ? 'border-[#1DB954] bg-[#1DB954] text-black shadow-[0_15px_30px_rgba(29,185,84,0.3)]'
        : 'border-white/5 bg-white/5 text-white hover:border-white/10 hover:bg-white/10'
    }`}
  >
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-white/10 shadow-lg sm:h-14 sm:w-14">
      <img src={song.img} className="h-full w-full object-cover" alt="" />
    </div>
    <div className="min-w-0 flex-1 overflow-hidden text-left">
      <h4 className="truncate text-sm font-black uppercase italic tracking-tight">{song.title}</h4>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${isPlaying ? 'text-black/60' : 'text-white/40'}`}>{song.artist}</p>
    </div>
    <span className={`text-[11px] font-black ${isPlaying ? 'text-black/60' : 'text-white/20'}`}>{song.duration}</span>
  </motion.button>
);

const App = () => {
  const [view, setView] = useState('player');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(SONGS[0]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const progress = 42;
  const [searchQuery, setSearchQuery] = useState('');

  const [dimensions, setDimensions] = useState({ width: 480, height: 720 });

  const filteredSongs = useMemo(() => {
    return SONGS.filter(
      (song) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handlePlaylistClick = (pl) => {
    setSelectedPlaylist(pl);
    setView('playlist');
  };

  const isSquare = dimensions.width / dimensions.height > 1.1;
  const isTooShort = dimensions.height < 600;

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[#000] p-2 font-sans text-white sm:p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute left-[-10%] top-[-10%] h-[70vw] w-[70vw] rounded-full opacity-20 blur-[120px]"
          style={{ backgroundColor: isPlaying ? '#1DB954' : '#333' }}
        />
      </div>

      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          minWidth: 400,
          minHeight: 500,
          maxWidth: '95vw',
          maxHeight: '95vh',
        }}
        className="relative flex flex-col overflow-hidden rounded-[3.5rem] border-8 border-[#1a1a1a] bg-[#121212] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]"
      >
        <div className="z-10 flex shrink-0 items-center justify-between p-6 pb-2 sm:p-8">
          <div className="flex items-center gap-4">
            {view !== 'player' && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setView(view === 'playlist' ? 'library' : 'player')}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-white/5 bg-white/5 hover:bg-white/10 sm:h-12 sm:w-12"
              >
                <ChevronLeft size={20} />
              </motion.button>
            )}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1DB954] text-black shadow-lg shadow-green-500/20 sm:h-10 sm:w-10">
                <Music size={18} strokeWidth={3} />
              </div>
              <span className="hidden text-lg font-black uppercase italic tracking-tighter sm:inline sm:text-xl">
                SoundQuest
              </span>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setView('library')}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-all sm:h-12 sm:w-12 ${
                view === 'library'
                  ? 'border-[#1DB954] bg-[#1DB954] text-black'
                  : 'border-white/5 bg-white/5 text-white'
              }`}
            >
              <Library size={18} />
            </button>
            <div className="group relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (view === 'player') setView('library');
                }}
                className={`h-10 rounded-2xl border-2 border-white/5 bg-white/5 pl-10 pr-4 text-[10px] font-black uppercase italic outline-none transition-all duration-500 focus:border-[#1DB954] sm:h-12 sm:pl-12 ${
                  searchQuery ? 'w-32 sm:w-48' : 'w-10 group-hover:w-32 sm:w-12 sm:group-hover:w-48'
                }`}
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-[#1DB954] sm:left-4"
                size={16}
              />
            </div>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col overflow-hidden px-6 pb-10 sm:px-10">
          <AnimatePresence mode="wait">
            {view === 'player' && (
              <motion.div
                key="player"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className={`flex h-full w-full items-center justify-center gap-6 py-4 sm:gap-10 ${isSquare ? 'flex-row' : 'flex-col'}`}
              >
                <div
                  className={`relative flex shrink items-center justify-center ${isSquare ? 'aspect-square h-[70%]' : 'aspect-square w-full max-w-[400px]'}`}
                >
                  <motion.div
                    layoutId="artwork"
                    className="relative h-full w-full overflow-hidden rounded-[3rem] border-4 border-white/10 shadow-2xl"
                  >
                    <img src={currentSong.img} className="h-full w-full object-cover" alt="" />
                    {isPlaying && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                        className="absolute -right-12 top-1/2 z-[-1] h-3/4 w-3/4 -translate-y-1/2 rounded-full border-[12px] border-[#1a1a1a] bg-black opacity-30 shadow-2xl"
                      >
                        <Disc size="100%" />
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                <div className={`shrink-0 ${isSquare ? 'max-w-[400px] flex-1' : 'w-full max-w-[450px] text-center'}`}>
                  <h2
                    className={`mb-1 truncate font-black uppercase italic leading-tight tracking-tighter ${isTooShort ? 'text-2xl' : 'text-3xl sm:text-5xl'}`}
                  >
                    {currentSong.title}
                  </h2>
                  <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#1DB954] sm:mb-8 sm:text-xs">
                    {currentSong.artist}
                  </p>

                  <div className="relative mb-6 h-2 overflow-hidden rounded-full bg-white/5 sm:mb-8">
                    <div className="absolute left-0 h-full rounded-full bg-[#1DB954]" style={{ width: `${progress}%` }} />
                  </div>

                  <div className={`flex items-center gap-6 sm:gap-10 ${isSquare ? 'justify-start' : 'justify-center'}`}>
                    <button type="button" className="text-white/40 transition-colors hover:text-white">
                      <SkipBack size={isTooShort ? 24 : 36} fill="currentColor" />
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.1, y: -5 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`flex items-center justify-center rounded-[2rem] border-b-8 border-slate-300 bg-white text-black shadow-xl sm:rounded-[3rem] ${isTooShort ? 'h-16 w-16' : 'h-20 w-20 sm:h-28 sm:w-28'}`}
                    >
                      {isPlaying ? (
                        <Pause size={isTooShort ? 32 : 44} fill="currentColor" />
                      ) : (
                        <Play size={isTooShort ? 32 : 44} className="ml-1.5" fill="currentColor" />
                      )}
                    </motion.button>
                    <button type="button" className="text-white/40 transition-colors hover:text-white">
                      <SkipForward size={isTooShort ? 24 : 36} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {(view === 'library' || view === 'playlist') && (
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="custom-scrollbar flex-1 overflow-y-auto pt-4"
              >
                {view === 'library' ? (
                  <div className="space-y-10 sm:space-y-12">
                    <header>
                      <h3 className="text-4xl font-black uppercase italic tracking-tighter sm:text-5xl">
                        {searchQuery ? 'Results' : 'Library'}
                      </h3>
                    </header>

                    {!searchQuery && (
                      <div className={`grid gap-4 sm:gap-6 ${dimensions.width > 700 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        {PLAYLISTS.map((pl) => (
                          <motion.button
                            key={pl.id}
                            whileHover={{ scale: 1.05, y: -5 }}
                            type="button"
                            onClick={() => handlePlaylistClick(pl)}
                            className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-4 border-white/5 bg-white/5 p-4 text-left shadow-lg sm:rounded-[2.5rem] sm:p-6"
                          >
                            <img src={pl.img} className="absolute inset-0 h-full w-full object-cover opacity-40" alt="" />
                            <div className="relative z-10 flex h-full flex-col justify-end">
                              <h4 className="text-sm font-black uppercase italic leading-tight sm:text-lg">{pl.title}</h4>
                              <p className="text-[8px] font-bold uppercase tracking-widest text-white/40 sm:text-[9px]">{pl.desc}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1DB954] sm:text-[11px]">
                        {searchQuery ? `Found ${filteredSongs.length} Tracks` : 'Recently Played'}
                      </div>
                      <div className={`grid gap-3 ${dimensions.width > 750 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {filteredSongs.length > 0 ? (
                          filteredSongs.map((song) => (
                            <SongRow
                              key={song.id}
                              song={song}
                              isPlaying={currentSong.id === song.id}
                              onClick={() => {
                                setCurrentSong(song);
                                setIsPlaying(true);
                                setView('player');
                              }}
                            />
                          ))
                        ) : (
                          <div className="col-span-full w-full py-20 text-center font-black uppercase italic tracking-widest text-white/20">
                            No Matches Found
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div
                      className={`relative flex items-end overflow-hidden rounded-[3rem] border-8 border-white/5 p-6 shadow-2xl sm:p-10 ${dimensions.height < 600 ? 'h-40' : 'h-64'}`}
                    >
                      <img src={selectedPlaylist.img} className="absolute inset-0 h-full w-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent" />
                      <h3 className="relative z-10 text-3xl font-black uppercase italic tracking-tighter sm:text-5xl">
                        {selectedPlaylist.title}
                      </h3>
                    </div>
                    <div className={`grid gap-3 ${dimensions.width > 750 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {SONGS.map((song) => (
                        <SongRow
                          key={song.id}
                          song={song}
                          isPlaying={currentSong.id === song.id}
                          onClick={() => {
                            setCurrentSong(song);
                            setIsPlaying(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {view !== 'player' && (
            <motion.div
              initial={{ y: 120 }}
              animate={{ y: 0 }}
              exit={{ y: 120 }}
              role="button"
              tabIndex={0}
              onClick={() => setView('player')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setView('player');
              }}
              className="absolute bottom-6 left-6 right-6 z-50 flex cursor-pointer items-center gap-4 rounded-[2.5rem] border-4 border-white/10 bg-[#1a1a1a]/95 p-3 shadow-2xl backdrop-blur-xl sm:bottom-8 sm:left-8 sm:right-8 sm:p-4"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-white/10 sm:h-14 sm:w-14">
                <img src={currentSong.img} className="h-full w-full object-cover" alt="" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h5 className="truncate text-[10px] font-black uppercase italic sm:text-xs">{currentSong.title}</h5>
                <p className="truncate text-[8px] font-bold uppercase tracking-[0.2em] text-[#1DB954] sm:text-[9px]">
                  {currentSong.artist}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-black shadow-md sm:h-12 sm:w-12"
              >
                {isPlaying ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} className="ml-1" fill="currentColor" />
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0}
          onDrag={(e, info) => {
            setDimensions({
              width: Math.max(400, dimensions.width + info.delta.x),
              height: Math.max(500, dimensions.height + info.delta.y),
            });
          }}
          className="absolute bottom-4 right-4 z-[100] flex h-10 w-10 cursor-nwse-resize items-center justify-center rounded-2xl bg-white/10 text-white/40 shadow-lg transition-colors hover:bg-[#1DB954] hover:text-black"
        >
          <Maximize2 size={18} rotate={45} />
        </motion.div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default App;
