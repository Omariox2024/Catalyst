import { GoogleGenAI, Modality } from '@google/genai';
import { FormData } from '../types';

function constructPrompt(formData: FormData): string {
    const { genre, mood, duration, tempo, instrumentation, looping, enableMastering } = formData;
    
    let prompt = `Compose an instrumental music track with the following characteristics:
- Genre: ${genre}
- Mood: ${mood}
- Duration: Approximately ${duration} seconds.
- Tempo: Around ${tempo} BPM.`;

    if (instrumentation) {
        prompt += `
- Instrumentation: Focus on ${instrumentation}.`;
    }

    if (looping) {
        prompt += `
- Structure: The track must be seamlessly loopable. Ensure the end of the track flows perfectly into the beginning.`;
    }

    if (enableMastering) {
        prompt += `
- Mastering: Apply professional audio mastering to the final track. Enhance clarity, punch, and loudness. Use subtle EQ to balance frequencies and gentle compression to glue the mix together, making it sound polished and ready for distribution.`;
    }

    prompt += `
Generate only the audio for this track.`;

    return prompt;
}

export const generateSoundtrack = async (ai: GoogleGenAI, formData: FormData): Promise<string | null> => {
    const prompt = constructPrompt(formData);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("API response did not contain audio data.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating soundtrack with Gemini API:", error);
        throw new Error("Failed to generate soundtrack. The AI model might be unavailable or the request was invalid.");
    }
};