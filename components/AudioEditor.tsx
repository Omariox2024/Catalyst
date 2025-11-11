import React, { useState } from 'react';
import { GeneratedAudio } from '../types';
import { useAudioProcessor } from '../hooks/useAudioProcessor';
import { DownloadIcon, SaveIcon, ResetIcon } from './IconComponents';
import FormField from './FormField';

interface AudioEditorProps {
    audio: GeneratedAudio;
    onSaveToLibrary: (audio: GeneratedAudio, tags: string[]) => void;
    isLoggedIn: boolean;
}

const AudioEditor: React.FC<AudioEditorProps> = ({ audio, onSaveToLibrary, isLoggedIn }) => {
    const {
        duration,
        edits,
        handleUpdateEdits,
        applyEdits,
        resetEdits,
        isProcessing,
        processedUrl,
        play,
        stop,
        isPlaying,
        getProcessedBlob,
    } = useAudioProcessor(audio);

    const [tagsInput, setTagsInput] = useState('');
    
    const handleDownload = () => {
        const blob = getProcessedBlob();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `[EDITED]_${audio.fileName}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSave = () => {
        const blob = getProcessedBlob();
        if (!blob) return;

        const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        const newAudio: GeneratedAudio = {
            ...audio,
            id: `track-edited-${Date.now()}`,
            blob,
            url: URL.createObjectURL(blob), // Create a new URL for the library
            fileName: `[EDITED]_${audio.fileName}`,
        };
        onSaveToLibrary(newAudio, tags);
        setTagsInput('');
    };

    const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substr(14, 5);

    return (
        <div className="bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 space-y-4 animate-fade-in">
            <audio controls src={processedUrl} className="w-full">
                Your browser does not support the audio element.
            </audio>

            <div className="bg-slate-700/50 p-4 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-600 pb-2">Audio Editor</h3>
                
                {/* Volume */}
                <FormField label={`Volume: ${Math.round(edits.volume * 100)}%`}>
                    <input type="range" min="0" max="2" step="0.05" value={edits.volume} onChange={(e) => handleUpdateEdits({ volume: parseFloat(e.target.value) })} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                </FormField>
                
                {/* Fades */}
                <div className="grid grid-cols-2 gap-4">
                     <FormField label="Fade In (s)">
                        <input type="number" min="0" step="0.1" value={edits.fadeIn} onChange={(e) => handleUpdateEdits({ fadeIn: parseFloat(e.target.value) })} className="w-full bg-slate-600 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"/>
                    </FormField>
                    <FormField label="Fade Out (s)">
                        <input type="number" min="0" step="0.1" value={edits.fadeOut} onChange={(e) => handleUpdateEdits({ fadeOut: parseFloat(e.target.value) })} className="w-full bg-slate-600 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"/>
                    </FormField>
                </div>

                {/* Trimming */}
                <FormField label={`Trim: ${formatTime(edits.trimStart)} - ${formatTime(edits.trimEnd)}`}>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="range" min="0" max={duration} step="0.1" value={edits.trimStart} onChange={(e) => handleUpdateEdits({ trimStart: Math.min(parseFloat(e.target.value), edits.trimEnd) })} className="w-full accent-purple-500"/>
                        <input type="range" min="0" max={duration} step="0.1" value={edits.trimEnd} onChange={(e) => handleUpdateEdits({ trimEnd: Math.max(parseFloat(e.target.value), edits.trimStart) })} className="w-full accent-purple-500"/>
                    </div>
                </FormField>
                
                <div className="flex flex-wrap gap-2 pt-2">
                    <button onClick={applyEdits} disabled={isProcessing} className="flex-1 btn-primary bg-green-600 hover:bg-green-700 disabled:bg-green-800">
                        {isProcessing ? 'Processing...' : 'Apply Edits'}
                    </button>
                    <button onClick={resetEdits} className="btn-secondary bg-slate-600 hover:bg-slate-500 flex items-center justify-center">
                        <ResetIcon/> Reset
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-4">
                 <button onClick={handleDownload} className="w-full flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-cyan-500/50">
                    <DownloadIcon /> Download Edited Track
                </button>
            </div>
            
            {isLoggedIn && (
                <div className="bg-slate-700/50 p-4 rounded-lg space-y-3 mt-2">
                    <h4 className="text-md font-semibold text-slate-300">Save Edited Track to Library</h4>
                    <FormField label="Tags (comma-separated)" hint="e.g., vlog, background, focus">
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            className="w-full bg-slate-600 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                            placeholder="Add tags to organize your music"
                        />
                    </FormField>
                    <button onClick={handleSave} className="w-full flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-indigo-500/50">
                        <SaveIcon /> Confirm & Save to Library
                    </button>
                </div>
            )}
        </div>
    );
};

export default AudioEditor;