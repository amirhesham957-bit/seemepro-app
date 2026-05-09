import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // For rapid prototyping
});

export const analyzeToxicVoiceNote = async (transcript: string) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert relationship psychologist AI. Analyze the transcript for signs of emotional manipulation, gaslighting, and toxicity. 
Return ONLY a valid JSON object matching this exact structure:
{
  "toxicity": number (0-100),
  "gaslighting": number (0-100),
  "manipulation": number (0-100),
  "redFlags": ["specific flag 1", "specific flag 2"],
  "category": "healthy" | "warning" | "toxic" | "run",
  "summary": "Brief 2 sentence psychological summary"
}`
        },
        {
          role: "user",
          content: `Transcript: "${transcript}"`
        }
      ],
      model: "llama3-8b-8192", // Fast model for rapid response
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    if (!responseContent) throw new Error("No response from AI");
    
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    // Fallback to mock data if API fails or quota exceeded
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
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert polygraph examiner and behavioral analyst. Analyze the transcript for signs of deception, stress, and underlying emotions.
Return ONLY a valid JSON object matching this exact structure:
{
  "truthfulness": number (0-100, where 100 is completely truthful),
  "stressLevel": "Low" | "Medium" | "High" | "Critical",
  "emotions": { "happy": number, "sad": number, "neutral": number, "angry": number },
  "summary": "Brief 2 sentence behavioral summary"
}
Ensure the emotion numbers add up to exactly 100.`
        },
        {
          role: "user",
          content: `Transcript: "${transcript}"`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    if (!responseContent) throw new Error("No response from AI");
    
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return null;
  }
};
