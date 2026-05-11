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
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={handleInstallClick}
          className="fixed bottom-6 right-6 z-[100] flex items-center justify-center w-12 h-12 bg-brand-primary/10 backdrop-blur-xl border border-brand-primary/30 hover:border-brand-primary hover:bg-brand-primary/20 rounded-full shadow-[0_0_20px_rgba(19,55,236,0.3)] group transition-all"
          title="Install SeeMePro App"
          aria-label="Install App"
        >
          <Download size={20} className="text-white group-hover:animate-bounce drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
