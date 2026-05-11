import React, { useState, useEffect, useRef } from 'react';
import { HeartCrack, UploadCloud, FileAudio, Play, AlertTriangle, ShieldAlert, Share2, Download } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { AnalysisReportPDF } from '../components/AnalysisReportPDF';
import { downloadReportAsPDF } from '../lib/pdfUtils';

const ToxicMeter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (file && waveformRef.current && !wavesurfer.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#FF3333',
        progressColor: '#8b5cf6',
        cursorColor: '#1337ec',
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
    if (!file) return;
    setIsAnalyzing(true);
    
    // Play audio while analyzing to look cool
    wavesurfer.current?.play();
    
    // Simulate STT transcription delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Use a hardcoded toxic transcript for the demo
    const demoTranscript = "You always do this. You're completely overreacting and acting crazy again. I never said that, you're making things up in your head. If you really loved me, you wouldn't question me like this. It's your fault I got angry anyway.";
    
    try {
      import('../lib/ai').then(async ({ analyzeToxicVoiceNote }) => {
         const aiResults = await analyzeToxicVoiceNote(demoTranscript);
         wavesurfer.current?.pause();
         setResults(aiResults);
         setIsAnalyzing(false);
      });
    } catch (e) {
      console.error(e);
      wavesurfer.current?.pause();
      setIsAnalyzing(false);
    }
  };

  const getStatusBadge = (category: string) => {
    switch (category) {
      case 'healthy': return { text: "Healthy 💚", color: "text-brand-success", bg: "bg-brand-success/20", ring: "ring-brand-success" };
      case 'warning': return { text: "Warning ⚠️", color: "text-yellow-400", bg: "bg-yellow-400/20", ring: "ring-yellow-400" };
      case 'toxic': return { text: "Toxic 🚩", color: "text-orange-500", bg: "bg-orange-500/20", ring: "ring-orange-500" };
      case 'run': return { text: "RUN! 🚨", color: "text-brand-warning", bg: "bg-brand-warning/20", ring: "ring-brand-warning" };
      default: return { text: "Unknown", color: "text-gray-400", bg: "bg-gray-400/20", ring: "ring-gray-400" };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full pb-20">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-brand-warning/20 rounded-xl text-brand-warning">
          <HeartCrack size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Toxic Meter</h1>
          <p className="text-brand-secondary">Analyze relationship voice notes for emotional manipulation.</p>
        </div>
      </div>

      {!results ? (
        <div className="glass-panel p-8 rounded-3xl max-w-2xl mx-auto mt-10 border-brand-warning/20">
          <div 
            onClick={() => document.getElementById('toxic-file-upload')?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed ${file ? 'border-transparent' : 'border-brand-warning/50 hover:border-brand-warning'} bg-brand-bg/50 rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px] relative`}
          >
            <input 
              id="toxic-file-upload" 
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
                   <FileAudio size={24} className="text-brand-warning" />
                   <p className="font-semibold text-lg">{file.name}</p>
                </div>
                
                {/* WaveSurfer Container */}
                <div ref={waveformRef} className="w-full h-24"></div>
                
              </div>
            ) : (
              <div className="space-y-4">
                <UploadCloud size={64} className="mx-auto text-brand-secondary" />
                <div>
                  <p className="font-semibold text-lg">Drop your partner's voice note here</p>
                  <p className="text-sm text-brand-secondary mt-2">Find out the truth hidden in their words.</p>
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
            <div className="mt-8 flex justify-center">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full max-w-md bg-gradient-to-r from-orange-500 to-brand-warning hover:from-brand-warning hover:to-orange-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg shadow-brand-warning/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Scanning for Red Flags...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={20} />
                    <span>Scan Voice Note</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6 animate-in slide-in-from-bottom-8">
          
          {/* Main Toxic Score Banner */}
          <div className={`glass-panel p-8 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden border-2 ${getStatusBadge(results.category).ring}`}>
            <div className={`absolute inset-0 opacity-10 bg-gradient-to-t from-transparent to-current ${getStatusBadge(results.category).color}`}></div>
            
            <div className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-6 ${getStatusBadge(results.category).bg} ${getStatusBadge(results.category).color}`}>
              {getStatusBadge(results.category).text}
            </div>

            <h2 className="text-xl text-brand-secondary font-medium mb-2">Toxicity Level</h2>
            <div className={`text-8xl font-black tracking-tighter ${getStatusBadge(results.category).color}`}>
              {results.toxicity}%
            </div>
            
            <p className="mt-6 text-lg max-w-lg">{results.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
               <h3 className="text-lg font-medium text-brand-secondary mb-6 flex items-center"><AlertTriangle className="mr-2 text-brand-warning" size={20} /> Red Flags Detected ({results.redFlags.length})</h3>
               <ul className="space-y-3">
                 {results.redFlags.map((flag: string, idx: number) => (
                   <li key={idx} className="flex items-start space-x-3 p-3 bg-brand-warning/10 rounded-lg border border-brand-warning/20">
                     <span className="text-brand-warning mt-0.5">🚩</span>
                     <span className="text-sm font-medium">{flag}</span>
                   </li>
                 ))}
               </ul>
            </div>
            
            <div className="space-y-6">
               <div className="glass-card p-6">
                 <h3 className="text-sm font-medium text-brand-secondary mb-2">Gaslighting Score</h3>
                 <div className="flex items-center space-x-4">
                   <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                     <div className="bg-orange-500 h-full rounded-full" style={{ width: `${results.gaslighting}%` }}></div>
                   </div>
                   <span className="font-bold text-orange-500">{results.gaslighting}%</span>
                 </div>
               </div>

               <div className="glass-card p-6">
                 <h3 className="text-sm font-medium text-brand-secondary mb-2">Manipulation Tactics</h3>
                 <div className="flex items-center space-x-4">
                   <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                     <div className="bg-brand-warning h-full rounded-full" style={{ width: `${results.manipulation}%` }}></div>
                   </div>
                   <span className="font-bold text-brand-warning">{results.manipulation}%</span>
                 </div>
               </div>

               <button className="w-full glass-button flex items-center justify-center space-x-2 py-4 text-brand-ai font-semibold border-brand-ai/30 hover:bg-brand-ai/10">
                 <Share2 size={20} />
                 <span>Share #ToxicMeter Result</span>
               </button>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mt-8">
             <button onClick={() => setResults(null)} className="glass-button px-6 py-2 text-sm">Analyze Another</button>
             <button
               onClick={() => downloadReportAsPDF('toxic-report', 'SeeMePro_ToxicMeter_Report')}
               className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:scale-105 transition-all text-sm"
             >
               <Download size={16} />
               <span>Download PDF Report</span>
             </button>
          </div>
          {results && <AnalysisReportPDF
            type="toxic"
            results={{
              summary: results.summary,
              toxicity: results.toxicity,
              category: results.category,
              redFlags: results.redFlags,
              gaslighting: results.gaslighting,
              manipulation: results.manipulation,
            }}
            id="toxic-report"
          />}
        </div>
      )}
    </div>
  );
};

export default ToxicMeter;
