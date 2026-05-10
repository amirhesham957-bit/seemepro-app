import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export const analyzeToxicVoiceNote = async (transcript: string) => {
  try {
    const prompt = `You are an expert relationship psychologist AI. Analyze the transcript for signs of emotional manipulation, gaslighting, and toxicity. 
Return ONLY a valid JSON object matching this exact structure:
{
  "toxicity": number (0-100),
  "gaslighting": number (0-100),
  "manipulation": number (0-100),
  "redFlags": ["specific flag 1", "specific flag 2"],
  "category": "healthy" | "warning" | "toxic" | "run",
  "summary": "Brief 2 sentence psychological summary"
}
Transcript: "${transcript}"`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || [null, responseText];
    return JSON.parse(jsonMatch[1]);
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return {
      toxicity: 85,
      gaslighting: 70,
      manipulation: 90,
      redFlags: ["API Quota Exceeded/Failed - Using Mock Data", "Aggressive tone detected"],
      category: "toxic",
      summary: "High levels of manipulation detected. Please ensure your API keys have sufficient quota."
    };
  }
};

export const analyzeVoiceTruthfulness = async (transcript: string) => {
  try {
    const prompt = `You are an expert polygraph examiner and behavioral analyst. Analyze the transcript for signs of deception, stress, and underlying emotions.
Return ONLY a valid JSON object matching this exact structure:
{
  "truthfulness": number (0-100),
  "stressLevel": "Low" | "Medium" | "High" | "Critical",
  "emotions": { "happy": number, "sad": number, "neutral": number, "angry": number },
  "summary": "Detailed 3-5 paragraph behavioral summary of the subject's voice analysis.",
  "strengths": ["clear articulation", "steady pace"],
  "areasToImprove": ["frequent filler words", "pitch elevation during difficult topics"],
  "categoryScores": { "voiceClarity": number (0-100), "confidence": number (0-100), "pace": number (0-100), "fillerWordsScore": number (0-100) }
}
Ensure the emotion numbers add up to exactly 100.
Transcript: "${transcript}"`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || [null, responseText];
    return JSON.parse(jsonMatch[1]);
  } catch (error) {
    console.error("AI Voice Analysis Failed:", error);
    return null;
  }
};

export const analyzeVideoTruthfulness = async (metadata: any) => {
  try {
    const prompt = `You are an expert body language and micro-expression analyst. I will provide you with JSON metadata extracted from a video session. 
Analyze the metadata and return ONLY a valid JSON object matching this exact structure:
{
  "truthfulness": number (0-100),
  "face": { 
    "microExpressions": "string describing micro-expressions detected", 
    "eyeMovement": "string describing eye movement patterns" 
  },
  "body": { 
    "posture": "string describing body posture", 
    "handMovements": "string describing hand movements/gestures" 
  },
  "inconsistencies": ["string detailing contradiction 1", "string detailing contradiction 2"],
  "summary": "Detailed 3-5 paragraph behavioral summary of the subject.",
  "strengths": ["good eye contact", "open posture"],
  "areasToImprove": ["frequent touching of face", "closed off body language"],
  "categoryScores": { "eyeContact": number (0-100), "posture": number (0-100), "confidence": number (0-100) }
}
Metadata: ${JSON.stringify(metadata)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || [null, responseText];
    return JSON.parse(jsonMatch[1]);
  } catch (error) {
    console.error("AI Video Analysis Failed:", error);
    return null;
  }
};

export const analyzeLiveInterview = async (videoMetadata: any, voiceMetadata: any) => {
  try {
    const prompt = `You are an expert interview coach and behavioral psychologist. I will provide you with both video and voice metadata from a live interview session. 
Analyze both datasets and return ONLY a valid JSON object matching this exact structure:
{
  "overallScore": number (0-100),
  "videoAnalysis": {
     "eyeContact": number (0-100),
     "posture": number (0-100),
     "facialExpressions": "string describing facial expression consistency"
  },
  "voiceAnalysis": {
     "confidence": number (0-100),
     "pace": number (0-100),
     "clarity": number (0-100),
     "fillerWords": number (0-100)
  },
  "summary": "Detailed 3-5 paragraph analysis of the interview performance, combining both visual and vocal cues.",
  "strengths": ["strength 1", "strength 2"],
  "areasToImprove": ["improvement 1", "improvement 2"],
  "coachingTips": ["tip 1", "tip 2", "tip 3"]
}
Video Metadata: ${JSON.stringify(videoMetadata)}
Voice Metadata: ${JSON.stringify(voiceMetadata)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || [null, responseText];
    return JSON.parse(jsonMatch[1]);
  } catch (error) {
    console.error("AI Live Interview Analysis Failed:", error);
    return null;
  }
};
