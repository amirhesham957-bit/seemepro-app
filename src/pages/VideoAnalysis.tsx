import React, { useState } from 'react';
import { UploadCloud, FileVideo, Play, CheckCircle, Activity, Camera, Lock } from 'lucide-react';
import { useGamificationStore } from '../store/gamificationStore';
import AdModal from '../components/AdModal';

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
    if (!file) return;

    if (attempts <= 0) {
      setShowAdModal(true);
      return;
    }

    if (!(await useAttempt('video'))) return;

    setIsAnalyzing(true);
    // Mock analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
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
    }, 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full pb-20">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-brand-ai/20 rounded-xl text-brand-ai">
          <Camera size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Video Analysis</h1>
          <p className="text-brand-secondary">Analyze facial expressions and body language for truthfulness.</p>
        </div>
      </div>

      {!results ? (
        <div className="glass-panel p-8 rounded-3xl max-w-2xl mx-auto mt-10 border-brand-ai/20">
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-brand-ai/50 hover:border-brand-ai bg-brand-bg/50 rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px]"
          >
            {file ? (
              <div className="space-y-4 animate-in zoom-in">
                <FileVideo size={64} className="mx-auto text-brand-ai" />
                <p className="font-semibold text-lg">{file.name}</p>
                <p className="text-sm text-brand-secondary">Ready for Deep Analysis</p>
              </div>
            ) : (
              <div className="space-y-4">
                <UploadCloud size={64} className="mx-auto text-brand-secondary" />
                <div>
                  <p className="font-semibold text-lg">Drop your video file here</p>
                  <p className="text-sm text-brand-secondary mt-2">Supports MP4, MOV, AVI (Max 500MB)</p>
                </div>
                <button 
                  className="glass-button px-6 py-2 mt-4 text-sm inline-flex items-center space-x-2"
                  onClick={() => document.getElementById('video-upload')?.click()}
                >
                  <span>Browse Files</span>
                </button>
                <input 
                  type="file" 
                  id="video-upload" 
                  className="hidden" 
                  accept="video/*"
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
                className={`w-full max-w-md ${attempts > 0 ? 'bg-gradient-to-r from-brand-ai to-purple-600 hover:from-purple-600 hover:to-brand-ai text-white shadow-brand-ai/25' : 'bg-gray-800 text-gray-400 cursor-not-allowed'} font-semibold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing MediaPipe Nodes...</span>
                  </>
                ) : attempts <= 0 ? (
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
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6 animate-in slide-in-from-bottom-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Truthfulness Score Banner */}
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center col-span-1 lg:col-span-1 border-brand-ai/30 relative overflow-hidden">
               <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-brand-ai to-purple-500"></div>
               <h3 className="text-sm uppercase tracking-wider text-brand-secondary mb-2">Confidence Score</h3>
               <div className="text-7xl font-bold text-gradient my-4">{results.truthfulness}%</div>
               <p className="text-xs text-brand-secondary">Based on 468 facial landmarks & 33 pose points</p>
            </div>

            <div className="glass-card p-6 col-span-1 lg:col-span-2">
              <h3 className="text-lg font-medium text-brand-secondary mb-4">Executive Summary</h3>
              <p className="text-lg leading-relaxed">{results.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="glass-card p-6 border-l-4 border-l-blue-500">
               <h3 className="text-lg font-medium mb-4 flex items-center text-blue-400">Facial Metrics</h3>
               <ul className="space-y-3">
                 <li className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-brand-secondary">Micro-expressions</span>
                   <span className="font-medium text-right text-sm">{results.face.microExpressions}</span>
                 </li>
                 <li className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-brand-secondary">Eye Tracking</span>
                   <span className="font-medium text-right text-sm">{results.face.eyeMovement}</span>
                 </li>
               </ul>
             </div>

             <div className="glass-card p-6 border-l-4 border-l-orange-500">
               <h3 className="text-lg font-medium mb-4 flex items-center text-orange-400">Body Language</h3>
               <ul className="space-y-3">
                 <li className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-brand-secondary">Posture</span>
                   <span className="font-medium text-right text-sm">{results.body.posture}</span>
                 </li>
                 <li className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-brand-secondary">Gestures</span>
                   <span className="font-medium text-right text-sm">{results.body.handMovements}</span>
                 </li>
               </ul>
             </div>
          </div>

          <div className="glass-card p-6 border-brand-warning/30">
            <h3 className="text-lg font-medium mb-4 text-brand-warning flex items-center">
               <Activity className="mr-2" /> Critical Inconsistencies Detected
            </h3>
            <ul className="space-y-2">
              {results.inconsistencies.map((item: string, idx: number) => (
                 <li key={idx} className="flex space-x-3 items-start bg-brand-warning/10 p-3 rounded-lg">
                    <span className="text-brand-warning mt-0.5">•</span>
                    <span>{item}</span>
                 </li>
              ))}
            </ul>
          </div>
          
          <div className="flex justify-center mt-8 space-x-4">
             <button onClick={() => setResults(null)} className="glass-button px-6 py-2 text-sm">Analyze Another Video</button>
             <button className="bg-brand-ai hover:bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors">Download PDF Report</button>
          </div>
        </div>
      )}
      <AdModal 
        isOpen={showAdModal} 
        onClose={() => setShowAdModal(false)} 
        featureToUnlock="video" 
      />
    </div>
  );
};

export default VideoAnalysis;
