export interface AlignedUnit {
  id: string;
  arabic: string; // Arabic sentence/phrase (can be empty string for spacers)
  english: string; // English sentence/phrase (can be empty string for spacers)
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  arabicText: string;
  englishText: string;
  alignedRows: AlignedUnit[];
  createdAt: number;
  lastReadAt: number;
}

const DB_NAME = 'BilingualReaderDB';
const DB_VERSION = 1;
const STORE_NAME = 'books';

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveBook(book: Book): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(book);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getBook(id: string): Promise<Book | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const books = request.result || [];
      // Sort by last read descending
      books.sort((a, b) => b.lastReadAt - a.lastReadAt);
      resolve(books);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteBook(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
