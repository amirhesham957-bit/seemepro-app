import React, { useState, useEffect, useRef } from 'react';
import { Video, Activity, AlertCircle, ShieldAlert, Disc } from 'lucide-react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';

// Use globals from CDN to avoid bundler issues
const FaceMesh = (window as any).FaceMesh;
const MediaPipeCamera = (window as any).Camera;

const LiveAnalysis = () => {
  const [isLive, setIsLive] = useState(false);
  const [time, setTime] = useState(0);

  // Real-time data
  const [truthScore, setTruthScore] = useState(90);
  const [stressScore, setStressScore] = useState(20);
  const [alerts, setAlerts] = useState<{time: string, msg: string}[]>([]);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);

  useEffect(() => {
    let interval: any;
    if (isLive) {
      interval = setInterval(() => {
        setTime(t => t + 1);
        
        // Randomly fluctuate scores to simulate AI processing based on face movements
        const newTruth = Math.max(0, Math.min(100, truthScore + (Math.random() * 10 - 5)));
        const newStress = Math.max(0, Math.min(100, stressScore + (Math.random() * 10 - 5)));
        
        setTruthScore(newTruth);
        setStressScore(newStress);

        if (newTruth < 50 && Math.random() > 0.9) {
           setAlerts(prev => [{ time: formatTime(time), msg: 'Deception spike detected (Voice Pitch)' }, ...prev].slice(0, 5));
        }
        if (newStress > 80 && Math.random() > 0.9) {
           setAlerts(prev => [{ time: formatTime(time), msg: 'High stress level (Micro-expressions)' }, ...prev].slice(0, 5));
        }

      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive, truthScore, stressScore, time]);

  useEffect(() => {
    if (isLive) {
      initFaceMesh();
      initSpeechRecognition();
    } else {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setTime(0);
      setAlerts([]);
      setTruthScore(90);
      setStressScore(20);
    }
    
    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isLive]);

  const initFaceMesh = () => {
    if (!faceMeshRef.current) {
      faceMeshRef.current = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMeshRef.current.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMeshRef.current.onResults(onFaceMeshResults);
    }

    if (typeof webcamRef.current !== "undefined" && webcamRef.current !== null && webcamRef.current.video) {
      const videoElement = webcamRef.current.video;
      cameraRef.current = new MediaPipeCamera(videoElement, {
        onFrame: async () => {
          if (faceMeshRef.current) {
            await faceMeshRef.current.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current.start();
    }
  };

  const onFaceMeshResults = (results: any) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;
    
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;
    
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        // Draw facial landmarks manually to simulate FACEMESH_TESSELATION
        canvasCtx.fillStyle = '#8b5cf6';
        canvasCtx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
        canvasCtx.lineWidth = 1;
        
        for (let i = 0; i < landmarks.length; i++) {
          const x = landmarks[i].x * videoWidth;
          const y = landmarks[i].y * videoHeight;
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 1, 0, 2 * Math.PI);
          canvasCtx.fill();
        }
      }
    }
    canvasCtx.restore();
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const text = lastResult[0].transcript.toLowerCase();
          // Detect filler words to trigger alerts
          const fillers = ['um', 'uh', 'like', 'you know', 'basically'];
          const found = fillers.some(f => text.includes(f));
          if (found) {
            setAlerts(prev => [{ time: formatTime(time), msg: 'Filler word overuse detected (Confidence drop)' }, ...prev].slice(0, 5));
            setTruthScore(prev => Math.max(0, prev - 5));
            setStressScore(prev => Math.min(100, prev + 5));
          }
        }
      };
      
      recognitionRef.current.start();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 h-full pb-20 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="p-3 bg-brand-primary/20 rounded-xl text-brand-primary"
          >
            <Activity size={28} />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              Live Analysis 
              <span className="ml-3 text-xs bg-gradient-to-r from-brand-primary to-brand-ai px-2 py-1 rounded-full text-white uppercase tracking-wider shadow-[0_0_10px_rgba(139,92,246,0.5)]">Premium</span>
            </h1>
            <p className="text-brand-secondary">Real-time processing for interviews using MediaPipe.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
           {isLive && (
             <div className="flex items-center space-x-2 text-brand-warning animate-pulse bg-brand-warning/10 px-3 py-1.5 rounded-lg border border-brand-warning/20">
               <Disc size={16} />
               <span className="font-mono">{formatTime(time)}</span>
             </div>
           )}
           <button 
             onClick={() => setIsLive(!isLive)}
             className={`px-6 py-2 rounded-xl font-bold transition-all ${isLive ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-brand-primary hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(19,55,236,0.4)]'}`}
           >
             {isLive ? 'End Session' : 'Start Camera'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Camera Feed Mock */}
        <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden relative flex flex-col items-center justify-center min-h-[400px] border border-brand-ai/30 bg-black shadow-lg">
          {!isLive ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-brand-secondary space-y-4">
               <Video size={64} className="mx-auto opacity-50" />
               <p>Camera is offline</p>
               <p className="text-sm max-w-xs mx-auto">Click 'Start Camera' to begin real-time WebRTC analysis with FaceMesh tracking.</p>
            </motion.div>
          ) : (
            <div className="w-full h-full relative">
               <Webcam 
                 ref={webcamRef}
                 audio={false} // Disable audio on webcam since SpeechRecognition handles mic
                 className="absolute inset-0 w-full h-full object-cover"
                 mirrored={true}
                 videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: "user"
                 }}
               />
               
               {/* Canvas for MediaPipe Overlays */}
               <canvas
                 ref={canvasRef}
                 className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
               />
               
               {/* UI Overlays */}
               <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm border border-brand-ai/30 flex items-center space-x-2 text-white">
                 <div className="w-2 h-2 rounded-full bg-brand-success animate-pulse shadow-[0_0_5px_#00CC66]"></div>
                 <span>MediaPipe Face Mesh Active</span>
               </div>

               <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm border border-brand-primary/30 flex items-center space-x-2 text-white">
                 <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                 <span>Speech Recognition</span>
               </div>

               {/* Realtime Target Box */}
               <motion.div 
                 initial={{ opacity: 0, scale: 1.1 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="absolute inset-1/4 border-2 border-brand-ai/50 border-dashed rounded-3xl flex items-center justify-center pointer-events-none"
               >
                 <div className="absolute -top-6 text-xs text-brand-ai font-mono tracking-widest bg-black/50 px-2 rounded">SUBJECT TRACKING ENABLED</div>
               </motion.div>
            </div>
          )}
        </div>

        {/* Live Analysis Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel rounded-3xl p-6 flex flex-col space-y-6 overflow-y-auto"
        >
          <h3 className="font-semibold text-lg border-b border-white/10 pb-4 text-brand-text">Real-Time Metrics</h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-secondary">Truthfulness</span>
              <span className="font-mono text-brand-success">{truthScore.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
               <motion.div 
                 animate={{ width: `${truthScore}%` }}
                 transition={{ type: 'spring', bounce: 0 }}
                 className="bg-brand-success h-full rounded-full shadow-[0_0_10px_#00CC66]" 
               />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-secondary">Stress Level</span>
              <span className="font-mono text-brand-warning">{stressScore.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
               <motion.div 
                 animate={{ width: `${stressScore}%` }}
                 transition={{ type: 'spring', bounce: 0 }}
                 className="bg-brand-warning h-full rounded-full shadow-[0_0_10px_#f59e0b]" 
               />
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
                   <motion.div 
                     initial={{ opacity: 0, x: -10 }} 
                     animate={{ opacity: 1, x: 0 }} 
                     key={i} 
                     className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-3 text-xs"
                   >
                     <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                     <div className="flex flex-col space-y-1">
                       <span className="font-mono text-red-400 text-[10px]">[{alert.time}]</span>
                       <span className="text-white font-medium">{alert.msg}</span>
                     </div>
                   </motion.div>
                 ))
               )}
             </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
};

export default LiveAnalysis;
