import React, { useState, useEffect, useRef, useMemo } from 'react';
import customAppLogo from './assets/images/custom_app_logo_1790881200475.jpg';
import { 
  Book, 
  AlignedUnit, 
  SavedWord,
  getAllBooks, 
  saveBook, 
  deleteBook, 
  getAllSavedWords,
  saveWordEntry,
  deleteWordEntry,
  initDB 
} from './db/indexedDB';

const DEFAULT_BOOKS: Book[] = [];

interface SelectedWordData {
  word: string;
  normalized?: string;
  meanings: string[];
  direction: 'ar-en' | 'en-ar';
  loading: boolean;
}

type TabType = 'workspace' | 'library' | 'lexicon' | 'notebook';
type ReaderLayoutMode = 'dual' | 'interleaved' | 'focus';
type ReadingTheme = 'obsidian' | 'parchment' | 'emerald';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('workspace');
  const [isReading, setIsReading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<ReaderLayoutMode>(() => {
    return (localStorage.getItem('pr_layoutMode') as ReaderLayoutMode) || 'interleaved';
  });
  const [theme, setTheme] = useState<ReadingTheme>(() => {
    return (localStorage.getItem('pr_theme') as ReadingTheme) || 'obsidian';
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('pr_fontSize');
    return saved ? parseInt(saved, 10) : 21;
  });
  const [activeReaderDrawer, setActiveReaderDrawer] = useState<'none' | 'typography' | 'toc' | 'layout'>('none');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Library filters
  const [searchFilter, setSearchFilter] = useState('');

  // Reader in-book search
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  // Selected word & floating lexicon card
  const [selectedWord, setSelectedWord] = useState<SelectedWordData | null>(null);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);

  // Standalone Lexicon Search Tab
  const [lexiconQuery, setLexiconQuery] = useState('');
  const [lexiconDirection, setLexiconDirection] = useState<'ar-en' | 'en-ar'>('ar-en');
  const [lexiconResult, setLexiconResult] = useState<{ word: string; meanings: string[] } | null>(null);
  const [lexiconLoading, setLexiconLoading] = useState(false);

  // Text Workspace & Aligner Form
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newArabicText, setNewArabicText] = useState('');
  const [newEnglishText, setNewEnglishText] = useState('');
  const [isAligning, setIsAligning] = useState(false);

  // Flashcards Study Mode
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [studyCardIndex, setStudyCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Sync scroll & speech states
  const [syncScroll, setSyncScroll] = useState<boolean>(() => {
    return localStorage.getItem('pr_syncScroll') !== 'false';
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Fullscreen, Paper Settings & Typography
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [arabicFont, setArabicFont] = useState<'Amiri' | 'IBM Plex Sans Arabic' | 'Scheherazade New'>(() => {
    return (localStorage.getItem('pr_arabicFont') as any) || 'Amiri';
  });
  const [englishFont, setEnglishFont] = useState<'Lora' | 'Plus Jakarta Sans'>(() => {
    return (localStorage.getItem('pr_englishFont') as any) || 'Lora';
  });
  const [lineHeight, setLineHeight] = useState<number>(() => {
    const saved = localStorage.getItem('pr_lineHeight');
    return saved ? parseFloat(saved) : 2.2;
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const arPaneRef = useRef<HTMLDivElement>(null);
  const enPaneRef = useRef<HTMLDivElement>(null);

  // Synchronized scroll handler
  const handleArScroll = () => {
    if (!syncScroll || !arPaneRef.current || !enPaneRef.current) return;
    const ar = arPaneRef.current;
    const en = enPaneRef.current;
    const maxAr = ar.scrollHeight - ar.clientHeight;
    if (maxAr <= 0) return;
    const ratio = ar.scrollTop / maxAr;
    en.scrollTop = ratio * (en.scrollHeight - en.clientHeight);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyMeanings = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // E-Reader Read Aloud / TTS function
  const handleReadAloud = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    
    if (!currentBook || currentBook.alignedRows.length === 0) return;
    const targetRow = currentBook.alignedRows.find(r => r.id === activeRowId) || currentBook.alignedRows[0];
    if (!targetRow) return;

    setActiveRowId(targetRow.id);

    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const arUtterance = new SpeechSynthesisUtterance(targetRow.arabic);
    arUtterance.lang = 'ar-SA';
    arUtterance.rate = 0.9;

    const enUtterance = new SpeechSynthesisUtterance(targetRow.english);
    enUtterance.lang = 'en-US';
    enUtterance.rate = 0.95;

    setIsSpeaking(true);

    arUtterance.onend = () => {
      window.speechSynthesis.speak(enUtterance);
    };

    enUtterance.onend = () => setIsSpeaking(false);
    arUtterance.onerror = () => setIsSpeaking(false);
    enUtterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(arUtterance);
    showToast('جارٍ القراءة الصوتية...');
  };

  // E-Reader Copy/Share active sentence
  const handleShareOrCopy = () => {
    if (!currentBook) return;
    const targetRow = currentBook.alignedRows.find(r => r.id === activeRowId) || currentBook.alignedRows[0];
    if (!targetRow) return;

    const textToCopy = `${targetRow.arabic}\n\n${targetRow.english}\n\n[${currentBook.title}]`;
    navigator.clipboard.writeText(textToCopy);
    showToast('تم نسخ الفقرة وترجمتها للحافظة');
  };

  // E-Reader Jump to sentence
  const handleJumpToSentence = (rowId: string) => {
    setActiveRowId(rowId);
    setActiveReaderDrawer('none');
    const el = document.getElementById(`sentence-${rowId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Delete a book locally
  const handleDeleteBook = async (bookId: string) => {
    try {
      await deleteBook(bookId);
      setBooks(prev => {
        const remaining = prev.filter(b => b.id !== bookId);
        if (currentBook?.id === bookId) {
          setCurrentBook(remaining.length > 0 ? remaining[0] : null);
        }
        return remaining;
      });
      showToast('تم حذف الكتاب من ذاكرة الهاتف المحلية');
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  // Load books & saved vocabulary from phone's local storage (IndexedDB)
  useEffect(() => {
    async function init() {
      try {
        await initDB();
        const storedBooks = await getAllBooks();
        
        // Purge old sample/demo books if present in local DB
        const demoPrefixes = ['book-the-mother', 'book-pride', 'book-poet', 'book-prophet', 'book-oldman'];
        const userBooks: Book[] = [];

        for (const book of storedBooks) {
          if (demoPrefixes.some(prefix => book.id.startsWith(prefix))) {
            await deleteBook(book.id);
          } else {
            userBooks.push(book);
          }
        }

        setBooks(userBooks);
        setCurrentBook(userBooks.length > 0 ? userBooks[0] : null);

        const words = await getAllSavedWords();
        setSavedWords(words);
      } catch (err) {
        console.error('Failed to init DB:', err);
        setBooks([]);
        setCurrentBook(null);
      }
    }
    init();
  }, []);

  // Sync settings with local storage for offline phone persistence
  useEffect(() => { localStorage.setItem('pr_layoutMode', layoutMode); }, [layoutMode]);
  useEffect(() => {
    localStorage.setItem('pr_theme', theme);
    document.body.className = `theme-${theme}`;
  }, [theme]);
  useEffect(() => { localStorage.setItem('pr_fontSize', fontSize.toString()); }, [fontSize]);
  useEffect(() => { localStorage.setItem('pr_arabicFont', arabicFont); }, [arabicFont]);
  useEffect(() => { localStorage.setItem('pr_englishFont', englishFont); }, [englishFont]);
  useEffect(() => { localStorage.setItem('pr_lineHeight', lineHeight.toString()); }, [lineHeight]);
  useEffect(() => { localStorage.setItem('pr_syncScroll', syncScroll.toString()); }, [syncScroll]);

  // Audio Speech Synthesis
  const speak = (text: string, lang: 'ar' | 'en') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 0.95;
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Word Click Handler
  const handleWordClick = async (rawWord: string, direction: 'ar-en' | 'en-ar') => {
    const cleanWord = rawWord
      .replace(/^[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+/gu, '')
      .replace(/[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+$/gu, '')
      .trim();
    if (!cleanWord) return;

    setSelectedWord({
      word: cleanWord,
      meanings: [],
      direction,
      loading: true
    });

    try {
      const endpoint = direction === 'ar-en' ? '/api/lexicon/ar-en' : '/api/lexicon/en-ar';
      const res = await fetch(`${endpoint}?word=${encodeURIComponent(cleanWord)}`);
      const data = await res.json();
      setSelectedWord({
        word: cleanWord,
        normalized: data.normalized || cleanWord,
        meanings: data.meanings || [],
        direction,
        loading: false
      });
    } catch (err) {
      console.error('Word lookup failed:', err);
      setSelectedWord({
        word: cleanWord,
        meanings: [],
        direction,
        loading: false
      });
    }
  };

  // Toggle Save Word to Vocabulary
  const handleToggleSaveWord = async (wordData: { word: string; meanings: string[]; direction: 'ar-en' | 'en-ar' }) => {
    const existing = savedWords.find(w => w.word.toLowerCase() === wordData.word.toLowerCase());
    if (existing) {
      await deleteWordEntry(existing.id);
      setSavedWords(prev => prev.filter(w => w.id !== existing.id));
    } else {
      const newEntry: SavedWord = {
        id: `word-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        word: wordData.word,
        meanings: wordData.meanings,
        direction: wordData.direction,
        bookTitle: currentBook?.title,
        savedAt: Date.now(),
        mastered: false
      };
      await saveWordEntry(newEntry);
      setSavedWords(prev => [newEntry, ...prev]);
    }
  };

  const isWordSaved = (w: string) => {
    return savedWords.some(item => item.word.toLowerCase() === w.toLowerCase());
  };

  // Filtered rows for in-book search
  const filteredRows = useMemo(() => {
    if (!currentBook) return [];
    if (!bookSearchQuery.trim()) return currentBook.alignedRows;
    const q = bookSearchQuery.trim().toLowerCase();
    return currentBook.alignedRows.filter(r =>
      r.arabic.toLowerCase().includes(q) || r.english.toLowerCase().includes(q)
    );
  }, [currentBook, bookSearchQuery]);

  // Filtered books in library
  const filteredBooks = useMemo(() => {
    if (!searchFilter.trim()) return books;
    const q = searchFilter.trim().toLowerCase();
    return books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
  }, [books, searchFilter]);

  // Standalone Lexicon Live Search
  useEffect(() => {
    if (!lexiconQuery.trim()) {
      setLexiconResult(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLexiconLoading(true);
      try {
        const endpoint = lexiconDirection === 'ar-en' ? '/api/lexicon/ar-en' : '/api/lexicon/en-ar';
        const res = await fetch(`${endpoint}?word=${encodeURIComponent(lexiconQuery.trim())}`);
        const data = await res.json();
        setLexiconResult({
          word: data.word || lexiconQuery,
          meanings: data.meanings || []
        });
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLexiconLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [lexiconQuery, lexiconDirection]);

  // Parse sentence into interactive words
  const parseInteractiveTokens = (sentence: string, direction: 'ar-en' | 'en-ar') => {
    const tokens = sentence.split(/(\s+|[،.؛:!؟«»""''`()\[\]{}\-_—–]+)/);
    return tokens.map((token, idx) => {
      const isWord = /[^\s،.؛:!؟«»""''`()\[\]{}\-_—–]+/.test(token);
      if (!isWord) return <span key={idx}>{token}</span>;

      const isSelected = selectedWord?.word === token.replace(/^[^\w\u0621-\u064A]+|[^\w\u0621-\u064A]+$/g, '');

      return (
        <span
          key={idx}
          onClick={(e) => {
            e.stopPropagation();
            handleWordClick(token, direction);
          }}
          className={`word-link ${isSelected ? 'active-word' : ''}`}
        >
          {token}
        </span>
      );
    });
  };

  // Add custom book with auto-alignment & open standalone reading screen
  const handleAutoAlign = () => {
    if (!newArabicText.trim() || !newEnglishText.trim()) return;
    setIsAligning(true);

    const arSentences = newArabicText
      .split(/([.!\n؟]+)/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && !/^[.!\n؟]+$/.test(s));

    const enSentences = newEnglishText
      .split(/([.!\n?]+)/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && !/^[.!\n?]+$/.test(s));

    const maxLen = Math.max(arSentences.length, enSentences.length);
    const rows: AlignedUnit[] = [];

    for (let i = 0; i < maxLen; i++) {
      rows.push({
        id: `row-custom-${i + 1}`,
        arabic: arSentences[i] || '',
        english: enSentences[i] || ''
      });
    }

    const createdBook: Book = {
      id: `book-user-${Date.now()}`,
      title: newTitle.trim() || 'كتاب مخصص — Parallel Reader',
      author: newAuthor.trim() || 'مؤلف مخصص — Author',
      arabicText: newArabicText,
      englishText: newEnglishText,
      alignedRows: rows,
      createdAt: Date.now(),
      lastReadAt: Date.now(),
      coverColor: 'from-amber-950/40 to-slate-900/80'
    };

    saveBook(createdBook).then(() => {
      setBooks(prev => [createdBook, ...prev.filter(b => b.id !== createdBook.id)]);
      setCurrentBook(createdBook);
      setIsAligning(false);
      setIsReading(true); // Open standalone reading screen!
    });
  };

  return (
    <>
      {/* ================= STANDALONE READING SCREEN ================= */}
      {/* When isReading is true, render the completely standalone, distraction-free reading folio with bottom settings bar */}
      {isReading && currentBook ? (
        <div className={`standalone-reader-screen ${isFullscreen ? 'fullscreen-mode' : ''}`}>
          <div className="folder-reading-wrap">
            <article className="paper-book-page">
              
              {/* Paper Page Running Top Header */}
              <div className="paper-page-header">
                {/* Back / Close Folder Button */}
                <button
                  onClick={() => {
                    if (isSpeaking) window.speechSynthesis.cancel();
                    setIsReading(false);
                  }}
                  className="paper-action-btn back-btn"
                  title="إغلاق الكتاب والعودة للتطبيق"
                >
                  <i className="fa-solid fa-arrow-right"></i>
                  <span>إغلاق الكتاب</span>
                </button>

                {/* Book & Author title in classical serif */}
                <div className="paper-book-identity">
                  <span className="paper-book-title">{currentBook.title}</span>
                  {currentBook.author && (
                    <>
                      <span className="paper-identity-sep">·</span>
                      <span className="paper-book-author">{currentBook.author}</span>
                    </>
                  )}
                </div>

                {/* Top Controls & Search */}
                <div className="paper-controls">
                  {/* In-Book Search Input */}
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={bookSearchQuery}
                      onChange={(e) => setBookSearchQuery(e.target.value)}
                      placeholder="بحث في الكتاب..."
                      className="paper-search-input"
                    />
                    {bookSearchQuery && (
                      <button 
                        onClick={() => setBookSearchQuery('')} 
                        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                        title="مسح البحث"
                      >
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    )}
                  </div>

                  {/* Progress Badge */}
                  <div className="paper-progress-badge hidden sm:inline-flex">
                    {filteredRows.length > 0 ? (
                      <span>
                        فقرة {Math.max(1, filteredRows.findIndex(r => r.id === activeRowId) + 1)} من {filteredRows.length}
                      </span>
                    ) : (
                      <span>0 فقرات</span>
                    )}
                  </div>

                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className={`paper-action-btn ${isFullscreen ? 'active' : ''}`}
                    title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
                  >
                    <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i>
                    <span className="hidden md:inline">{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
                  </button>
                </div>
              </div>

              {/* Book Spine Center Crease (for Dual Facing Pages) */}
              {layoutMode === 'dual' && <div className="paper-spine-crease" aria-hidden="true"></div>}

              {/* Reading Content Canvas */}
              <div className="paper-reading-canvas">
                {/* DUAL MODE */}
                {layoutMode === 'dual' && (
                  <div className="paper-dual-spread">
                    {/* Arabic Page (Right Page) */}
                    <div 
                      ref={arPaneRef}
                      onScroll={handleArScroll}
                      className="paper-page-column paper-page-ar"
                    >
                      {filteredRows.length === 0 ? (
                        <p className="paper-empty-notice">لا توجد فقرات مطابقة للبحث</p>
                      ) : (
                        filteredRows.map((row) => (
                          <div
                            key={row.id}
                            id={`sentence-${row.id}`}
                            onClick={() => setActiveRowId(row.id)}
                            onMouseEnter={() => setActiveRowId(row.id)}
                            className={`paper-sentence-row paper-row-ar ${activeRowId === row.id ? 'active-row' : ''}`}
                          >
                            <p 
                              className="text-ar"
                              style={{ 
                                fontFamily: `${arabicFont}, serif`, 
                                fontSize: `${fontSize}px`, 
                                lineHeight: lineHeight 
                              }}
                            >
                              {parseInteractiveTokens(row.arabic, 'ar-en')}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* English Page (Left Page) */}
                    <div 
                      ref={enPaneRef}
                      className="paper-page-column paper-page-en"
                    >
                      {filteredRows.length === 0 ? (
                        <p className="paper-empty-notice">No matching sentences found</p>
                      ) : (
                        filteredRows.map((row) => (
                          <div
                            key={row.id}
                            onClick={() => setActiveRowId(row.id)}
                            onMouseEnter={() => setActiveRowId(row.id)}
                            className={`paper-sentence-row paper-row-en ${activeRowId === row.id ? 'active-row' : ''}`}
                          >
                            <p 
                              className="text-en" 
                              style={{ 
                                fontFamily: `${englishFont}, serif`, 
                                fontSize: `${Math.round(fontSize * 0.84)}px`, 
                                lineHeight: lineHeight 
                              }}
                            >
                              {parseInteractiveTokens(row.english, 'en-ar')}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* INTERLEAVED MODE */}
                {layoutMode === 'interleaved' && (
                  <div className="paper-interleaved-spread">
                    {filteredRows.map((row) => (
                      <div
                        key={row.id}
                        id={`sentence-${row.id}`}
                        onClick={() => setActiveRowId(row.id)}
                        onMouseEnter={() => setActiveRowId(row.id)}
                        className={`paper-interleaved-row ${activeRowId === row.id ? 'active-row' : ''}`}
                      >
                        <p 
                          className="text-ar mb-1.5" 
                          style={{ 
                            fontFamily: `${arabicFont}, serif`, 
                            fontSize: `${fontSize}px`, 
                            lineHeight: lineHeight 
                          }}
                        >
                          {parseInteractiveTokens(row.arabic, 'ar-en')}
                        </p>
                        <p 
                          className="text-en" 
                          style={{ 
                            fontFamily: `${englishFont}, serif`, 
                            fontSize: `${Math.round(fontSize * 0.84)}px`, 
                            lineHeight: lineHeight 
                          }}
                        >
                          {parseInteractiveTokens(row.english, 'en-ar')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* FOCUS MODE */}
                {layoutMode === 'focus' && (
                  <div className="paper-focus-spread">
                    {filteredRows.map((row) => (
                      <div
                        key={row.id}
                        id={`sentence-${row.id}`}
                        onClick={() => setActiveRowId(row.id)}
                        className={`paper-focus-row group ${activeRowId === row.id ? 'active-row' : ''}`}
                      >
                        <p 
                          className="text-ar mb-2" 
                          style={{ 
                            fontFamily: `${arabicFont}, serif`, 
                            fontSize: `${fontSize + 1}px`, 
                            lineHeight: lineHeight 
                          }}
                        >
                          {parseInteractiveTokens(row.arabic, 'ar-en')}
                        </p>
                        <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                          <p 
                            className="text-en" 
                            style={{ 
                              fontFamily: `${englishFont}, serif`, 
                              fontSize: `${Math.round(fontSize * 0.84)}px` 
                            }}
                          >
                            {row.english}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ================= BOTTOM SETTINGS & CONTROLS TOOLBAR ================= */}
              {/* شريط الإعدادات والتحكم في الأسفل كما في القارئ الإلكتروني الحديث */}
              <footer className="ereader-bottom-toolbar">
                {/* 1. Theme Quick Selector */}
                <div className="ereader-toolbar-group" title="تغيير لون ومظهر الورق">
                  <button
                    onClick={() => setTheme('parchment')}
                    className={`theme-dot-btn theme-dot-parchment ${theme === 'parchment' ? 'active' : ''}`}
                    title="ورق عتيق دافئ"
                  />
                  <button
                    onClick={() => setTheme('obsidian')}
                    className={`theme-dot-btn theme-dot-obsidian ${theme === 'obsidian' ? 'active' : ''}`}
                    title="عقيق الليل الداكن"
                  />
                  <button
                    onClick={() => setTheme('emerald')}
                    className={`theme-dot-btn theme-dot-emerald ${theme === 'emerald' ? 'active' : ''}`}
                    title="زمرد هادئ مريح للعين"
                  />
                </div>

                {/* 2. Quick Font Size Resizer */}
                <div className="ereader-toolbar-group bg-black/10 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/10" title="تعديل حجم الخط">
                  <button
                    onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                    className="font-size-btn"
                    title="تصغير الخط"
                  >
                    A-
                  </button>
                  <span className="text-xs font-mono font-bold px-1.5 min-w-[34px] text-center opacity-85">
                    {fontSize}
                  </span>
                  <button
                    onClick={() => setFontSize(prev => Math.min(32, prev + 2))}
                    className="font-size-btn"
                    title="تكبير الخط"
                  >
                    A+
                  </button>
                </div>

                {/* 3. Layout Mode Quick Selector */}
                <div className="ereader-toolbar-group hidden sm:flex bg-black/10 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/10">
                  <button
                    onClick={() => setLayoutMode('dual')}
                    className={`paper-layout-btn px-2 py-1 text-xs gap-1.5 ${layoutMode === 'dual' ? 'active' : ''}`}
                    title="صفحتان متقابلتان"
                  >
                    <i className="fa-solid fa-columns"></i>
                    <span className="hidden md:inline">متقابل</span>
                  </button>
                  <button
                    onClick={() => setLayoutMode('interleaved')}
                    className={`paper-layout-btn px-2 py-1 text-xs gap-1.5 ${layoutMode === 'interleaved' ? 'active' : ''}`}
                    title="متداخل سطر بسطر"
                  >
                    <i className="fa-solid fa-bars-staggered"></i>
                    <span className="hidden md:inline">متداخل</span>
                  </button>
                  <button
                    onClick={() => setLayoutMode('focus')}
                    className={`paper-layout-btn px-2 py-1 text-xs gap-1.5 ${layoutMode === 'focus' ? 'active' : ''}`}
                    title="نمط التركيز"
                  >
                    <i className="fa-solid fa-eye"></i>
                    <span className="hidden md:inline">تركيز</span>
                  </button>
                </div>

                {/* 4. Reading Progress Navigation Slider */}
                <div className="ereader-progress-slider hidden lg:flex">
                  <button
                    onClick={() => {
                      if (filteredRows.length === 0) return;
                      const idx = filteredRows.findIndex(r => r.id === activeRowId);
                      const targetIdx = idx > 0 ? idx - 1 : filteredRows.length - 1;
                      handleJumpToSentence(filteredRows[targetIdx].id);
                    }}
                    className="font-size-btn"
                    title="الفقرة السابقة"
                  >
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                  </button>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, filteredRows.length - 1)}
                    value={Math.max(0, filteredRows.findIndex(r => r.id === activeRowId))}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      if (filteredRows[idx]) handleJumpToSentence(filteredRows[idx].id);
                    }}
                    title="شريط التقديم والترجيع في الكتاب"
                  />
                  <button
                    onClick={() => {
                      if (filteredRows.length === 0) return;
                      const idx = filteredRows.findIndex(r => r.id === activeRowId);
                      const targetIdx = idx < filteredRows.length - 1 ? idx + 1 : 0;
                      handleJumpToSentence(filteredRows[targetIdx].id);
                    }}
                    className="font-size-btn"
                    title="الفقرة التالية"
                  >
                    <i className="fa-solid fa-chevron-left text-xs"></i>
                  </button>
                </div>

                {/* 5. Read Aloud / Audio Button */}
                <button
                  onClick={handleReadAloud}
                  className={`paper-action-btn ${isSpeaking ? 'active ring-2 ring-purple-400 animate-pulse' : ''}`}
                  title={isSpeaking ? 'إيقاف القراءة الصوتية' : 'استماع للفقرة المحددة (نطق صوتي ثنائي اللغة)'}
                >
                  <i className={`fa-solid ${isSpeaking ? 'fa-stop' : 'fa-volume-high'} text-sm`}></i>
                  <span className="hidden md:inline">{isSpeaking ? 'إيقاف' : 'استماع'}</span>
                </button>

                {/* 6. Settings Drawer Trigger */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="paper-action-btn"
                  title="فتح لوحة إعدادات الخطوط والتباعد والتزامن"
                >
                  <i className="fa-solid fa-sliders text-sm"></i>
                  <span>الإعدادات</span>
                </button>
              </footer>

            </article>
          </div>
        </div>
      ) : (
        /* ================= MAIN APPLICATION LAYOUT ================= */
        <div className="app-container">
          {/* Ambient background glow orbs */}
          <div className="ambient-background">
            <div className="ambient-orb orb-1"></div>
            <div className="ambient-orb orb-2"></div>
          </div>

          {/* ================= HEADER ================= */}
          <header className="header">
            <div className="header-content">
              
              {/* Brand */}
              <button 
                onClick={() => setActiveTab('workspace')}
                className="header-brand"
              >
                <img src={customAppLogo} alt="Logo" className="header-brand-logo-img" />
                <div>
                  <div className="header-brand-title">محراب القراءة المتوازية</div>
                </div>
              </button>

              {/* Desktop Navigation */}
              <nav className="header-nav">
                <button
                  onClick={() => setActiveTab('workspace')}
                  className={`nav-item ${activeTab === 'workspace' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                  <span>إعداد النصوص</span>
                </button>

                <button
                  onClick={() => setActiveTab('library')}
                  className={`nav-item ${activeTab === 'library' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-lines-leaning"></i>
                  <span>المكتبة</span>
                </button>

                <button
                  onClick={() => setActiveTab('lexicon')}
                  className={`nav-item ${activeTab === 'lexicon' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <span>المعجم</span>
                </button>

                <button
                  onClick={() => setActiveTab('notebook')}
                  className={`nav-item ${activeTab === 'notebook' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-bookmark"></i>
                  <span>المفردات ({savedWords.length})</span>
                </button>
              </nav>

              {/* Header Actions */}
              <div className="header-actions">
                {/* Theme switcher */}
                <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setTheme('obsidian')}
                    title="نمط العقيق الأسود"
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      theme === 'obsidian' ? 'bg-purple-600/40 text-purple-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-moon text-xs"></i>
                  </button>
                  <button
                    onClick={() => setTheme('parchment')}
                    title="نمط المخطوطة العاجية"
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      theme === 'parchment' ? 'bg-amber-800/40 text-amber-300' : 'text-slate-400 hover:text-amber-200'
                    }`}
                  >
                    <i className="fa-solid fa-scroll text-xs"></i>
                  </button>
                  <button
                    onClick={() => setTheme('emerald')}
                    title="نمط الزمرد الأندلسي"
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      theme === 'emerald' ? 'bg-emerald-800/40 text-emerald-300' : 'text-slate-400 hover:text-emerald-200'
                    }`}
                  >
                    <i className="fa-solid fa-gem text-xs"></i>
                  </button>
                </div>
              </div>

            </div>
          </header>

          {/* ================= MAIN CONTENT ================= */}
          <main className="main-content">

            {/* --- VIEW 1: TEXT WORKSPACE & START WORK ("بدء العمل") --- */}
            {activeTab === 'workspace' && (
              <div className="view-enter max-w-5xl mx-auto space-y-6">
                
                {/* The Two Parallel Text Editors */}
                <div className="alignment-grid">
                  {/* Arabic Input */}
                  <div className="alignment-editor">
                    <div className="alignment-editor-header">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-font text-purple-400"></i>
                        <h3 className="font-bold text-white text-sm">النص العربي</h3>
                      </div>
                      <button
                        onClick={() => setNewArabicText('')}
                        className="text-xs text-slate-400 hover:text-red-300"
                        title="مسح"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                    <textarea
                      rows={12}
                      value={newArabicText}
                      onChange={(e) => setNewArabicText(e.target.value)}
                      placeholder="الصق النص العربي هنا..."
                      className="form-textarea w-full text-ar leading-relaxed"
                    />
                  </div>

                  {/* English / Foreign Input */}
                  <div className="alignment-preview">
                    <div className="alignment-editor-header">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-language text-purple-400"></i>
                        <h3 className="font-bold text-white text-sm">English Parallel Text</h3>
                      </div>
                      <button
                        onClick={() => setNewEnglishText('')}
                        className="text-xs text-slate-400 hover:text-red-300"
                        title="Clear"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                    <textarea
                      rows={12}
                      value={newEnglishText}
                      onChange={(e) => setNewEnglishText(e.target.value)}
                      placeholder="Paste parallel English text here..."
                      className="form-textarea w-full text-en leading-relaxed"
                    />
                  </div>
                </div>

                {/* Book Metadata and Hero Start Button */}
                <div className="workspace-card space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">العنوان</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="عنوان النص أو الكتاب..."
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="form-label">المؤلف</label>
                      <input
                        type="text"
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        placeholder="اسم المؤلف أو المترجم..."
                        className="form-input w-full"
                      />
                    </div>
                  </div>

                  {/* The Hero "بدء العمل" Button */}
                  <div className="flex items-center justify-center pt-2">
                    <button
                      onClick={handleAutoAlign}
                      disabled={!newArabicText.trim() || !newEnglishText.trim() || isAligning}
                      className="btn-start-action"
                    >
                      <i className={`fa-solid ${isAligning ? 'fa-spinner fa-spin' : 'fa-play'}`}></i>
                      <span>بدء العمل</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- VIEW 2: COMPREHENSIVE LEXICON EXPLORER --- */}
            {activeTab === 'lexicon' && (
              <div className="view-enter max-w-4xl mx-auto space-y-6">
                <div>
                  <h2 className="section-title">المعجم</h2>
                </div>

                {/* Search Box */}
                <div className="library-controls flex-col items-stretch gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={lexiconQuery}
                        onChange={(e) => setLexiconQuery(e.target.value)}
                        placeholder={lexiconDirection === 'ar-en' ? 'اكتب الكلمة بالعربية...' : 'Type English word...'}
                        className="search-box w-full text-base py-3"
                        autoFocus
                      />
                      {lexiconQuery && (
                        <button 
                          onClick={() => setLexiconQuery('')} 
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          title="مسح"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setLexiconDirection(prev => prev === 'ar-en' ? 'en-ar' : 'ar-en')}
                      className="btn btn-secondary shrink-0"
                    >
                      <i className="fa-solid fa-right-left"></i>
                      <span>{lexiconDirection === 'ar-en' ? 'عربي ➔ إنجليزي' : 'English ➔ Arabic'}</span>
                    </button>
                  </div>
                </div>

                {/* Search Result */}
                {lexiconLoading ? (
                  <div className="text-center py-12 text-slate-400">
                    <i className="fa-solid fa-spinner fa-spin text-2xl mb-2 text-purple-400"></i>
                    <p className="text-xs">جارٍ البحث...</p>
                  </div>
                ) : lexiconResult && lexiconResult.meanings.length > 0 ? (
                  <div className="interleaved-card card-active p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold font-serif text-white mb-1">
                          {lexiconResult.word}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => speak(lexiconResult.word, lexiconDirection === 'ar-en' ? 'ar' : 'en')}
                          className="btn btn-secondary py-1.5 px-3 text-xs"
                          title="استمع للنطق"
                        >
                          <i className="fa-solid fa-volume-high"></i>
                        </button>
                        <button
                          onClick={() => handleToggleSaveWord({
                            word: lexiconResult.word,
                            meanings: lexiconResult.meanings,
                            direction: lexiconDirection
                          })}
                          className={`btn ${isWordSaved(lexiconResult.word) ? 'btn-primary' : 'btn-secondary'} py-1.5 px-3 text-xs`}
                        >
                          <i className={`fa-solid ${isWordSaved(lexiconResult.word) ? 'fa-check' : 'fa-bookmark'}`}></i>
                          <span>{isWordSaved(lexiconResult.word) ? 'محفوظة' : 'حفظ'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10">
                      <div className="flex flex-wrap gap-2">
                        {lexiconResult.meanings.map((m, i) => (
                          <span key={i} className="btn btn-secondary py-1 px-3 text-sm text-purple-200">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : lexiconQuery ? (
                  <div className="text-center py-12 text-slate-400 interleaved-card">
                    <p>لا توجد نتائج مطابقة</p>
                  </div>
                ) : null}

              </div>
            )}

            {/* --- VIEW 3: VOCABULARY NOTEBOOK & FLASHCARDS --- */}
            {activeTab === 'notebook' && (
              <div className="view-enter max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="section-title">المفردات ({savedWords.length})</h2>
                  </div>

                  {savedWords.length > 0 && (
                    <button
                      onClick={() => {
                        setStudyCardIndex(0);
                        setIsFlipped(false);
                        setShowFlashcards(true);
                      }}
                      className="btn btn-primary"
                    >
                      <i className="fa-solid fa-graduation-cap"></i>
                      <span>مراجعة البطاقات</span>
                    </button>
                  )}
                </div>

                {savedWords.length === 0 ? (
                  <div className="interleaved-card text-center py-16">
                    <i className="fa-solid fa-bookmark text-3xl text-slate-600 mb-2"></i>
                    <p className="text-slate-400">لا توجد مفردات محفوظة</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedWords.map((item) => (
                      <div key={item.id} className="vocab-card">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-xl font-bold font-serif text-white">{item.word}</h4>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => speak(item.word, item.direction === 'ar-en' ? 'ar' : 'en')}
                              className="btn btn-ghost py-1 px-2 text-xs"
                              title="نطق"
                            >
                              <i className="fa-solid fa-volume-high"></i>
                            </button>
                            <button
                              onClick={() => handleToggleSaveWord(item)}
                              className="btn btn-ghost py-1 px-2 text-xs text-red-400 hover:text-red-300"
                              title="حذف"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5">
                          <div className="flex flex-wrap gap-1.5">
                            {item.meanings.map((m, i) => (
                              <span key={i} className="btn btn-secondary py-0.5 px-2.5 text-xs text-purple-200">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- VIEW 4: LIBRARY --- */}
            {activeTab === 'library' && (
              <div className="view-enter space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="section-title">المكتبة ({books.length})</h2>
                  </div>

                  <button
                    onClick={() => setActiveTab('workspace')}
                    className="btn btn-primary"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>إعداد نص جديد</span>
                  </button>
                </div>

                {/* Library Search */}
                {books.length > 0 && (
                  <div className="library-controls">
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="ابحث في عناوين الكتب أو أسماء المؤلفين..."
                      className="search-box"
                    />
                  </div>
                )}

                {/* Books Grid & Empty State */}
                {filteredBooks.length === 0 ? (
                  <div className="interleaved-card text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300 text-2xl">
                      <i className="fa-solid fa-book-open"></i>
                    </div>
                    <h3 className="text-lg font-bold text-white font-serif">المكتبة فارغة</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      لم تقم بإنشاء أية كتب محلياً بعد.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab('workspace')}
                        className="btn btn-primary px-6 py-2.5"
                      >
                        <i className="fa-solid fa-plus ml-1.5"></i>
                        <span>إعداد نص جديد الآن</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="books-grid">
                    {filteredBooks.map((book) => (
                      <div
                        key={book.id}
                        onClick={() => {
                          setCurrentBook(book);
                          setIsReading(true);
                        }}
                        className="book-card cursor-pointer group"
                      >
                        <div className="book-cover relative">
                          <div className="book-cover-content">
                            <div className="book-cover-icon">
                              <i className="fa-solid fa-book-open text-purple-400"></i>
                            </div>
                          </div>
                          
                          {/* Quick Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBook(book.id);
                            }}
                            className="absolute top-2 left-2 w-8 h-8 rounded-full bg-red-900/80 hover:bg-red-600 text-white flex items-center justify-center text-xs opacity-80 hover:opacity-100 transition-all shadow-md"
                            title="حذف الكتاب من الجهاز"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>

                        <div className="book-info">
                          <div className="book-title line-clamp-1">{book.title}</div>
                          <div className="book-author line-clamp-1">{book.author}</div>
                          <div className="book-meta mt-2">
                            <i className="fa-solid fa-align-right text-xs"></i>
                            <span>{book.alignedRows.length} فقرة مرتبطة</span>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentBook(book);
                                setIsReading(true);
                              }}
                              className="btn btn-primary flex-1 py-1.5 text-xs flex items-center justify-center gap-1.5"
                            >
                              <i className="fa-solid fa-folder-open"></i>
                              <span>فتح المجلد</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBook(book.id);
                              }}
                              className="btn btn-secondary py-1.5 px-2.5 text-xs text-red-300 hover:text-red-100 hover:bg-red-900/40"
                              title="حذف الكتاب"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </main>

          {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
          <nav className="mobile-bottom-nav">
            <div className="mobile-nav-grid">
              <button
                onClick={() => setActiveTab('workspace')}
                className={`mobile-nav-btn ${activeTab === 'workspace' ? 'active' : ''}`}
              >
                <i className="fa-solid fa-pen-to-square"></i>
                <span>إعداد النصوص</span>
              </button>

              <button
                onClick={() => setActiveTab('library')}
                className={`mobile-nav-btn ${activeTab === 'library' ? 'active' : ''}`}
              >
                <i className="fa-solid fa-lines-leaning"></i>
                <span>المكتبة</span>
              </button>

              <button
                onClick={() => setActiveTab('lexicon')}
                className={`mobile-nav-btn ${activeTab === 'lexicon' ? 'active' : ''}`}
              >
                <i className="fa-solid fa-magnifying-glass"></i>
                <span>المعجم</span>
              </button>

              <button
                onClick={() => setActiveTab('notebook')}
                className={`mobile-nav-btn ${activeTab === 'notebook' ? 'active' : ''}`}
              >
                <i className="fa-solid fa-bookmark"></i>
                <span>المفردات</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ================= FLOATING SMART LEXICON CARD ================= */}
      {selectedWord && (
        <div className="smart-lexicon-floating">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold font-serif text-white">{selectedWord.word}</h3>
              <button
                onClick={() => speak(selectedWord.word, selectedWord.direction === 'ar-en' ? 'ar' : 'en')}
                className={`btn btn-ghost py-1 px-2 text-purple-300 hover:text-white ${isSpeaking ? 'text-purple-400 animate-pulse' : ''}`}
                title="استمع للنطق"
              >
                <i className="fa-solid fa-volume-high text-sm"></i>
              </button>
            </div>

            <div className="flex items-center gap-1">
              {selectedWord.meanings.length > 0 && (
                <button
                  onClick={() => handleCopyMeanings(selectedWord.meanings.join(', '))}
                  className="btn btn-ghost py-1 px-2 text-xs text-purple-300 hover:text-white"
                  title="نسخ"
                >
                  <i className={`fa-solid ${copyFeedback ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                  {copyFeedback && <span className="text-xs mr-1 text-emerald-400 font-sans">تم</span>}
                </button>
              )}
              <button
                onClick={() => handleToggleSaveWord(selectedWord)}
                className={`btn ${isWordSaved(selectedWord.word) ? 'btn-primary' : 'btn-secondary'} py-1 px-2.5 text-xs`}
                title={isWordSaved(selectedWord.word) ? 'محفوظة' : 'حفظ'}
              >
                <i className={`fa-solid ${isWordSaved(selectedWord.word) ? 'fa-check' : 'fa-bookmark'}`}></i>
              </button>
              <button
                onClick={() => setSelectedWord(null)}
                className="btn btn-ghost py-1 px-2 text-slate-400 hover:text-white"
                title="إغلاق"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            {selectedWord.loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                <i className="fa-solid fa-spinner fa-spin text-purple-400"></i>
                <span>جارٍ البحث...</span>
              </div>
            ) : selectedWord.meanings.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedWord.meanings.map((m, idx) => (
                  <span
                    key={idx}
                    className="btn btn-secondary py-1 px-3 text-sm text-purple-200"
                  >
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-1">
                لا توجد ترجمة مسجلة لهذه الكلمة
              </p>
            )}
          </div>
        </div>
      )}

      {/* ================= FLASHCARD STUDY MODAL ================= */}
      {showFlashcards && savedWords.length > 0 && (
        <div className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="text-base font-bold text-white">
                بطاقة {studyCardIndex + 1} / {savedWords.length}
              </h2>
              <button onClick={() => setShowFlashcards(false)} className="modal-close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className="interleaved-card card-active min-h-[180px] flex flex-col items-center justify-center text-center cursor-pointer select-none p-6"
              >
                {!isFlipped ? (
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-serif text-white">{savedWords[studyCardIndex]?.word}</h3>
                    <p className="text-xs text-slate-400">{savedWords[studyCardIndex]?.bookTitle}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {savedWords[studyCardIndex]?.meanings.map((m, idx) => (
                        <span key={idx} className="btn btn-secondary py-1 px-3 text-base text-violet-300">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer justify-between">
              <button
                onClick={() => speak(savedWords[studyCardIndex]?.word, savedWords[studyCardIndex]?.direction === 'ar-en' ? 'ar' : 'en')}
                className="btn btn-secondary"
                title="استمع للنطق"
              >
                <i className="fa-solid fa-volume-high"></i>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setStudyCardIndex(prev => (prev > 0 ? prev - 1 : savedWords.length - 1));
                  }}
                  className="btn btn-secondary"
                >
                  السابقة
                </button>
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setStudyCardIndex(prev => (prev + 1) % savedWords.length);
                  }}
                  className="btn btn-primary"
                >
                  التالية
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= READING SETTINGS MODAL ================= */}
      {showSettings && (
        <div className="modal-overlay active" onClick={() => setShowSettings(false)}>
          <div className="modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-sliders text-purple-400"></i>
                <h2 className="text-base font-bold font-serif text-white">إعدادات القراءة</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="modal-close" title="إغلاق">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body space-y-5">
              
              {/* Paper Theme */}
              <div className="space-y-2">
                <label className="form-label text-sm font-semibold">مظهر الورق</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTheme('parchment')}
                    className={`btn text-xs py-2 px-3 border transition-all ${
                      theme === 'parchment'
                        ? 'border-amber-600 bg-amber-900/30 text-amber-200 ring-2 ring-amber-500/40'
                        : 'border-white/10 bg-black/20 text-slate-300 hover:border-amber-500/40'
                    }`}
                  >
                    <i className="fa-solid fa-scroll text-sm"></i>
                    <span>ورق عتيق</span>
                  </button>

                  <button
                    onClick={() => setTheme('obsidian')}
                    className={`btn text-xs py-2 px-3 border transition-all ${
                      theme === 'obsidian'
                        ? 'border-purple-600 bg-purple-900/30 text-purple-200 ring-2 ring-purple-500/40'
                        : 'border-white/10 bg-black/20 text-slate-300 hover:border-purple-500/40'
                    }`}
                  >
                    <i className="fa-solid fa-moon text-sm"></i>
                    <span>عقيق الليل</span>
                  </button>

                  <button
                    onClick={() => setTheme('emerald')}
                    className={`btn text-xs py-2 px-3 border transition-all ${
                      theme === 'emerald'
                        ? 'border-emerald-600 bg-emerald-900/30 text-emerald-200 ring-2 ring-emerald-500/40'
                        : 'border-white/10 bg-black/20 text-slate-300 hover:border-emerald-500/40'
                    }`}
                  >
                    <i className="fa-solid fa-gem text-sm"></i>
                    <span>زمرد فاخر</span>
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="form-label text-sm font-semibold">حجم الخط</label>
                  <span className="text-purple-300 font-mono text-sm">{fontSize}px</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setFontSize(prev => Math.max(16, prev - 2))}
                    className="btn btn-secondary py-1.5 px-3"
                  >
                    A-
                  </button>
                  <input
                    type="range"
                    min="16"
                    max="28"
                    step="1"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="flex-1 accent-purple-500 cursor-pointer"
                  />
                  <button 
                    onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                    className="btn btn-secondary py-1.5 px-3"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Arabic Font Family */}
              <div className="space-y-2">
                <label className="form-label text-sm font-semibold">الخط العربي</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setArabicFont('Amiri')}
                    className={`btn text-xs py-2 border transition-all ${
                      arabicFont === 'Amiri'
                        ? 'btn-primary'
                        : 'btn-secondary text-slate-300'
                    }`}
                    style={{ fontFamily: 'Amiri, serif' }}
                  >
                    الأميري
                  </button>
                  <button
                    onClick={() => setArabicFont('IBM Plex Sans Arabic')}
                    className={`btn text-xs py-2 border transition-all ${
                      arabicFont === 'IBM Plex Sans Arabic'
                        ? 'btn-primary'
                        : 'btn-secondary text-slate-300'
                    }`}
                    style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
                  >
                    المهند
                  </button>
                  <button
                    onClick={() => setArabicFont('Scheherazade New')}
                    className={`btn text-xs py-2 border transition-all ${
                      arabicFont === 'Scheherazade New'
                        ? 'btn-primary'
                        : 'btn-secondary text-slate-300'
                    }`}
                    style={{ fontFamily: 'Scheherazade New, serif' }}
                  >
                    النسخ
                  </button>
                </div>
              </div>

              {/* Line Spacing */}
              <div className="space-y-2">
                <label className="form-label text-sm font-semibold">تباعد الأسطر</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLineHeight(1.8)}
                    className={`btn text-xs py-2 ${lineHeight === 1.8 ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    مريح (1.8)
                  </button>
                  <button
                    onClick={() => setLineHeight(2.2)}
                    className={`btn text-xs py-2 ${lineHeight === 2.2 ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    متوازن (2.2)
                  </button>
                  <button
                    onClick={() => setLineHeight(2.6)}
                    className={`btn text-xs py-2 ${lineHeight === 2.6 ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    فسيح (2.6)
                  </button>
                </div>
              </div>

              {/* Layout Mode */}
              <div className="space-y-2">
                <label className="form-label text-sm font-semibold">نمط العرض</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLayoutMode('dual')}
                    className={`btn text-xs py-2 ${layoutMode === 'dual' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <i className="fa-solid fa-columns"></i>
                    <span>صفحتان</span>
                  </button>
                  <button
                    onClick={() => setLayoutMode('interleaved')}
                    className={`btn text-xs py-2 ${layoutMode === 'interleaved' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <i className="fa-solid fa-bars-staggered"></i>
                    <span>متداخل</span>
                  </button>
                  <button
                    onClick={() => setLayoutMode('focus')}
                    className={`btn text-xs py-2 ${layoutMode === 'focus' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <i className="fa-solid fa-eye"></i>
                    <span>التركيز</span>
                  </button>
                </div>
              </div>

              {/* Sync Scroll Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="font-semibold text-sm text-white">تزامن التمرير</div>
                <button
                  onClick={() => setSyncScroll(!syncScroll)}
                  className={`btn py-1.5 px-3 text-xs ${syncScroll ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <i className="fa-solid fa-arrows-up-down"></i>
                  <span>{syncScroll ? 'مفعّل' : 'معطّل'}</span>
                </button>
              </div>

            </div>

            <div className="modal-footer">
              <button onClick={() => setShowSettings(false)} className="btn btn-primary w-full">
                حفظ وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
