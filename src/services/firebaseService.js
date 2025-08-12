// src/services/firebaseService.js

import { 
    getDoc, getFirestore, doc, getDocs, collection, addDoc, deleteDoc, 
    setDoc, serverTimestamp, writeBatch, query, where, onSnapshot, 
    orderBy, limit 
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll, uploadString, getBytes } from "firebase/storage";
import { firebaseConfig } from "../config/firebaseConfig" 

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const sanitizeForFirestore = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined) {
        newObj[key] = sanitizeForFirestore(value);
      }
    }
  }
  return newObj;
};

// --- Asset Explorer Service ---
// [수정] 에셋 탐색기 서비스 로직을 개편합니다.
// 이제 파일 메타데이터(소유자 등)는 Firestore에서 관리하므로, Storage 서비스는 순수하게 파일/폴더의 존재 여부만 다룹니다.
export const assetService = {
  // 폴더 목록만 가져옵니다. 파일 목록은 Firestore의 'assets' 배열에서 가져옵니다.
  listFolders: async (storyId, path) => {
    if (!storyId) return [];
    const fullPath = path ? `assets/${storyId}/${path}` : `assets/${storyId}`;
    const listRef = ref(storage, fullPath);
    const res = await listAll(listRef);

    return res.prefixes.map(folderRef => ({
        name: folderRef.name,
        path: folderRef.fullPath.replace(`assets/${storyId}/`, ''), // 상대 경로로 저장
        type: 'folder',
    }));
  },

  createFolder: async (storyId, path, folderName) => {
    // 폴더 생성을 위해 내부에 .placeholder 파일을 업로드합니다.
    const fullPath = `assets/${storyId}/${path ? `${path}/` : ''}${folderName}/.placeholder`;
    const folderRef = ref(storage, fullPath);
    await uploadString(folderRef, '');
    return { name: folderName, path: `${path ? `${path}/` : ''}${folderName}`, type: 'folder' };
  },

  deleteFile: async (filePath) => {
    // 파일 경로를 받아 Storage에서 직접 삭제합니다.
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  },

  deleteFolder: async (folderPath) => {
    // 폴더 내의 모든 파일과 하위 폴더를 재귀적으로 삭제합니다.
    const listRef = ref(storage, folderPath);
    const res = await listAll(listRef);

    const deletePromises = [];
    res.items.forEach(itemRef => deletePromises.push(deleteObject(itemRef)));
    res.prefixes.forEach(folderRef => deletePromises.push(assetService.deleteFolder(folderRef.fullPath)));

    await Promise.all(deletePromises);
  },
};


// --- Story Data Service (Firestore & Storage) ---
export const storyService = {
  uploadImage: async (file, path) => {
    if (!file || !path) {
      throw new Error("업로드할 파일과 저장 경로가 필요합니다.");
    }
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  },

  deleteImage: async (imageUrl) => {
    if (!imageUrl) return;
    try {
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    } catch (error) {
      if (error.code !== 'storage/object-not-found') {
        console.error("Storage 이미지 삭제 오류:", error);
        throw error;
      }
    }
  },

  copyImageInStorage: async (sourceUrl, destinationPath) => {
    try {
      const sourceRef = ref(storage, sourceUrl);
      const bytes = await getBytes(sourceRef);
      const destinationRef = ref(storage, destinationPath);
      const snapshot = await uploadBytes(destinationRef, bytes);
      const newDownloadURL = await getDownloadURL(snapshot.ref);
      return newDownloadURL;
    } catch (error) {
      console.error("스토리지 이미지 복사 중 오류 발생:", error);
      throw error;
    }
  },

  fetchStoryList: async () => {
    const querySnapshot = await getDocs(collection(db, "stories"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title || '제목 없는 이야기' }));
  },

  loadStory: async (id) => {
    if (!id) return null;
    const storyRef = doc(db, "stories", id);
    const docSnap = await getDoc(storyRef);
    if (!docSnap.exists()) return null;
    return docSnap.data();
  },

  listenToMessages: (storyId, callback) => {
    if (!storyId) return () => {};
    const messagesRef = collection(db, "stories", storyId, "messages");
    const q = query(messagesRef, orderBy("id", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
      callback(messages);
    }, (error) => console.error("메시지 리스닝 중 오류 발생:", error));
    return unsubscribe;
  },
  
  addMessage: async (storyId, messageData) => {
    if (!storyId) throw new Error("메시지를 추가하려면 스토리 ID가 필요합니다.");
    const sanitizedMessage = sanitizeForFirestore(messageData);
    const messagesRef = collection(db, "stories", storyId, "messages");
    await addDoc(messagesRef, sanitizedMessage);
  },

  deleteMessage: async (storyId, messageDocId) => {
    if (!storyId || !messageDocId) throw new Error("메시지를 삭제하려면 ID가 필요합니다.");
    const messageRef = doc(db, "stories", storyId, "messages", messageDocId);
    await deleteDoc(messageRef);
  },

  saveStory: async (id, data) => {
    if (!id) throw new Error("저장할 이야기가 없습니다.");
    const sanitizedData = sanitizeForFirestore(data);
    const storyRef = doc(db, "stories", id);
    await setDoc(storyRef, { ...sanitizedData, updatedAt: serverTimestamp() }, { merge: true });
  },

  createNewStory: async (storyData) => {
    const sanitizedData = sanitizeForFirestore(storyData);
    const docRef = await addDoc(collection(db, "stories"), { ...sanitizedData, createdAt: serverTimestamp() });
    return docRef.id;
  },

  deleteStoryRecursively: async (id) => {
    if (!id) return;
    const storyRef = doc(db, "stories", id);
    const subCollections = ['messages', 'sceneIndex', 'loreIndex', 'characterIndex'];
    const deleteCollectionInBatch = async (collectionRef) => {
        const q = query(collectionRef, limit(50));
        let snapshot = await getDocs(q);
        while (snapshot.size > 0) {
            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            snapshot = await getDocs(q);
        }
    };
    for (const subCollectionName of subCollections) {
        await deleteCollectionInBatch(collection(db, storyRef.path, subCollectionName));
    }
    await deleteDoc(storyRef);
  },

  updateMessagesSummarizedFlag: async (storyId, messageDocIds) => {
      if (!storyId || !messageDocIds || messageDocIds.length === 0) return;
      const batch = writeBatch(db);
      const messagesRef = collection(db, "stories", storyId, "messages");
      messageDocIds.forEach(docId => {
          if(docId) batch.update(doc(messagesRef, docId), { isSummarized: true });
      });
      await batch.commit();
  },

  loadIndexCollection: async (storyId, collectionName) => {
    if (!storyId || !collectionName) return [];
    const querySnapshot = await getDocs(collection(db, "stories", storyId, collectionName));
    return querySnapshot.docs.map(doc => ({ ...doc.data() }));
  },

  getIndexEntries: async (storyId, collectionName, level, limit) => {
      if (!storyId || !collectionName) return [];
      const indexCollectionRef = collection(db, "stories", storyId, collectionName);
      const q = query(indexCollectionRef, where("level", "==", level));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data()).slice(0, limit);
  },

  addIndexEntry: async (storyId, collectionName, entry) => {
      if (!storyId || !collectionName || !entry || !entry.id) return;
      const sanitizedEntry = sanitizeForFirestore(entry);
      const vectorDocRef = doc(db, "stories", storyId, collectionName, sanitizedEntry.id);
      await setDoc(vectorDocRef, sanitizedEntry);
  },

  deleteIndexEntries: async (storyId, collectionName, entryIds) => {
      if (!storyId || !collectionName || !entryIds || entryIds.length === 0) return;
      const batch = writeBatch(db);
      const indexCollectionRef = collection(db, "stories", storyId, collectionName);
      entryIds.forEach(id => batch.delete(doc(indexCollectionRef, id)));
      await batch.commit();
  },

  fetchBlueprintTemplates: async () => {
    const querySnapshot = await getDocs(collection(db, "blueprintTemplates"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  saveBlueprintTemplate: async (templateData) => {
    const { id, ...dataToSave } = templateData;
    const templateRef = doc(db, "blueprintTemplates", id);
    await setDoc(templateRef, { ...dataToSave, savedAt: serverTimestamp() });
  },

  deleteBlueprintTemplate: async (id) => {
    if (!id) return;
    await deleteDoc(doc(db, "blueprintTemplates", id));
  },

  fetchCharacterTemplates: async () => {
    const querySnapshot = await getDocs(collection(db, "characterTemplates"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  saveCharacterTemplate: async (templateData) => {
    const { id, ...dataToSave } = templateData;
    const sanitizedData = sanitizeForFirestore(dataToSave);
    const templateRef = doc(db, "characterTemplates", id);
    await setDoc(templateRef, { ...sanitizedData, savedAt: serverTimestamp() });
  },

  deleteCharacterTemplate: async (id) => {
    if (!id) return;
    await deleteDoc(doc(db, "characterTemplates", id));
  },

  fetchCustomTools: async () => {
    const querySnapshot = await getDocs(collection(db, "users", "defaultUser", "customTools"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  saveCustomTool: async (toolData) => {
    const { id, ...dataToSave } = toolData;
    const docId = id.startsWith('new_') ? Date.now().toString() : id;
    const sanitizedData = sanitizeForFirestore(dataToSave);
    const toolRef = doc(db, "users", "defaultUser", "customTools", docId);
    await setDoc(toolRef, { ...sanitizedData, savedAt: serverTimestamp() }, { merge: true });
    return docId;
  },

  deleteCustomTool: async (toolId) => {
    if (!toolId) return;
    await deleteDoc(doc(db, "users", "defaultUser", "customTools", toolId));
  },
};
