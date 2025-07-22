import React from 'react';
import { ICONS } from '../../constants';

const WelcomeMessage = React.memo(({ isNewSceneDisabled }) => (
    <div className="text-center text-[var(--text-secondary)] h-full flex flex-col justify-center items-center animate-fadeIn p-4">
        <ICONS.LucideTheater size={64} className="mb-6 opacity-20" strokeWidth={1.5}/>
        <h2 className="text-5xl font-bold text-[var(--text-primary)] font-serif tracking-tight">
            Roleplay Studio
        </h2>
        <p className="mt-4 max-w-lg font-sans leading-relaxed text-lg">
           AI Persona Acting Simulator
        </p>
        <p className="mt-8 max-w-lg font-sans leading-relaxed">
            좌측 패널에서 연기할 '페르소나'와 '상황'을 설정하고, 첫 장면을 생성하여 새로운 연기를 시작하십시오.
        </p>
        {isNewSceneDisabled && (
            <div className="mt-6 text-sm text-[var(--warning)] bg-yellow-900/30 p-4 rounded-lg border border-yellow-800/50 font-sans max-w-md">
                <p className="font-bold mb-1">경고: 시스템 요구사항 미충족</p>
                <p>'새 장면 시작' 기능이 비활성화되었습니다. [상황] 탭에서 '상황'을, [인물] 탭에서 '유저'와 1명 이상의 '페르소나'를 설정해야 합니다.</p>
            </div>
        )}
    </div>
));

export default WelcomeMessage;
