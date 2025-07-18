import React from 'react';
import { ICONS } from '../../constants';
import { Card, CardHeader } from '../ui/layouts';
import { EditableField } from '../ui/forms';
import { RisuAiCardForm } from './RisuAiCardForm';

/**
 * 주인공 캐릭터 시트 컴포넌트
 * @param {object} props - { localCharacter, handleLocalChange, handleImageUpload, handleSaveAsTemplateClick, isProcessing }
 */
export const ProtagonistSheet = ({ localCharacter, handleLocalChange, handleImageUpload, handleSaveAsTemplateClick, isProcessing }) => {
    return (
        <div className="space-y-6 lg:col-span-1">
            <Card>
                <CardHeader icon={ICONS.LucideFileText} title="기본 정보" />
                <div className="space-y-3">
                    <EditableField label="이름" value={localCharacter.name || ''} onChange={e => handleLocalChange('name', e.target.value)} />
                    <EditableField isTextarea rows={5} label="외형" value={localCharacter.appearance || ''} onChange={e => handleLocalChange('appearance', e.target.value)} />
                    <EditableField isTextarea rows={5} label="캐릭터 노트" value={localCharacter.note || ''} onChange={e => handleLocalChange('note', e.target.value)} />
                </div>
            </Card>
            <Card>
                <CardHeader icon={ICONS.LucideBot} title="RisuAI 카드 설정" />
                <RisuAiCardForm 
                    localCharacter={localCharacter}
                    handleLocalChange={handleLocalChange}
                    handleImageUpload={handleImageUpload}
                />
            </Card>
            <div className="pt-2">
                <button
                    onClick={handleSaveAsTemplateClick}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center px-4 py-3 bg-[var(--panel-bg-alt)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--border)] rounded-lg text-base font-semibold transition-colors disabled:opacity-50"
                >
                    <ICONS.LucideFileArchive className="w-5 h-5 mr-2.5"/>
                    프리셋으로 저장
                </button>
            </div>
        </div>
    );
};
