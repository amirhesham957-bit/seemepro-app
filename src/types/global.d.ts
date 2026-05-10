interface Window {
  adsbygoogle: any[];
  adConfig: (config: any) => void;
  adBreak: (config: any) => void;
}

export interface AnalysisReport {
  id: string;
  userId: string;
  type: 'video' | 'voice' | 'live';
  overallScore: number;
  timestamp: string;
  categoryScores: {
    eyeContact?: number;
    posture?: number;
    voiceClarity?: number;
    confidence?: number;
    pace?: number;
    fillerWords?: number;
  };
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  details: any;
}

export interface VideoMetadata {
  averageBlinkRate: number;
  headPoseShifts: number;
  smileFrames: number;
  eyeContactScore: number;
  expression: 'Confident' | 'Nervous' | 'Distracted' | 'Neutral';
  facialLandmarks: any[];
}

export interface VoiceMetadata {
  transcript: string;
  fillerWordsCount: number;
  wordsPerMinute: number;
  confidenceScore: number;
  clarityScore: number;
  tone: string;
}
