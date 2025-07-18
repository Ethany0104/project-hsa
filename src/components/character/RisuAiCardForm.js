import React from 'react';
import { ICONS } from '../../constants';
import { EditableField } from '../ui/forms';

/**
 * RisuAI 카드 설정을 위한 재사용 가능한 폼 컴포넌트
 * @param {object} props - { localCharacter, handleLocalChange, handleImageUpload }
 */
export const RisuAiCardForm = ({ localCharacter, handleLocalChange, handleImageUpload }) => {
    return (
        <div className="space-y-3">
            <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">프로필 이미지</label>
                <div className="flex items-center space-x-4">
                    {localCharacter.profileImageUrl ? (
                        <img src={localCharacter.profileImageUrl} alt="Profile Preview" className="w-20 h-20 rounded-lg object-cover border border-[var(--border)]" />
                    ) : (
                        <div className="w-20 h-20 rounded-lg bg-[var(--input-bg)] flex items-center justify-center border border-dashed border-[var(--border)]">
                            <ICONS.LucideImage className="w-8 h-8 text-[var(--text-secondary)]" />
                        </div>
                    )}
                    <label htmlFor="profile-image-upload" className="cursor-pointer bg-[var(--panel-bg-alt)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--border)] rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
                        이미지 선택
                    </label>
                    <input 
                        id="profile-image-upload"
                        type="file" 
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageUpload} 
                        className="hidden" 
                    />
                </div>
            </div>
            <EditableField 
                isTextarea
                rows={4}
                label="첫 대사 (First Message)" 
                value={localCharacter.firstMessage || ''} 
                onChange={e => handleLocalChange('firstMessage', e.target.value)}
                placeholder="캐릭터가 처음 건네는 인사를 입력하세요."
            />
            <EditableField 
                isTextarea
                rows={6}
                label="시나리오 (Scenario)" 
                value={localCharacter.scenario || ''} 
                onChange={e => handleLocalChange('scenario', e.target.value)}
                placeholder="채팅의 배경이 되는 상황을 설정합니다."
            />
            <EditableField 
                isTextarea
                rows={8}
                label="시스템 프롬프트 (System Prompt)" 
                value={localCharacter.systemPrompt || ''} 
                onChange={e => handleLocalChange('systemPrompt', e.target.value)}
                placeholder="AI에게 캐릭터의 역할, 말투 등 핵심 지시를 내립니다."
            />
            <EditableField 
                isTextarea
                rows={4}
                label="후처리 지시문 (Post History Instructions)" 
                value={localCharacter.postHistoryInstructions || ''} 
                onChange={e => handleLocalChange('postHistoryInstructions', e.target.value)}
                placeholder="AI의 최종 응답을 다듬기 위한 추가 지시를 내립니다."
            />
        </div>
    );
};
