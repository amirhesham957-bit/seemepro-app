const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  'import { BrowserRouter as Router, Routes, Route, Link, useLocation } from \'react-router-dom\';',
  'import { BrowserRouter as Router, Routes, Route, Link, useLocation, NavLink } from \'react-router-dom\';'
);

if (!app.includes('AnimatedBackground')) {
  app = app.replace(
    'import { motion, AnimatePresence } from \'framer-motion\';',
    'import { motion, AnimatePresence } from \'framer-motion\';\nimport AnimatedBackground from \'./components/AnimatedBackground\';'
  );
}

const navItemComponent = `// Nav link with active glow
const NavItem = ({ to, icon, label, end = false, badge }: { to: string; icon: React.ReactNode; label: string; end?: boolean; badge?: React.ReactNode }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      \`flex items-center space-x-3 p-3 rounded-xl transition-all w-full relative group \${
        isActive
          ? 'bg-brand-ai/15 text-white shadow-[0_0_12px_rgba(139,92,246,0.2)] border border-brand-ai/20'
          : 'text-brand-secondary hover:text-white hover:bg-white/10'
      }\`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && <motion.div layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-brand-ai/10" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
        <span className="relative z-10">{icon}</span>
        <span className="hidden md:block font-medium relative z-10">{label}</span>
        {badge && <span className="relative z-10 ml-auto">{badge}</span>}
      </>
    )}
  </NavLink>
);`;

if (!app.includes('const NavItem')) {
  app = app.replace('// Layout Wrapper', navItemComponent + '\n\n// Layout Wrapper');
}

const layoutRegex = /\/\/ Layout Wrapper\nconst Layout = \(\{ children \}: \{ children: React\.ReactNode \}\) => \{[\s\S]*?  \);\n\};\n/m;

const newLayout = `// Layout Wrapper
const Layout = ({ children }: { children: React.ReactNode }) => {
  const coins = useGamificationStore((state) => state.coins);

  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      <AnimatedBackground />
      {/* Sidebar Navigation */}
      <nav className="w-20 md:w-64 glass-panel h-full flex flex-col items-center md:items-start py-8 px-4 flex-shrink-0 z-10 relative">
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
        
        <div className="flex flex-col space-y-2 w-full">
          <NavItem to="/" end icon={<LayoutDashboard size={24} />} label="Dashboard" />
          <NavItem to="/voice" icon={<Mic size={24} />} label="Voice Analysis" />
          <NavItem to="/video" icon={<Video size={24} />} label="Video Analysis" />
          <NavItem to="/toxic" icon={<HeartCrack size={24} />} label="Toxic Meter" />
          <NavItem to="/live" icon={<Activity size={24} />} label="Live Analysis" badge={<div className="w-2 h-2 rounded-full bg-brand-ai animate-pulse"></div>} />
          <NavItem to="/history" icon={<History size={24} />} label="History" />
        </div>
        
        <div className="mt-auto w-full flex flex-col space-y-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="glass-card p-4 flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10"></div>
            <Star className="text-yellow-400 mb-2 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" size={28} />
            <p className="text-sm font-semibold hidden md:block">{coins} Coins</p>
            <button className="mt-2 text-xs bg-brand-primary hover:bg-blue-600 px-3 py-1.5 rounded-lg w-full transition-colors hidden md:block shadow-lg">Get Premium</button>
          </motion.div>
          
          <Link to="/privacy" className="text-xs text-brand-secondary hover:text-white transition-colors text-center pb-2 hidden md:block">
            Privacy Policy
          </Link>
        </div>
      </nav>
      
      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative z-10 p-6 md:p-10">
        <div className="max-w-6xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
`;

app = app.replace(layoutRegex, newLayout);
fs.writeFileSync('src/App.tsx', app);
console.log('App.tsx updated');
