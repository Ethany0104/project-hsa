import React, { useState, useMemo } from 'react';
import { ICONS } from '../../../constants';
import { Spinner } from '../../ui';

const ScheduleManager = ({ character, onUpdate, onGenerate, isProcessing }) => {
    const [newTime, setNewTime] = useState("09:00");
    const schedule = useMemo(() => character.dailySchedule || [], [character.dailySchedule]);

    const handleAddTimeSlot = () => {
        if (!newTime || schedule.some(s => s.time === newTime)) return;
        const newSchedule = [...schedule, { time: newTime, variants: [{ activity: '', weight: 100 }] }];
        newSchedule.sort((a, b) => a.time.localeCompare(b.time));
        onUpdate('dailySchedule', newSchedule);
    };

    const handleDeleteTimeSlot = (time) => {
        const newSchedule = schedule.filter(s => s.time !== time);
        onUpdate('dailySchedule', newSchedule);
    };

    const handleVariantChange = (time, variantIndex, field, value) => {
        const newSchedule = JSON.parse(JSON.stringify(schedule));
        const timeSlot = newSchedule.find(s => s.time === time);
        if (timeSlot) {
            timeSlot.variants[variantIndex][field] = value;
            onUpdate('dailySchedule', newSchedule);
        }
    };
    
    const handleAddVariant = (time) => {
        const newSchedule = JSON.parse(JSON.stringify(schedule));
        const timeSlot = newSchedule.find(s => s.time === time);
        if (timeSlot) {
            timeSlot.variants.push({ activity: '', weight: 10 });
            const totalWeight = timeSlot.variants.reduce((sum, v) => sum + v.weight, 0);
            if (totalWeight > 100) {
                 timeSlot.variants.forEach(v => v.weight = Math.floor(100 / timeSlot.variants.length));
            }
            onUpdate('dailySchedule', newSchedule);
        }
    };
    
    const handleDeleteVariant = (time, variantIndex) => {
        const newSchedule = JSON.parse(JSON.stringify(schedule));
        const timeSlot = newSchedule.find(s => s.time === time);
        if (timeSlot && timeSlot.variants.length > 1) {
            timeSlot.variants.splice(variantIndex, 1);
            onUpdate('dailySchedule', newSchedule);
        }
    };

    return (
        <div className="space-y-4">
            <button onClick={() => onGenerate(character.id)} disabled={isProcessing} className="w-full flex items-center justify-center px-4 py-2 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
                {isProcessing ? <Spinner className="w-4 h-4 mr-2" /> : <ICONS.LucideSparkles className="w-4 h-4 mr-2" />}
                AI로 시간표 자동 생성
            </button>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {schedule.map(({ time, variants }) => (
                    <div key={time} className="p-3 bg-[var(--input-bg)] rounded-lg border border-[var(--border-primary)]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold font-mono text-lg text-[var(--accent-primary)]">{time}</span>
                            <button onClick={() => handleDeleteTimeSlot(time)} className="text-[var(--text-secondary)] hover:text-[var(--danger)]"><ICONS.LucideTrash2 size={14} /></button>
                        </div>
                        <div className="space-y-2">
                            {variants.map((variant, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input type="text" value={variant.activity} onChange={e => handleVariantChange(time, index, 'activity', e.target.value)} placeholder="활동 내용" className="flex-grow bg-[var(--bg-secondary)] p-1.5 rounded-md text-sm border border-[var(--border-primary)]" />
                                    <input type="number" value={variant.weight} onChange={e => handleVariantChange(time, index, 'weight', parseInt(e.target.value) || 0)} className="w-16 bg-[var(--bg-secondary)] p-1.5 rounded-md text-sm border border-[var(--border-primary)] text-center" />
                                    <button onClick={() => handleDeleteVariant(time, index)} className="text-[var(--text-secondary)] hover:text-[var(--danger)]"><ICONS.LucideX size={14} /></button>
                                </div>
                            ))}
                             <button onClick={() => handleAddVariant(time)} className="w-full text-xs py-1 mt-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-secondary)] rounded-md transition-colors">+ 활동 가능성 추가</button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex space-x-2">
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="flex-grow bg-[var(--bg-secondary)] p-2 rounded-md text-sm border border-[var(--border-primary)]" />
                <button onClick={handleAddTimeSlot} className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-secondary)] rounded-lg text-sm font-semibold transition-colors">시간대 추가</button>
            </div>
        </div>
    );
};

export default ScheduleManager;
