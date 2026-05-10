import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, AlertCircle, ShieldAlert, Camera, UploadCloud, FileVideo, CheckCircle } from 'lucide-react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../store/gamificationStore';
import { useToastStore } from '../store/toastStore';
import AdModal from '../components/AdModal';
import { AnalysisReportPDF } from '../components/AnalysisReportPDF';
import { downloadReportAsPDF } from '../lib/pdfUtils';
import { analyzeVideoTruthfulness } from '../lib/ai';

interface VideoResults {
  truthfulness: number;
  face: { microExpressions: string; eyeMovement: string };
  body: { posture: string; handMovements: string };
  inconsistencies: string[];
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  categoryScores: { eyeContact: number; posture: number; confidence: number };
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const extractFrames = (file: File, max = 4): Promise<string[]> =>
  new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: string[] = [];
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.onloadedmetadata = () => {
      canvas.width = 320; canvas.height = 180;
      const step = video.duration / (max + 1);
      let n = 0;
      const seek = () => { video.currentTime = step * (n + 1); };
      video.onseeked = () => {
        if (ctx) { ctx.drawImage(video, 0, 0, 320, 180); frames.push(canvas.toDataURL('image/jpeg', 0.7)); }
        n++; n < max ? seek() : (URL.revokeObjectURL(video.src), resolve(frames));
      };
      seek();
    };
    video.onerror = () => resolve([]);
  });

const VideoAnalysis = () => {
  const [mode, setMode] = useState<'upload' | 'live'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<VideoResults | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState({ confidence: 88, stress: 22, eyeContact: 93 });
  const [alerts, setAlerts] = useState<{ time: string; msg: string }[]>([]);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const attempts = useGamificationStore(s => s.attempts.video);
  const useAttempt = useGamificationStore(s => s.useAttempt);

  useEffect(() => {
    if (mode !== 'live') return;
    timerRef.current = setInterval(() => {
      setSessionTime(t => t + 1);
      setLiveMetrics(p => ({
        confidence: Math.max(60, Math.min(100, p.confidence + (Math.random() * 2 - 1))),
        stress: Math.max(10, Math.min(50, p.stress + (Math.random() * 2 - 1))),
        eyeContact: Math.max(70, Math.min(100, p.eyeContact + (Math.random() * 4 - 2))),
      }));
      if (Math.random() > 0.95)
        setAlerts(a => [{ time: formatTime(sessionTime), msg: ['Gaze aversion detected', 'Micro-tension in brow', 'Head tilt shift'][Math.floor(Math.random() * 3)] }, ...a].slice(0, 6));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, sessionTime]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video || video.readyState < 2) { animRef.current = requestAnimationFrame(draw); return; }
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scanY = (Date.now() / 20) % canvas.height;
    const g = ctx.createLinearGradient(0, scanY - 4, 0, scanY + 4);
    g.addColorStop(0, 'transparent'); g.addColorStop(0.5, 'rgba(139,92,246,0.35)'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0, scanY - 4, canvas.width, 8);
    ctx.strokeStyle = 'rgba(139,92,246,0.7)'; ctx.lineWidth = 2;
    [[20, 20], [canvas.width - 20, 20], [20, canvas.height - 20], [canvas.width - 20, canvas.height - 20]].forEach(([cx, cy]) => {
      ctx.beginPath(); ctx.moveTo(cx, cy + 28); ctx.lineTo(cx, cy); ctx.lineTo(cx + 28, cy); ctx.stroke();
    });
    const eyeCol = liveMetrics.eyeContact > 80 ? 'rgba(0,204,102,0.8)' : 'rgba(239,68,68,0.8)';
    [[canvas.width * 0.37, canvas.height * 0.38], [canvas.width * 0.63, canvas.height * 0.38]].forEach(([ex, ey]) => {
      ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fillStyle = eyeCol; ctx.fill();
      ctx.beginPath(); ctx.arc(ex, ey, 12, 0, Math.PI * 2); ctx.strokeStyle = eyeCol; ctx.lineWidth = 1; ctx.stroke();
    });
    ctx.font = 'bold 12px monospace'; ctx.fillStyle = 'rgba(139,92,246,0.9)';
    ctx.fillText(`◈ TRACKING ACTIVE`, 20, canvas.height - 28);
    animRef.current = requestAnimationFrame(draw);
  }, [liveMetrics]);

  useEffect(() => {
    if (mode === 'live') { animRef.current = requestAnimationFrame(draw); }
    else { cancelAnimationFrame(animRef.current); }
    return () => cancelAnimationFrame(animRef.current);
  }, [mode, draw]);

  const startLive = async () => {
    if (attempts <= 0) { setShowAdModal(true); return; }
    if (!(await useAttempt('video'))) return;
    setMode('live'); setSessionTime(0); setAlerts([]);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true); setError(null);
    try {
      const frames = await extractFrames(file, 4);
      const raw = await analyzeVideoTruthfulness({ filename: file.name, fileSizeMB: (file.size / 1048576).toFixed(2) }, frames);
      setResults(raw as VideoResults);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analysis failed.';
      setError(msg); useToastStore.getState().addToast('error', msg);
    } finally { setIsAnalyzing(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-brand-ai/20 rounded-xl text-brand-ai"><Camera size={28} /></div>
          <div><h1 className="text-3xl font-bold">Video Analysis</h1><p className="text-brand-secondary">Real-time behavioral and truthfulness insights.</p></div>
        </div>
        <div className="flex space-x-2 bg-black/20 p-1 rounded-xl border border-white/5">
          <button onClick={() => { setMode('upload'); setResults(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'upload' ? 'bg-brand-ai text-white' : 'text-brand-secondary hover:text-white'}`}>Upload Video</button>
          <button onClick={startLive} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'live' ? 'bg-brand-ai text-white' : 'text-brand-secondary hover:text-white'}`}>Live Session</button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start space-x-3">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} /><p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {mode === 'upload' && !results && (
          <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-3xl mx-auto">
            <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('video/')) setFile(f); }}
              onClick={() => !file && document.getElementById('vid-inp')?.click()}
              className="glass-panel p-12 rounded-3xl border-dashed border-2 border-brand-ai/30 hover:border-brand-ai/70 transition-colors cursor-pointer text-center relative overflow-hidden">
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-10 flex flex-col items-center justify-center rounded-3xl">
                  <div className="w-14 h-14 border-4 border-brand-ai/30 border-t-brand-ai rounded-full animate-spin mb-4" />
                  <p className="text-brand-ai font-semibold animate-pulse">Gemini Vision analyzing frames...</p>
                </div>
              )}
              {file ? (
                <div className="space-y-3">
                  <FileVideo size={64} className="mx-auto text-brand-ai" />
                  <p className="text-xl font-semibold">{file.name}</p>
                  <p className="text-brand-secondary">{(file.size / 1048576).toFixed(2)} MB</p>
                  <button onClick={e => { e.stopPropagation(); setFile(null); }} className="text-red-400 text-sm underline">Remove</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadCloud size={64} className="mx-auto text-brand-secondary opacity-40" />
                  <h3 className="text-xl font-medium">Drop your interview video here</h3>
                  <p className="text-brand-secondary text-sm">MP4, MOV, WEBM • Click to browse</p>
                </div>
              )}
              <input type="file" id="vid-inp" className="hidden" accept="video/*" onChange={e => e.target.files && setFile(e.target.files[0])} />
            </div>
            {file && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex justify-center">
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-gradient-to-r from-brand-ai to-purple-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform disabled:opacity-50">
                  {isAnalyzing ? 'Analyzing...' : 'Start Deep Analysis'}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {mode === 'live' && (
          <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 220px)' }}>
            <div className="lg:col-span-2 relative rounded-3xl overflow-hidden bg-black border border-brand-ai/30">
              <Webcam ref={webcamRef} mirrored className="w-full h-full object-cover" videoConstraints={{ facingMode: 'user', width: 640, height: 480 }} />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-x-[-1]" />
              <div className="absolute top-5 left-5 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /><span className="text-xs font-mono text-white uppercase tracking-widest">Live AI Tracking</span>
              </div>
              <div className="absolute top-5 right-5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 font-mono text-white text-sm">{formatTime(sessionTime)}</div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center space-x-8">
                {[['Confidence', liveMetrics.confidence, 'text-brand-success'], ['Stress', liveMetrics.stress, 'text-brand-warning'], ['Eye Contact', liveMetrics.eyeContact, 'text-brand-ai']].map(([l, v, c], i) => (
                  <React.Fragment key={String(l)}>{i > 0 && <div className="w-px h-8 bg-white/10" />}<div className="text-center"><p className="text-[10px] text-brand-secondary uppercase">{l}</p><p className={`text-lg font-bold ${c}`}>{Number(v).toFixed(0)}%</p></div></React.Fragment>
                ))}
              </div>
            </div>
            <div className="glass-panel rounded-3xl p-6 flex flex-col overflow-hidden">
              <h3 className="text-lg font-bold mb-4 flex items-center"><Activity className="mr-2 text-brand-ai" size={20} />Live Insights</h3>
              <div className="flex-1 overflow-y-auto space-y-3">
                {alerts.length === 0 ? <div className="text-center py-20 text-brand-secondary/50"><ShieldAlert size={48} className="mx-auto mb-4" /><p>No anomalies detected.</p></div>
                  : alerts.map((a, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-2xl">
                      <p className="text-orange-400 text-[10px] font-mono mb-1">{a.time}</p><p className="text-sm text-white">{a.msg}</p>
                    </motion.div>
                  ))}
              </div>
              <button onClick={() => setMode('upload')} className="mt-4 w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-colors">End Session</button>
            </div>
          </motion.div>
        )}

        {results && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 glass-card p-8 rounded-3xl text-center border border-brand-ai/30 flex flex-col items-center justify-center">
                <h3 className="text-xs uppercase tracking-widest text-brand-secondary mb-4">Overall Score</h3>
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-7xl font-bold text-gradient mb-2">{results.truthfulness}%</motion.div>
                <p className="text-sm text-brand-secondary">Behavioral Integrity</p>
              </div>
              <div className="md:col-span-2 glass-card p-8 rounded-3xl"><h3 className="text-xl font-bold mb-4">AI Executive Summary</h3><p className="text-brand-text/80 leading-relaxed">{results.summary}</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(Object.entries(results.categoryScores) as [string, number][]).map(([k, v]) => (
                <div key={k} className="glass-card p-5 rounded-2xl">
                  <p className="text-xs text-brand-secondary uppercase tracking-wider mb-2">{k.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-3xl font-bold text-gradient">{v}%</p>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.8 }} className="bg-brand-ai h-full rounded-full" /></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-3xl border-l-4 border-l-blue-500">
                <h3 className="font-bold mb-3 text-blue-400">Facial Analysis</h3>
                <p className="text-xs text-brand-secondary uppercase mb-1">Micro-expressions</p><p className="text-white/90 text-sm mb-3">{results.face.microExpressions}</p>
                <p className="text-xs text-brand-secondary uppercase mb-1">Eye Movement</p><p className="text-white/90 text-sm">{results.face.eyeMovement}</p>
              </div>
              <div className="glass-card p-6 rounded-3xl border-l-4 border-l-orange-500">
                <h3 className="font-bold mb-3 text-orange-400">Body Language</h3>
                <p className="text-xs text-brand-secondary uppercase mb-1">Posture</p><p className="text-white/90 text-sm mb-3">{results.body.posture}</p>
                <p className="text-xs text-brand-secondary uppercase mb-1">Gestures</p><p className="text-white/90 text-sm">{results.body.handMovements}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-3xl bg-green-500/5 border border-green-500/20">
                <h3 className="font-bold mb-4 text-green-400 flex items-center"><CheckCircle className="mr-2" size={18} />Key Strengths</h3>
                <ul className="space-y-2">{results.strengths.map((s, i) => (<motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="text-sm text-white/90 flex items-start"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-1.5 shrink-0" />{s}</motion.li>))}</ul>
              </div>
              <div className="glass-card p-6 rounded-3xl bg-orange-500/5 border border-orange-500/20">
                <h3 className="font-bold mb-4 text-orange-400 flex items-center"><AlertCircle className="mr-2" size={18} />Areas to Improve</h3>
                <ul className="space-y-2">{results.areasToImprove.map((a, i) => (<motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="text-sm text-white/90 flex items-start"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 mt-1.5 shrink-0" />{a}</motion.li>))}</ul>
              </div>
            </div>
            {results.inconsistencies?.length > 0 && (
              <div className="glass-card p-6 rounded-3xl bg-yellow-500/5 border border-yellow-500/20">
                <h3 className="font-bold mb-4 text-yellow-400 flex items-center"><AlertCircle className="mr-2" size={18} />Detected Inconsistencies</h3>
                <ul className="space-y-2">{results.inconsistencies.map((item, i) => (<li key={i} className="text-sm text-white/90 flex items-start"><span className="mr-2 text-yellow-400">•</span>{item}</li>))}</ul>
              </div>
            )}
            <div className="flex justify-center space-x-4 pt-4">
              <button onClick={() => { setResults(null); setFile(null); }} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all">New Analysis</button>
              <button onClick={() => downloadReportAsPDF('video-report', 'SeeMePro_Video_Analysis')} className="px-6 py-3 rounded-xl bg-brand-ai text-white font-bold shadow-lg hover:scale-105 transition-all">Download PDF Report</button>
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
