import React from 'react';
import { X, PlayCircle, Lock } from 'lucide-react';
import { useGamificationStore } from '../store/gamificationStore';
import confetti from 'canvas-confetti';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureToUnlock?: 'voice' | 'video' | 'live' | 'toxic';
}

const AdModal: React.FC<AdModalProps> = ({ isOpen, onClose, featureToUnlock }) => {
  const { adLimits, watchAd, addCoins, deviceId } = useGamificationStore();

  let isLimitReached = false;
  let limitMessage = '';

  if (featureToUnlock === 'voice') {
    if (adLimits.voiceDaily >= 6) {
      isLimitReached = true;
      limitMessage = "You have reached your daily limit of 6 voice analysis ads.";
    }
  } else if (featureToUnlock === 'video') {
    if (adLimits.videoDaily >= 3 && adLimits.videoWeekly >= 6) {
      isLimitReached = true;
      limitMessage = "You have reached your daily limit (3) and weekly limit (6) for video analysis ads.";
    }
  }

  const handleWatchAd = () => {
    if (typeof window.adBreak !== 'function') {
      alert("Ad blocker detected or ads not fully initialized. Please disable your ad blocker or try again in a moment.");
      return;
    }

    window.adBreak({
      type: 'reward',
      name: featureToUnlock ? `${featureToUnlock}_reward` : 'coins_reward',
      beforeReward: (showAd: () => void) => {
        showAd();
      },
      adDismissed: () => {
        console.log("User dismissed the ad early.");
        onClose();
      },
      adViewed: async () => {
        if (featureToUnlock === 'voice' || featureToUnlock === 'video') {
          await watchAd(featureToUnlock);
        } else {
          addCoins(10); // Generic ad watch gives coins
        }
        
        // --- Antigravity Webhook Integration ---
        try {
          await fetch('https://YOUR_ANTIGRAVITY_WEBHOOK_URL', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: deviceId || 'unknown',
              reward_type: featureToUnlock || 'coins',
              status: 'completed',
              platform: 'pwa'
            })
          });
        } catch (e) {
          console.error("Webhook notification failed", e);
        }
        // ---------------------------------------
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1337ec', '#8b5cf6', '#00CC66']
        });
        
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden relative border-brand-ai/30 shadow-[0_0_50px_rgba(139,92,246,0.1)]">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
          <X size={24} />
        </button>

        <div className="p-8 text-center flex flex-col items-center">
          {isLimitReached ? (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6 text-red-500">
                <Lock size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Limit Reached</h2>
              <p className="text-brand-secondary mb-8">{limitMessage}</p>
              <button onClick={onClose} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all">
                Close
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-brand-primary/20 flex items-center justify-center mb-6 text-brand-primary">
                <PlayCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Unlock Feature</h2>
              <p className="text-brand-secondary mb-8">
                {featureToUnlock 
                  ? `Watch a short sponsor video to get 1 free ${featureToUnlock} analysis attempt.` 
                  : `Watch a short sponsor video to earn 10 free Coins.`}
              </p>
              
              {featureToUnlock === 'voice' && (
                <p className="text-xs text-brand-secondary/70 mb-4">Daily Ad Limits: {adLimits.voiceDaily}/6</p>
              )}
              {featureToUnlock === 'video' && (
                <p className="text-xs text-brand-secondary/70 mb-4">
                  Daily: {adLimits.videoDaily}/3 | Weekly: {adLimits.videoWeekly}/6
                </p>
              )}

              <button 
                onClick={handleWatchAd}
                className="w-full bg-brand-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-primary/30 flex items-center justify-center"
              >
                <PlayCircle className="mr-2" size={20} /> Watch Ad Now
              </button>
              <button onClick={onClose} className="mt-4 text-sm text-brand-secondary hover:text-white transition-colors">
                Maybe later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdModal;
