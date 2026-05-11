import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PwaInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={handleInstallClick}
          className="mt-2 text-xs flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg w-full transition-colors hidden md:flex shadow-lg group"
        >
          <Download size={14} className="text-brand-ai group-hover:animate-bounce" />
          <span className="text-brand-secondary group-hover:text-white transition-colors">Install App</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
