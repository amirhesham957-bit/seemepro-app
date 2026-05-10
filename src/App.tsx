import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, Mic, Video, HeartCrack, Trophy, LayoutDashboard } from 'lucide-react';
import VoiceAnalysis from './pages/VoiceAnalysis';
import ToxicMeter from './pages/ToxicMeter';
import VideoAnalysis from './pages/VideoAnalysis';
import LiveAnalysis from './pages/LiveAnalysis';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { useEffect } from 'react';
import { LegalDisclaimerModal } from './components/LegalDisclaimerModal';
import { ToastContainer } from './components/Toast';
import { useGamificationStore } from './store/gamificationStore';
import { motion, AnimatePresence } from 'framer-motion';

// Home Component with Cinematic Animations
const Home = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col items-center justify-center h-full text-center space-y-6"
  >
    <motion.h1 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring' }}
      className="text-5xl font-bold text-gradient"
    >
      SeemePro
    </motion.h1>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="text-xl text-brand-secondary max-w-2xl"
    >
      Read Between The Lines, Reveal The Truth
    </motion.p>
    <motion.div 
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.6 } }
      }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 w-full max-w-4xl"
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
        <Link to="/voice" className="glass-card p-6 flex items-center space-x-4 hover:scale-105 transition-transform group">
          <div className="p-4 bg-brand-primary/20 rounded-full text-brand-primary group-hover:scale-110 transition-transform"><Mic size={32} /></div>
          <div className="text-left">
            <h3 className="text-xl font-semibold">Voice Analysis</h3>
            <p className="text-sm text-brand-secondary">Detect stress and deception in audio</p>
          </div>
        </Link>
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
        <Link to="/video" className="glass-card p-6 flex items-center space-x-4 hover:scale-105 transition-transform group">
          <div className="p-4 bg-brand-ai/20 rounded-full text-brand-ai group-hover:scale-110 transition-transform"><Video size={32} /></div>
          <div className="text-left">
            <h3 className="text-xl font-semibold">Video Analysis</h3>
            <p className="text-sm text-brand-secondary">Analyze micro-expressions</p>
          </div>
        </Link>
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
        <Link to="/toxic" className="glass-card p-6 flex items-center space-x-4 hover:scale-105 transition-transform group">
          <div className="p-4 bg-brand-warning/20 rounded-full text-brand-warning group-hover:scale-110 transition-transform"><HeartCrack size={32} /></div>
          <div className="text-left">
            <h3 className="text-xl font-semibold">Toxic Meter</h3>
            <p className="text-sm text-brand-secondary">Analyze relationships for red flags</p>
          </div>
        </Link>
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
        <Link to="/live" className="glass-card p-6 flex items-center space-x-4 hover:scale-105 transition-transform border-brand-ai/50 group relative overflow-hidden">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-ai to-brand-primary opacity-20 blur-lg group-hover:opacity-40 transition-opacity"></div>
          <div className="p-4 bg-brand-ai/20 rounded-full text-brand-ai group-hover:scale-110 transition-transform"><Activity size={32} /></div>
          <div className="text-left relative z-10">
            <h3 className="text-xl font-semibold">Live Analysis <span className="text-xs bg-brand-ai px-2 py-1 rounded-full ml-2 shadow-[0_0_10px_rgba(139,92,246,0.6)]">PRO</span></h3>
            <p className="text-sm text-brand-secondary">Real-time video/audio tracking</p>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  </motion.div>
);

// Layout Wrapper
const Layout = ({ children }: { children: React.ReactNode }) => {
  const coins = useGamificationStore((state) => state.coins);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-20 md:w-64 glass-panel h-full flex flex-col items-center md:items-start py-8 px-4 flex-shrink-0 z-10">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-3 mb-12 px-2"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-ai flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
            <span className="font-bold text-lg">S</span>
          </div>
          <span className="font-bold text-xl hidden md:block tracking-wide text-gradient">SeemePro</span>
        </motion.div>
        
        <div className="flex flex-col space-y-4 w-full">
          <Link to="/" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors w-full text-brand-text">
            <LayoutDashboard size={24} />
            <span className="hidden md:block font-medium">Dashboard</span>
          </Link>
          <Link to="/voice" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors w-full text-brand-secondary hover:text-brand-text">
            <Mic size={24} />
            <span className="hidden md:block font-medium">Voice Analysis</span>
          </Link>
          <Link to="/video" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors w-full text-brand-secondary hover:text-brand-text">
            <Video size={24} />
            <span className="hidden md:block font-medium">Video Analysis</span>
          </Link>
          <Link to="/toxic" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors w-full text-brand-secondary hover:text-brand-text">
            <HeartCrack size={24} />
            <span className="hidden md:block font-medium">Toxic Meter</span>
          </Link>
          <Link to="/live" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors w-full text-brand-secondary hover:text-brand-text relative">
            <Activity size={24} />
            <span className="hidden md:block font-medium">Live Analysis</span>
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-ai hidden md:block animate-pulse"></div>
          </Link>
        </div>
        
        <div className="mt-auto w-full flex flex-col space-y-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="glass-card p-4 flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10"></div>
            <Trophy className="text-yellow-400 mb-2 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" size={28} />
            <p className="text-sm font-semibold hidden md:block">{coins} Coins</p>
            <button className="mt-2 text-xs bg-brand-primary hover:bg-blue-600 px-3 py-1.5 rounded-lg w-full transition-colors hidden md:block shadow-lg">Get Premium</button>
          </motion.div>
          
          <Link to="/privacy" className="text-xs text-brand-secondary hover:text-white transition-colors text-center pb-2 hidden md:block">
            Privacy Policy
          </Link>
        </div>
      </nav>
      
      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative p-6 md:p-10">
        <div className="max-w-6xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

// Animated Routes Wrapper
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/voice" element={<VoiceAnalysis />} />
        <Route path="/video" element={<VideoAnalysis />} />
        <Route path="/toxic" element={<ToxicMeter />} />
        <Route path="/live" element={<LiveAnalysis />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const initializeStore = useGamificationStore((state) => state.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <Router>
      <ToastContainer />
      <LegalDisclaimerModal />
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  );
}

export default App;
