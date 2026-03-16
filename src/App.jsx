import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { Trophy, ChevronUp, CheckCircle2, Activity, Vote, Layers, Search, QrCode } from 'lucide-react';
import fpPromise from '@fingerprintjs/fingerprintjs';
import clsx from 'clsx';
import { QRCodeSVG } from 'qrcode.react';

// --- MAIN APP COMPONENT (ROUTING) ---
export default function App() {
  return (
    <BrowserRouter>
      {/* Enterprise dark background (Zinc-950) - Solid, no blurry neon blobs */}
      <div className="min-h-screen bg-[#09090B] text-zinc-100 font-sans selection:bg-blue-500/30 relative">
        
        {/* Navigation Bar - Structural, subtle bottom border, blurred backing */}
        <nav className="bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col items-center justify-center gap-5">
            
            {/* Logo & Title */}
            <div className="flex items-center gap-3 font-bold text-2xl tracking-tight text-zinc-100">
              <div className="w-10 h-10 rounded-lg text-white bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
                <Layers size={20} strokeWidth={2.5} />
              </div>
              Yukthi Project Expo
            </div>

            {/* Nav Buttons - Segmented Control Style */}
            <NavLinks />
            
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<VotePage />} />
          <Route path="/livestandings" element={<LeaderboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// Separate component for nav links to handle active states smoothly
function NavLinks() {
  const location = useLocation();
  
  // return (
  //   <div className="flex p-1 bg-zinc-900 border border-zinc-800/80 rounded-lg shadow-inner">
  //     <Link 
  //       to="/" 
  //       className={clsx(
  //         "px-6 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all duration-200",
  //         location.pathname === "/" 
  //           ? "bg-[#18181B] text-zinc-100 shadow-sm ring-1 ring-white/5" 
  //           : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
  //       )}
  //     >
  //       <Vote size={18} /> Vote
  //     </Link>
  //     <Link 
  //       to="/livestandings" 
  //       className={clsx(
  //         "px-6 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all duration-200",
  //         location.pathname === "/livestandings" 
  //           ? "bg-[#18181B] text-zinc-100 shadow-sm ring-1 ring-white/5" 
  //           : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
  //       )}
  //     >
  //       <Trophy size={18} /> Standings
  //     </Link>
  //   </div>
  // );
}

// --- PAGE 1: VOTING PAGE (/) ---
function VotePage() {
  const [teams, setTeams] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visitorId, setVisitorId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQrTeam, setActiveQrTeam] = useState(null);
  
  const [searchParams] = useSearchParams();
  const selectedTeam = searchParams.get('team');

  useEffect(() => {
    const initFingerprint = async () => {
      const fp = await fpPromise.load();
      const result = await fp.get();
      setVisitorId(result.visitorId);
      
      const { data } = await supabase
        .from('device_votes')
        .select('fingerprint')
        .eq('fingerprint', result.visitorId)
        .single();
        
      if (data) setHasVoted(true);
    };

    const fetchTeams = async () => {
      const { data } = await supabase.from('teams').select('*').order('department').order('team_number');
      if (data) setTeams(data);
      setLoading(false);
    };

    initFingerprint();
    fetchTeams();
  }, []);

  const handleVote = async (teamId) => {
    if (hasVoted || !visitorId) return;

    setHasVoted(true);
    const { data: success, error } = await supabase.rpc('cast_secure_vote', { 
      p_team_id: teamId,
      p_fingerprint: visitorId
    });
    
    if (error || !success) {
      setHasVoted(false);
      alert("It looks like a vote has already been cast from this device.");
    }
  };

  // FILTER & SORT LOGIC: Filters by search query, then forces the selected team to the top
  const displayTeams = teams
    .filter(team => team.project_title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.registration_number === selectedTeam) return -1;
      if (b.registration_number === selectedTeam) return 1;
      return 0;
    });

  if (loading) return <LoadingScreen />;

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 relative">
      <header className="mb-10 text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100">
          #Cast Your Vote for Yukthi Peoples Choice Award
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-base">
          Support your favorite project at the Yukthi Project Expo. Every vote matters!
        </p>
      </header>

      {/* Search Bar */}
      <div className="mb-10 max-w-md mx-auto relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search size={18} className="text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search projects by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[#121214] border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-sm"
        />
      </div>

      {hasVoted && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-10 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center gap-3 text-emerald-400 font-medium max-w-2xl mx-auto"
        >
          <CheckCircle2 size={20} className="text-emerald-500" />
          Your vote has been securely recorded.
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayTeams.map((team) => {
          const isTargeted = team.registration_number === selectedTeam;

          return (
            <div
              key={team.id}
              className={clsx(
                "group relative overflow-hidden p-6 rounded-xl border bg-[#121214] flex flex-col h-full transition-colors duration-200",
                isTargeted && !hasVoted 
                  ? "border-blue-500/50 ring-1 ring-blue-500/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]" 
                  : "border-zinc-800 hover:border-zinc-700"
              )}
            >
              {isTargeted && !hasVoted && (
                <div className="absolute top-0 inset-x-0 h-1 bg-blue-600" />
              )}
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-zinc-800/80 text-zinc-300 uppercase tracking-wide border border-zinc-700/50">
                      {team.registration_number}
                    </span>
                    <span className="text-sm text-zinc-500 font-mono">
                      #{team.department}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => setActiveQrTeam(team)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
                    title="Show Voting QR Code"
                  >
                    <QrCode size={18} />
                  </button>
                </div>
                
                <h3 className="font-semibold text-lg text-zinc-100 leading-snug">
                  {team.project_title}
                </h3>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-800/60">
                <button
                  onClick={() => handleVote(team.id)}
                  disabled={hasVoted}
                  className={clsx(
                    "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors duration-200",
                    hasVoted
                      ? "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed"
                      : isTargeted
                        ? "bg-blue-600 hover:bg-blue-500 text-white"
                        : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  )}
                >
                  {hasVoted ? 'Vote Submitted' : 'Vote for Project'}
                  {!hasVoted && <ChevronUp size={16} strokeWidth={2.5} />}
                </button>
              </div>
            </div>
          );
        })}
        
        {displayTeams.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-zinc-500">
            No projects found matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {activeQrTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveQrTeam(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121214] border border-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative"
            >
              <h3 className="text-xl font-bold text-zinc-100 mb-1 leading-tight">
                {activeQrTeam.project_title}
              </h3>
              <p className="text-zinc-500 text-sm mb-6">
                Scan to vote directly for Team {activeQrTeam.registration_number}
              </p>
              
              <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-sm">
                <QRCodeSVG 
                  value={`${window.location.origin}/?team=${activeQrTeam.registration_number}`} 
                  size={200} 
                  level="H" 
                  includeMargin={false} 
                />
              </div>
              
              <button 
                onClick={() => setActiveQrTeam(null)} 
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// --- PAGE 2: LIVE LEADERBOARD (/livestandings) ---
function LeaderboardPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase.from('teams').select('*').order('vote', { ascending: false });
      if (data) setTeams(data);
      setLoading(false);
    };

    fetchTeams();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, (payload) => {
        setTeams((currentTeams) => {
          const updatedTeams = currentTeams.map((t) => t.id === payload.new.id ? payload.new : t);
          return updatedTeams.sort((a, b) => (b.vote || 0) - (a.vote || 0));
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-10 text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100 flex items-center justify-center gap-3">
          <Trophy size={32} className="text-amber-500" strokeWidth={2.5} />
          Live Standings
        </h1>
        <p className="text-zinc-500 font-medium">Real-time voting results</p>
      </header>

      <div className="space-y-3 relative">
        <AnimatePresence mode='popLayout'>
          {teams.map((team, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            let rankBadge = "bg-zinc-800/50 text-zinc-400 border border-zinc-800";
            let cardStyle = "bg-[#121214] border-zinc-800/80";
            
            if (isFirst) {
              rankBadge = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
              cardStyle = "bg-[#121214] border-amber-500/30 ring-1 ring-amber-500/10";
            } else if (isSecond) {
              rankBadge = "bg-slate-400/10 text-slate-300 border border-slate-500/20";
              cardStyle = "bg-[#121214] border-slate-500/30";
            } else if (isThird) {
              rankBadge = "bg-orange-500/10 text-orange-500 border border-orange-500/20";
              cardStyle = "bg-[#121214] border-orange-500/30";
            }

            return (
              <motion.div
                key={team.id}
                layoutId={`team-${team.id}`}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  layout: { type: "spring", stiffness: 350, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className={clsx(
                  "relative overflow-hidden p-4 sm:p-5 rounded-xl border", 
                  cardStyle
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                    <div className={clsx("flex flex-col items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold text-lg sm:text-xl shrink-0", rankBadge)}>
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider text-zinc-400 bg-zinc-800 border border-zinc-700/50">
                          {team.department}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-zinc-100 truncate">
                        {team.project_title}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-4 border-l border-zinc-800">
                    <motion.div 
                      key={team.vote}
                      initial={{ scale: 1.1, color: '#3B82F6' }}
                      animate={{ scale: 1, color: '#F4F4F5' }}
                      className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-zinc-100"
                    >
                      {team.vote || 0}
                    </motion.div>
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                      Votes
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </main>
  );
}

// --- UTILITY COMPONENT ---
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-zinc-500 gap-4 bg-[#09090B]">
      <Activity size={28} className="text-blue-500 animate-pulse" />
      <p className="font-semibold tracking-wider uppercase text-sm">Loading Network</p>
    </div>
  );
}