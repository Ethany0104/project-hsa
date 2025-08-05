// src/services/firebaseService.js

import { 
    getDoc, getFirestore, doc, getDocs, collection, addDoc, deleteDoc, 
    setDoc, serverTimestamp, writeBatch, query, where, onSnapshot, 
    orderBy, limit 
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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

  /**
   * [신규 기능] 스토리지의 한 위치에 있는 이미지를 다른 위치로 복사합니다.
   * 템플릿 에셋을 새 장면에 추가할 때 사용됩니다.
   * @param {string} sourceUrl - 복사할 원본 이미지의 다운로드 URL.
   * @param {string} destinationPath - 이미지를 복사할 새로운 스토리지 경로.
   * @returns {Promise<string>} - 복사된 새 이미지의 다운로드 URL.
   */
  copyImageInStorage: async (sourceUrl, destinationPath) => {
    try {
      // 1. 원본 URL을 사용해 이미지 데이터를 Blob 형태로 가져옵니다.
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch source image: ${response.statusText}`);
      }
      const blob = await response.blob();

      // 2. 새로운 경로에 Blob 데이터를 업로드합니다.
      const destinationRef = ref(storage, destinationPath);
      const snapshot = await uploadBytes(destinationRef, blob);

      // 3. 새로 업로드된 파일의 다운로드 URL을 반환합니다.
      const newDownloadURL = await getDownloadURL(snapshot.ref);
      return newDownloadURL;
    } catch (error) {
      console.error("스토리지 이미지 복사 중 오류 발생:", error);
      throw error; // 오류를 상위로 전파하여 호출부에서 처리하도록 합니다.
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
};
