import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const LegalDisclaimerModal: React.FC = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('hasAcceptedDisclaimer');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const handleAccept = () => {
    if (!isChecked) return;
    setIsLoading(true);
    localStorage.setItem('hasAcceptedDisclaimer', 'true');
    setIsVisible(false);
    window.location.href = '/';
  };

  return (
    <AnimatePresence>
      {/* Full-screen overlay — z-[9999] beats everything */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop — pointer-events-none so it never blocks the button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-none"
        />

        {/* Modal card — z-[10000] so it sits above the backdrop */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl shadow-brand-primary/20 z-[10000]"
        >
          {/* Header */}
          <div className="relative p-6 border-b border-gray-800 flex items-center gap-4 bg-gray-900/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Legal Disclaimer</h2>
              <p className="text-sm text-gray-400">Important terms of service</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="rounded-xl bg-orange-500/10 p-4 border border-orange-500/20 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-sm text-orange-200/80 leading-relaxed">
                <strong className="text-orange-400 block mb-1">Entertainment Purpose Only</strong>
                This application uses Artificial Intelligence to analyze behavior, voice, and facial
                expressions. The results provided are for entertainment and self-reflection purposes only.
                <br /><br />
                The analysis is <strong>not scientifically proven</strong> and should not be used for
                legal, medical, psychological, or critical decision-making. We do not assume any
                responsibility or liability for actions taken based on these results.
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-800 bg-gray-800/50 cursor-pointer hover:bg-gray-800 transition-colors">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                />
                <div className="h-5 w-5 rounded border border-gray-600 bg-gray-900 peer-checked:border-brand-primary peer-checked:bg-brand-primary transition-all flex items-center justify-center">
                  <CheckCircle2 className={`h-3 w-3 text-white transition-transform ${isChecked ? 'scale-100' : 'scale-0'}`} />
                </div>
              </div>
              <span className="text-sm text-gray-300">
                I have read and agree to the terms. I understand this app is for entertainment only
                and I will not use the results for critical decisions.
              </span>
            </label>
          </div>

          {/* Footer — explicit z-[10001] to be absolutely un-blockable */}
          <div className="relative p-6 pt-2 z-[10001]">
            <button
              type="button"
              onClick={handleAccept}
              disabled={!isChecked || isLoading}
              className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                isChecked
                  ? 'bg-brand-primary hover:bg-blue-600 text-white shadow-lg shadow-brand-primary/25 cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'I Agree & Continue'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
