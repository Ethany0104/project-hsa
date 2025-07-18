import { useState } from 'react';
import { ICONS } from '../../constants';

/**
 * 화면 측면에서 나타나는 사이드 시트(Side Sheet) 컴포넌트
 * @param {object} props - { isOpen: boolean, onClose: function, children: React.ReactNode, size?: 'default' | 'narrow' }
 */
export const SideSheet = ({ isOpen, onClose, children, size = 'default' }) => {
    const sizeClasses = {
        default: 'w-full md:w-5/6 lg:w-4/5 max-w-7xl',
        narrow: 'w-full max-w-md md:max-w-none md:w-[440px]'
    };

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose}
            ></div>
            <div 
                className={`fixed inset-y-0 left-0 bg-[var(--bg)] shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col border-r border-[var(--border)] ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${sizeClasses[size]}`}
            >
                {children}
            </div>
        </>
    );
};

/**
 * 접고 펼 수 있는 아코디언(Accordion) 컴포넌트
 * @param {object} props - { title: string, children: React.ReactNode, icon?: React.ElementType, defaultOpen?: boolean }
 */
export const Accordion = ({ title, children, icon: Icon, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--panel-bg-alt)]">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 hover:bg-[var(--border)] transition-colors">
                <div className="flex items-center">
                    {Icon && <Icon className="w-4 h-4 mr-2 text-[var(--text-secondary)]" />}
                    <span className="font-semibold text-sm text-[var(--text-primary)] font-sans">{title}</span>
                </div>
                {isOpen ? <ICONS.LucideChevronDown className="w-5 h-5 text-[var(--text-secondary)]" /> : <ICONS.LucideChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />}
            </button>
            {isOpen && <div className="p-3 border-t border-[var(--border)] bg-[var(--panel-bg)]">{children}</div>}
        </div>
    );
};

/**
 * 컨텐츠를 감싸는 기본 카드(Card) 레이아웃
 * @param {object} props - { children: React.ReactNode, className?: string }
 */
export const Card = ({ children, className = "" }) => (
    <div className={`bg-[var(--panel-bg)] border border-[var(--border)] rounded-xl p-4 shadow-sm ${className}`}>
        {children}
    </div>
);

/**
 * 카드 컴포넌트의 헤더(CardHeader)
 * @param {object} props - { icon: React.ElementType, title: string, children?: React.ReactNode }
 */
export const CardHeader = ({ icon: Icon, title, children }) => (
    <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
            <Icon className="w-5 h-5 mr-2 text-[var(--accent)]" />
            <h3 className="text-md font-bold text-[var(--text-primary)] font-sans">{title}</h3>
        </div>
        <div>{children}</div>
    </div>
);
