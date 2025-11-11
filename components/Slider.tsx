
import React from 'react';
import FormField from './FormField';

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, onChange }) => {
    return (
        <FormField label={label}>
            <div className="flex items-center gap-4">
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <span className="bg-slate-700 text-slate-200 text-sm font-semibold rounded-md py-1 px-3 w-20 text-center">
                    {value} BPM
                </span>
            </div>
        </FormField>
    );
};

export default Slider;
