// src/services/firebaseService.js

import { 
    getDoc, getFirestore, doc, getDocs, collection, addDoc, deleteDoc, 
    setDoc, serverTimestamp, writeBatch, query, where, onSnapshot, 
    orderBy, limit 
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
// [수정] Firebase Storage 관련 모듈을 가져옵니다.
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// 이 경로는 실제 프로젝트 구조에 맞게 '../config/firebaseConfig' 등으로 수정해야 합니다.
import { firebaseConfig } from "../config/firebaseConfig" 

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// [추가] Firebase Storage 서비스를 초기화합니다.
const storage = getStorage(app);

/**
 * Firestore에 저장하기 전에 객체에서 모든 'undefined' 값을 재귀적으로 제거하는 함수.
 * Firestore는 'undefined' 값을 지원하지 않으므로, 이 함수는 오류를 방지합니다.
 * @param {any} obj - 소독할 객체
 * @returns {any} 'undefined' 값이 제거된 객체
 */
const sanitizeForFirestore = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    // 배열의 각 항목을 재귀적으로 처리하고, undefined인 항목은 필터링합니다.
    return obj.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }

  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      // 'undefined'가 아닌 값만 새 객체에 추가합니다.
      if (value !== undefined) {
        newObj[key] = sanitizeForFirestore(value);
      }
    }
  }
  return newObj;
};


// --- Story Data Service (Firestore) ---
export const storyService = {
  // [추가] 이미지를 Firebase Storage에 업로드하고 URL을 반환하는 함수
  uploadImage: async (file, path) => {
    if (!file || !path) {
      throw new Error("업로드할 파일과 저장 경로가 필요합니다.");
    }
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
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
    }, (error) => {
      console.error("메시지 리스닝 중 오류 발생:", error);
    });

    return unsubscribe;
  },
  
  addMessage: async (storyId, messageData) => {
    if (!storyId) throw new Error("메시지를 추가하려면 스토리 ID가 필요합니다.");
    const sanitizedMessage = sanitizeForFirestore(messageData);
    console.warn('[DEBUG] Adding Message:', JSON.parse(JSON.stringify(sanitizedMessage)));
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
    // 개선: apiLog 등 제외 로직을 제거하여 모든 관련 데이터를 저장하도록 수정합니다.
    const sanitizedData = sanitizeForFirestore(data);
    console.warn('[DEBUG] Saving Story Data:', JSON.parse(JSON.stringify(sanitizedData)));
    const storyRef = doc(db, "stories", id);
    await setDoc(storyRef, { ...sanitizedData, updatedAt: serverTimestamp() }, { merge: true });
  },

  createNewStory: async (storyData) => {
    const sanitizedData = sanitizeForFirestore(storyData);
    console.warn('[DEBUG] Creating New Story:', JSON.parse(JSON.stringify(sanitizedData)));
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
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            
            snapshot = await getDocs(q);
        }
    };

    for (const subCollectionName of subCollections) {
        const subCollectionRef = collection(db, storyRef.path, subCollectionName);
        await deleteCollectionInBatch(subCollectionRef);
    }

    await deleteDoc(storyRef);
  },

  updateMessagesSummarizedFlag: async (storyId, messageDocIds) => {
      if (!storyId || !messageDocIds || messageDocIds.length === 0) return;
      const batch = writeBatch(db);
      const messagesRef = collection(db, "stories", storyId, "messages");
      
      messageDocIds.forEach(docId => {
          if(docId) {
            const messageDocRef = doc(messagesRef, docId);
            batch.update(messageDocRef, { isSummarized: true });
          }
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
      console.warn(`[DEBUG] Adding Index Entry to ${collectionName}:`, JSON.parse(JSON.stringify(sanitizedEntry)));
      const vectorDocRef = doc(db, "stories", storyId, collectionName, sanitizedEntry.id);
      await setDoc(vectorDocRef, sanitizedEntry);
  },

  deleteIndexEntries: async (storyId, collectionName, entryIds) => {
      if (!storyId || !collectionName || !entryIds || entryIds.length === 0) return;
      const batch = writeBatch(db);
      const indexCollectionRef = collection(db, "stories", storyId, collectionName);
      entryIds.forEach(id => {
          batch.delete(doc(indexCollectionRef, id));
      });
      await batch.commit();
  },

  // --- Blueprint Template Service ---
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
    const templateRef = doc(db, "blueprintTemplates", id);
    await deleteDoc(templateRef);
  },

  // --- Character Template Service (FIXED) ---
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
    const templateRef = doc(db, "characterTemplates", id);
    await deleteDoc(templateRef);
  },
};
