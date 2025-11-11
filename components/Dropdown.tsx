
import React from 'react';
import FormField from './FormField';

interface DropdownProps {
    label: string;
    name: string;
    value: string;
    options: string[];
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ label, name, value, options, onChange }) => {
    return (
        <FormField label={label}>
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-slate-700 text-slate-200 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition appearance-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                }}
            >
                {options.map(option => (
                    <option key={option} value={option} className="bg-slate-800">
                        {option}
                    </option>
                ))}
            </select>
        </FormField>
    );
};

export default Dropdown;
