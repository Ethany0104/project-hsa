import React from 'react';

const BdsmSlider = ({ label, value, onChange, labels }) => (
    <div className="font-sans">
        <div className="flex justify-between items-center mb-1 text-xs font-medium">
            <span className="text-[var(--text-secondary)]">{labels[0]}</span>
            <span className="text-[var(--text-primary)] font-bold">{label}</span>
            <span className="text-[var(--text-secondary)]">{labels[1]}</span>
        </div>
        <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={value}
            onInput={e => onChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[var(--border-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
        />
    </div>
);

export default BdsmSlider;
