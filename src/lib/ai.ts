import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const parseJSON = (text: string) => {
  const clean = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('No valid JSON in response');
  }
};

export const analyzeToxicVoiceNote = async (transcript: string) => {
  try {
    const prompt = `You are an expert relationship psychologist AI. Analyze the following transcript for signs of emotional manipulation, gaslighting, and toxicity.
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
    return parseJSON(result.response.text());
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    throw new Error("Failed to analyze voice note.");
  }
};

export const analyzeVoiceTruthfulness = async (transcript: string) => {
  try {
    const prompt = `You are an expert polygraph examiner and behavioral analyst. Analyze the following transcript for signs of deception, stress, clarity, and underlying emotions.
Return ONLY a valid JSON object matching this exact structure:
{
  "truthfulness": number (0-100),
  "stressLevel": "Low" | "Medium" | "High" | "Critical",
  "emotions": { "happy": number, "sad": number, "neutral": number, "angry": number },
  "summary": "Detailed 3-5 paragraph behavioral summary of the subject's speech.",
  "strengths": ["clear articulation", "steady pace"],
  "areasToImprove": ["frequent filler words", "pitch elevation during difficult topics"],
  "categoryScores": { "voiceClarity": number (0-100), "confidence": number (0-100), "pace": number (0-100), "fillerWordsScore": number (0-100) }
}
Ensure the emotion numbers add up to exactly 100.
Transcript: "${transcript}"`;
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text());
  } catch (error) {
    console.error("AI Voice Analysis Failed:", error);
    throw new Error("Failed to analyze voice truthfulness.");
  }
};

export const analyzeVideoTruthfulness = async (metadata: any, framesBase64?: string[]) => {
  try {
    let prompt = `You are an expert body language and micro-expression analyst. Analyze the metadata and return ONLY a valid JSON object:
{
  "truthfulness": number (0-100),
  "face": { "microExpressions": "string", "eyeMovement": "string" },
  "body": { "posture": "string", "handMovements": "string" },
  "inconsistencies": ["string 1", "string 2"],
  "summary": "Detailed 3-5 paragraph behavioral summary.",
  "strengths": ["strength 1"],
  "areasToImprove": ["area 1"],
  "categoryScores": { "eyeContact": number (0-100), "posture": number (0-100), "confidence": number (0-100) }
}
Metadata: ${JSON.stringify(metadata)}`;

    const contents: any[] = [prompt];
    if (framesBase64 && framesBase64.length > 0) {
      prompt += `\nAnalyze these ${framesBase64.length} video frames too.`;
      contents[0] = prompt;
      framesBase64.forEach(base64 => {
        contents.push({ inlineData: { data: base64.replace(/^data:image\/[a-z]+;base64,/, ""), mimeType: "image/jpeg" } });
      });
    }
    const result = await model.generateContent(contents);
    return parseJSON(result.response.text());
  } catch (error) {
    console.error("AI Video Analysis Failed:", error);
    throw new Error("Failed to analyze video.");
  }
};

export const analyzeLiveInterview = async (videoMetadata: any, voiceMetadata: any, transcript: string) => {
  try {
    const prompt = `You are an expert interview coach. Analyze all data and return ONLY a valid JSON object:
{
  "overallScore": number (0-100),
  "videoAnalysis": { "eyeContact": number (0-100), "posture": number (0-100), "facialExpressions": "string" },
  "voiceAnalysis": { "confidence": number (0-100), "pace": number (0-100), "clarity": number (0-100), "fillerWords": number (0-100) },
  "summary": "Detailed 3-5 paragraph analysis.",
  "strengths": ["strength 1", "strength 2"],
  "areasToImprove": ["area 1", "area 2"],
  "coachingTips": ["tip 1", "tip 2", "tip 3"]
}
Video: ${JSON.stringify(videoMetadata)}
Voice: ${JSON.stringify(voiceMetadata)}
Transcript: "${transcript}"`;
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text());
  } catch (error) {
    console.error("AI Live Interview Analysis Failed:", error);
    throw new Error("Failed to analyze live interview.");
  }
};
