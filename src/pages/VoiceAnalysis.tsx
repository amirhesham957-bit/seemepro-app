import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Activity, AlertCircle, CheckCircle2, WifiOff } from 'lucide-react';
import { useGamificationStore } from '../store/gamificationStore';
import { useToastStore } from '../store/toastStore';
import AdModal from '../components/AdModal';
import { analyzeVoiceTruthfulness } from '../lib/ai';
import { downloadReportAsPDF } from '../lib/pdfUtils';
import { AnalysisReportPDF } from '../components/AnalysisReportPDF';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CategoryScores {
  voiceClarity: number;
  confidence: number;
  pace: number;
  fillerWordsScore: number;
}

interface Emotions {
  happy: number;
  sad: number;
  neutral: number;
  angry: number;
}

interface VoiceResults {
  truthfulness: number;
  stressLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  emotions: Emotions;
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  categoryScores: CategoryScores;
}

// ─── Browser Compatibility ────────────────────────────────────────────────────

const getSpeechRecognition = (): typeof window.SpeechRecognition | null => {
  if ('SpeechRecognition' in window) return window.SpeechRecognition;
  if ('webkitSpeechRecognition' in window) return (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;
  return null;
};

const isSpeechSupported = (): boolean => getSpeechRecognition() !== null;

// ─── Waveform Canvas Component ───────────────────────────────────────────────

const WaveformVisualizer = ({ isActive }: { isActive: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isActive) {
      cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      // Draw flat line when inactive
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.strokeStyle = 'rgba(34,197,94,0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      return;
    }

    let audioCtx: AudioContext;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const draw = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          animFrameRef.current = requestAnimationFrame(draw);
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteTimeDomainData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Glow effect
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(34,197,94,0.6)';
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(34,197,94,0.9)';
          ctx.lineWidth = 2;

          const sliceWidth = canvas.width / bufferLength;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
          }
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        };
        draw();
      } catch {
        // Mic access denied — draw flat line
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    start();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtx?.close();
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={80}
      className="w-full rounded-xl bg-black/20"
    />
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const VoiceAnalysis = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<VoiceResults | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [fillerCount, setFillerCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported] = useState(isSpeechSupported);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const startTimeRef = useRef<number>(0);

  const attempts = useGamificationStore(state => state.attempts.voice);
  const useAttempt = useGamificationStore(state => state.useAttempt);

  const FILLERS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'right', 'so'];

  const countFillers = useCallback((text: string): number => {
    const lower = text.toLowerCase();
    return FILLERS.reduce((count, filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, 'g');
      return count + (lower.match(regex)?.length ?? 0);
    }, 0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleStartRecording = async () => {
    if (!speechSupported) {
      setError('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (attempts <= 0) {
      setShowAdModal(true);
      return;
    }

    if (!(await useAttempt('voice'))) return;

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setFillerCount(0);
    setWordCount(0);
    finalTranscriptRef.current = '';
    startTimeRef.current = Date.now();

    const SpeechRecognitionClass = getSpeechRecognition()!;
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let newFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          newFinal += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }

      if (newFinal) {
        finalTranscriptRef.current += newFinal + ' ';
        setTranscript(finalTranscriptRef.current);
        setFillerCount(countFillers(finalTranscriptRef.current));
        setWordCount(finalTranscriptRef.current.trim().split(/\s+/).filter(Boolean).length);
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions and try again.');
      } else if (event.error === 'no-speech') {
        // Ignore — no-speech is non-fatal
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      // Auto-restarts only if we're still supposed to be recording
      if (recognitionRef.current && isRecording) {
        try { recognition.start(); } catch { /* already stopped */ }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      setError('Failed to start speech recognition. Please try again.');
    }
  };

  const handleStopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
    setInterimTranscript('');
  };

  const handleAnalyze = async () => {
    const finalText = finalTranscriptRef.current.trim();
    if (!finalText) {
      useToastStore.getState().addToast('error', 'No transcript to analyze. Please record some speech first.');
      return;
    }
    if (finalText.split(/\s+/).length < 10) {
      useToastStore.getState().addToast('error', 'Transcript too short. Please speak for at least a few sentences.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const rawResult = await analyzeVoiceTruthfulness(finalText);
      setResults(rawResult as VoiceResults);
      useToastStore.getState().addToast('success', 'Voice analysis complete!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed.';
      setError(msg);
      useToastStore.getState().addToast('error', msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const elapsedSeconds = isRecording ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
  const wpm = elapsedSeconds > 10 ? Math.round((wordCount / elapsedSeconds) * 60) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
            <Mic size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Voice Analysis</h1>
            <p className="text-brand-secondary">Analyze vocal tone, clarity, and confidence using AI.</p>
          </div>
        </div>

        {!speechSupported && (
          <div className="flex items-center space-x-2 text-orange-400 text-sm bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20">
            <WifiOff size={16} />
            <span>Chrome/Edge required for live transcription</span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start space-x-3"
          >
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!results ? (
          <motion.div
            key="recording-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Record Panel */}
            <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center min-h-[420px] text-center relative overflow-hidden">
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex flex-col items-center justify-center rounded-3xl">
                  <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mb-4" />
                  <p className="text-green-400 font-semibold animate-pulse">Gemini AI is interpreting your voice...</p>
                  <p className="text-brand-secondary text-sm mt-2">This may take 10–20 seconds</p>
                </div>
              )}

              {/* Mic Pulse Button */}
              <motion.div
                animate={isRecording ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={isRecording ? { repeat: Infinity, duration: 1.4 } : {}}
                className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${
                  isRecording ? 'bg-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'bg-green-500/10'
                }`}
              >
                <Mic size={48} className={isRecording ? 'text-red-400' : 'text-green-400'} />
              </motion.div>

              <h3 className="text-2xl font-bold mb-2">
                {isRecording ? 'Recording in progress...' : 'Ready to analyze?'}
              </h3>
              <p className="text-brand-secondary mb-8 max-w-xs text-sm">
                {isRecording
                  ? 'Speak clearly and naturally. AI is monitoring your tone, pace, and clarity.'
                  : 'Click below to start recording your voice for instant AI vocal feedback.'}
              </p>

              {/* Live Stats */}
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex space-x-6 mb-6 text-center"
                >
                  <div>
                    <p className="text-2xl font-bold text-green-400">{wordCount}</p>
                    <p className="text-[10px] text-brand-secondary uppercase">Words</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">{fillerCount}</p>
                    <p className="text-[10px] text-brand-secondary uppercase">Fillers</p>
                  </div>
                  {wpm > 0 && (
                    <div>
                      <p className="text-2xl font-bold text-blue-400">{wpm}</p>
                      <p className="text-[10px] text-brand-secondary uppercase">WPM</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Record / Stop Button */}
              {isRecording ? (
                <button
                  onClick={handleStopRecording}
                  className="px-10 py-4 rounded-2xl font-bold text-lg bg-red-500 hover:bg-red-600 text-white transition-all shadow-xl"
                >
                  Stop Recording
                </button>
              ) : (
                <button
                  onClick={handleStartRecording}
                  disabled={isAnalyzing}
                  className="px-10 py-4 rounded-2xl font-bold text-lg bg-green-500 hover:bg-green-600 text-white transition-all shadow-xl disabled:opacity-50"
                >
                  Start Recording
                </button>
              )}

              {/* Waveform */}
              <div className="mt-6 w-full">
                <WaveformVisualizer isActive={isRecording} />
              </div>
            </div>

            {/* Transcript Panel */}
            <div className="glass-panel p-8 rounded-3xl flex flex-col">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Activity className="mr-2 text-green-400" size={20} />
                Live Transcript
              </h3>

              <div className="flex-1 bg-black/20 rounded-2xl p-6 overflow-y-auto min-h-[260px] max-h-[340px] font-mono text-sm leading-relaxed">
                {transcript ? (
                  <span className="text-white/90">{transcript}</span>
                ) : (
                  <span className="text-brand-secondary italic">Your speech will appear here in real-time...</span>
                )}
                {interimTranscript && (
                  <span className="text-green-400/60 italic">{interimTranscript}</span>
                )}
              </div>

              {/* Filler word chips */}
              {fillerCount > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {FILLERS.map(f => {
                    const count = (finalTranscriptRef.current.toLowerCase().match(new RegExp(`\\b${f}\\b`, 'g')) || []).length;
                    if (count === 0) return null;
                    return (
                      <span key={f} className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded-full border border-orange-500/30">
                        &ldquo;{f}&rdquo; ×{count}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={isRecording || isAnalyzing || !transcript}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isAnalyzing ? 'Analyzing with Gemini AI...' : 'Run AI Analysis'}
                </button>
                {isRecording && (
                  <p className="text-center text-xs text-brand-secondary mt-2">Stop recording first to analyze</p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ─── Results View ─────────────────────────────────────────── */
          <motion.div
            key="results-view"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="space-y-6"
          >
            {/* Score + Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 glass-card p-8 rounded-3xl text-center flex flex-col items-center justify-center border border-green-500/30">
                <h3 className="text-xs uppercase tracking-widest text-brand-secondary mb-4">Clarity Score</h3>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="text-7xl font-bold text-gradient mb-2"
                >
                  {results.categoryScores.voiceClarity}%
                </motion.div>
                <p className="text-sm text-brand-secondary">Vocal Articulation</p>
                <div className="mt-4 px-3 py-1 rounded-full text-xs font-semibold border" style={{
                  borderColor: results.stressLevel === 'Low' ? 'rgba(34,197,94,0.4)' : results.stressLevel === 'Critical' ? 'rgba(239,68,68,0.4)' : 'rgba(251,146,60,0.4)',
                  color: results.stressLevel === 'Low' ? '#4ade80' : results.stressLevel === 'Critical' ? '#f87171' : '#fb923c',
                  backgroundColor: results.stressLevel === 'Low' ? 'rgba(34,197,94,0.1)' : results.stressLevel === 'Critical' ? 'rgba(239,68,68,0.1)' : 'rgba(251,146,60,0.1)',
                }}>
                  Stress: {results.stressLevel}
                </div>
              </div>

              <div className="md:col-span-2 glass-card p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-4">AI Executive Summary</h3>
                <p className="text-brand-text/80 leading-relaxed">{results.summary}</p>
              </div>
            </div>

            {/* Vocal Metrics + Emotions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-3xl border-l-4 border-l-green-500">
                <h3 className="text-lg font-medium mb-4 text-green-400">Vocal Metrics</h3>
                <div className="space-y-4">
                  <MetricRow label="Confidence" value={results.categoryScores.confidence} color="bg-green-500" />
                  <MetricRow label="Speaking Pace" value={results.categoryScores.pace} color="bg-blue-500" />
                  <MetricRow label="Filler Word Score" value={results.categoryScores.fillerWordsScore} color="bg-purple-500" />
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl border-l-4 border-l-purple-500">
                <h3 className="text-lg font-medium mb-4 text-purple-400">Emotional Tone</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(results.emotions) as [string, number][]).map(([emo, val]) => (
                    <div key={emo} className="bg-black/20 p-3 rounded-xl">
                      <p className="text-[10px] text-brand-secondary uppercase tracking-wider">{emo}</p>
                      <p className="text-xl font-bold">{val}%</p>
                      <div className="w-full bg-white/5 rounded-full h-1 mt-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          className="h-full rounded-full bg-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strengths + Improve */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-3xl bg-green-500/5 border border-green-500/20">
                <h3 className="font-bold mb-4 text-green-400 flex items-center">
                  <CheckCircle2 className="mr-2" size={20} /> Key Strengths
                </h3>
                <ul className="space-y-2">
                  {results.strengths.map((s, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="text-sm text-white/90 flex items-start"
                    >
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-1.5 shrink-0" />
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-6 rounded-3xl bg-orange-500/5 border border-orange-500/20">
                <h3 className="font-bold mb-4 text-orange-400 flex items-center">
                  <AlertCircle className="mr-2" size={20} /> Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {results.areasToImprove.map((a, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="text-sm text-white/90 flex items-start"
                    >
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 mt-1.5 shrink-0" />
                      {a}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4 pt-6">
              <button
                onClick={() => { setResults(null); setTranscript(''); setFillerCount(0); setWordCount(0); }}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
              >
                New Analysis
              </button>
              <button
                onClick={() => downloadReportAsPDF('voice-report', 'SeeMePro_Voice_Analysis')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all"
              >
                Download PDF Report
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdModal isOpen={showAdModal} onClose={() => setShowAdModal(false)} featureToUnlock="voice" />
      {results && <AnalysisReportPDF type="voice" results={results} id="voice-report" />}
    </motion.div>
  );
};

// ─── Metric Row Component ─────────────────────────────────────────────────────

const MetricRow = ({ label, value, color = 'bg-green-500' }: { label: string; value: number; color?: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-brand-secondary uppercase tracking-wider">{label}</span>
      <span className="text-white font-semibold">{value}%</span>
    </div>
    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`${color} h-full rounded-full`}
      />
    </div>
  </div>
);

export default VoiceAnalysis;
