import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Activity, Video, Star, Zap, ChevronRight, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useGamificationStore } from '../store/gamificationStore';
import { useToastStore } from '../store/toastStore';

const VoiceAnalysis = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showAdModal, setShowAdModal] = useState(false);

  const attempts = useGamificationStore(state => state.attempts.voice);
  const useAttempt = useGamificationStore(state => state.useAttempt);

  // Mocking Web Speech API and Audio visualization
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        const mockPhrases = [
          "I believe my experience in software development makes me a strong candidate...",
          "Actually, looking back at that project, I learned that communication is key...",
          "In my previous role, I managed a team of five engineers and led several successful launches...",
          "I am really excited about the opportunity to join this innovative team..."
        ];
        setTranscript(prev => prev + " " + mockPhrases[Math.floor(Math.random() * mockPhrases.length)]);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    if (attempts <= 0) {
      setShowAdModal(true);
      return;
    }

    if (!(await useAttempt('voice'))) return;

    setIsRecording(true);
    setTranscript('');
  };

  const handleAnalyze = async () => {
    if (!transcript) {
      useToastStore.getState().addToast('error', 'No transcript found to analyze.');
      return;
    }

    setIsAnalyzing(true);
    try {
      // In real implementation, we'd send the transcript to Gemini
      // For now, we use the mock structure consistent with our AI service
      const mockResult = {
        truthfulness: 88,
        stressLevel: 'Low',
        emotions: { happy: 30, sad: 5, neutral: 60, angry: 5 },
        summary: 'The speaker demonstrates high levels of clarity and confidence. The speaking pace is steady, and filler word usage is minimal, indicating professional presence.',
        strengths: ['Steady speaking pace', 'Clear articulation', 'Positive emotional tone'],
        areasToImprove: ['Slightly repetitive sentence structures', 'Occasional pitch drops at end of sentences'],
        categoryScores: { voiceClarity: 92, confidence: 88, pace: 85, fillerWordsScore: 90 }
      };
      
      // Simulate AI delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      setResults(mockResult);
      useToastStore.getState().addToast('success', 'Voice analysis completed successfully.');
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
          <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
            <Mic size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Voice Analysis</h1>
            <p className="text-brand-secondary">Analyze vocal tone, clarity, and confidence.</p>
          </div>
        </div>

        <div className="flex space-x-2 bg-black/20 p-1 rounded-xl border border-white/5">
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-500 shadow-lg">Record</button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-brand-secondary hover:text-white">Live Session</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!results ? (
          <motion.div
            key="recording-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center min-h-[400px] text-center relative overflow-hidden">
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mb-4" />
                  <p className="text-green-500 font-medium animate-pulse">Gemini AI is interpreting your voice...</p>
                </div>
              )}

              <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${isRecording ? 'bg-red-500/20 scale-110 animate-pulse' : 'bg-green-500/10'}`}>
                <Mic size={48} className={isRecording ? 'text-red-500' : 'text-green-500'} />
              </div>

              <h3 className="text-2xl font-bold mb-2">{isRecording ? 'Recording in progress...' : 'Ready to analyze?'}</h3>
              <p className="text-brand-secondary mb-8 max-w-xs">
                {isRecording 
                  ? 'Speak clearly and naturally. We are monitoring your tone, pace, and clarity.' 
                  : 'Click the button below to start a recording session for instant vocal feedback.'}
              </p>

              <button 
                onClick={handleToggleRecording}
                className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
            </div>

            <div className="glass-panel p-8 rounded-3xl flex flex-col">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Activity className="mr-2 text-green-400" size={20} />
                Live Transcript
              </h3>
              <div className="flex-1 bg-black/20 rounded-2xl p-6 overflow-y-auto max-h-[300px] text-brand-text/80 font-mono text-sm leading-relaxed">
                {transcript || <span className="text-brand-secondary italic">Your speech will appear here in real-time...</span>}
              </div>
              
              <div className="mt-6 flex space-x-4">
                <button 
                  onClick={handleAnalyze}
                  disabled={!isRecording || isAnalyzing}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results-view"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 glass-card p-8 rounded-3xl text-center flex flex-col items-center justify-center border-green-500/30">
                <h3 className="text-sm uppercase tracking-widest text-brand-secondary mb-4">Clarity Score</h3>
                <div className="text-7xl font-bold text-gradient mb-2">{results.categoryScores.voiceClarity}%</div>
                <p className="text-sm text-brand-secondary">Vocal Articulation</p>
              </div>
              <div className="md:col-span-2 glass-card p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-4">AI Executive Summary</h3>
                <p className="text-lg text-brand-text/80 leading-relaxed">{results.summary}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="glass-card p-6 rounded-3xl border-l-4 border-l-green-500">
                 <h3 className="text-lg font-medium mb-4 text-green-400">Vocal Metrics</h3>
                 <div className="space-y-4">
                   <MetricRow label="Confidence" value={results.categoryScores.confidence} />
                   <MetricRow label="Speaking Pace" value={results.categoryScores.pace} />
                   <MetricRow label="Filler Word Score" value={results.categoryScores.fillerWordsScore} />
                 </div>
               </div>

               <div className="glass-card p-6 rounded-3xl border-l-4 border-l-purple-500">
                 <h3 className="text-lg font-medium mb-4 text-purple-400">Emotional Tone</h3>
                 <div className="grid grid-cols-2 gap-4">
                   {Object.entries(results.emotions).map(([emo, val]) => (
                     <div key={emo} className="bg-black/20 p-3 rounded-xl">
                       <p className="text-[10px] text-brand-secondary uppercase">{emo}</p>
                       <p className="text-lg font-bold">{val as number}%</p>
                     </div>
                   ))}
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="glass-card p-6 rounded-3xl bg-green-500/5 border border-green-500/20">
                 <h3 className="font-bold mb-4 text-green-400 flex items-center">
                   <CheckCircle2 className="mr-2" size={20} /> Key Strengths
                 </h3>
                 <ul className="space-y-2">
                   {results.strengths.map((s: string, i: number) => (
                     <li key={i} className="text-sm text-white/90 flex items-center">
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" /> {s}
                     </li>
                   ))}
                 </ul>
               </div>
               <div className="glass-card p-6 rounded-3xl bg-orange-500/5 border border-orange-500/20">
                 <h3 className="font-bold mb-4 text-orange-400 flex items-center">
                   <AlertCircle className="mr-2" size={20} /> Areas to Improve
                 </h3>
                 <ul className="space-y-2">
                   {results.areasToImprove.map((a: string, i: number) => (
                     <li key={i} className="text-sm text-white/90 flex items-center">
                       <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2" /> {a}
                     </li>
                   ))}
                 </ul>
               </div>
            </div>

            <div className="flex justify-center space-x-4 pt-6">
               <button onClick={() => setResults(null)} className="px-6 py-3 rounded-xl bg-white/5 text-white font-medium">New Analysis</button>
               <button onClick={() => {}} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all">Download PDF Report</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdModal isOpen={showAdModal} onClose={() => setShowAdModal(false)} featureToUnlock="voice" />
    </motion.div>
  );
};

const MetricRow = ({ label, value }: { label: string, value: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-brand-secondary uppercase">{label}</span>
      <span className="text-white font-medium">{value}%</span>
    </div>
    <div className="w-full bg-white/5 rounded-full h-1.5">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        className="bg-green-500 h-full rounded-full" 
      />
    </div>
  </div>
);

export default VoiceAnalysis;
