import React, { useState, useEffect } from 'react';
import { Video, Activity, AlertCircle, ShieldAlert, Disc } from 'lucide-react';
import Webcam from 'react-webcam';

const LiveAnalysis = () => {
  const [isLive, setIsLive] = useState(false);
  const [time, setTime] = useState(0);

  // Mock real-time data
  const [truthScore, setTruthScore] = useState(90);
  const [stressScore, setStressScore] = useState(20);
  const [alerts, setAlerts] = useState<{time: string, msg: string}[]>([]);

  useEffect(() => {
    let interval: any;
    if (isLive) {
      interval = setInterval(() => {
        setTime(t => t + 1);
        
        // Randomly fluctuate scores
        const newTruth = Math.max(0, Math.min(100, truthScore + (Math.random() * 10 - 5)));
        const newStress = Math.max(0, Math.min(100, stressScore + (Math.random() * 10 - 5)));
        
        setTruthScore(newTruth);
        setStressScore(newStress);

        // Generate random alerts if stress spikes or truth drops
        if (newTruth < 50 && Math.random() > 0.8) {
           setAlerts(prev => [{ time: formatTime(time), msg: 'Deception spike detected (Voice Pitch)' }, ...prev].slice(0, 5));
        }
        if (newStress > 80 && Math.random() > 0.8) {
           setAlerts(prev => [{ time: formatTime(time), msg: 'High stress level (Micro-expressions)' }, ...prev].slice(0, 5));
        }

      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive, truthScore, stressScore, time]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full pb-20 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-primary/20 rounded-xl text-brand-primary">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              Live Analysis 
              <span className="ml-3 text-xs bg-gradient-to-r from-brand-primary to-brand-ai px-2 py-1 rounded-full text-white uppercase tracking-wider">Premium</span>
            </h1>
            <p className="text-brand-secondary">Real-time processing for interviews.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
           {isLive && (
             <div className="flex items-center space-x-2 text-brand-warning animate-pulse">
               <Disc size={16} />
               <span className="font-mono">{formatTime(time)}</span>
             </div>
           )}
           <button 
             onClick={() => setIsLive(!isLive)}
             className={`px-6 py-2 rounded-xl font-bold transition-all ${isLive ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-brand-primary hover:bg-blue-600 text-white'}`}
           >
             {isLive ? 'End Session' : 'Start Camera'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Camera Feed Mock */}
        <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden relative flex flex-col items-center justify-center min-h-[400px] border border-white/5 bg-black">
          {!isLive ? (
            <div className="text-center text-brand-secondary space-y-4">
               <Video size={64} className="mx-auto opacity-50" />
               <p>Camera is offline</p>
               <p className="text-sm max-w-xs mx-auto">Click 'Start Camera' to begin real-time WebRTC analysis.</p>
            </div>
          ) : (
            <div className="w-full h-full relative">
               <Webcam 
                 audio={true}
                 className="absolute inset-0 w-full h-full object-cover"
                 mirrored={true}
               />
               
               {/* UI Overlays */}
               <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm border border-white/10 flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span>MediaPipe Face Mesh Active</span>
               </div>

               {/* Realtime Target Box */}
               <div className="absolute inset-1/4 border-2 border-brand-ai/50 border-dashed rounded-3xl flex items-center justify-center pointer-events-none">
                 <div className="absolute -top-6 text-xs text-brand-ai font-mono tracking-widest">SUBJECT TRACKING ENABLED</div>
               </div>
            </div>
          )}
        </div>

        {/* Live Analysis Panel */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col space-y-6 overflow-y-auto">
          <h3 className="font-semibold text-lg border-b border-white/10 pb-4">Real-Time Metrics</h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-secondary">Truthfulness</span>
              <span className="font-mono text-brand-success">{truthScore.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
               <div className="bg-brand-success h-2 rounded-full transition-all duration-300" style={{ width: `${truthScore}%` }}></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-secondary">Stress Level</span>
              <span className="font-mono text-brand-warning">{stressScore.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
               <div className="bg-brand-warning h-2 rounded-full transition-all duration-300" style={{ width: `${stressScore}%` }}></div>
            </div>
          </div>

          <div className="flex-1 mt-4">
             <h4 className="text-sm font-medium text-brand-secondary mb-3 flex items-center">
               <ShieldAlert size={16} className="mr-2" /> Live Alerts
             </h4>
             <div className="space-y-2">
               {!isLive ? (
                 <p className="text-xs text-gray-500 italic text-center mt-10">Waiting for session to start...</p>
               ) : alerts.length === 0 ? (
                 <p className="text-xs text-green-500/70 italic text-center mt-10">Session nominal. No red flags.</p>
               ) : (
                 alerts.map((alert, i) => (
                   <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-start space-x-2 text-xs">
                     <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                     <div>
                       <span className="font-mono text-red-400 mr-2">[{alert.time}]</span>
                       <span className="text-brand-text">{alert.msg}</span>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LiveAnalysis;
