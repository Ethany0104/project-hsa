import React from 'react';
import { ICONS } from '../../constants';
import { Card, CardHeader } from '../ui/layouts';
import { EditableField } from '../ui/forms';

/**
 * 유저 정보 시트 컴포넌트
 */
export const UserSheet = ({ localCharacter, handleLocalChange, handleImageUpload }) => {
    return (
        <div className="space-y-6 lg:col-span-1 max-w-md mx-auto">
            <Card>
                <CardHeader icon={ICONS.LucideUser} title="유저 정보" />
                <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">프로필 이미지</label>
                        <div className="w-3/4 mx-auto aspect-[2/3] rounded-lg bg-[var(--input-bg)] flex items-center justify-center border border-dashed border-[var(--border-primary)] overflow-hidden mb-3">
                            {localCharacter.profileImageUrl ? (
                                <img src={localCharacter.profileImageUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                            ) : (
                                <ICONS.LucideImage className="w-16 h-16 text-[var(--text-secondary)] opacity-50" />
                            )}
                        </div>
                        <div className="flex flex-col items-center">
                            {/* [BUG FIX] label의 htmlFor와 input의 id를 캐릭터별로 고유하게 만듭니다. */}
                            <label htmlFor={`user-profile-image-upload-${localCharacter.id}`} className="cursor-pointer bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--border-secondary)] rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
                                이미지 업로드
                            </label>
                            <p className="text-xs text-[var(--text-secondary)] mt-2">최대 2MB (PNG, JPG, WEBP)</p>
                        </div>
                        {/* [BUG FIX] id를 고유하게 변경하여 다른 시트의 input과 충돌하지 않도록 합니다. */}
                        <input 
                            id={`user-profile-image-upload-${localCharacter.id}`}
                            type="file" 
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleImageUpload} 
                            className="hidden" 
                        />
                    </div>
                    <EditableField label="이름" value={localCharacter.name || ''} onChange={e => handleLocalChange('name', e.target.value)} placeholder="유저의 이름을 입력합니다."/>
                    <EditableField isTextarea rows={5} label="외형" value={localCharacter.appearance || ''} onChange={e => handleLocalChange('appearance', e.target.value)} placeholder="페르소나의 외모, 체형, 자주 입는 옷차림 등을 구체적으로 묘사합니다."/>
                    <EditableField isTextarea rows={5} label="유저 컨셉" value={localCharacter.generationConcept || ''} onChange={e => handleLocalChange('generationConcept', e.target.value)} placeholder="AI가 참고할 유저의 핵심 컨셉이나 키워드를 서술합니다."/>
                </div>
            </Card>
        </div>
    );
};