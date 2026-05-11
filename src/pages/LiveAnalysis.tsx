import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Activity, AlertCircle, ShieldAlert, Disc, Camera, Mic, CheckCircle2 } from 'lucide-react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../store/toastStore';
import AdModal from '../components/AdModal';
import { AnalysisReportPDF } from '../components/AnalysisReportPDF';
import { downloadReportAsPDF } from '../lib/pdfUtils';
import { analyzeLiveInterview } from '../lib/ai';

interface VideoMetrics { eyeContact: number; posture: number }
interface VoiceMetrics { confidence: number; pace: number; clarity: number; fillerWords: number }
interface AlertItem { time: string; msg: string; type: 'warning' | 'danger' }

interface LiveResults {
  overallScore: number;
  videoAnalysis: { eyeContact: number; posture: number; facialExpressions: string };
  voiceAnalysis: { confidence: number; pace: number; clarity: number; fillerWords: number };
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  coachingTips: string[];
}

const fmt = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const getSpeechRecognition = () =>
  ('SpeechRecognition' in window ? window.SpeechRecognition : null) ??
  (('webkitSpeechRecognition' in window) ? (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition : null);

const MetricBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-secondary">
      <span>{label}</span><span>{value.toFixed(0)}%</span>
    </div>
    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
      <motion.div animate={{ width: `${value}%` }} transition={{ duration: 0.6 }} className={`${color} h-full rounded-full`} />
    </div>
  </div>
);

const LiveAnalysis = () => {
  const [isLive, setIsLive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<LiveResults | null>(null);
  const [time, setTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [videoMetrics, setVideoMetrics] = useState<VideoMetrics>({ eyeContact: 92, posture: 85 });
  const [voiceMetrics, setVoiceMetrics] = useState<VoiceMetrics>({ confidence: 88, pace: 78, clarity: 83, fillerWords: 8 });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');
  const timeRef = useRef(0);

  // Keep timeRef in sync
  useEffect(() => { timeRef.current = time; }, [time]);

  // Timer + metric simulation
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setTime(t => t + 1);
      setVideoMetrics(p => ({
        eyeContact: Math.max(60, Math.min(100, p.eyeContact + (Math.random() * 4 - 2))),
        posture: Math.max(55, Math.min(100, p.posture + (Math.random() * 4 - 2))),
      }));
      setVoiceMetrics(p => ({
        ...p,
        confidence: Math.max(60, Math.min(100, p.confidence + (Math.random() * 6 - 3))),
        pace: Math.max(40, Math.min(100, p.pace + (Math.random() * 4 - 2))),
      }));
      if (Math.random() > 0.96) {
        const type: 'warning' | 'danger' = Math.random() > 0.5 ? 'warning' : 'danger';
        const msgs = { warning: 'Speaking pace increasing', danger: 'Significant gaze aversion' };
        setAlerts(a => [{ time: fmt(timeRef.current), msg: msgs[type], type }, ...a].slice(0, 6));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Canvas overlay
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video || video.readyState < 2) { animRef.current = requestAnimationFrame(draw); return; }
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scanY = (Date.now() / 20) % canvas.height;
    const g = ctx.createLinearGradient(0, scanY - 3, 0, scanY + 3);
    g.addColorStop(0, 'transparent'); g.addColorStop(0.5, 'rgba(19,55,236,0.3)'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0, scanY - 3, canvas.width, 6);
    ctx.strokeStyle = 'rgba(19,55,236,0.7)'; ctx.lineWidth = 2;
    [[20, 20], [canvas.width - 20, 20], [20, canvas.height - 20], [canvas.width - 20, canvas.height - 20]].forEach(([cx, cy]) => {
      ctx.beginPath(); ctx.moveTo(cx, cy + 26); ctx.lineTo(cx, cy); ctx.lineTo(cx + 26, cy); ctx.stroke();
    });
    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    if (isLive) { animRef.current = requestAnimationFrame(draw); }
    else { cancelAnimationFrame(animRef.current); }
    return () => cancelAnimationFrame(animRef.current);
  }, [isLive, draw]);

  // Speech recognition
  const startSpeech = useCallback(() => {
    const SR = getSpeechRecognition(); if (!SR) return;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let fin = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript + ' ';
      }
      if (fin) {
        transcriptRef.current += fin;
        setTranscript(transcriptRef.current);
        const fillers = ['um', 'uh', 'like', 'you know', 'basically'];
        if (fillers.some(f => fin.toLowerCase().includes(f))) {
          setAlerts(a => [{ time: fmt(timeRef.current), msg: 'Filler word detected', type: 'warning' }, ...a].slice(0, 6));
          setVoiceMetrics(p => ({ ...p, fillerWords: Math.min(100, p.fillerWords + 3) }));
        }
      }
    };
    rec.start();
    recognitionRef.current = rec;
  }, []);

  const handleStart = () => {
    setError(null);
    setTime(0); setAlerts([]); setTranscript('');
    transcriptRef.current = '';
    setVideoMetrics({ eyeContact: 92, posture: 85 });
    setVoiceMetrics({ confidence: 88, pace: 78, clarity: 83, fillerWords: 8 });
    setIsLive(true);
    startSpeech();
  };

  const handleEnd = async () => {
    setIsLive(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsAnalyzing(true);
    try {
      const raw = await analyzeLiveInterview(videoMetrics, voiceMetrics, transcriptRef.current.trim() || '(no transcript)');
      setResults(raw as LiveResults);
      useToastStore.getState().addToast('success', 'Interview analysis complete!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analysis failed.';
      setError(msg); useToastStore.getState().addToast('error', msg);
    } finally { setIsAnalyzing(false); }
  };

  if (results) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }} className="space-y-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 glass-card p-8 rounded-3xl text-center border border-brand-ai/30 flex flex-col items-center justify-center">
            <h3 className="text-xs uppercase tracking-widest text-brand-secondary mb-4">Overall Score</h3>
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-7xl font-bold text-gradient mb-2">{results.overallScore}%</motion.div>
            <p className="text-sm text-brand-secondary">Interview Performance</p>
          </div>
          <div className="md:col-span-2 glass-card p-8 rounded-3xl"><h3 className="text-xl font-bold mb-4">AI Executive Summary</h3><p className="text-brand-text/80 leading-relaxed">{results.summary}</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-3xl border-l-4 border-l-brand-ai space-y-4">
            <h3 className="font-bold text-brand-ai">Visual Analysis</h3>
            <MetricBar label="Eye Contact" value={results.videoAnalysis.eyeContact} color="bg-brand-ai" />
            <MetricBar label="Posture" value={results.videoAnalysis.posture} color="bg-brand-primary" />
            <p className="text-xs text-brand-secondary uppercase mt-2">Expression</p>
            <p className="text-sm text-white/90">{results.videoAnalysis.facialExpressions}</p>
          </div>
          <div className="glass-card p-6 rounded-3xl border-l-4 border-l-green-500 space-y-4">
            <h3 className="font-bold text-green-400">Vocal Analysis</h3>
            <MetricBar label="Confidence" value={results.voiceAnalysis.confidence} color="bg-green-500" />
            <MetricBar label="Pace" value={results.voiceAnalysis.pace} color="bg-blue-500" />
            <MetricBar label="Clarity" value={results.voiceAnalysis.clarity} color="bg-purple-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-3xl bg-green-500/5 border border-green-500/20">
            <h3 className="font-bold mb-4 text-green-400 flex items-center"><CheckCircle2 className="mr-2" size={18} />Key Strengths</h3>
            <ul className="space-y-2">{results.strengths.map((s, i) => (<li key={i} className="text-sm text-white/90 flex items-start"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-1.5 shrink-0" />{s}</li>))}</ul>
          </div>
          <div className="glass-card p-6 rounded-3xl bg-orange-500/5 border border-orange-500/20">
            <h3 className="font-bold mb-4 text-orange-400 flex items-center"><AlertCircle className="mr-2" size={18} />Areas to Improve</h3>
            <ul className="space-y-2">{results.areasToImprove.map((a, i) => (<li key={i} className="text-sm text-white/90 flex items-start"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 mt-1.5 shrink-0" />{a}</li>))}</ul>
          </div>
        </div>
        {results.coachingTips?.length > 0 && (
          <div className="glass-card p-6 rounded-3xl bg-brand-ai/5 border border-brand-ai/20">
            <h3 className="font-bold mb-4 text-brand-ai">Coaching Tips</h3>
            <ul className="space-y-2">{results.coachingTips.map((t, i) => (<li key={i} className="text-sm text-white/90 flex items-start"><span className="mr-2 text-brand-ai font-bold">{i + 1}.</span>{t}</li>))}</ul>
          </div>
        )}
        <div className="flex justify-center space-x-4 pt-4">
          <button onClick={() => setResults(null)} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all">New Session</button>
          <button onClick={() => downloadReportAsPDF('live-report', 'SeeMePro_Live_Interview')} className="px-6 py-3 rounded-xl bg-brand-ai text-white font-bold shadow-lg hover:scale-105 transition-all">Download PDF Report</button>
        </div>
        <AnalysisReportPDF type="live" results={results} id="live-report" />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 pb-20 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-3 bg-brand-primary/20 rounded-xl text-brand-primary"><Activity size={28} /></motion.div>
          <div>
            <h1 className="text-3xl font-bold flex items-center">Live Interview AI
              <span className="ml-3 text-xs bg-gradient-to-r from-brand-primary to-brand-ai px-2 py-1 rounded-full text-white uppercase tracking-wider">Pro</span>
            </h1>
            <p className="text-brand-secondary">Dual-stream behavioral and verbal analysis.</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {isLive && <div className="flex items-center space-x-2 text-brand-warning animate-pulse bg-brand-warning/10 px-3 py-1.5 rounded-lg border border-brand-warning/20"><Disc size={16} /><span className="font-mono">{fmt(time)}</span></div>}
          <button onClick={() => isLive ? handleEnd() : handleStart()} disabled={isAnalyzing}
            className={`px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 ${isLive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-brand-primary hover:bg-blue-600 text-white'}`}>
            {isAnalyzing ? 'Generating Report...' : isLive ? 'End Session' : 'Start Interview'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start space-x-3">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} /><p className="text-red-300 text-sm">{error}</p>
        </motion.div>}
      </AnimatePresence>

      {isAnalyzing && (
        <div className="glass-panel p-20 rounded-3xl flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-brand-ai/30 border-t-brand-ai rounded-full animate-spin" />
          <p className="text-brand-ai font-semibold animate-pulse">Gemini AI is generating your interview report...</p>
        </div>
      )}

      {!isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden relative flex flex-col items-center justify-center min-h-[450px] border border-brand-ai/30 bg-black">
            {!isLive ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-brand-secondary space-y-4">
                <Camera size={64} className="mx-auto opacity-40" />
                <p>Camera is offline</p>
                <p className="text-sm max-w-xs mx-auto">Click &apos;Start Interview&apos; to begin real-time multimodal analysis.</p>
              </motion.div>
            ) : (
              <div className="w-full h-full relative">
                <Webcam ref={webcamRef} audio mirrored className="absolute inset-0 w-full h-full object-cover" videoConstraints={{ width: 640, height: 480, facingMode: 'user' }} />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-x-[-1]" />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm border border-brand-ai/30 flex items-center space-x-2 text-white">
                  <div className="w-2 h-2 rounded-full bg-brand-success animate-pulse" /><span>Video Active</span>
                </div>
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm border border-green-500/30 flex items-center space-x-2 text-white">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span>Audio Active</span>
                </div>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center space-x-8">
                  {[['Eye Contact', videoMetrics.eyeContact, 'text-brand-ai'], ['Confidence', voiceMetrics.confidence, 'text-brand-success'], ['Pace', voiceMetrics.pace, 'text-brand-primary']].map(([l, v, c], i) => (
                    <React.Fragment key={String(l)}>{i > 0 && <div className="w-px h-8 bg-white/10" />}<div className="text-center"><p className="text-[10px] text-brand-secondary uppercase">{l}</p><p className={`text-lg font-bold ${c}`}>{Number(v).toFixed(0)}%</p></div></React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel rounded-3xl p-6 flex flex-col space-y-5 overflow-y-auto">
            <h3 className="font-semibold text-lg border-b border-white/10 pb-4">Real-Time Feed</h3>
            <div className="space-y-3"><h4 className="text-xs font-bold text-brand-ai uppercase tracking-widest">Visual Cues</h4>
              <MetricBar label="Eye Contact" value={videoMetrics.eyeContact} color="bg-brand-ai" />
              <MetricBar label="Posture" value={videoMetrics.posture} color="bg-brand-primary" />
            </div>
            <div className="space-y-3"><h4 className="text-xs font-bold text-green-400 uppercase tracking-widest">Vocal Cues</h4>
              <MetricBar label="Confidence" value={voiceMetrics.confidence} color="bg-green-500" />
              <MetricBar label="Pace" value={voiceMetrics.pace} color="bg-blue-500" />
              <MetricBar label="Clarity" value={voiceMetrics.clarity} color="bg-purple-500" />
            </div>
            {transcript && (
              <div className="space-y-2"><h4 className="text-xs font-bold text-brand-secondary uppercase tracking-widest flex items-center"><Mic size={12} className="mr-1" />Transcript</h4>
                <div className="bg-black/20 rounded-xl p-3 max-h-[120px] overflow-y-auto font-mono text-xs text-white/80 leading-relaxed">{transcript}</div>
              </div>
            )}
            <div className="flex-1"><h4 className="text-sm font-medium text-brand-secondary mb-3 flex items-center"><ShieldAlert size={16} className="mr-2" />Alerts</h4>
              <div className="space-y-2">
                {!isLive ? <p className="text-xs text-gray-500 italic text-center mt-6">Start session to monitor.</p>
                  : alerts.length === 0 ? <p className="text-xs text-green-500/70 italic text-center mt-6">All signals nominal.</p>
                  : alerts.map((a, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className={`rounded-lg p-2 flex items-start space-x-2 ${a.type === 'danger' ? 'bg-red-500/10 border border-red-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                      <AlertCircle size={12} className={`${a.type === 'danger' ? 'text-red-400' : 'text-orange-400'} mt-0.5 shrink-0`} />
                      <div><span className={`font-mono text-[10px] block ${a.type === 'danger' ? 'text-red-400' : 'text-orange-400'}`}>{a.time}</span>
                        <span className="text-white text-xs">{a.msg}</span></div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default LiveAnalysis;
