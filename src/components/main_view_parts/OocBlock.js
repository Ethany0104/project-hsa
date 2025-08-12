import React from 'react';

const OocBlock = ({ text }) => {
    return (
        <div className="animate-fadeIn">
            <div className="border-l-4 border-[var(--danger)] pl-4 py-2 bg-[var(--danger)]/10">
                <p className="text-sm italic text-[var(--danger)]/80 font-sans">
                    <strong className="font-bold text-[var(--danger)]">[OOC] </strong>
                    {text}
                </p>
            </div>
        </div>
    );
};

export default OocBlock;
