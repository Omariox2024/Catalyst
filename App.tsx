import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { generateSoundtrack } from './services/geminiService';
import { FormData, GeneratedAudio, Preset, User } from './types';
import { GENRES, MOODS } from './constants';
import { createWavBlobFromPcmBase64 } from './utils/audioUtils';

import Header from './components/Header';
import Presets from './components/Presets';
import Library from './components/Library';
import FormField from './components/FormField';
import Dropdown from './components/Dropdown';
import Slider from './components/Slider';
import ToggleSwitch from './components/ToggleSwitch';
import AudioEditor from './components/AudioEditor';
import { SpinnerIcon, MusicNoteIcon, ChatBubbleIcon } from './components/IconComponents';
import ConversationalAgent from './components/ConversationalAgent';

type AppMode = 'generator' | 'agent';

export default function App() {
    const [formData, setFormData] = useState<FormData>({
        genre: 'Lofi Hip-Hop',
        mood: 'Relaxed',
        duration: 90,
        tempo: 90,
        instrumentation: 'Piano and vinyl crackle',
        looping: true,
        enableMastering: true,
    });

    // State for generation process
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);

    // Mocked state for user features
    const [user, setUser] = useState<User | null>(null);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [library, setLibrary] = useState<GeneratedAudio[]>([]);
    
    // App mode state
    const [mode, setMode] = useState<AppMode>('generator');

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
            setFormData(prev => ({ ...prev, [name]: e.target.checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
        }
    }, []);

    const handleSliderChange = useCallback((value: number) => {
        setFormData(prev => ({ ...prev, tempo: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setGeneratedAudio(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const base64Audio = await generateSoundtrack(ai, formData);
            
            if (base64Audio) {
                const wavBlob = createWavBlobFromPcmBase64(base64Audio);
                const audioUrl = URL.createObjectURL(wavBlob);
                const fileName = `${formData.genre.replace(/\s/g, '')}_${formData.mood.replace(/\s/g, '')}_${formData.duration}s.wav`;
                setGeneratedAudio({
                    id: `track-${Date.now()}`,
                    url: audioUrl,
                    blob: wavBlob,
                    fileName,
                    formData: { ...formData },
                });
            } else {
                throw new Error("The AI did not return any audio data.");
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during generation.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Mock Authentication and Feature Functions
    const handleLogin = () => setUser({ name: 'Demo User', email: 'user@example.com' });
    const handleLogout = () => setUser(null);

    const handleSavePreset = (name: string) => {
        if (user && name) {
            setPresets(prev => [...prev, { ...formData, name }]);
        } else {
            alert("Please log in and provide a name to save a preset.");
        }
    };
    
    const handleLoadPreset = (preset: Preset) => {
        const { name, ...presetFormData } = preset;
        setFormData(presetFormData);
    };

    const handleSaveToLibrary = (audio: GeneratedAudio, tags: string[]) => {
        if (user) {
             const audioWithTags = { ...audio, tags };
             setLibrary(prev => [audioWithTags, ...prev]);
             alert(`"${audio.fileName}" saved to your library!`);
        } else {
            alert("Please log in to save tracks to your library.");
        }
    };

    const renderGenerator = () => (
        <>
            <div className="bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {user && <Presets presets={presets} onSave={handleSavePreset} onLoad={handleLoadPreset} />}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Dropdown label="Genre / Style" name="genre" value={formData.genre} options={GENRES} onChange={handleInputChange} />
                        <Dropdown label="Mood / Emotion" name="mood" value={formData.mood} options={MOODS} onChange={handleInputChange} />
                    </div>

                    <FormField label="Duration (seconds)" hint="Crucial for timing your content perfectly.">
                        <input
                            type="number"
                            name="duration"
                            value={formData.duration}
                            onChange={handleInputChange}
                            className="w-full bg-slate-700 text-slate-200 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                            min="10"
                            max="300"
                            required
                        />
                    </FormField>

                    <Slider
                        label="Tempo (BPM)"
                        value={formData.tempo}
                        min={60}
                        max={180}
                        onChange={handleSliderChange}
                    />

                    <FormField label="Instrumentation Hint (Optional)" hint="e.g., 'Heavy on synths', 'No drums', 'Acoustic guitar lead'">
                         <input
                            type="text"
                            name="instrumentation"
                            value={formData.instrumentation}
                            onChange={handleInputChange}
                            className="w-full bg-slate-700 text-slate-200 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                            placeholder="Describe the instruments you want"
                        />
                    </FormField>
                    
                     <ToggleSwitch 
                        label="Enable AI Mastering" 
                        name="enableMastering" 
                        checked={formData.enableMastering} 
                        onChange={handleInputChange}
                        description="Applies automated EQ, compression, and leveling for a polished, professional sound."
                    />

                    <ToggleSwitch 
                        label="Seamless Looping" 
                        name="looping" 
                        checked={formData.looping} 
                        onChange={handleInputChange}
                        description="Ensures the end of the track flows perfectly into the beginning."
                    />

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold text-lg py-4 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/50 disabled:shadow-none"
                        >
                            {isLoading ? (
                                <>
                                    <SpinnerIcon />
                                    AI is Composing...
                                </>
                            ) : (
                                "Generate Soundtrack"
                            )}
                        </button>
                    </div>
                </form>
            </div>
            
            {error && (
                <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {generatedAudio && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-center mb-4 text-slate-300">Your Track is Ready!</h2>
                    <AudioEditor 
                        key={generatedAudio.id} 
                        audio={generatedAudio} 
                        onSaveToLibrary={handleSaveToLibrary}
                        isLoggedIn={!!user}
                    />
                </div>
            )}
            
            {user && <Library tracks={library} />}
        </>
    );

    return (
        <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8 flex flex-col items-center">
            <main className="w-full max-w-2xl mx-auto">
                <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />

                <div className="mb-8 flex justify-center">
                    <div className="flex items-center bg-slate-800 p-1 rounded-full">
                        <button
                            onClick={() => setMode('generator')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${mode === 'generator' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                            <MusicNoteIcon />
                            Soundtrack Generator
                        </button>
                        <button
                            onClick={() => setMode('agent')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${mode === 'agent' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                           <ChatBubbleIcon/>
                            Live Conversation
                        </button>
                    </div>
                </div>

                {mode === 'generator' ? renderGenerator() : <ConversationalAgent />}

                <footer className="text-center mt-12 text-slate-500 text-sm">
                    <p>All generated tracks are royalty-free for personal and commercial use.</p>
                    <p>&copy; {new Date().getFullYear()} Catalyst AI. All rights reserved.</p>
                </footer>
            </main>
        </div>
    );
}