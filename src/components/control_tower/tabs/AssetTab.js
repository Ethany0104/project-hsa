import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStoryContext } from '../../../contexts/StoryProvider';
import { ICONS } from '../../../constants';
import { Card, CardHeader } from '../../ui/layouts';
import { Spinner, ConfirmationModal } from '../../ui';

const AssetTab = () => {
    const { storyProps, handlerProps } = useStoryContext();
    const { storyId, assets = [], characters, isProcessing, lastAiImageAssetChoice } = storyProps;
    const { handleUploadAsset, handleDeleteAsset, showToast } = handlerProps;
    const [assetToDelete, setAssetToDelete] = useState(null);
    const [selectedOwner, setSelectedOwner] = useState('shared');
    const [isDebugVisible, setIsDebugVisible] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        if (!storyId) {
            showToast("에셋을 업로드하려면 먼저 장면을 시작해야 합니다.", "error");
            return;
        }
        acceptedFiles.forEach(file => {
            handleUploadAsset(file, selectedOwner);
        });
    }, [storyId, handleUploadAsset, showToast, selectedOwner]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.gif', '.jpeg', '.jpg', '.webp'] },
        maxSize: 5 * 1024 * 1024, // 5MB
        onDropRejected: (fileRejections) => {
            fileRejections.forEach(({ file, errors }) => {
                errors.forEach(error => {
                    if (error.code === 'file-too-large') {
                        showToast(`'${file.name}' 파일이 너무 큽니다. (최대 5MB)`, "error");
                    } else {
                        showToast(`'${file.name}' 파일은 올릴 수 없습니다. (${error.message})`, "error");
                    }
                });
            });
        }
    });

    const confirmDelete = (asset) => {
        setAssetToDelete(asset);
    };

    const executeDelete = () => {
        if (assetToDelete) {
            handleDeleteAsset(assetToDelete);
            setAssetToDelete(null);
        }
    };
    
    const getOwnerName = (ownerId) => {
        if (ownerId === 'shared') return '공용';
        return characters.find(c => String(c.id) === ownerId)?.name || '알 수 없음';
    };

    const availableAssetsText = useMemo(() => {
        if (!assets || assets.length === 0) {
            return "### 사용 가능한 에셋 목록 (availableAssets)\n없음";
        }
        const assetMap = assets.reduce((acc, asset) => {
            const ownerKey = asset.ownerId === 'shared' 
                ? '공용' 
                : characters.find(c => String(c.id) === String(asset.ownerId))?.name || '알수없음';
            
            if (!acc[ownerKey]) {
                acc[ownerKey] = [];
            }
            acc[ownerKey].push(asset.fileName);
            return acc;
        }, {});
        return `### 사용 가능한 에셋 목록 (availableAssets)\n${JSON.stringify(assetMap, null, 2)}`;
    }, [assets, characters]);

    return (
        <>
            <div className="space-y-6">
                <Card>
                    <CardHeader icon={ICONS.LucideGalleryHorizontal} title="장면 에셋 관리" />
                    <div className="mb-4">
                        <label htmlFor="asset-owner" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">에셋 소유자</label>
                        <select
                            id="asset-owner"
                            value={selectedOwner}
                            onChange={(e) => setSelectedOwner(e.target.value)}
                            className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-primary)]"
                            disabled={!storyId}
                        >
                            <option value="shared">공용 에셋</option>
                            {characters.filter(c => !c.isUser).map(char => (
                                <option key={char.id} value={char.id}>{char.name}</option>
                            ))}
                        </select>
                    </div>
                    <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors ${isDragActive ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-primary)] hover:border-[var(--accent-secondary)]'}`}>
                        <input {...getInputProps()} />
                        <ICONS.LucideImage className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-2" />
                        {isDragActive ?
                            <p className="text-sm text-[var(--accent-primary)]">여기에 이미지를 놓으세요</p> :
                            <p className="text-sm text-[var(--text-secondary)]">이미지를 드래그 앤 드롭하거나 클릭해서 업로드하세요. (최대 5MB)</p>
                        }
                    </div>
                </Card>

                <Card>
                    <CardHeader icon={ICONS.LucideImages} title={`업로드된 에셋 (${assets.length})`}>
                        <button 
                            onClick={() => setIsDebugVisible(!isDebugVisible)} 
                            className="flex items-center px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-md text-xs"
                            title="AI 컨텍스트 디버거"
                        >
                            <ICONS.LucideBug className="w-4 h-4 mr-1" />
                        </button>
                    </CardHeader>
                    {/* [수정] 디버그 뷰에 AI의 선택 결과와 분석된 텍스트를 모두 표시합니다. */}
                    {isDebugVisible && (
                        <div className="mb-4 p-2 bg-[var(--input-bg)] rounded-md border border-[var(--border-primary)] animate-fadeIn">
                            <h4 className="text-xs font-bold text-[var(--text-secondary)] mb-1">AI에게 전달되는 에셋 컨텍스트:</h4>
                            <pre className="w-full bg-black/20 p-2 rounded text-[10px] text-white/80 overflow-x-auto whitespace-pre-wrap font-mono">
                                <code>{availableAssetsText}</code>
                            </pre>
                            <h4 className="text-xs font-bold text-[var(--text-secondary)] mt-3 mb-1">AI의 최신 이미지 선택:</h4>
                            <div className="w-full bg-black/20 p-2 rounded text-xs text-white/80 font-mono space-y-2">
                                {lastAiImageAssetChoice && lastAiImageAssetChoice.analyzedText ? (
                                    <>
                                        <div>
                                            <span className="text-cyan-400">분석 대상 텍스트: </span>
                                            <p className="mt-1 p-1 bg-black/30 rounded text-gray-300 whitespace-pre-wrap">"{lastAiImageAssetChoice.analyzedText}"</p>
                                        </div>
                                        <div>
                                            <span className="text-cyan-400">AI 응답: </span>
                                            <span className="font-bold text-white">"{lastAiImageAssetChoice.choice}"</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-gray-500">아직 AI가 이미지를 선택하지 않았습니다.</p>
                                )}
                            </div>
                        </div>
                    )}
                    {isProcessing && !assetToDelete && (
                         <div className="flex items-center justify-center p-4 text-sm text-[var(--text-secondary)]">
                            <Spinner className="w-4 h-4 mr-2" />
                            에셋을 처리하는 중...
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
                        {assets.map((asset) => (
                            <div key={asset.id} className="relative group aspect-square">
                                <img src={asset.storageUrl} alt={asset.fileName} className="w-full h-full object-cover rounded-md bg-[var(--input-bg)]" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between items-start p-1">
                                    <div className="text-white text-[10px] font-bold bg-black/60 px-1.5 py-0.5 rounded-full self-start">
                                        {getOwnerName(asset.ownerId)}
                                    </div>
                                    <div className="self-stretch flex justify-between items-end">
                                      <p className="text-white text-xs break-all p-1 bg-black/50 rounded-sm max-w-[70%]">{asset.fileName}</p>
                                      <button onClick={() => confirmDelete(asset)} className="p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-500">
                                          <ICONS.LucideTrash2 size={14} />
                                      </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                     {assets.length === 0 && !isProcessing && (
                        <p className="text-center text-xs text-[var(--text-secondary)] py-8">업로드된 에셋이 없습니다.</p>
                     )}
                </Card>
            </div>
            <ConfirmationModal
                isOpen={!!assetToDelete}
                onClose={() => setAssetToDelete(null)}
                onConfirm={executeDelete}
                title="에셋 삭제 확인"
            >
                <p>정말로 <strong>{assetToDelete?.fileName}</strong> 에셋을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            </ConfirmationModal>
        </>
    );
};

export default AssetTab;
