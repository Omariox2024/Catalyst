
import React from 'react';

interface FormFieldProps {
    label: string;
    hint?: string;
    children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, hint, children }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
                {label}
            </label>
            {children}
            {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
        </div>
    );
};

export default FormField;
