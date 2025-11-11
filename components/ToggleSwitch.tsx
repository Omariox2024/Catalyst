import React from 'react';

interface ToggleSwitchProps {
    label: string;
    name: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    description?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, name, checked, onChange, description }) => {
    return (
        <div className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg">
            <div>
                <label htmlFor={name} className="font-medium text-slate-300">
                    {label}
                </label>
                {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
            </div>
            <label htmlFor={name} className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    id={name}
                    name={name}
                    checked={checked}
                    onChange={onChange}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
        </div>
    );
};

export default ToggleSwitch;