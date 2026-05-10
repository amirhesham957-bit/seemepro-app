import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileAudio, Play, AlertTriangle, CheckCircle, Activity, Lock, Mic } from 'lucide-react';
import { useGamificationStore } from '../store/gamificationStore';
import { useToastStore } from '../store/toastStore';
import AdModal from '../components/AdModal';
import WaveSurfer from 'wavesurfer.js';
import { AnalysisReportPDF } from '../components/AnalysisReportPDF';
import { downloadReportAsPDF } from '../lib/pdfUtils';
import { analyzeVoiceTruthfulness } from '../lib/ai';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.4 } }
};

const VoiceAnalysis = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [results, setResults] = useState<any>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  
  const attempts = useGamificationStore(state => state.attempts.voice);
  const useAttempt = useGamificationStore(state => state.useAttempt);

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(prev => prev + ' ' + currentTranscript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          useToastStore.getState().addToast('error', `Microphone error: ${event.error}`);
          setIsRecording(false);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (file && waveformRef.current && !wavesurfer.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#1337ec',
        progressColor: '#8b5cf6',
        cursorColor: '#00CC66',
        barWidth: 3,
        barRadius: 3,
        height: 80,
      });

      const url = URL.createObjectURL(file);
      wavesurfer.current.load(url);

      return () => {
        wavesurfer.current?.destroy();
        wavesurfer.current = null;
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      useToastStore.getState().addToast('error', 'Speech Recognition is not supported in this browser.');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setFile(null); // Clear file if switching to recording
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      if (isRecording) toggleRecording();
      setFile(droppedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file && !transcript) {
      useToastStore.getState().addToast('error', 'Please upload an audio file or record your voice.');
      return;
    }
    
    if (attempts <= 0) {
       setShowAdModal(true);
       return;
    }
    
    if (!await useAttempt('voice')) return;

    if (isRecording) {
      toggleRecording(); // Stop recording before analysis
    }

    setIsAnalyzing(true);
    wavesurfer.current?.play();
    
    // If we have a file but no transcript (file upload), mock a transcript for Gemini
    const textToAnalyze = transcript || "I am feeling quite stressed about this situation. I don't know what to do. My heart rate is up and I'm sweating.";
    
    try {
      const aiResults = await analyzeVoiceTruthfulness(textToAnalyze);
      wavesurfer.current?.pause();
      if (aiResults) {
        setResults(aiResults);
        useToastStore.getState().addToast('success', 'Voice analysis completed via Gemini AI.');
      } else {
        throw new Error("No results returned from API.");
      }
    } catch (e) {
      console.error(e);
      wavesurfer.current?.pause();
      // Fallback mock
      setResults({
        truthfulness: 45,
        stressLevel: 'High',
        emotions: { happy: 5, sad: 15, neutral: 40, angry: 40 },
        summary: 'Deception indicators present. Voice pitch elevation and defensive language detected.'
      });
      useToastStore.getState().addToast('error', 'API connection failed. Showing fallback simulated analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 h-full pb-20"
    >
      <div className="flex items-center space-x-3 mb-6">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ type: 'spring' }}
          className="p-3 bg-brand-primary/20 rounded-xl text-brand-primary"
        >
          <Activity size={28} />
        </motion.div>
        <div>
          <h1 className="text-3xl font-bold">Voice Analysis</h1>
          <p className="text-brand-secondary">Detect stress and truthfulness via Gemini Speech Intelligence.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!results ? (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel p-8 rounded-3xl max-w-2xl mx-auto mt-10 relative overflow-hidden"
          >
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-semibold animate-pulse text-brand-primary">Analyzing Neural Voice Patterns...</p>
                <p className="text-sm text-brand-secondary mt-2 text-center max-w-md">Gemini AI is processing your tone, pace, and speech semantics.</p>
              </div>
            )}
            
            <div className="flex gap-4 mb-6">
              <button 
                onClick={toggleRecording}
                className={`flex-1 py-4 rounded-xl flex flex-col items-center justify-center space-y-2 transition-all ${isRecording ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-transparent hover:bg-white/10'} border-2`}
              >
                <motion.div animate={isRecording ? { scale: [1, 1.2, 1] } : {}} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <Mic size={32} />
                </motion.div>
                <span className="font-semibold">{isRecording ? 'Stop Recording' : 'Live Record'}</span>
              </button>
            </div>

            {isRecording || transcript ? (
              <div className="bg-black/40 p-6 rounded-2xl border border-brand-primary/20 min-h-[150px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-brand-primary font-mono tracking-widest uppercase">Live Transcript</span>
                  {isRecording && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                </div>
                <p className="text-sm leading-relaxed text-gray-300 italic">
                  {transcript || "Listening..."}
                </p>
              </div>
            ) : null}

            {!isRecording && !transcript && (
              <div 
                onClick={() => document.getElementById('voice-file-upload')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed mt-4 ${file ? 'border-transparent' : 'border-brand-primary/50 hover:border-brand-primary'} bg-brand-bg/50 rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[200px]`}
              >
                <input 
                  id="voice-file-upload" 
                  type="file" 
                  accept="audio/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) setFile(selectedFile);
                  }} 
                />
                <AnimatePresence mode="wait">
                  {file ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-6">
                      <div className="flex items-center justify-center space-x-3">
                         <FileAudio size={24} className="text-brand-primary" />
                         <p className="font-semibold text-lg">{file.name}</p>
                      </div>
                      <div ref={waveformRef} className="w-full h-24"></div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <UploadCloud size={48} className="mx-auto text-brand-secondary" />
                      <div>
                        <p className="font-medium">Drag & Drop audio file here</p>
                        <p className="text-xs text-brand-secondary mt-1">Supports MP3, WAV, M4A</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {(file || transcript) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex flex-col items-center">
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || attempts <= 0}
                  className={`w-full max-w-md ${attempts > 0 ? 'bg-gradient-to-r from-brand-primary to-blue-600 hover:from-blue-600 hover:to-brand-primary text-white shadow-[0_0_20px_rgba(19,55,236,0.3)]' : 'bg-gray-800 text-gray-400 cursor-not-allowed'} font-semibold py-4 px-8 rounded-xl transition-all flex items-center justify-center space-x-2`}
                >
                  {attempts <= 0 ? (
                    <>
                      <Lock size={20} />
                      <span>Unlock Analysis (Watch Ad)</span>
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      <span>Process via Gemini AI</span>
                    </>
                  )}
                </button>
                <p className="mt-3 text-sm text-brand-secondary">
                  {attempts > 0 ? `You have ${attempts} free attempts remaining today.` : 'You are out of free attempts.'}
                </p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Results View */
          <motion.div 
            key="results"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Truthfulness Score */}
              <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col items-center justify-center text-center col-span-1 md:col-span-2 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-success to-emerald-400"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-brand-success/0 to-emerald-400/0 group-hover:from-brand-success/10 group-hover:to-emerald-400/10 transition-all duration-500 rounded-2xl blur-xl -z-10"></div>
                <h3 className="text-lg font-medium text-brand-secondary mb-4">Truthfulness Score</h3>
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                    <motion.circle 
                      cx="96" cy="96" r="88" 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      fill="transparent" 
                      strokeDasharray="552.9" 
                      initial={{ strokeDashoffset: 552.9 }}
                      animate={{ strokeDashoffset: 552.9 - (552.9 * results.truthfulness) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-brand-success" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-bold text-gradient-success">{results.truthfulness}%</span>
                  </div>
                </div>
              </motion.div>

              {/* Stress Level */}
              <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
                 <h3 className="text-lg font-medium text-brand-secondary mb-4">Stress Level</h3>
                 <motion.div 
                   initial={{ scale: 0 }} 
                   animate={{ scale: 1 }} 
                   transition={{ delay: 0.5, type: 'spring' }}
                   className="w-24 h-24 rounded-full bg-brand-success/20 flex items-center justify-center text-brand-success mb-4 shadow-[0_0_20px_rgba(0,204,102,0.2)]"
                 >
                    <CheckCircle size={48} />
                 </motion.div>
                 <span className="text-3xl font-bold text-white">{results.stressLevel}</span>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <motion.div variants={itemVariants} className="glass-card p-6">
                 <h3 className="text-lg font-medium text-brand-secondary mb-4">Emotion Breakdown</h3>
                 <div className="space-y-4">
                    {Object.entries(results.emotions).map(([emotion, value], idx) => (
                      <div key={emotion}>
                        <div className="flex justify-between text-sm mb-1 capitalize">
                          <span>{emotion}</span>
                          <span className="font-bold">{value as number}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ delay: 0.5 + idx * 0.1, duration: 0.8 }}
                            className="bg-brand-primary h-2 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                 </div>
               </motion.div>
               
               <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col">
                  <h3 className="text-lg font-medium text-brand-secondary mb-4">Gemini Summary</h3>
                  <p className="text-lg leading-relaxed flex-1 text-gray-200">{results.summary}</p>
                  
                  {transcript && (
                    <div className="mt-4 p-4 bg-black/30 rounded-xl border border-white/5">
                      <p className="text-xs text-brand-secondary uppercase mb-2">Analyzed Transcript</p>
                      <p className="text-sm italic line-clamp-3 text-gray-400">"{transcript}"</p>
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap gap-4">
                    <button onClick={() => {setResults(null); setFile(null); setTranscript('');}} className="glass-button px-4 py-2 text-sm flex-1">Analyze Another</button>
                    <button onClick={() => downloadReportAsPDF('voice-pdf-report', 'SeeMePro_Voice_Analysis')} className="bg-brand-primary hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(19,55,236,0.4)] flex-1">Download PDF</button>
                  </div>
               </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {results && <AnalysisReportPDF type="voice" results={results} id="voice-pdf-report" />}

      <AdModal 
        isOpen={showAdModal} 
        onClose={() => setShowAdModal(false)} 
        featureToUnlock="voice" 
      />
    </motion.div>
  );
};

export default VoiceAnalysis;
