/* Non-imported DLS sandbox reference (lucide-react + framer-motion). See src/design/weeMotion.js and src/ui/wee/. */
import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Home, Gamepad2, Sparkles, X, Plus, 
  ChevronRight, Shield, Globe, RefreshCw, Film, Upload, 
  Check, Trash2, Image as ImageIcon, Volume2, Play, 
  Terminal, Wand2, Info, Search, Settings, Cpu, MousePointer2,
  AlertCircle, HardDrive, ExternalLink, Zap, ChevronLeft, 
  ChevronRight as ChevronRightIcon, Layers, Monitor, 
  MousePointer, Bell, PlayCircle, Minimize2, Maximize2, Music
} from 'lucide-react';

/**
 * ============================================================================
 * DESIGN LANGUAGE SYSTEM (DLS) DOCUMENTATION
 * ============================================================================
 * * 1. TYPOGRAPHY:
 * - Main Headers: 'font-black uppercase italic tracking-tighter'
 * - Action Buttons: 'font-black uppercase italic tracking-widest text-[11px]'
 * - Labels: 'text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]'
 * * 2. SPACING & SHAPE:
 * - Container Radius: 'rounded-[4rem]' (Extra large for premium feel)
 * - Inner Blocks: 'rounded-[3rem]'
 * - Button Radius: 'rounded-2xl' or 'rounded-full'
 * - Padding: Standardized at p-10 (40px) or p-12 (48px) for content surfaces.
 * * 3. COLOR PALETTE:
 * - Primary Surface: White (#FFFFFF)
 * - Background Surface: Ghost White (#FDFDFF)
 * - Border Stroke: Slate-50 or Slate-100 (2px - 4px thickness)
 * - Accents: Blue-500 (Primary), Amber-500 (Discovery), Slate-900 (Text/Heavy Buttons)
 * * 4. MOTION & ANIMATION:
 * - Transitions: 0.3s duration with 'easeInOut' or 'spring' for scale.
 * - Hover Effects: scale-105 for primary actions, active:scale-95 for feedback.
 * - Page Transitions: Y-axis offset (10px to 40px) with opacity 0 -> 1.
 * * 5. DEPTH & SHADOWS:
 * - Soft depth: shadow-xl shadow-slate-200/50
 * - Extreme depth (Modals): shadow-2xl with backdrop-blur-xl
 * ============================================================================
 */

const SPACES = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard', color: '#FF4D4D', bg: '#FFF5F5' },
  { id: 'home', icon: Home, label: 'Home', color: '#34ACE0', bg: '#F0F9FF' },
  { id: 'games', icon: Gamepad2, label: 'Games', color: '#33D9B2', bg: '#F0FFF4' },
  { id: 'system', icon: Cpu, label: 'System', color: '#8E44AD', bg: '#F5F0FF' },
];

const MOCK_LIBRARY = [
  { id: 'lib1', title: 'Stremio', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&q=80' },
  { id: 'lib2', title: 'Halo Infinite', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&q=80' },
  { id: 'lib3', title: 'Cursor', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=200&q=80' },
  { id: 'lib4', title: 'Adobe Premiere', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=200&q=80' },
  { id: 'lib5', title: 'Palworld', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=200&q=80' },
  { id: 'lib6', title: 'Wilds', type: 'GIF', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqejR4N3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3ZSZSZmcmFtZXM9MQ/3o7TKMGpxx6B3DhXVK/giphy.gif' },
];

const MOCK_SUGGESTIONS = [
  { id: 's1', name: 'Cyberpunk 2077', source: 'Steam', path: 'steam://rungameid/1091500', icon: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=100&q=80' },
  { id: 's2', name: 'Alan Wake 2', source: 'Epic', path: 'epic://launcher/apps/AW2', icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80' },
  { id: 's3', name: 'Photoshop', source: 'Local', path: 'C:/Adobe/PS.exe', icon: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=100&q=80' },
];

// --- Shared Elements ---

const ModalButton = ({ children, onClick, variant = 'primary', disabled = false }) => {
  const themes = {
    primary: 'bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-200',
    secondary: 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-2 border-slate-200',
    danger: 'text-red-500 hover:text-red-600 hover:bg-red-50 border-2 border-transparent',
  };
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:grayscale ${themes[variant]}`}
    >
      {children}
    </button>
  );
};

const Toggle = ({ active, onToggle }) => (
  <button onClick={onToggle} className={`w-12 h-7 rounded-full transition-all relative ${active ? 'bg-blue-500' : 'bg-slate-200'}`}>
    <m.div animate={{ x: active ? 20 : 4 }} className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm" />
  </button>
);

const SectionHeader = ({ icon: Icon, title, colorClass = "text-blue-500" }) => (
  <div className="flex items-center gap-4 mb-6">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-lg border border-slate-50 ${colorClass}`}>
      <Icon size={20} />
    </div>
    <h5 className="font-black uppercase italic text-sm text-slate-800">{title}</h5>
  </div>
);

// --- The Advanced Channel Config Modal ---

const ChannelConfigModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('setup');
  const [artMode, setArtMode] = useState('library');
  const [scanning, setScanning] = useState(false);
  
  // Behavior Settings State
  const [config, setConfig] = useState({
    name: 'Cursor',
    path: 'C:\\Users\\dev\\AppData\\Local\\Programs\\cursor\\Cursor.exe',
    type: 'app',
    platform: 'All',
    artSource: { title: 'Cursor', url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=100&q=80' },
    asAdmin: false,
    hoverSound: 'Wii Hover 1',
    animationMode: 'global',
    kenBurns: true,
    soundActive: true,
    preventMulti: true,
    autoFocus: true,
    minimizeToTray: false,
  });

  const isConfigured = config.path && config.artSource;

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] p-6">
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl" />
          
          <m.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative w-full max-w-7xl h-[88vh] bg-white rounded-[4rem] shadow-2xl flex overflow-hidden border-8 border-white"
          >
            {/* Side Rail Navigation */}
            <div className="w-80 bg-slate-50 border-r-4 border-white p-10 flex flex-col gap-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
                  <Zap size={24} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic leading-none">Config</h2>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">v3.0 Engine</span>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <p className="px-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Make Channel</p>
                  {[
                    { id: 'setup', label: 'Channel Setup', icon: MousePointer2, desc: 'Path & Creative' },
                    { id: 'behavior', label: 'Behavior', icon: Settings, desc: 'Runtime Logic' },
                  ].map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setActiveTab(t.id)}
                      className={`w-full flex items-center gap-5 p-5 rounded-[2rem] transition-all text-left group ${activeTab === t.id ? 'bg-white shadow-xl shadow-slate-200/50 text-slate-900' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                      <t.icon size={22} className={activeTab === t.id ? 'text-blue-500' : 'group-hover:text-slate-600'} />
                      <div>
                        <p className="font-black uppercase italic text-[11px] tracking-widest leading-none mb-1">{t.label}</p>
                        <p className="text-[9px] font-bold opacity-60 uppercase">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="px-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Discovery</p>
                  {[
                    { id: 'suggested', label: 'Suggested', icon: Sparkles, desc: 'Auto-detected' },
                  ].map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setActiveTab(t.id)}
                      className={`w-full flex items-center gap-5 p-5 rounded-[2rem] transition-all text-left group ${activeTab === t.id ? 'bg-white shadow-xl shadow-slate-200/50 text-slate-900' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                      <t.icon size={22} className={activeTab === t.id ? 'text-amber-500' : 'group-hover:text-slate-600'} />
                      <div>
                        <p className="font-black uppercase italic text-[11px] tracking-widest leading-none mb-1">{t.label}</p>
                        <p className="text-[9px] font-bold opacity-60 uppercase">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto p-6 bg-white rounded-[2.5rem] border-2 border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isConfigured ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Status: {isConfigured ? 'Ready' : 'Incomplete'}</span>
                </div>
              </div>
            </div>

            {/* Content Surface */}
            <div className="flex-1 flex flex-col bg-white">
              <div className="px-12 py-8 flex justify-between items-center border-b-2 border-slate-50">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800">
                  {activeTab === 'setup' && 'Channel Setup'}
                  {activeTab === 'behavior' && 'Runtime Logic'}
                  {activeTab === 'suggested' && 'System Discovery'}
                </h3>
                <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full text-slate-300 transition-colors"><X size={24} /></button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#FDFDFF]">
                
                {/* --- TAB: SETUP --- */}
                {activeTab === 'setup' && (
                  <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
                    <div className="space-y-8">
                       <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Launch Target</h4>
                          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                             {['app', 'website'].map(t => (
                               <button 
                                 key={t} 
                                 onClick={() => setConfig({...config, type: t})}
                                 className={`px-8 py-2 text-[10px] font-black uppercase italic rounded-xl transition-all ${config.type === t ? 'bg-white shadow-lg text-slate-900' : 'text-slate-400'}`}
                               >
                                 {t}
                               </button>
                             ))}
                          </div>
                       </div>

                       <div className="grid grid-cols-1 gap-6 bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm">
                          <div className="space-y-4">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-slate-400">Display Name</span>
                                <div className="flex gap-2">
                                   {['All', 'Steam', 'Epic', 'Store'].map(p => (
                                     <button key={p} className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black uppercase text-slate-400 border border-slate-100 hover:text-blue-500 transition-colors">{p}</button>
                                   ))}
                                </div>
                             </div>
                             <div className="relative">
                               <input 
                                 type="text" 
                                 value={config.name}
                                 onChange={(e) => setConfig({...config, name: e.target.value})}
                                 className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-black italic text-slate-700 outline-none focus:border-blue-200 transition-all text-lg"
                               />
                               <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                             </div>
                          </div>

                          <div className="space-y-4">
                             <span className="text-[10px] font-black uppercase text-slate-400">Target Path</span>
                             <div className="flex gap-4">
                               <input 
                                 type="text" 
                                 value={config.path}
                                 readOnly
                                 className="flex-1 bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-bold text-slate-400 text-sm truncate"
                               />
                               <button className="px-8 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl">Browse</button>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Channel Art</h4>
                       {config.artSource ? (
                         <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 flex items-center justify-between shadow-sm group">
                            <div className="flex items-center gap-8">
                               <div className="relative w-32 h-20 rounded-2xl overflow-hidden shadow-2xl border-4 border-white rotate-[-2deg]">
                                  <img src={config.artSource.url} className="w-full h-full object-cover" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black uppercase text-blue-500 mb-1">Active Asset</p>
                                  <p className="text-2xl font-black uppercase italic text-slate-800">{config.artSource.title}</p>
                               </div>
                            </div>
                            <button 
                              onClick={() => setConfig({...config, artSource: null})}
                              className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase italic text-[11px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200"
                            >
                              Change Channel Art
                            </button>
                         </div>
                       ) : (
                         <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-10">
                            <div className="flex bg-slate-50 p-2 rounded-[2rem]">
                               <button onClick={() => setArtMode('library')} className={`flex-1 py-4 font-black uppercase italic text-[11px] tracking-widest rounded-[1.5rem] transition-all ${artMode === 'library' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Media Library</button>
                               <button onClick={() => setArtMode('upload')} className={`flex-1 py-4 font-black uppercase italic text-[11px] tracking-widest rounded-[1.5rem] transition-all ${artMode === 'upload' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Upload Asset</button>
                            </div>
                            
                            {artMode === 'library' ? (
                               <div className="grid grid-cols-4 gap-6">
                                 {MOCK_LIBRARY.map(item => (
                                   <button key={item.id} onClick={() => setConfig({...config, artSource: item})} className="group relative aspect-[16/9] rounded-2xl overflow-hidden border-4 border-transparent hover:border-blue-500 transition-all shadow-lg hover:-translate-y-2 duration-300">
                                     <img src={item.url} className="w-full h-full object-cover" />
                                   </button>
                                 ))}
                               </div>
                            ) : (
                              <div className="h-80 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center group hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer">
                                 <Upload size={32} className="text-slate-300 mb-6" />
                                 <p className="font-black uppercase italic text-lg text-slate-400">Drop files or Browse</p>
                              </div>
                            )}
                         </div>
                       )}
                    </div>
                  </m.div>
                )}

                {/* --- TAB: BEHAVIOR --- */}
                {activeTab === 'behavior' && (
                  <m.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12 max-w-4xl">
                    <section className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-300">Privileges & Audio</h4>
                       <div className="grid grid-cols-2 gap-8">
                          <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm group hover:border-blue-100 transition-all">
                             <SectionHeader icon={Shield} title="Privileges" colorClass="text-blue-500" />
                             <div className="flex justify-between items-center gap-6">
                               <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed max-w-[70%]">Run this channel with Administrator access levels.</p>
                               <Toggle active={config.asAdmin} onToggle={() => setConfig({...config, asAdmin: !config.asAdmin})} />
                             </div>
                          </div>
                          
                          <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm group hover:border-amber-100 transition-all">
                             <SectionHeader icon={Volume2} title="Audio focus" colorClass="text-amber-500" />
                             <div className="flex justify-between items-center gap-6">
                               <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed max-w-[70%]">Play assigned channel sound effects when focused.</p>
                               <Toggle active={config.soundActive} onToggle={() => setConfig({...config, soundActive: !config.soundActive})} />
                             </div>
                          </div>
                       </div>
                       
                       {config.soundActive && (
                         <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 grid grid-cols-2 gap-4">
                            {['Wii Hover 1', 'Dearly Beloved'].map(s => (
                              <button 
                                key={s} 
                                onClick={() => setConfig({...config, hoverSound: s})}
                                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${config.hoverSound === s ? 'border-blue-400 bg-white shadow-md' : 'border-white bg-white/50 hover:bg-white'}`}
                              >
                                 <div className="flex items-center gap-3">
                                    <Music size={16} className={config.hoverSound === s ? 'text-blue-500' : 'text-slate-300'} />
                                    <span className={`font-black uppercase italic text-[10px] ${config.hoverSound === s ? 'text-slate-900' : 'text-slate-400'}`}>{s}</span>
                                 </div>
                                 <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-300"><Play size={10} fill="currentColor" /></div>
                              </button>
                            ))}
                            <button className="col-span-2 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-[10px] tracking-widest hover:bg-black transition-colors">Upload New Sound</button>
                         </m.div>
                       )}
                    </section>

                    <section className="bg-white p-12 rounded-[4rem] border-2 border-slate-100 shadow-sm space-y-10">
                      <SectionHeader icon={Terminal} title="System Logic" colorClass="text-slate-700" />
                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { id: 'preventMulti', icon: Layers, label: 'Single Instance Only', desc: 'Prevent multiple windows of the same application from launching simultaneously.', active: config.preventMulti },
                          { id: 'autoFocus', icon: MousePointer, label: 'Force Focus on Launch', desc: 'Automatically bring application to the foreground when executed from dashboard.', active: config.autoFocus },
                          { id: 'minimizeToTray', icon: Minimize2, label: 'Minimize to System Tray', desc: 'Keep process active in the background tray instead of closing completely.', active: config.minimizeToTray },
                        ].map(item => (
                          <div key={item.id} className="flex items-center justify-between p-8 bg-slate-50/50 rounded-[2.5rem] border-2 border-transparent hover:border-slate-100 transition-all group">
                            <div className="flex items-center gap-8">
                               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 shadow-sm transition-all">
                                  <item.icon size={24} />
                               </div>
                               <div>
                                  <p className="font-black uppercase italic text-sm text-slate-800 mb-1">{item.label}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase max-w-md leading-relaxed">{item.desc}</p>
                               </div>
                            </div>
                            <Toggle active={item.active} onToggle={() => setConfig({...config, [item.id]: !item.active})} />
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-300">Animation Strategy</h4>
                       <div className="bg-white p-12 rounded-[4rem] border-2 border-slate-100 shadow-sm space-y-10">
                          <SectionHeader icon={Film} title="Motion Architecture" colorClass="text-purple-500" />
                          <div className="grid grid-cols-3 gap-8">
                             {['global', 'hover', 'always'].map((motionMode) => (
                               <button 
                                 key={motionMode} 
                                 onClick={() => setConfig({...config, motion: motionMode})}
                                 className={`p-10 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-6 group ${config.motion === motionMode ? 'border-blue-500 bg-blue-50' : 'border-slate-50 hover:border-slate-100'}`}
                               >
                                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${config.motion === motionMode ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-300 group-hover:text-slate-400'}`}>
                                     <PlayCircle size={32} />
                                  </div>
                                  <div className="text-center">
                                     <p className={`font-black uppercase italic text-sm ${config.motion === motionMode ? 'text-blue-500' : 'text-slate-800'}`}>{motionMode} Play</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Runtime Sync</p>
                                  </div>
                               </button>
                             ))}
                          </div>
                       </div>
                    </section>

                    <section className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-300">Post-Processing</h4>
                       <div className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-100 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-6">
                             <div className={`p-5 rounded-3xl transition-all ${config.kenBurns ? 'bg-purple-500 text-white shadow-xl shadow-purple-200' : 'bg-slate-100 text-slate-300'}`}>
                                <Maximize2 size={32} />
                             </div>
                             <div>
                                <p className="font-black uppercase italic text-xl text-slate-800 tracking-tighter leading-none mb-1">Ken Burns Movement</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase max-w-sm">Adds cinematic slow-zoom and pan movement to static channel backgrounds.</p>
                             </div>
                          </div>
                          <Toggle active={config.kenBurns} onToggle={() => setConfig({...config, kenBurns: !config.kenBurns})} />
                       </div>
                    </section>
                  </m.div>
                )}

                {/* --- TAB: SUGGESTED --- */}
                {activeTab === 'suggested' && (
                  <m.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10 max-w-4xl">
                    <div className="flex justify-between items-center bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl">
                       <div className="space-y-2">
                          <h4 className="text-2xl font-black uppercase italic tracking-tighter">Ready to Scan</h4>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Detecting installed apps, Steam games, and browser history</p>
                       </div>
                       <button onClick={handleScan} className="flex items-center gap-4 px-10 py-5 bg-white text-slate-900 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:scale-105 transition-all shadow-xl">
                         <RefreshCw size={20} className={scanning ? 'animate-spin' : ''} />
                         {scanning ? 'Searching...' : 'Search System'}
                       </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                       {MOCK_SUGGESTIONS.map(item => (
                         <button key={item.id} className="group flex items-center gap-8 bg-white p-6 rounded-[2.5rem] border-4 border-transparent hover:border-blue-100 shadow-sm hover:shadow-xl transition-all text-left">
                            <img src={item.icon} className="w-24 h-24 rounded-2xl object-cover shadow-lg group-hover:rotate-[-3deg] transition-transform duration-500" />
                            <div className="flex-1">
                               <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-500 tracking-widest border border-slate-100">{item.source}</span>
                               <h5 className="text-2xl font-black uppercase italic text-slate-800 mt-2">{item.name}</h5>
                            </div>
                            <div className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-[11px] hover:bg-blue-500 transition-colors shadow-lg">Configure</div>
                         </button>
                       ))}
                    </div>
                  </m.div>
                )}
                
              </div>

              {/* Bottom Action Bar */}
              <div className="p-10 bg-white border-t-4 border-slate-50 flex justify-between items-center z-10 px-12">
                 <button className="text-red-500 font-black uppercase italic tracking-[0.2em] text-[11px] px-8 py-4 rounded-2xl hover:bg-red-50 transition-all">Clear Metadata</button>
                 <div className="flex gap-5">
                    <ModalButton variant="secondary" onClick={onClose}>Discard</ModalButton>
                    <ModalButton disabled={!isConfigured} onClick={() => {}}>Save Channel</ModalButton>
                 </div>
              </div>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * ============================================================================
 * PLUG-AND-PLAY COMPONENT: GOOEY SPACE PILL (VERTICAL NAV)
 * ============================================================================
 * This component is designed to be highly modular and easy to copy-paste.
 *
 * DESIGN & MOTION RULES:
 * 1. The "Gooey" Physics: Uses Framer Motion's spring physics. 
 * - Stiffness (400): High stiffness gives it that energetic "Nintendo" snap.
 * - Damping (20): Low damping allows it to slightly overshoot (bounce) before settling.
 * 2. Centering & Layout: 
 * - Compact Mode: Absolute positioning (inset-0) + flex-center ensures the active icon is perfectly centered.
 * - Cross-fading: Using a single `AnimatePresence` without `mode="wait"`. This allows the 
 * compact icon to fade out WHILE the expanded list fades in, eliminating any empty gaps or blinking.
 * 3. Consistent Staggering: Every item in the expanded view (including the wand and divider) 
 * uses the exact same `itemVariants` with a dynamic `custom={i}` delay. This ensures a 
 * uniform "waterfall" entrance.
 * 4. Styling (Tailwind): 
 * - Backdrop blur and white/80 background gives it a premium glassmorphic feel.
 * - Active states use LayoutId ("pillActive") for fluid background morphing between clicks.
 * ============================================================================
 */

const GooeySpacePill = ({ activeIdx, onSelect, onConfigOpen }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Nintendo-style bouncy spring physics
  const springConfigOpen = { type: "spring", stiffness: 400, damping: 20, mass: 0.8 };
  const springConfigClose = { type: "spring", stiffness: 300, damping: 25, mass: 1 };

  // Calculate dynamic height: (Number of spaces * icon height) + padding and extra buttons
  const expandedHeight = (SPACES.length * 64) + 120;

  const containerVariants = {
    closed: { height: 80, width: 80, borderRadius: 40, transition: springConfigClose },
    open: { height: expandedHeight, width: 90, borderRadius: 45, transition: springConfigOpen }
  };

  const itemVariants = {
    closed: { opacity: 0, scale: 0.5, y: 15, transition: { duration: 0.1 } },
    open: (i) => ({ opacity: 1, scale: 1, y: 0, transition: { delay: i * 0.04, ...springConfigOpen } })
  };

  const ActiveIcon = SPACES[activeIdx].icon;

  return (
    <div className="fixed left-10 top-1/2 -translate-y-1/2 z-[150] flex flex-col items-center">
      <m.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={isHovered ? "open" : "closed"}
        variants={containerVariants}
        className="bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative z-10 border-4 border-white/50 overflow-hidden"
        style={{ cursor: 'pointer' }}
      >
        {/* CROSS-FADING CONTENT AREA */}
        <AnimatePresence>
          {!isHovered ? (
            /* COMPACT STATE: Perfectly centered active icon */
            <m.div 
              key="compact"
              initial={{ opacity: 0, scale: 0.5 }} 
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.15, type: 'spring' } }} 
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.1 } }}
              className="absolute inset-0 flex items-center justify-center text-slate-900"
            >
              <ActiveIcon size={28} />
            </m.div>
          ) : (
            /* EXPANDED STATE: Full waterfall list */
            <m.div 
              key="expanded" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="absolute inset-0 flex flex-col items-center pt-5 gap-2 w-full"
            >
              {SPACES.map((space, i) => (
                <m.button
                  key={space.id}
                  custom={i}
                  variants={itemVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                  whileTap={{ scale: 0.9, rotate: 0 }}
                  onClick={(e) => { e.stopPropagation(); onSelect(i); setIsHovered(false); }}
                  className="group relative flex items-center justify-center w-14 h-14 rounded-full transition-colors"
                >
                  {/* Fluid selection highlight */}
                  {activeIdx === i && <m.div layoutId="pillActive" className="absolute inset-0 bg-white shadow-md rounded-full z-0" />}
                  
                  <space.icon size={22} className={`relative z-10 ${activeIdx === i ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  
                  {/* Gooey blur effect behind icon on hover */}
                  <m.div 
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                    style={{ backgroundColor: space.color, filter: 'blur(8px)', zIndex: -1 }}
                  />
                  
                  {/* Floating Tooltip */}
                  <div className="absolute left-full ml-4 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all -translate-x-2 group-hover:translate-x-0 shadow-xl whitespace-nowrap z-50">
                    {space.label}
                  </div>
                </m.button>
              ))}
              
              {/* Separator Line */}
              <m.div custom={SPACES.length} variants={itemVariants} initial="closed" animate="open" exit="closed" className="w-8 h-1 bg-slate-200/50 rounded-full my-1" />
              
              {/* Magic Wand Button */}
              <m.button 
                custom={SPACES.length + 1}
                variants={itemVariants}
                initial="closed"
                animate="open"
                exit="closed"
                onClick={(e) => { e.stopPropagation(); onConfigOpen(); setIsHovered(false); }}
                whileHover={{ scale: 1.15, rotate: 12 }}
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl group relative"
              >
                <Wand2 size={22} className="relative z-10" />
                <m.div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-40 bg-blue-500 transition-opacity" style={{ filter: 'blur(8px)', zIndex: 0 }} />
              </m.button>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
      
      {/* Dynamic Floor Shadow for physical depth */}
      <m.div 
        className="absolute -bottom-4 w-12 h-2 bg-black/10 rounded-full blur-sm"
        animate={{ scaleX: isHovered ? 2.5 : 1, opacity: isHovered ? 0.15 : 0.4 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
    </div>
  );
};

// --- App Shell ---

const App = () => {
  const [activeSpaceIdx, setActiveSpaceIdx] = useState(1);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const activeSpace = SPACES[activeSpaceIdx];

  return (
    <div className="min-h-screen flex items-center justify-center transition-colors duration-1000 bg-[#F4F7FF]">
      
      <GooeySpacePill 
        activeIdx={activeSpaceIdx} 
        onSelect={setActiveSpaceIdx} 
        onConfigOpen={() => setIsConfigOpen(true)} 
      />

      <m.div key={activeSpace.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
        <div className="w-48 h-48 rounded-[3.5rem] mb-10 flex items-center justify-center shadow-[0_30px_70px_-15px_rgba(0,0,0,0.1)] bg-white border-4 border-white">
          <activeSpace.icon size={80} color={activeSpace.color} strokeWidth={1.5} />
        </div>
        <h1 className="text-7xl font-black text-slate-900 uppercase italic tracking-tighter text-center leading-none">
          {activeSpace.label}
        </h1>
        <button onClick={() => setIsConfigOpen(true)} className="mt-12 px-12 py-5 bg-white rounded-full font-black uppercase italic tracking-widest text-[11px] shadow-xl hover:scale-105 transition-all flex items-center gap-4 text-slate-800 border border-slate-50">
           Launch Config Engine <ChevronRight size={18} className="text-blue-500" />
        </button>
      </m.div>

      <ChannelConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; border: 4px solid #FDFDFF; }
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
      `}</style>
    </div>
  );
};

export default App;