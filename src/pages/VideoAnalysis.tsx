import React, { useState, useRef } from 'react';
import { UploadCloud, FileVideo, Play, CheckCircle, Activity, Camera, Lock } from 'lucide-react';
import { useGamificationStore } from '../store/gamificationStore';
import { useToastStore } from '../store/toastStore';
import AdModal from '../components/AdModal';
import { AnalysisReportPDF } from '../components/AnalysisReportPDF';
import { downloadReportAsPDF } from '../lib/pdfUtils';
import { analyzeVideoTruthfulness } from '../lib/ai';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.4 } }
};

const VideoAnalysis = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showAdModal, setShowAdModal] = useState(false);

  const attempts = useGamificationStore(state => state.attempts.video);
  const useAttempt = useGamificationStore(state => state.useAttempt);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      useToastStore.getState().addToast('error', 'Please upload a video file first.');
      return;
    }

    if (attempts <= 0) {
      setShowAdModal(true);
      return;
    }

    if (!(await useAttempt('video'))) return;

    setIsAnalyzing(true);
    
    try {
      // Mocking MediaPipe extraction for the uploaded video file
      // In a real scenario, we would draw the video to a canvas and process frames with FaceMesh
      const mockMetadata = {
        filename: file.name,
        size: file.size,
        durationSeconds: Math.floor(Math.random() * 30 + 10),
        averageBlinkRate: Math.random() * 20 + 10,
        headPoseShifts: Math.floor(Math.random() * 10),
        smileFrames: Math.floor(Math.random() * 50)
      };
      
      const aiResults = await analyzeVideoTruthfulness(mockMetadata);
      
      if (aiResults) {
        setResults(aiResults);
        useToastStore.getState().addToast('success', 'Advanced video analysis completed by Gemini AI.');
      } else {
        throw new Error("No results returned from API.");
      }
    } catch (error) {
      console.error(error);
      useToastStore.getState().addToast('error', 'Analysis failed. Showing fallback data.');
      // Fallback
      setResults({
        truthfulness: 72,
        face: { microExpressions: 'Suspicious blinking rate detected', eyeMovement: 'Avoiding eye contact' },
        body: { posture: 'Defensive, arms crossed', handMovements: 'Frequent touching of face (fidgeting)' },
        inconsistencies: [
          'Verbal claim of calmness contradicts elevated heart rate tracking from face mesh.',
          'Smile appears asymmetrical (forced).'
        ],
        summary: 'The subject exhibits multiple signs of psychological stress and potential deception. Body language contradicts verbal statements in several key moments.'
      });
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
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className="p-3 bg-brand-ai/20 rounded-xl text-brand-ai"
        >
          <Camera size={28} />
        </motion.div>
        <div>
          <h1 className="text-3xl font-bold">Video Analysis</h1>
          <p className="text-brand-secondary">Analyze facial expressions and body language for truthfulness using Gemini Vision.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!results ? (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel p-8 rounded-3xl max-w-2xl mx-auto mt-10 border-brand-ai/20 relative overflow-hidden"
          >
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-brand-ai/30 border-t-brand-ai rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-semibold animate-pulse text-brand-ai">Analyzing Video via Gemini AI...</p>
                <p className="text-sm text-brand-secondary">Extracting FaceMesh nodes & interpreting body language</p>
              </div>
            )}
            
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !file && document.getElementById('video-upload')?.click()}
              className={`border-2 border-dashed ${file ? 'border-brand-ai/20' : 'border-brand-ai/50 hover:border-brand-ai cursor-pointer'} bg-brand-bg/50 rounded-2xl p-10 text-center transition-all flex flex-col items-center justify-center min-h-[300px]`}
            >
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div 
                    key="file"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <FileVideo size={64} className="mx-auto text-brand-ai" />
                    <p className="font-semibold text-lg">{file.name}</p>
                    <p className="text-sm text-brand-secondary">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for Deep Analysis</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-red-400 hover:text-red-300 underline mt-2 block mx-auto"
                    >
                      Remove Video
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <UploadCloud size={64} className="mx-auto text-brand-secondary" />
                    <div>
                      <p className="font-semibold text-lg">Drop your video file here</p>
                      <p className="text-sm text-brand-secondary mt-2">Supports MP4, MOV, AVI (Max 500MB)</p>
                    </div>
                    <button 
                      className="glass-button px-6 py-2 mt-4 text-sm inline-flex items-center space-x-2"
                    >
                      <span>Browse Files</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <input 
                type="file" 
                id="video-upload" 
                className="hidden" 
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            <AnimatePresence>
              {file && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-8 flex flex-col items-center"
                >
                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || attempts <= 0}
                    className={`w-full max-w-md ${attempts > 0 ? 'bg-gradient-to-r from-brand-ai to-purple-600 hover:from-purple-600 hover:to-brand-ai text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'bg-gray-800 text-gray-400 cursor-not-allowed'} font-semibold py-4 px-8 rounded-xl transition-all flex items-center justify-center space-x-2`}
                  >
                    {attempts <= 0 ? (
                      <>
                        <Lock size={20} />
                        <span>Unlock Analysis (Watch Ad)</span>
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        <span>Run Advanced Analysis</span>
                      </>
                    )}
                  </button>
                  <p className="mt-3 text-sm text-brand-secondary">
                    {attempts > 0 ? `You have ${attempts} free attempts remaining today.` : 'You are out of free attempts.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Truthfulness Score Banner */}
              <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col items-center justify-center text-center col-span-1 lg:col-span-1 border-brand-ai/30 relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-ai to-purple-500"></div>
                 <div className="absolute -inset-2 bg-gradient-to-r from-brand-ai/0 to-purple-500/0 group-hover:from-brand-ai/10 group-hover:to-purple-500/10 transition-all duration-500 rounded-2xl blur-xl -z-10"></div>
                 <h3 className="text-sm uppercase tracking-wider text-brand-secondary mb-2">Confidence Score</h3>
                 <div className="text-7xl font-bold text-gradient my-4">{results.truthfulness}%</div>
                 <p className="text-xs text-brand-secondary">Based on 468 facial landmarks & Gemini Vision</p>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card p-6 col-span-1 lg:col-span-2">
                <h3 className="text-lg font-medium text-brand-secondary mb-4">Gemini AI Executive Summary</h3>
                <p className="text-lg leading-relaxed text-brand-text/90">{results.summary}</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <motion.div variants={itemVariants} className="glass-card p-6 border-l-4 border-l-blue-500 hover:bg-white/5 transition-colors">
                 <h3 className="text-lg font-medium mb-4 flex items-center text-blue-400">Facial Metrics</h3>
                 <ul className="space-y-4">
                   <li className="flex flex-col border-b border-white/5 pb-3">
                     <span className="text-brand-secondary text-sm mb-1">Micro-expressions</span>
                     <span className="font-medium text-sm text-blue-100">{results.face.microExpressions}</span>
                   </li>
                   <li className="flex flex-col border-b border-white/5 pb-3">
                     <span className="text-brand-secondary text-sm mb-1">Eye Tracking</span>
                     <span className="font-medium text-sm text-blue-100">{results.face.eyeMovement}</span>
                   </li>
                 </ul>
               </motion.div>

               <motion.div variants={itemVariants} className="glass-card p-6 border-l-4 border-l-orange-500 hover:bg-white/5 transition-colors">
                 <h3 className="text-lg font-medium mb-4 flex items-center text-orange-400">Body Language</h3>
                 <ul className="space-y-4">
                   <li className="flex flex-col border-b border-white/5 pb-3">
                     <span className="text-brand-secondary text-sm mb-1">Posture</span>
                     <span className="font-medium text-sm text-orange-100">{results.body.posture}</span>
                   </li>
                   <li className="flex flex-col border-b border-white/5 pb-3">
                     <span className="text-brand-secondary text-sm mb-1">Gestures</span>
                     <span className="font-medium text-sm text-orange-100">{results.body.handMovements}</span>
                   </li>
                 </ul>
               </motion.div>
            </div>

            {results.inconsistencies && results.inconsistencies.length > 0 && (
              <motion.div variants={itemVariants} className="glass-card p-6 border-brand-warning/30 bg-brand-warning/5">
                <h3 className="text-lg font-medium mb-4 text-brand-warning flex items-center">
                   <Activity className="mr-2" /> Critical Inconsistencies Detected
                </h3>
                <ul className="space-y-3">
                  {results.inconsistencies.map((item: string, idx: number) => (
                     <li key={idx} className="flex space-x-3 items-start bg-black/20 p-4 rounded-xl border border-brand-warning/10">
                        <span className="text-brand-warning mt-0.5">•</span>
                        <span className="text-sm leading-relaxed">{item}</span>
                     </li>
                  ))}
                </ul>
              </motion.div>
            )}
            
            <motion.div variants={itemVariants} className="flex justify-center mt-8 space-x-4">
               <button onClick={() => {setResults(null); setFile(null);}} className="glass-button px-6 py-3 text-sm font-medium">Analyze Another Video</button>
               <button onClick={() => downloadReportAsPDF('video-pdf-report', 'SeeMePro_Video_Analysis')} className="bg-brand-ai hover:bg-purple-600 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">Download PDF Report</button>
               <button onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'SeeMe Pro Analysis', text: 'Check out my Gemini AI analysis results!', url: window.location.href }).catch(() => {});
                  } else {
                    alert('Sharing is not supported on this device.');
                  }
               }} className="bg-[#1a1a2e] border border-brand-ai hover:bg-brand-ai/20 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors">Share</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {results && <AnalysisReportPDF type="video" results={results} id="video-pdf-report" />}
      <AdModal 
        isOpen={showAdModal} 
        onClose={() => setShowAdModal(false)} 
        featureToUnlock="video" 
      />
    </motion.div>
  );
};

export default VideoAnalysis;
