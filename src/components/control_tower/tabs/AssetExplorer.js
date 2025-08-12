// src/components/control_tower/tabs/AssetExplorer.js
import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStoryContext } from '../../../contexts/StoryProvider';
import { ICONS } from '../../../constants';
import { Card, CardHeader } from '../../ui/layouts';
import { Spinner } from '../../ui/widgets';
import { ConfirmationModal } from '../../ui/modals/ConfirmationModal';
import { assetService } from '../../../services';

const AssetExplorer = () => {
    const { storyProps, handlerProps } = useStoryContext();
    const { storyId } = storyProps;
    const { showToast, setImagePreviewUrl } = handlerProps;

    const [currentPath, setCurrentPath] = useState('');
    const [items, setItems] = useState({ folders: [], files: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const fetchItems = useCallback(async () => {
        if (!storyId) return;
        setIsLoading(true);
        try {
            const fetchedItems = await assetService.listAssets(storyId, currentPath);
            setItems(fetchedItems);
        } catch (error) {
            showToast(`에셋을 불러오는 중 오류 발생: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [storyId, currentPath, showToast]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const onDrop = useCallback(async (acceptedFiles) => {
        if (!storyId || acceptedFiles.length === 0) return;
        setIsLoading(true);
        showToast(`${acceptedFiles.length}개의 파일을 업로드하는 중...`);
        try {
            await Promise.all(acceptedFiles.map(file => assetService.uploadFile(storyId, currentPath, file)));
            showToast(`${acceptedFiles.length}개의 파일이 업로드되었습니다.`, 'success');
        } catch (error) {
            showToast(`파일 업로드 실패: ${error.message}`, 'error');
        } finally {
            await fetchItems(); // Refresh list
        }
    }, [storyId, currentPath, fetchItems, showToast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true });

    const handleNavigate = (folderName) => {
        setCurrentPath(prev => prev ? `${prev}/${folderName}` : folderName);
    };

    const handleBreadcrumbClick = (index) => {
        const pathSegments = currentPath.split('/');
        const newPath = pathSegments.slice(0, index + 1).join('/');
        setCurrentPath(newPath);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        setIsLoading(true);
        try {
            await assetService.createFolder(storyId, currentPath, newFolderName);
            showToast(`'${newFolderName}' 폴더가 생성되었습니다.`, 'success');
            setNewFolderName('');
            setIsCreatingFolder(false);
        } catch (error) {
            showToast(`폴더 생성 실패: ${error.message}`, 'error');
        } finally {
            await fetchItems();
        }
    };

    const confirmDelete = (item) => setItemToDelete(item);

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsLoading(true);
        try {
            if (itemToDelete.type === 'folder') {
                await assetService.deleteFolder(itemToDelete.path);
            } else {
                await assetService.deleteFile(itemToDelete.path);
            }
            showToast(`'${itemToDelete.name}'이(가) 삭제되었습니다.`);
        } catch (error) {
            showToast(`삭제 실패: ${error.message}`, 'error');
        } finally {
            setItemToDelete(null);
            await fetchItems();
        }
    };

    const breadcrumbs = currentPath.split('/').filter(Boolean);

    const ItemIcon = ({ item }) => {
        if (item.type === 'folder') return <ICONS.LucideFolder size={32} className="text-yellow-500" />;
        return <ICONS.LucideFileText size={32} className="text-gray-400" />;
    };

    return (
        <>
            <Card className="h-full flex flex-col">
                <CardHeader icon={ICONS.LucideGalleryHorizontal} title="에셋 탐색기">
                    <button onClick={() => setIsCreatingFolder(true)} disabled={!storyId} className="flex items-center px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-md text-xs disabled:opacity-50">
                        <ICONS.LucideFolderPlus className="w-4 h-4 mr-1" /> 새 폴더
                    </button>
                </CardHeader>

                <div className="flex items-center text-sm mb-4 bg-[var(--input-bg)] p-2 rounded-md">
                    <button onClick={() => setCurrentPath('')} className="hover:text-[var(--accent-primary)]">Root</button>
                    {breadcrumbs.map((segment, index) => (
                        <React.Fragment key={index}>
                            <span className="mx-2">/</span>
                            <button onClick={() => handleBreadcrumbClick(index)} className="hover:text-[var(--accent-primary)]">{segment}</button>
                        </React.Fragment>
                    ))}
                </div>

                <div {...getRootProps({ className: `flex-grow border-2 border-dashed rounded-lg transition-colors ${isDragActive ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-primary)]'}` })}>
                    <input {...getInputProps()} />
                    <div className="h-full p-2 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-sm text-[var(--text-secondary)]"><Spinner className="w-5 h-5 mr-2" /> 로딩 중...</div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-4">
                                {items.folders.map(folder => (
                                    <div key={folder.path} onDoubleClick={() => handleNavigate(folder.name)} className="relative group flex flex-col items-center p-2 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer text-center">
                                        <ItemIcon item={folder} />
                                        <p className="text-xs mt-2 break-all">{folder.name}</p>
                                        <button onClick={() => confirmDelete(folder)} className="absolute top-1 right-1 p-1 bg-red-600/80 rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><ICONS.LucideTrash2 size={12} /></button>
                                    </div>
                                ))}
                                {items.files.map(file => (
                                    <div key={file.path} onDoubleClick={() => setImagePreviewUrl(file.url)} className="relative group flex flex-col items-center p-2 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer text-center">
                                        <img src={file.url} alt={file.name} className="w-16 h-16 object-cover rounded-md bg-[var(--input-bg)]" />
                                        <p className="text-xs mt-2 break-all">{file.name}</p>
                                        <button onClick={() => confirmDelete(file)} className="absolute top-1 right-1 p-1 bg-red-600/80 rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><ICONS.LucideTrash2 size={12} /></button>
                                    </div>
                                ))}
                                {!isLoading && items.folders.length === 0 && items.files.length === 0 && (
                                     <div className="col-span-full text-center py-16 text-[var(--text-secondary)]">
                                        <ICONS.LucideArchiveX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-sm">폴더가 비어있습니다.</p>
                                        <p className="text-xs mt-1">파일을 여기에 드래그 앤 드롭하여 업로드하세요.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Card>
            <ConfirmationModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={executeDelete} title="삭제 확인">
                <p>정말로 <strong className="text-[var(--accent-primary)]">{itemToDelete?.name}</strong> 항목을 삭제하시겠습니까? 폴더를 삭제하면 내부의 모든 파일과 하위 폴더가 영구적으로 삭제됩니다.</p>
            </ConfirmationModal>
            {isCreatingFolder && (
                 <div className="fixed inset-0 bg-black/70 flex justify-center items-center animate-fadeIn backdrop-blur-sm p-4 z-[150]">
                    <div className="panel-ui rounded-xl shadow-2xl w-full max-w-sm border border-[var(--border-primary)] p-6">
                        <h3 className="text-lg font-bold mb-4">새 폴더 생성</h3>
                        <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="폴더 이름" autoFocus className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm mb-4" onKeyPress={e => e.key === 'Enter' && handleCreateFolder()} />
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setIsCreatingFolder(false)} className="px-4 py-2 bg-[var(--bg-tertiary)] rounded-lg text-sm">취소</button>
                            <button onClick={handleCreateFolder} className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-sm">생성</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// [FIX] Remove the unnecessary fallback line as the icon is now correctly imported from constants.
// ICONS.LucideFolderPlus = ICONS.LucideFolderPlus || ICONS.LucideFolder;

export default AssetExplorer;
