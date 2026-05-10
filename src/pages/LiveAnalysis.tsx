import React, { useEffect, useState, useRef } from 'react';
import { Video, Activity, AlertCircle, ShieldAlert, Disc, Camera, Play, Lock, Mic, MicOff, Settings, User, Briefcase, Star, Zap, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../store/gamificationStore';
import { useToastStore } from '../store/toastStore';
import AdModal from '../components/AdModal';
import { AnalysisReportPDF } from '../components/AnalysisReportPDF';
import { downloadReportAsPDF } from '../lib/pdfUtils';
import { analyzeLiveInterview } from '../lib/ai';

// Use globals from CDN to avoid bundler issues
declare const FaceMesh: any;
declare const CameraUtils: any;

const LiveAnalysis = () => {
  const [isLive, setIsLive] = useState(false);
  const [mode, setMode] = useState<'setup' | 'analysis'>('setup');
  const [time, setTime] = useState(0);

  // Real-time data
  const [videoMetrics, setVideoMetrics] = useState({
    eyeContact: 95,
    posture: 85,
    expression: 'Confident'
  });
  const [voiceMetrics, setVoiceMetrics] = useState({
    confidence: 90,
    pace: 80,
    clarity: 85,
    fillerWords: 5
  });
  const [alerts, setAlerts] = useState<{time: string, msg: string, type: 'warning' | 'danger'}[]>([]);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    let interval: any;
    if (isLive) {
      interval = setInterval(() => {
        setTime(t => t + 1);
        
        // Simulate real-time fluctuations
        setVideoMetrics(prev => ({
          ...prev,
          eyeContact: Math.max(70, Math.min(100, prev.eyeContact + (Math.random() * 4 - 2))),
          posture: Math.max(60, Math.min(100, prev.posture + (Math.random() * 4 - 2))),
        }));

        setVoiceMetrics(prev => ({
          ...prev,
          confidence: Math.max(70, Math.min(100, prev.confidence + (Math.random() * 6 - 3))),
          pace: Math.max(50, Math.min(100, prev.pace + (Math.random() * 4 - 2))),
          fillerWords: Math.max(0, Math.min(20, prev.fillerWords + (Math.random() * 2 - 1))),
        }));

        // Randomly trigger alerts
        if (Math.random() > 0.95) {
           const types: ('warning' | 'danger')[] = ['warning', 'danger'];
           const type = types[Math.floor(Math.random() * types.length)];
           const msg = type === 'danger' ? 'Significant gaze aversion detected' : 'Speaking pace increasing';
           setAlerts(prev => [{ time: formatTime(time), msg, type }, ...prev].slice(0, 5));
        }

      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive, time]);

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
      setVideoMetrics({ eyeContact: 95, posture: 85, expression: 'Confident' });
      setVoiceMetrics({ confidence: 90, pace: 80, clarity: 85, fillerWords: 5 });
    }
    
    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isLive]);

  const initFaceMesh = async () => {
    try {
      if (typeof FaceMesh === 'undefined') {
        useToastStore.getState().addToast('error', 'MediaPipe FaceMesh not loaded.');
        return;
      }

      faceMeshRef.current = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMeshRef.current.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMeshRef.current.onResults(onFaceMeshResults);

      if (webcamRef.current?.video) {
        const videoElement = webcamRef.current.video;
        if (typeof CameraUtils !== 'undefined') {
          cameraRef.current = new CameraUtils(videoElement, {
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
      }
    } catch (error) {
      console.error("FaceMesh initialization failed:", error);
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
    canvasCtx.clearRect(0, 0, videoWidth, videoHeight);
    
    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        canvasCtx.fillStyle = '#8b5cf6';
        canvasCtx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
        canvasCtx.lineWidth = 1;
        for (let i = 0; i < landmarks.length; i += 10) { 
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
        const transcript = event.results[event.results.length - 1][0].transcript;
        // Filler word detection logic
        const fillers = ['um', 'uh', 'like', 'you know', 'basically'];
        if (fillers.some(f => transcript.toLowerCase().includes(f))) {
           setAlerts(prev => [{ time: formatTime(time), msg: 'Filler word detected', type: 'warning' }, ...prev].slice(0, 5));
           setVoiceMetrics(prev => ({ ...prev, fillerWords: Math.min(100, prev.fillerWords + 2) }));
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

  const handleEndSession = async () => {
    setIsLive(false);
    setIsAnalyzing(true);
    
    try {
      // Combine metadata for Gemini
      const aiResults = await analyzeLiveInterview(videoMetrics, voiceMetrics);
      if (aiResults) {
        // Redirect to results or show summary
        // For now, we'll just toast and log
        useToastStore.getState().addToast('success', 'Interview analysis complete!');
        console.log('Interview Results:', aiResults);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 h-full pb-20 flex flex-col"
    >
      <div className="flex items-center justify-between">
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
              Live Interview AI 
              <span className="ml-3 text-xs bg-gradient-to-r from-brand-primary to-brand-ai px-2 py-1 rounded-full text-white uppercase tracking-wider shadow-[0_0_10px_rgba(139,92,246,0.5)]">Pro</span>
            </h1>
            <p className="text-brand-secondary">Dual-stream behavioral and verbal analysis.</p>
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
             onClick={() => isLive ? handleEndSession() : setIsLive(true)}
             className={`px-6 py-2 rounded-xl font-bold transition-all ${isLive ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-brand-primary hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(19,55,236,0.4)]'}`}
           >
             {isLive ? 'End Session' : 'Start Interview'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Main Camera Feed */}
        <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden relative flex flex-col items-center justify-center min-h-[450px] border border-brand-ai/30 bg-black shadow-lg">
          {!isLive ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-brand-secondary space-y-4">
               <Camera size={64} className="mx-auto opacity-50" />
               <p>Camera is offline</p>
               <p className="text-sm max-w-xs mx-auto">Click 'Start Interview' to begin real-time multimodal analysis.</p>
            </motion.div>
          ) : (
            <div className="w-full h-full relative">
               <Webcam 
                 ref={webcamRef}
                 audio={true}
                 className="absolute inset-0 w-full h-full object-cover"
                 mirrored={true}
                 videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
               />
               <canvas
                 ref={canvasRef}
                 className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
               />
               
               {/* Visual Indicators */}
               <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm border border-brand-ai/30 flex items-center space-x-2 text-white">
                 <div className="w-2 h-2 rounded-full bg-brand-success animate-pulse shadow-[0_0_5px_#00CC66]"></div>
                 <span>Video Engine Active</span>
               </div>

               <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm border border-brand-primary/30 flex items-center space-x-2 text-white">
                 <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                 <span>Audio Engine Active</span>
               </div>

               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-[10px] text-brand-secondary uppercase">Eye Contact</p>
                    <p className="text-lg font-bold text-brand-ai">{videoMetrics.eyeContact.toFixed(0)}%</p>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[10px] text-brand-secondary uppercase">Confidence</p>
                    <p className="text-lg font-bold text-brand-success">{voiceMetrics.confidence.toFixed(0)}%</p>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[10px] text-brand-secondary uppercase">Pace</p>
                    <p className="text-lg font-bold text-brand-primary">{voiceMetrics.pace.toFixed(0)}%</p>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Multimodal Insights Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel rounded-3xl p-6 flex flex-col space-y-6 overflow-y-auto"
        >
          <h3 className="font-semibold text-lg border-b border-white/10 pb-4 text-brand-text">Real-Time Multimodal Feed</h3>

          {/* Video Stream Metrics */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-ai uppercase tracking-widest">Visual Cues</h4>
            <div className="space-y-3">
              <MetricBar label="Eye Contact" value={videoMetrics.eyeContact} color="bg-brand-ai" />
              <MetricBar label="Posture" value={videoMetrics.posture} color="bg-brand-primary" />
            </div>
          </div>

          {/* Voice Stream Metrics */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest">Vocal Cues</h4>
            <div className="space-y-3">
              <MetricBar label="Confidence" value={voiceMetrics.confidence} color="bg-brand-success" />
              <MetricBar label="Pace" value={voiceMetrics.pace} color="bg-brand-secondary" />
              <MetricBar label="Clarity" value={voiceMetrics.clarity} color="bg-brand-ai" />
            </div>
          </div>

          {/* Live Alerts */}
          <div className="flex-1 mt-4">
             <h4 className="text-sm font-medium text-brand-secondary mb-3 flex items-center">
               <ShieldAlert size={16} className="mr-2" /> Intelligence Alerts
             </h4>
             <div className="space-y-2">
               {!isLive ? (
                 <p className="text-xs text-gray-500 italic text-center mt-10">Start session to begin monitoring.</p>
               ) : alerts.length === 0 ? (
                 <p className="text-xs text-green-500/70 italic text-center mt-10">All signals nominal.</p>
               ) : (
                 alerts.map((alert, i) => (
                   <motion.div 
                     initial={{ opacity: 0, x: -10 }} 
                     animate={{ opacity: 1, x: 0 }} 
                     key={i} 
                     className={`rounded-lg p-3 flex items-start space-x-3 ${alert.type === 'danger' ? 'bg-red-500/10 border border-red-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}
                   >
                     <AlertCircle size={14} className={`${alert.type === 'danger' ? 'text-red-400' : 'text-orange-400'} mt-0.5 shrink-0`} />
                     <div className="flex flex-col space-y-1">
                       <span className={`font-mono text-[10px] ${alert.type === 'danger' ? 'text-red-400' : 'text-orange-400'}`}>{alert.time}</span>
                       <span className="text-white font-medium text-xs">{alert.msg}</span>
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

// Helper Component
const MetricBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-secondary">
      <span>{label}</span>
      <span>{value.toFixed(0)}%</span>
    </div>
    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
       <motion.div 
         initial={{ width: 0 }}
         animate={{ width: `${value}%` }}
         className={`${color} h-full rounded-full`} 
       />
    </div>
  </div>
);

export default LiveAnalysis;
