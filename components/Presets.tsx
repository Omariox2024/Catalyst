
import React, { useState } from 'react';
import { Preset } from '../types';
import { SaveIcon } from './IconComponents';
import FormField from './FormField';

interface PresetsProps {
    presets: Preset[];
    onSave: (name: string) => void;
    onLoad: (preset: Preset) => void;
}

const Presets: React.FC<PresetsProps> = ({ presets, onSave, onLoad }) => {
    const [presetName, setPresetName] = useState('');
    const [showSave, setShowSave] = useState(false);

    const handleSaveClick = () => {
        if (presetName) {
            onSave(presetName);
            setPresetName('');
            setShowSave(false);
        }
    };
    
    const handleLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPresetName = e.target.value;
        const selectedPreset = presets.find(p => p.name === selectedPresetName);
        if (selectedPreset) {
            onLoad(selectedPreset);
        }
    };

    return (
        <div className="bg-slate-700/50 p-4 rounded-lg mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                    <label htmlFor="preset-select" className="block text-sm font-medium text-slate-300 mb-1">Load Preset</label>
                    <select
                        id="preset-select"
                        onChange={handleLoad}
                        defaultValue=""
                        className="w-full bg-slate-600 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                    >
                        <option value="" disabled>Select a preset...</option>
                        {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex-shrink-0 self-end">
                    <button type="button" onClick={() => setShowSave(!showSave)} className="w-full sm:w-auto flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        <SaveIcon /> Save Current
                    </button>
                </div>
            </div>

            {showSave && (
                <div className="flex gap-4 p-3 bg-slate-900/50 rounded-md animate-fade-in">
                    <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Enter preset name..."
                        className="flex-grow bg-slate-600 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                    />
                    <button type="button" onClick={handleSaveClick} className="btn-primary bg-green-600 hover:bg-green-700">
                        Confirm Save
                    </button>
                </div>
            )}
        </div>
    );
};

export default Presets;
