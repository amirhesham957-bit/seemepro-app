import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileAudio, Play, AlertTriangle, CheckCircle, Activity, Lock } from 'lucide-react';
import { useGamificationStore } from '../store/gamificationStore';
import { useToastStore } from '../store/toastStore';
import AdModal from '../components/AdModal';
import WaveSurfer from 'wavesurfer.js';
import { AnalysisReportPDF } from '../components/AnalysisReportPDF';
import { downloadReportAsPDF } from '../lib/pdfUtils';

const VoiceAnalysis = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  
  const attempts = useGamificationStore(state => state.attempts.voice);
  const useAttempt = useGamificationStore(state => state.useAttempt);

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setFile(droppedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      useToastStore.getState().addToast('error', 'Please upload an audio file first.');
      return;
    }
    
    if (attempts <= 0) {
       setShowAdModal(true);
       return;
    }
    
    if (!useAttempt('voice')) return;

    setIsAnalyzing(true);
    wavesurfer.current?.play();
    
    // Simulate STT transcription delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    const demoTranscript = "I don't know what you're talking about. I was at home the entire night. Yes, I'm sure.";
    
    try {
      const { analyzeVoiceTruthfulness } = await import('../lib/ai');
      const aiResults = await analyzeVoiceTruthfulness(demoTranscript);
      wavesurfer.current?.pause();
      if (aiResults) {
        setResults(aiResults);
        useToastStore.getState().addToast('success', 'Voice analysis completed successfully.');
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
        voicePitch: 'Slight elevation in fundamental frequency (F0) suggesting minor stress.',
        emotions: { happy: 5, sad: 15, neutral: 40, angry: 40 },
        summary: 'Deception indicators present. Voice pitch elevation and defensive language detected.'
      });
      useToastStore.getState().addToast('error', 'API connection failed. Showing fallback simulated analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full pb-20">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-brand-primary/20 rounded-xl text-brand-primary">
          <Activity size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Voice Analysis</h1>
          <p className="text-brand-secondary">Detect stress and truthfulness in audio.</p>
        </div>
      </div>

      {!results ? (
        <div className="glass-panel p-8 rounded-3xl max-w-2xl mx-auto mt-10">
          <div 
            onClick={() => document.getElementById('voice-file-upload')?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed ${file ? 'border-transparent' : 'border-brand-primary/50 hover:border-brand-primary'} bg-brand-bg/50 rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px] relative`}
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
            {file ? (
              <div className="w-full space-y-6 animate-in zoom-in">
                <div className="flex items-center justify-center space-x-3">
                   <FileAudio size={24} className="text-brand-primary" />
                   <p className="font-semibold text-lg">{file.name}</p>
                </div>
                
                {/* WaveSurfer Container */}
                <div ref={waveformRef} className="w-full h-24"></div>
                
              </div>
            ) : (
              <div className="space-y-4">
                <UploadCloud size={64} className="mx-auto text-brand-secondary" />
                <div>
                  <p className="font-semibold text-lg">Drag & Drop your audio file here</p>
                  <p className="text-sm text-brand-secondary mt-2">Supports MP3, WAV, M4A (Max 25MB)</p>
                </div>
                <button 
                  className="glass-button px-6 py-2 mt-4 text-sm inline-flex items-center space-x-2"
                  onClick={() => document.getElementById('audio-upload')?.click()}
                >
                  <span>Browse Files</span>
                </button>
                <input 
                  type="file" 
                  id="audio-upload" 
                  className="hidden" 
                  accept="audio/*"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                />
              </div>
            )}
          </div>

          {file && (
            <div className="mt-8 flex flex-col items-center">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || attempts <= 0}
                className={`w-full max-w-md ${attempts > 0 ? 'bg-gradient-to-r from-brand-primary to-blue-600 hover:from-blue-600 hover:to-brand-primary text-white shadow-brand-primary/25' : 'bg-gray-800 text-gray-400 cursor-not-allowed'} font-semibold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Analyzing Neural Patterns...</span>
                  </>
                ) : attempts <= 0 ? (
                  <>
                    <Lock size={20} />
                    <span>Unlock Analysis (Watch Ad)</span>
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    <span>Start Analysis</span>
                  </>
                )}
              </button>
              <p className="mt-3 text-sm text-brand-secondary">
                {attempts > 0 ? `You have ${attempts} free attempts remaining today.` : 'You are out of free attempts.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6 animate-in slide-in-from-bottom-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Truthfulness Score */}
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center col-span-1 md:col-span-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-success to-emerald-400"></div>
              <h3 className="text-lg font-medium text-brand-secondary mb-4">Truthfulness Score</h3>
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="552.9" strokeDashoffset={552.9 - (552.9 * results.truthfulness) / 100} className="text-brand-success transition-all duration-1500 ease-out" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-bold text-gradient-success">{results.truthfulness}%</span>
                </div>
              </div>
            </div>

            {/* Stress Level */}
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
               <h3 className="text-lg font-medium text-brand-secondary mb-4">Stress Level</h3>
               <div className="w-24 h-24 rounded-full bg-brand-success/20 flex items-center justify-center text-brand-success mb-4">
                  <CheckCircle size={48} />
               </div>
               <span className="text-2xl font-bold">{results.stressLevel}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="glass-card p-6">
               <h3 className="text-lg font-medium text-brand-secondary mb-4">Emotion Breakdown</h3>
               <div className="space-y-4">
                  {Object.entries(results.emotions).map(([emotion, value]) => (
                    <div key={emotion}>
                      <div className="flex justify-between text-sm mb-1 capitalize">
                        <span>{emotion}</span>
                        <span className="font-bold">{value as number}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="bg-brand-ai h-2 rounded-full" style={{ width: `${value}%` }}></div>
                      </div>
                    </div>
                  ))}
               </div>
             </div>
             
             <div className="glass-card p-6">
                <h3 className="text-lg font-medium text-brand-secondary mb-4">Summary</h3>
                <p className="text-lg leading-relaxed">{results.summary}</p>
                <div className="mt-8 flex space-x-4">
                  <button onClick={() => {setResults(null); setFile(null);}} className="glass-button px-4 py-2 text-sm">Analyze Another</button>
                  <button onClick={() => downloadReportAsPDF('voice-pdf-report', 'SeeMePro_Voice_Analysis')} className="bg-brand-ai hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">Download PDF</button>
                  <button onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'SeeMe Pro Analysis', text: 'Check out my voice analysis results!', url: window.location.href }).catch(() => {});
                    } else {
                      alert('Sharing is not supported on this device.');
                    }
                  }} className="bg-[#1a1a2e] border border-brand-ai hover:bg-brand-ai/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">Share</button>
                </div>
             </div>
          </div>
        </div>
      )}
      {results && <AnalysisReportPDF type="voice" results={results} id="voice-pdf-report" />}

      <AdModal 
        isOpen={showAdModal} 
        onClose={() => setShowAdModal(false)} 
        featureToUnlock="voice" 
      />
    </div>
  );
};

export default VoiceAnalysis;
