import React from 'react';
import { motion } from 'framer-motion';

interface LottieLoaderProps {
  message?: string;
  subMessage?: string;
  color?: string;
}

const LottieLoader: React.FC<LottieLoaderProps> = ({
  message = 'Gemini AI is analyzing...',
  subMessage = 'This may take a few seconds',
  color = '#8b5cf6',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center py-16 space-y-6"
    >
      {/* Orbital rings */}
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{ borderTopColor: color, borderRightColor: color + '40' }}
        />
        {/* Middle ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="absolute inset-3 rounded-full border-2 border-transparent"
          style={{ borderTopColor: '#1337ec', borderLeftColor: '#1337ec40' }}
        />
        {/* Inner pulse */}
        <motion.div
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="absolute inset-7 rounded-full"
          style={{ backgroundColor: color + '30', boxShadow: `0 0 16px ${color}60` }}
        />
        {/* Core dot */}
        <div
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>

      {/* Scanning bar */}
      <div className="w-48 h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="h-full w-1/3 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      </div>

      {/* Text */}
      <div className="text-center space-y-1">
        <motion.p
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="font-semibold text-white"
          style={{ textShadow: `0 0 12px ${color}80` }}
        >
          {message}
        </motion.p>
        <p className="text-xs text-brand-secondary">{subMessage}</p>
      </div>

      {/* Data stream dots */}
      <div className="flex space-x-2">
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 0.9, delay, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default LottieLoader;
