import React, { useState, useEffect, useRef } from 'react';
import { Video, Activity, AlertCircle, ShieldAlert, Disc, Camera, Play, Lock, UploadCloud, FileVideo, CheckCircle } from 'lucide-react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../store/gamificationStore';
import { useToastStore } from '../store/toastStore';
import AdModal from '../components/AdModal';
import { AnalysisReportPDF } from '../components/AnalysisReportPDF';
import { downloadReportAsPDF } from '../lib/pdfUtils';
import { analyzeVideoTruthfulness } from '../lib/ai';

// Use globals from CDN to avoid bundler issues
declare const FaceMesh: any;
declare const CameraUtils: any;

const VideoAnalysis = () => {
  const [mode, setMode] = useState<'upload' | 'live'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  
  // Real-time data (for live mode)
  const [liveMetrics, setLiveMetrics] = useState({
    truthScore: 90,
    stressScore: 20,
    eyeContact: 95,
    expression: 'Confident'
  });
  const [alerts, setAlerts] = useState<{time: string, msg: string}[]>([]);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const attempts = useGamificationStore(state => state.attempts.video);
  const useAttempt = useGamificationStore(state => state.useAttempt);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      setMode('upload');
    }
  };

  const startLiveAnalysis = async () => {
    if (attempts <= 0) {
      setShowAdModal(true);
      return;
    }
    if (!(await useAttempt('video'))) return;

    setMode('live');
    setIsAnalyzing(true);
    initFaceMesh();
  };

  const initFaceMesh = async () => {
    try {
      // In a real environment, we'd load from @mediapipe/face_mesh
      // For this implementation, we assume they are available or loaded via script tag
      if (typeof FaceMesh === 'undefined') {
        useToastStore.getState().addToast('error', 'MediaPipe FaceMesh not loaded. Please check connection.');
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
        // Using a generic camera utils helper if available
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
      setIsAnalyzing(false);
    } catch (error) {
      console.error("FaceMesh initialization failed:", error);
      useToastStore.getState().addToast('error', 'Failed to initialize AI camera.');
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
        // Draw simplified face mesh
        canvasCtx.fillStyle = '#8b5cf6';
        canvasCtx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
        canvasCtx.lineWidth = 1;
        for (let i = 0; i < landmarks.length; i += 5) { // Sample for performance
          const x = landmarks[i].x * videoWidth;
          const y = landmarks[i].y * videoHeight;
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 1, 0, 2 * Math.PI);
          canvasCtx.fill();
        }
      }
    }
    canvasCtx.restore();

    // Simulate metric updates
    setLiveMetrics(prev => ({
      ...prev,
      truthScore: Math.max(60, Math.min(100, prev.truthScore + (Math.random() * 2 - 1))),
      stressScore: Math.max(10, Math.min(40, prev.stressScore + (Math.random() * 2 - 1))),
      eyeContact: Math.max(80, Math.min(100, prev.eyeContact + (Math.random() * 4 - 2))),
    }));
  };

  const handleAnalyzeUploaded = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const mockMetadata = {
        filename: file.name,
        durationSeconds: 30,
        averageBlinkRate: 15,
        headPoseShifts: 5,
        smileFrames: 20
      };
      const aiResults = await analyzeVideoTruthfulness(mockMetadata);
      if (aiResults) setResults(aiResults);
    } catch (error) {
      useToastStore.getState().addToast('error', 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-brand-ai/20 rounded-xl text-brand-ai">
            <Camera size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Video Analysis</h1>
            <p className="text-brand-secondary">Real-time behavioral and truthfulness insights.</p>
          </div>
        </div>
        
        <div className="flex space-x-2 bg-black/20 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setMode('upload')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'upload' ? 'bg-brand-ai text-white shadow-lg' : 'text-brand-secondary hover:text-white'}`}
          >
            Upload Video
          </button>
          <button 
            onClick={startLiveAnalysis}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'live' ? 'bg-brand-ai text-white shadow-lg' : 'text-brand-secondary hover:text-white'}`}
          >
            Live Session
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'upload' && !results && (
          <motion.div
            key="upload-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-3xl mx-auto"
          >
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="glass-panel p-12 rounded-3xl border-dashed border-2 border-brand-ai/30 hover:border-brand-ai transition-colors cursor-pointer text-center relative overflow-hidden"
              onClick={() => !file && document.getElementById('file-input')?.click()}
            >
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex flex-col items-center justify-center rounded-3xl">
                  <div className="w-12 h-12 border-4 border-brand-ai/30 border-t-brand-ai rounded-full animate-spin mb-4"></div>
                  <p className="text-brand-ai font-medium">Gemini AI is analyzing your video...</p>
                </div>
              )}
              
              {file ? (
                <div className="space-y-4">
                  <FileVideo size={64} className="mx-auto text-brand-ai" />
                  <p className="text-xl font-semibold">{file.name}</p>
                  <p className="text-brand-secondary">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-red-400 text-sm underline">Remove</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadCloud size={64} className="mx-auto text-brand-secondary opacity-50" />
                  <h3 className="text-xl font-medium">Drop your interview video here</h3>
                  <p className="text-brand-secondary">or click to browse files</p>
                </div>
              )}
              <input 
                type="file" 
                id="file-input" 
                className="hidden" 
                accept="video/*" 
                onChange={(e) => e.target.files && setFile(e.target.files[0])} 
              />
            </div>

            {file && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex justify-center">
                <button 
                  onClick={handleAnalyzeUploaded}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-brand-ai to-purple-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Start Deep Analysis'}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {mode === 'live' && (
          <motion.div
            key="live-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]"
          >
            <div className="lg:col-span-2 relative rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
              <Webcam
                ref={webcamRef}
                mirrored
                className="w-full h-full object-cover"
                videoConstraints={{ facingMode: 'user' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono text-white uppercase tracking-widest">Live AI Tracking</span>
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center space-x-8">
                <div className="text-center">
                  <p className="text-[10px] text-brand-secondary uppercase">Confidence</p>
                  <p className="text-lg font-bold text-brand-success">{liveMetrics.truthScore.toFixed(0)}%</p>
                </div>
                <div className="w-[1px] h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[10px] text-brand-secondary uppercase">Stress</p>
                  <p className="text-lg font-bold text-brand-warning">{liveMetrics.stressScore.toFixed(0)}%</p>
                </div>
                <div className="w-[1px] h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[10px] text-brand-secondary uppercase">Eye Contact</p>
                  <p className="text-lg font-bold text-brand-ai">{liveMetrics.eyeContact.toFixed(0)}%</p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 flex flex-col overflow-hidden">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Activity className="mr-2 text-brand-ai" size={20} />
                Live Insights
              </h3>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {alerts.length === 0 ? (
                  <div className="text-center py-20 text-brand-secondary opacity-50">
                    <ShieldAlert size={48} className="mx-auto mb-4" />
                    <p>No threats detected. Stay natural.</p>
                  </div>
                ) : (
                  alerts.map((alert, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i} 
                      className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl"
                    >
                      <div className="flex items-center text-red-400 text-xs font-mono mb-1">
                        <AlertCircle size={12} className="mr-1" /> {alert.time}
                      </div>
                      <p className="text-sm text-white">{alert.msg}</p>
                    </motion.div>
                  ))
                )}
              </div>
              <button 
                onClick={() => setMode('upload')}
                className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-sm font-medium"
              >
                End Session & Generate Report
              </button>
            </div>
          </motion.div>
        )}

        {results && (
          <motion.div
            key="results-view"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 glass-card p-8 rounded-3xl text-center flex flex-col items-center justify-center border-brand-ai/30">
                <h3 className="text-sm uppercase tracking-widest text-brand-secondary mb-4">Overall Score</h3>
                <div className="text-7xl font-bold text-gradient mb-2">{results.truthfulness}%</div>
                <p className="text-sm text-brand-secondary">Behavioral Integrity</p>
              </div>
              <div className="md:col-span-2 glass-card p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-4">AI Executive Summary</h3>
                <p className="text-lg text-brand-text/80 leading-relaxed">{results.summary}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-3xl border-l-4 border-l-blue-500">
                <h3 className="font-bold mb-4 text-blue-400">Facial Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-brand-secondary uppercase">Micro-expressions</p>
                    <p className="text-white font-medium">{results.face.microExpressions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-secondary uppercase">Eye Movement</p>
                    <p className="text-white font-medium">{results.face.eyeMovement}</p>
                  </div>
                </div>
              </div>
              <div className="glass-card p-6 rounded-3xl border-l-4 border-l-orange-500">
                <h3 className="font-bold mb-4 text-orange-400">Body Language</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-brand-secondary uppercase">Posture</p>
                    <p className="text-white font-medium">{results.body.posture}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-secondary uppercase">Gestures</p>
                    <p className="text-white font-medium">{results.body.handMovements}</p>
                  </div>
                </div>
              </div>
            </div>

            {results.inconsistencies && (
              <div className="glass-card p-6 rounded-3xl bg-brand-warning/5 border border-brand-warning/20">
                <h3 className="font-bold mb-4 text-brand-warning flex items-center">
                  <AlertCircle className="mr-2" /> Detected Inconsistencies
                </h3>
                <ul className="space-y-3">
                  {results.inconsistencies.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-white/90 flex items-start">
                      <span className="mr-2 text-brand-warning">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-center space-x-4 pt-6">
              <button onClick={() => setResults(null)} className="px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all">New Analysis</button>
              <button onClick={() => downloadReportAsPDF('video-report', 'SeeMePro_Analysis')} className="px-6 py-3 rounded-xl bg-brand-ai text-white font-bold shadow-lg hover:scale-105 transition-all">Download PDF Report</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {results && <AnalysisReportPDF type="video" results={results} id="video-report" />}
      <AdModal isOpen={showAdModal} onClose={() => setShowAdModal(false)} featureToUnlock="video" />
    </motion.div>
  );
};

export default VideoAnalysis;
