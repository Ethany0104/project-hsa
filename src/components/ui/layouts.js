import { useState } from 'react';
import { ICONS } from '../../constants';

/**
 * A side sheet component that slides in from the right.
 * @param {object} props - { isOpen, onClose, children, size?: 'default' | 'narrow' }
 */
export const SideSheet = ({ isOpen, onClose, children, size = 'default' }) => {
    const sizeClasses = {
        // [PD 주석] v21: 페르소나 패널(3단)에 최적화된 너비(6xl, 1152px)로 재조정
        default: 'w-screen lg:w-full lg:max-w-6xl',
        // [PD 주석] v21: 유저 패널(1단)이 너무 좁아보이지 않도록 너비를 lg(512px)로 재조정
        narrow: 'w-screen md:w-full md:max-w-lg'
    };

    const transformStyle = {
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 z-[109] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            <div
                className={`fixed inset-y-0 right-0 z-[110] transition-transform duration-300 ease-in-out ${sizeClasses[size]}`}
                style={transformStyle}
            >
                <div className="h-full bg-[var(--panel-bg)] shadow-2xl flex flex-col border-l border-[var(--border-primary)] w-full">
                    {children}
                </div>
            </div>
        </>
    );
};


export const Accordion = ({ title, children, icon: Icon, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-[var(--border-primary)] rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 hover:bg-[var(--bg-tertiary)] transition-colors">
                <div className="flex items-center">
                    {Icon && <Icon className="w-4 h-4 mr-2.5 text-[var(--text-secondary)]" />}
                    <span className="font-semibold text-sm text-[var(--text-primary)] font-sans">{title}</span>
                </div>
                <ICONS.LucideChevronRight className={`w-5 h-5 text-[var(--text-secondary)] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            {isOpen && <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] animate-fadeIn">{children}</div>}
        </div>
    );
};

export const Card = ({ children, className = "" }) => (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-md ${className}`}>
        {children}
    </div>
);

export const CardHeader = ({ icon: Icon, title, children }) => (
    <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--border-primary)]">
        <div className="flex items-center">
            <Icon className="w-5 h-5 mr-3 text-[var(--accent-primary)]" />
            <h3 className="text-md font-bold text-[var(--text-primary)] font-sans">{title}</h3>
        </div>
        <div>{children}</div>
    </div>
);
