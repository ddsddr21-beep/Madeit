export interface AlignedUnit {
  id: string;
  arabic: string;
  english: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  arabicText: string;
  englishText: string;
  alignedRows: AlignedUnit[];
  createdAt: number;
  lastReadAt?: number;
  coverColor?: string;
}

export interface SavedWord {
  id: string;
  word: string;
  normalized?: string;
  meanings: string[];
  direction: 'ar-en' | 'en-ar';
  bookTitle?: string;
  contextSentence?: string;
  notes?: string;
  savedAt: number;
  mastered?: boolean;
  level?: number; // 0: New, 1: Learning, 2: Familiar, 3: Mastered
  streak?: number; // Consecutive correct reviews
  reviewCount?: number; // Total review count
  lastReviewedAt?: number; // Timestamp of last review
  nextReviewAt?: number; // Timestamp when next review is due
  intervalDays?: number; // Current spaced interval in days
  easinessFactor?: number; // SM-2 Easiness Factor (default 2.5)
}

const DB_NAME = 'ParallelReaderDB';
const DB_VERSION = 2;
const BOOKS_STORE = 'books';
const VOCAB_STORE = 'vocabulary';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(VOCAB_STORE)) {
        const vocabStore = db.createObjectStore(VOCAB_STORE, { keyPath: 'id' });
        vocabStore.createIndex('word', 'word', { unique: false });
        vocabStore.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function initDB(): Promise<void> {
  await openDB();
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKS_STORE, 'readonly');
    const store = tx.objectStore(BOOKS_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBook(book: Book): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKS_STORE, 'readwrite');
    const store = tx.objectStore(BOOKS_STORE);
    const request = store.put(book);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteBook(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKS_STORE, 'readwrite');
    const store = tx.objectStore(BOOKS_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllSavedWords(): Promise<SavedWord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VOCAB_STORE, 'readonly');
    const store = tx.objectStore(VOCAB_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveWordEntry(entry: SavedWord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VOCAB_STORE, 'readwrite');
    const store = tx.objectStore(VOCAB_STORE);
    const request = store.put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteWordEntry(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VOCAB_STORE, 'readwrite');
    const store = tx.objectStore(VOCAB_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
