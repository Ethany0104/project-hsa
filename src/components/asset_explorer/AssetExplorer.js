// src/components/asset_explorer/AssetExplorer.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import { useDropzone } from 'react-dropzone';
import { useStoryContext } from '../../contexts/StoryProvider';
import { ICONS } from '../../constants';
import { Card, CardHeader } from '../ui/layouts';
import { Spinner } from '../ui/widgets';
import { ConfirmationModal } from '../ui/modals/ConfirmationModal';
import { assetService } from '../../services';

// --- Draggable/Droppable 컴포넌트들 ---
const DraggableFile = ({ file, onDoubleClick, onConfirmDelete, isSelected, onClick, isGhost, ownerName, ownerColor }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: file.id, data: { type: 'file', file } });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 } : undefined;
    
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}
            onClick={(e) => onClick(e, file, 'file')}
            onDoubleClick={() => onDoubleClick(file.storageUrl)}
            className={`relative group flex flex-col items-center p-2 rounded-lg text-center touch-none transition-all duration-150 ${isSelected ? 'selected' : 'hover:bg-[var(--bg-tertiary)] cursor-pointer'} ${isGhost ? 'ghost' : ''}`}>
            {isSelected && !isGhost && (
                <div className="selection-checkmark"><ICONS.LucideCheckCircle size={20} /></div>
            )}
            <div className="relative w-20 h-20">
                <img src={file.storageUrl} alt={file.fileName} className="w-full h-full object-cover rounded-md bg-[var(--input-bg)] pointer-events-none" />
                {ownerName && (
                    <span className="absolute bottom-1 right-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: ownerColor }}>
                        {ownerName}
                    </span>
                )}
            </div>
            <p className="text-xs mt-2 break-all w-full text-center pointer-events-none">{file.fileName}</p>
            <button onMouseDown={(e) => { e.stopPropagation(); onConfirmDelete(file); }} className="absolute top-1 right-1 p-1 bg-red-600/80 rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><ICONS.LucideTrash2 size={12} /></button>
        </div>
    );
};

const DroppableFolder = ({ folder, onNavigate, onConfirmDelete, isSelected, onClick, isGhost }) => {
    const { isOver, setNodeRef } = useDroppable({ id: folder.path, data: { type: 'folder' } });
    return (
        <div ref={setNodeRef}
            onClick={(e) => onClick(e, folder, 'folder')}
            onDoubleClick={() => onNavigate(folder.name)}
            className={`relative group flex flex-col items-center p-2 rounded-lg text-center transition-all duration-150 ${isOver ? 'bg-[var(--accent-primary)]/20' : ''} ${isSelected ? 'selected' : 'hover:bg-[var(--bg-tertiary)] cursor-pointer'} ${isGhost ? 'ghost' : ''}`}>
            {isSelected && !isGhost && (
                <div className="selection-checkmark"><ICONS.LucideCheckCircle size={20} /></div>
            )}
            <ICONS.LucideFolder size={48} className="text-yellow-500 pointer-events-none" />
            <p className="text-xs mt-2 break-all w-full text-center pointer-events-none">{folder.name}</p>
            <button onMouseDown={(e) => { e.stopPropagation(); onConfirmDelete(folder); }} className="absolute top-1 right-1 p-1 bg-red-600/80 rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><ICONS.LucideTrash2 size={12} /></button>
        </div>
    );
};

// --- 드래그 미리보기 UI를 위한 컴포넌트 ---
const DragPreview = ({ items }) => {
    if (!items || items.length === 0) return null;
    const previewItems = items.slice(0, 3);
    const remainingCount = items.length - previewItems.length;

    return (
        <div className="drag-preview-container">
            {remainingCount > 0 && (
                <div className="drag-preview-counter">+{remainingCount}</div>
            )}
            {previewItems.reverse().map((item, index) => (
                <div key={item.id} className="drag-preview-item" style={{ transform: `translate(${index * 6}px, ${index * 6}px)` }}>
                    {item.type === 'file' ? (
                        <img src={item.storageUrl} alt={item.fileName} className="w-16 h-16 object-cover rounded-md" />
                    ) : (
                        <ICONS.LucideFolder size={48} className="text-yellow-500" />
                    )}
                </div>
            ))}
        </div>
    );
};

const AssetExplorer = () => {
    const { storyProps, handlerProps } = useStoryContext();
    const { storyId, assets, characters } = storyProps;
    const { showToast, setImagePreviewUrl, handleUploadAsset, handleDeleteAsset, handleBulkAssetSave, setAssets } = handlerProps;
    
    const [currentPath, setCurrentPath] = useState('');
    const [folders, setFolders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    
    const [selectedOwner, setSelectedOwner] = useState('shared');

    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isBoxDragging, setIsBoxDragging] = useState(false);
    const [activeDragItem, setActiveDragItem] = useState(null);
    const selectionBoxRef = useRef(null);
    const explorerRef = useRef(null);
    const dragStartPosRef = useRef({ x: 0, y: 0 });

    const fetchFolders = useCallback(async () => {
        if (!storyId) return;
        setIsLoading(true);
        try {
            const fetchedFolders = await assetService.listFolders(storyId, currentPath);
            setFolders(fetchedFolders);
        } catch (error) {
            showToast(`폴더를 불러오는 중 오류 발생: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [storyId, currentPath, showToast]);

    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    // [수정] currentFiles가 선택된 소유자(selectedOwner)에 따라 필터링되도록 로직을 수정합니다.
    const currentFiles = useMemo(() =>
        assets.filter(asset => {
            const pathMatch = (asset.path || '') === currentPath;
            // 'shared'는 ownerId가 'shared'인 에셋을, 캐릭터 ID는 해당 ID를 가진 에셋을 필터링합니다.
            const ownerMatch = String(asset.ownerId) === String(selectedOwner);
            return pathMatch && ownerMatch;
        }),
        [assets, currentPath, selectedOwner] // 의존성 배열에 selectedOwner 추가
    );

    const allItems = [...folders, ...currentFiles];

    const onDrop = useCallback(async (acceptedFiles) => {
        if (isBoxDragging) return;
        if (!storyId || acceptedFiles.length === 0) return;
        
        setIsLoading(true);
        showToast(`${acceptedFiles.length}개의 파일을 업로드하는 중... (소유자: ${selectedOwner})`);
        try {
            const uploadPromises = acceptedFiles.map(file => handleUploadAsset(file, selectedOwner, currentPath));
            const newAssets = await Promise.all(uploadPromises);
            
            setAssets(prevAssets => [...prevAssets, ...newAssets]);
            
            setTimeout(handleBulkAssetSave, 0);

            showToast(`${acceptedFiles.length}개의 파일이 성공적으로 업로드되었습니다.`, 'success');
        } catch (error) {
            showToast(`파일 업로드 실패: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [isBoxDragging, storyId, currentPath, showToast, selectedOwner, handleUploadAsset, setAssets, handleBulkAssetSave]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true });

    const handleMouseDown = useCallback((e) => {
        const itemElement = e.target.closest('.asset-item, .folder-item');
        if (!itemElement) {
            e.preventDefault();
            setIsBoxDragging(true);
            const rect = explorerRef.current.getBoundingClientRect();
            dragStartPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            if (!e.shiftKey) setSelectedItems(new Set());

            const box = selectionBoxRef.current;
            if (box) {
                Object.assign(box.style, {
                    left: `${dragStartPosRef.current.x}px`, top: `${dragStartPosRef.current.y}px`,
                    width: '0px', height: '0px', display: 'block'
                });
            }
        }
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isBoxDragging || !explorerRef.current || isDragActive) return;
        e.preventDefault();

        const rect = explorerRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const { x: startX, y: startY } = dragStartPosRef.current;

        const newX = Math.min(startX, currentX);
        const newY = Math.min(startY, currentY);
        const newWidth = Math.abs(startX - currentX);
        const newHeight = Math.abs(startY - currentY);

        const box = selectionBoxRef.current;
        if (box) Object.assign(box.style, { left: `${newX}px`, top: `${newY}px`, width: `${newWidth}px`, height: `${newHeight}px` });

        const newSelected = new Set(e.shiftKey ? selectedItems : []);
        const allItemElements = Array.from(explorerRef.current.querySelectorAll('.asset-item, .folder-item'));
        
        allItemElements.forEach(itemEl => {
            const itemRect = itemEl.getBoundingClientRect();
            const itemLeft = itemRect.left - rect.left;
            const itemTop = itemRect.top - rect.top;
            const itemId = itemEl.dataset.id;
            if (newX < itemLeft + itemRect.width && newX + newWidth > itemLeft && newY < itemTop + itemRect.height && newY + newHeight > itemTop) {
                newSelected.add(itemId);
            }
        });
        setSelectedItems(newSelected);
    }, [isBoxDragging, selectedItems, isDragActive]);

    const handleMouseUp = useCallback(() => {
        if (isBoxDragging) {
            setIsBoxDragging(false);
            if (selectionBoxRef.current) selectionBoxRef.current.style.display = 'none';
        }
    }, [isBoxDragging]);
    
    const handleItemClick = useCallback((e, item) => {
        e.stopPropagation();
        const itemId = item.id || item.path;
        if (e.shiftKey) {
            setSelectedItems(prev => {
                const newSet = new Set(prev);
                if (newSet.has(itemId)) newSet.delete(itemId);
                else newSet.add(itemId);
                return newSet;
            });
        } else {
            setSelectedItems(new Set([itemId]));
        }
    }, []);

    useEffect(() => {
        const explorerElement = explorerRef.current;
        if (explorerElement) {
            explorerElement.addEventListener('mousedown', handleMouseDown);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            if (explorerElement) {
                explorerElement.removeEventListener('mousedown', handleMouseDown);
            }
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseDown, handleMouseMove, handleMouseUp]);

    const handleNavigate = (folderName) => setCurrentPath(prev => prev ? `${prev}/${folderName}` : folderName);
    const handleBreadcrumbClick = (index) => setCurrentPath(currentPath.split('/').slice(0, index + 1).join('/'));
    
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        setIsLoading(true);
        try {
            await assetService.createFolder(storyId, currentPath, newFolderName);
            showToast(`'${newFolderName}' 폴더가 생성되었습니다.`, 'success');
            setNewFolderName('');
            setIsCreatingFolder(false);
            await fetchFolders();
        } catch (error) {
            showToast(`폴더 생성 실패: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = (item) => setItemToDelete(item);

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsLoading(true);
        try {
            if (itemToDelete.type === 'folder') {
                await assetService.deleteFolder(`assets/${storyId}/${itemToDelete.path}`);
                await fetchFolders();
            } else {
                await handleDeleteAsset(itemToDelete);
            }
            showToast(`'${itemToDelete.fileName || itemToDelete.name}'이(가) 삭제되었습니다.`);
        } catch (error) {
            showToast(`삭제 실패: ${error.message}`, 'error');
        } finally {
            setItemToDelete(null);
            setIsLoading(false);
        }
    };

    const handleDragStart = (event) => {
        const activeItemData = allItems.find(item => item.id === event.active.id || item.path === event.active.id);
        setActiveDragItem(activeItemData);
    };

    const handleDragEnd = async (event) => {
        setActiveDragItem(null);
        // 파일 이동 로직은 추후 구현 (Firestore 데이터 업데이트 필요)
    };
    
    const draggedPreviewItems = activeDragItem 
        ? (selectedItems.has(activeDragItem.id) 
            ? allItems.filter(item => selectedItems.has(item.id)) 
            : [activeDragItem])
        : [];

    const breadcrumbs = currentPath.split('/').filter(Boolean);
    
    const ownerOptions = useMemo(() => [
        { id: 'shared', name: '공용 에셋' },
        ...characters.map(c => ({ id: c.id, name: c.name }))
    ], [characters]);

    const getOwnerInfo = (ownerId) => {
        if (ownerId === 'shared') return { name: '공용', color: '#6B7280' };
        const owner = characters.find(c => String(c.id) === String(ownerId));
        return owner ? { name: owner.name, color: owner.isUser ? '#3B82F6' : '#8A2BE2' } : { name: '?', color: '#EF4444'};
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col p-4 bg-[var(--bg-primary)] w-full flex-grow">
                <Card className="h-full flex flex-col">
                    <CardHeader icon={ICONS.LucideGalleryHorizontal} title="에셋 탐색기">
                        <div className="flex items-center space-x-2">
                            <select 
                                value={selectedOwner}
                                onChange={e => setSelectedOwner(e.target.value)}
                                disabled={!storyId}
                                className="bg-[var(--input-bg)] border border-[var(--border-primary)] text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] disabled:opacity-50"
                            >
                                {ownerOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                            </select>
                            <button onClick={() => setIsCreatingFolder(true)} disabled={!storyId} className="flex items-center px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-md text-xs disabled:opacity-50">
                                <ICONS.LucideFolderPlus className="w-4 h-4 mr-1" /> 새 폴더
                            </button>
                        </div>
                    </CardHeader>
                    <div className="flex items-center text-sm mb-4 bg-[var(--input-bg)] p-2 rounded-md">
                        <button onClick={() => setCurrentPath('')} className="hover:text-[var(--accent-primary)] font-semibold">Root</button>
                        {breadcrumbs.map((segment, index) => (
                            <React.Fragment key={index}>
                                <span className="mx-2 text-[var(--text-secondary)]">/</span>
                                <button onClick={() => handleBreadcrumbClick(index)} className="hover:text-[var(--accent-primary)]">{segment}</button>
                            </React.Fragment>
                        ))}
                    </div>
                    <div {...getRootProps({ className: `relative flex-grow border-2 border-dashed rounded-lg transition-colors p-2 ${isDragActive ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-primary)]'}` })}>
                        <input {...getInputProps()} />
                        <div ref={explorerRef} className="h-full overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full"><Spinner /> 로딩 중...</div>
                            ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 h-full content-start">
                                    {folders.map(folder => (
                                        <div key={folder.path} data-id={folder.path} className="folder-item">
                                            <DroppableFolder folder={folder} onNavigate={() => handleNavigate(folder.name)} onConfirmDelete={confirmDelete} isSelected={selectedItems.has(folder.path)} onClick={handleItemClick} isGhost={activeDragItem && selectedItems.has(folder.path)} />
                                        </div>
                                    ))}
                                    {currentFiles.map(file => {
                                        const ownerInfo = getOwnerInfo(file.ownerId);
                                        return (
                                            <div key={file.id} data-id={file.id} className="asset-item">
                                                <DraggableFile file={file} onDoubleClick={setImagePreviewUrl} onConfirmDelete={confirmDelete} isSelected={selectedItems.has(file.id)} onClick={handleItemClick} isGhost={activeDragItem && selectedItems.has(file.id)} ownerName={ownerInfo.name} ownerColor={ownerInfo.color} />
                                            </div>
                                        );
                                    })}
                                    {!isLoading && folders.length === 0 && currentFiles.length === 0 && (
                                        <div className="col-span-full w-full h-full flex flex-col items-center justify-center text-center text-[var(--text-secondary)]">
                                            <ICONS.LucideArchiveX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-sm">폴더가 비어있습니다.</p>
                                            <p className="text-xs mt-1">파일을 여기에 드래그 앤 드롭하여 업로드하세요.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div id="selection-box" ref={selectionBoxRef}></div>
                        </div>
                    </div>
                </Card>
            </div>
            <DragOverlay>
                {activeDragItem ? <DragPreview items={draggedPreviewItems} /> : null}
            </DragOverlay>
            <ConfirmationModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={executeDelete} title="삭제 확인">
                <p>정말로 <strong className="text-[var(--accent-primary)]">{itemToDelete?.fileName || itemToDelete?.name}</strong> 항목을 삭제하시겠습니까? 폴더를 삭제하면 내부의 모든 파일과 하위 폴더가 영구적으로 삭제됩니다.</p>
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
        </DndContext>
    );
};

export default AssetExplorer;
