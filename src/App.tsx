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
  aiLoading?: boolean;
  aiExactMatch?: string;
  aiContextualMeaning?: string;
  aiExplanation?: string;
  aiError?: boolean;
  aiSource?: 'gemini' | 'local_engine' | 'lexicon';
  aiConnected?: boolean;
  aiStatusMessage?: string;
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
  const [customDelimiter, setCustomDelimiter] = useState<string>('');
  const [focusLanguage, setFocusLanguage] = useState<'ar' | 'en'>('ar');
  const [isAligning, setIsAligning] = useState(false);

  // Flashcards & Spaced Repetition Review State
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabFilter, setVocabFilter] = useState<'all' | 'due' | 'learning' | 'mastered'>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewMode, setReviewMode] = useState<'flashcard' | 'quiz' | 'recall' | 'matching' | 'audio'>('flashcard');
  const [reviewQueue, setReviewQueue] = useState<SavedWord[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    total: 0,
    completed: false
  });

  // Matching Game State
  const [matchingCards, setMatchingCards] = useState<{ id: string; wordId: string; text: string; type: 'term' | 'meaning' }[]>([]);
  const [selectedMatching, setSelectedMatching] = useState<string[]>([]);
  const [matchedCardIds, setMatchedCardIds] = useState<string[]>([]);
  const [matchingErrorIds, setMatchingErrorIds] = useState<string[]>([]);

  // Quiz & Audio Mode State
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);

  // Recall / Spelling Mode State
  const [recallInput, setRecallInput] = useState('');
  const [recallChecked, setRecallChecked] = useState(false);
  const [recallIsCorrect, setRecallIsCorrect] = useState(false);
  const [recallShowHint, setRecallShowHint] = useState(false);

  // Manual Add Word Modal State
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [addWordTerm, setAddWordTerm] = useState('');
  const [addWordMeanings, setAddWordMeanings] = useState('');
  const [addWordNotes, setAddWordNotes] = useState('');
  const [addWordDirection, setAddWordDirection] = useState<'ar-en' | 'en-ar'>('ar-en');

  // Edit Word & Notes Modal State
  const [showEditWordModal, setShowEditWordModal] = useState(false);
  const [editingWord, setEditingWord] = useState<SavedWord | null>(null);
  const [editWordMeanings, setEditWordMeanings] = useState('');
  const [editWordNotes, setEditWordNotes] = useState('');

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
  const isScrollingRef = useRef<boolean>(false);

  // Synchronized scroll handlers (bidirectional & smooth)
  const handleArScroll = () => {
    if (!syncScroll || !arPaneRef.current || !enPaneRef.current) return;
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;

    const ar = arPaneRef.current;
    const en = enPaneRef.current;
    const maxAr = ar.scrollHeight - ar.clientHeight;
    if (maxAr > 0) {
      const ratio = ar.scrollTop / maxAr;
      en.scrollTop = ratio * (en.scrollHeight - en.clientHeight);
    }

    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
  };

  const handleEnScroll = () => {
    if (!syncScroll || !arPaneRef.current || !enPaneRef.current) return;
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;

    const ar = arPaneRef.current;
    const en = enPaneRef.current;
    const maxEn = en.scrollHeight - en.clientHeight;
    if (maxEn > 0) {
      const ratio = en.scrollTop / maxEn;
      ar.scrollTop = ratio * (ar.scrollHeight - ar.clientHeight);
    }

    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
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
        
        // Purge old demo books if needed, or identify user books
        const demoPrefixes = ['book-the-mother', 'book-pride', 'book-poet', 'book-oldman'];
        const userBooks: Book[] = [];

        for (const book of storedBooks) {
          if (demoPrefixes.some(prefix => book.id.startsWith(prefix))) {
            await deleteBook(book.id);
          } else {
            userBooks.push(book);
          }
        }

        // Add a long demo book if the library is totally empty
        if (userBooks.length === 0) {
          const prophetDemo: Book = {
            id: 'book-prophet-long-demo',
            title: 'النبي (مقتطفات)',
            author: 'جبران خليل جبران',
            arabicText: '',
            englishText: '',
            createdAt: Date.now(),
            coverColor: '#5A189A',
            alignedRows: [
              {
                id: 'p1',
                arabic: 'المصطفى، المختار والحبيب، الذي كان فجراً لذاته، قد انتظر اثنتي عشرة سنة في مدينة أورفليس لعودة سفينته التي ستحمله ثانية إلى الجزيرة التي وُلد فيها.',
                english: 'Almustafa, the chosen and the beloved, who was a dawn unto his own day, had waited twelve years in the city of Orphalese for his ship that was to return and bear him back to the isle of his birth.'
              },
              {
                id: 'p2',
                arabic: 'وفي السنة الثانية عشرة، في اليوم السابع من شهر أيلول، شهر الحصاد، صعد إلى التل الذي يقع خارج أسوار المدينة، ونظر نحو البحر؛ فرأى سفينته تقترب مع الضباب.',
                english: 'And in the twelfth year, on the seventh day of Ielool, the month of reaping, he climbed the hill without the city walls and looked seaward; and he beheld his ship coming with the mist.'
              },
              {
                id: 'p3',
                arabic: 'حينئذ انفتح رتاج قلبه، وطار فرحه فوق البحر. وأغمض عينيه وصلى في صمت روحه.',
                english: 'Then the gates of his heart were flung open, and his joy flew far over the sea. And he closed his eyes and prayed in the silences of his soul.'
              },
              {
                id: 'p4',
                arabic: 'ولكنه بينما كان ينحدر من التل، اعتراه حزن، وفكر في قلبه: كيف أنصرف بسلام وبدون كآبة؟ لا، لست أستطيع أن أغادر هذه المدينة بدون جرح في الروح.',
                english: 'But as he descended the hill, a sadness came upon him, and he thought in his heart: How shall I go in peace and without sorrow? Nay, not without a wound in the spirit shall I leave this city.'
              },
              {
                id: 'p5',
                arabic: 'طويلة كانت أيام الألم التي قضيتها بين جدرانها، وطويلة كانت ليالي الوحدة؛ ومن ذا الذي يستطيع أن ينفصل عن ألمه ووحدته بدون أسف؟',
                english: 'Long were the days of pain I have spent within its walls, and long were the nights of aloneness; and who can depart from his pain and his aloneness without regret?'
              },
              {
                id: 'p6',
                arabic: 'لقد نثرت أجزاء كثيرة من روحي في هذه الشوارع، وأبناء شوقي كثر هم الذين يمشون عراة بين هذه التلال، ولا أستطيع أن أنسلخ عنهم بدون ثقل وكآبة.',
                english: 'Too many fragments of the spirit have I scattered in these streets, and too many are the children of my longing that walk naked among these hills, and I cannot withdraw from them without a burden and an ache.'
              },
              {
                id: 'p7',
                arabic: 'ليس ثوباً هذا الذي أخلعه اليوم، بل هو جلد أمزقه بيدي. وليس فكراً هذا الذي أتركه وراءي، بل هو قلب رققه الجوع والعطش.',
                english: 'It is not a garment I cast off this day, but a skin that I tear with my own hands. Nor is it a thought I leave behind me, but a heart made soft with hunger and with thirst.'
              },
              {
                id: 'p8',
                arabic: 'بيد أنني لا أستطيع أن أتمهل طويلاً. فالبحر الذي يدعو كل الأشياء إليه يدعوني أنا أيضاً، وعليّ أن أركب السفينة.',
                english: 'Yet I cannot tarry longer. The sea that calls all things unto her calls me, and I must embark.'
              },
              {
                id: 'p9',
                arabic: 'لأن البقاء، رغم أن الساعات تحترق في الليل، إنما هو تجميد وجمود، وحبس في قالب. أود لو أحمل معي كل ما هو هنا. ولكن كيف السبيل؟',
                english: 'For to stay, though the hours burn in the night, is to freeze and crystallize and be bound in a mould. Fain would I take with me all that is here. But how shall I?'
              },
              {
                id: 'p10',
                arabic: 'إن الصوت لا يستطيع أن يحمل اللسان والشفاه التي أعطته أجنحة. فبمفرده يجب أن يطلب الفضاء. وبمفرده وبدون عشه يطير العقاب عبر الشمس.',
                english: 'A voice cannot carry the tongue and the lips that gave it wings. Alone must it seek the ether. And alone and without his nest shall the eagle fly across the sun.'
              },
              {
                id: 'p11',
                arabic: 'والآن عندما وصل إلى سفح التل، نظر ثانية نحو البحر، فرأى سفينته تقترب من الميناء، وعلى مقدمتها البحارة، أبناء بلاده. فصرخت روحه إليهم وقال:',
                english: 'Now when he reached the foot of the hill, he turned again towards the sea, and he saw his ship approaching the harbour, and upon her prow the mariners, the men of his own land. And his soul cried out to them, and he said:'
              },
              {
                id: 'p12',
                arabic: 'يا أبناء أمي العتيقة، يا ركاب الأمواج، كم مرة أبحرتم في أحلامي. والآن ها أنتم تأتون في يقظتي، التي هي حلمي الأعمق.',
                english: 'Sons of my ancient mother, you riders of the tides, how often have you sailed in my dreams. And now you come in my awakening, which is my deeper dream.'
              },
              {
                id: 'p13',
                arabic: 'أنا مستعد للرحيل، وشراعي ينتظر الريح في لهفة. نفس واحد فقط سأتنفسه في هذا الهواء الهادئ، نظرة محبة واحدة سألقيها إلى الوراء، ثم أقف بينكم، بحاراً بين البحارة.',
                english: 'Ready am I to go, and my eagerness with sails full set awaits the wind. Only another breath will I breathe in this still air, only another loving look cast backward, And then I shall stand among you, a seafarer among seafarers.'
              },
              {
                id: 'p14',
                arabic: 'وأنت أيها البحر العظيم، الأم التي لا تنام، أنت التي وحدك السلام والحرية للنهر والجدول، جدول واحد فقط سيعرج هذا المنعطف، همسة واحدة فقط سيهمس بها في هذا المرج، ثم آتيك، قطرة غير محدودة إلى محيط غير محدود.',
                english: 'And you, vast sea, sleeping mother, Who alone are peace and freedom to the river and the stream, Only another winding will this stream make, only another murmur in this glade, And then I shall come to you, a boundless drop to a boundless ocean.'
              }
            ]
          };
          await saveBook(prophetDemo);
          userBooks.push(prophetDemo);
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

  // Word Click Handler with AI Context Translation & Lexicon Integration
  const handleWordClick = async (
    rawWord: string, 
    direction: 'ar-en' | 'en-ar',
    rowContext?: AlignedUnit
  ) => {
    if (rowContext) {
      setActiveRowId(rowContext.id);
    }

    const cleanWord = rawWord
      .replace(/^[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+/gu, '')
      .replace(/[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+$/gu, '')
      .trim();
    if (!cleanWord) return;

    // Extract surrounding sentences (target sentence + 2 surrounding sentences)
    let sourceContext: { prev?: string; current: string; next?: string } | undefined;
    let targetContext: { prev?: string; current: string; next?: string } | undefined;

    if (rowContext && currentBook) {
      const rowIndex = currentBook.alignedRows.findIndex(r => r.id === rowContext.id);
      const prevRow = rowIndex > 0 ? currentBook.alignedRows[rowIndex - 1] : undefined;
      const nextRow = rowIndex >= 0 && rowIndex < currentBook.alignedRows.length - 1 
        ? currentBook.alignedRows[rowIndex + 1] 
        : undefined;

      if (direction === 'ar-en') {
        sourceContext = {
          prev: prevRow?.arabic,
          current: rowContext.arabic,
          next: nextRow?.arabic
        };
        targetContext = {
          prev: prevRow?.english,
          current: rowContext.english,
          next: nextRow?.english
        };
      } else {
        sourceContext = {
          prev: prevRow?.english,
          current: rowContext.english,
          next: nextRow?.english
        };
        targetContext = {
          prev: prevRow?.arabic,
          current: rowContext.arabic,
          next: nextRow?.arabic
        };
      }
    }

    const hasContext = !!sourceContext?.current && !!targetContext?.current;

    setSelectedWord({
      word: cleanWord,
      meanings: [],
      direction,
      loading: true,
      aiLoading: hasContext,
      aiExactMatch: undefined,
      aiContextualMeaning: undefined,
      aiExplanation: undefined,
      aiError: false
    });

    // 1. Fetch Lexical Dictionary (Wikitionary / dataset)
    const fetchLexicon = async () => {
      try {
        const endpoint = direction === 'ar-en' ? '/api/lexicon/ar-en' : '/api/lexicon/en-ar';
        const res = await fetch(`${endpoint}?word=${encodeURIComponent(cleanWord)}`);
        const data = await res.json();
        setSelectedWord(prev => {
          if (!prev || prev.word !== cleanWord) return prev;
          return {
            ...prev,
            normalized: data.normalized || cleanWord,
            meanings: data.meanings || [],
            loading: false
          };
        });
      } catch (err) {
        console.error('Word lookup failed:', err);
        setSelectedWord(prev => {
          if (!prev || prev.word !== cleanWord) return prev;
          return {
            ...prev,
            meanings: [],
            loading: false
          };
        });
      }
    };

    // 2. Fetch AI Contextual Translation automatically
    const fetchAiTranslation = async () => {
      if (!hasContext) return;
      try {
        const res = await fetch('/api/ai/context-translation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: cleanWord,
            direction,
            sourceContext,
            targetContext
          })
        });
        const data = await res.json();
        if (data.status === 'success') {
          setSelectedWord(prev => {
            if (!prev || prev.word !== cleanWord) return prev;
            return {
              ...prev,
              aiLoading: false,
              aiExactMatch: data.exactMatchedWord,
              aiContextualMeaning: data.contextualMeaning,
              aiExplanation: data.explanation,
              aiSource: data.source,
              aiConnected: data.aiConnected === true,
              aiStatusMessage: data.aiStatusMessage,
              aiError: data.aiConnected !== true
            };
          });
        } else {
          setSelectedWord(prev => {
            if (!prev || prev.word !== cleanWord) return prev;
            return {
              ...prev,
              aiLoading: false,
              aiError: true,
              aiConnected: false,
              aiStatusMessage: 'تعذر معالجة الطلب.'
            };
          });
        }
      } catch (err) {
        console.error('AI contextual lookup failed:', err);
        setSelectedWord(prev => {
          if (!prev || prev.word !== cleanWord) return prev;
          return {
            ...prev,
            aiLoading: false,
            aiError: true,
            aiConnected: false,
            aiStatusMessage: 'تعذر الاتصال بالخادم.'
          };
        });
      }
    };

    fetchLexicon();
    fetchAiTranslation();
  };

  // Toggle Save Word to Vocabulary
  const handleToggleSaveWord = async (wordData: { word: string; meanings: string[]; direction: 'ar-en' | 'en-ar' }) => {
    const existing = savedWords.find(w => w.word.toLowerCase() === wordData.word.toLowerCase());
    if (existing) {
      await deleteWordEntry(existing.id);
      setSavedWords(prev => prev.filter(w => w.id !== existing.id));
      showToast('تمت إزالة الكلمة من المفردات');
    } else {
      const newEntry: SavedWord = {
        id: `word-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        word: wordData.word,
        meanings: wordData.meanings,
        direction: wordData.direction,
        bookTitle: currentBook?.title,
        savedAt: Date.now(),
        mastered: false,
        level: 0,
        streak: 0,
        reviewCount: 0,
        intervalDays: 1,
        nextReviewAt: Date.now()
      };
      await saveWordEntry(newEntry);
      setSavedWords(prev => [newEntry, ...prev]);
      showToast('تم حفظ الكلمة في قائمة المفردات والمراجعة');
    }
  };

  const isWordSaved = (w: string) => {
    return savedWords.some(item => item.word.toLowerCase() === w.toLowerCase());
  };

  // Toggle Mastered Status manually
  const handleToggleMastered = async (wordId: string) => {
    const word = savedWords.find(w => w.id === wordId);
    if (!word) return;
    const isNowMastered = !word.mastered;
    const updated: SavedWord = {
      ...word,
      mastered: isNowMastered,
      level: isNowMastered ? 3 : 1
    };
    await saveWordEntry(updated);
    setSavedWords(prev => prev.map(w => w.id === wordId ? updated : w));
    showToast(isNowMastered ? 'تم تمييز المفردة كمتقنة ⭐' : 'تم إعادة المفردة لقيد المراجعة');
  };

  // Review & Spaced Repetition Calculations
  // Real-time sentence counts for workspace textboxes based on delimiter
  const parsedArSentences = useMemo(() => {
    if (!newArabicText.trim()) return [];
    if (customDelimiter && customDelimiter.trim()) {
      const delim = customDelimiter.trim();
      const escaped = delim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return newArabicText
        .split(new RegExp(escaped, 'g'))
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    return newArabicText
      .split(/([.!\n؟?]+)/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !/^[.!\n؟?]+$/.test(s));
  }, [newArabicText, customDelimiter]);

  const parsedEnSentences = useMemo(() => {
    if (!newEnglishText.trim()) return [];
    if (customDelimiter && customDelimiter.trim()) {
      const delim = customDelimiter.trim();
      const escaped = delim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return newEnglishText
        .split(new RegExp(escaped, 'g'))
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    return newEnglishText
      .split(/([.!\n?]+)/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !/^[.!\n?]+$/.test(s));
  }, [newEnglishText, customDelimiter]);

  const dueWords = useMemo(() => {
    return savedWords.filter(w => !w.nextReviewAt || w.nextReviewAt <= Date.now());
  }, [savedWords]);

  const masteredWords = useMemo(() => {
    return savedWords.filter(w => (w.level ?? 0) >= 3 || w.mastered);
  }, [savedWords]);

  const learningWords = useMemo(() => {
    return savedWords.filter(w => (w.level ?? 0) < 3 && !w.mastered);
  }, [savedWords]);

  const filteredSavedWords = useMemo(() => {
    let list = savedWords;
    if (vocabFilter === 'due') list = dueWords;
    else if (vocabFilter === 'learning') list = learningWords;
    else if (vocabFilter === 'mastered') list = masteredWords;

    if (vocabSearch.trim()) {
      const q = vocabSearch.trim().toLowerCase();
      list = list.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.meanings.some(m => m.toLowerCase().includes(q)) ||
        (w.bookTitle && w.bookTitle.toLowerCase().includes(q))
      );
    }
    return list;
  }, [savedWords, vocabFilter, vocabSearch, dueWords, learningWords, masteredWords]);

  // Dynamic Quiz Distractor Algorithm (Picks smart contextually relevant distractors)
  const generateQuizOptions = (targetWord: SavedWord, all: SavedWord[]) => {
    const correctMeaning = targetWord.meanings[0] || targetWord.word;

    // Filter distractors from same language direction if available
    const sameDirectionWords = all.filter(w => w.id !== targetWord.id && w.direction === targetWord.direction && w.meanings.length > 0);
    const otherWords = all.filter(w => w.id !== targetWord.id && w.meanings.length > 0);

    const poolWords = sameDirectionWords.length >= 3 ? sameDirectionWords : (otherWords.length >= 3 ? otherWords : all);
    const candidateMeanings = poolWords.map(w => w.meanings[0]).filter(m => m && m.toLowerCase() !== correctMeaning.toLowerCase());

    const fallbackDistractors = targetWord.direction === 'ar-en'
      ? ['literary expression', 'emotional state', 'rapid movement', 'scenic description', 'philosophical concept', 'historical era']
      : ['تعبير أو اصطلاح أدبي', 'حالة وجدانية عميقة', 'حركة سريعة أو انتقال', 'وصف لمشهد طبيعي', 'فكرة أو مفهوم فلسفي', 'حقبة زمنية تاريخية'];

    const fullPool = [...new Set([...candidateMeanings, ...fallbackDistractors])].filter(m => m.toLowerCase() !== correctMeaning.toLowerCase());
    const shuffledPool = fullPool.sort(() => 0.5 - Math.random()).slice(0, 3);
    const finalOptions = [correctMeaning, ...shuffledPool].sort(() => 0.5 - Math.random());

    setQuizOptions(finalOptions);
    setQuizSelected(null);
    setQuizRevealed(false);
  };

  // Matching Pair Game Generator
  const setupMatchingGame = (wordsList: SavedWord[]) => {
    const sample = [...wordsList].sort(() => 0.5 - Math.random()).slice(0, 6);
    const cards: { id: string; wordId: string; text: string; type: 'term' | 'meaning' }[] = [];

    sample.forEach((w) => {
      cards.push({
        id: `term-${w.id}`,
        wordId: w.id,
        text: w.word,
        type: 'term'
      });
      cards.push({
        id: `meaning-${w.id}`,
        wordId: w.id,
        text: w.meanings[0] || w.word,
        type: 'meaning'
      });
    });

    setMatchingCards(cards.sort(() => 0.5 - Math.random()));
    setSelectedMatching([]);
    setMatchedCardIds([]);
    setMatchingErrorIds([]);
  };

  // Matching Card Click Handler
  const handleMatchingCardClick = (cardId: string) => {
    if (matchedCardIds.includes(cardId) || selectedMatching.includes(cardId)) return;

    const newSelected = [...selectedMatching, cardId];
    setSelectedMatching(newSelected);

    if (newSelected.length === 2) {
      const card1 = matchingCards.find(c => c.id === newSelected[0]);
      const card2 = matchingCards.find(c => c.id === newSelected[1]);

      if (card1 && card2 && card1.wordId === card2.wordId && card1.type !== card2.type) {
        // Match Success!
        const newlyMatched = [...matchedCardIds, card1.id, card2.id];
        setMatchedCardIds(newlyMatched);
        setSelectedMatching([]);

        // Check if all matched
        if (newlyMatched.length === matchingCards.length) {
          setReviewStats(prev => ({
            ...prev,
            good: prev.good + matchingCards.length / 2,
            completed: true
          }));
        }
      } else {
        // Mismatch
        setMatchingErrorIds(newSelected);
        setTimeout(() => {
          setSelectedMatching([]);
          setMatchingErrorIds([]);
        }, 700);
      }
    }
  };

  // Keyboard navigation for review sessions
  useEffect(() => {
    if (!showReviewModal || reviewStats.completed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        if (reviewMode === 'flashcard') {
          setIsFlipped(prev => !prev);
        }
      } else if (e.key === '1') {
        if (reviewMode === 'flashcard') handleRateCurrentWord('again');
      } else if (e.key === '2') {
        if (reviewMode === 'flashcard') handleRateCurrentWord('hard');
      } else if (e.key === '3') {
        if (reviewMode === 'flashcard') handleRateCurrentWord('good');
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'ح') {
        const curr = reviewQueue[reviewIndex];
        if (curr) speak(curr.word, curr.direction === 'ar-en' ? 'ar' : 'en');
      } else if (e.key === 'Escape') {
        setShowReviewModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showReviewModal, reviewStats.completed, reviewMode, reviewIndex, reviewQueue]);

  // Start Review Session
  const startReviewSession = (mode: 'flashcard' | 'quiz' | 'recall' | 'matching' | 'audio', targetWords?: SavedWord[]) => {
    let list = targetWords ? [...targetWords] : (vocabFilter === 'due' ? [...dueWords] : [...savedWords]);
    if (list.length === 0) list = [...savedWords];
    if (list.length === 0) {
      showToast('لا توجد مفردات محفوظة للمراجعة');
      return;
    }

    // Sort due words first
    list.sort((a, b) => {
      const aDue = !a.nextReviewAt || a.nextReviewAt <= Date.now() ? 0 : 1;
      const bDue = !b.nextReviewAt || b.nextReviewAt <= Date.now() ? 0 : 1;
      return aDue - bDue;
    });

    setReviewMode(mode);
    setReviewQueue(list);
    setReviewIndex(0);
    setIsFlipped(false);
    setReviewStats({ again: 0, hard: 0, good: 0, total: list.length, completed: false });
    
    if (mode === 'matching') {
      setupMatchingGame(list);
    } else if ((mode === 'quiz' || mode === 'audio') && list[0]) {
      generateQuizOptions(list[0], savedWords);
    }
    if (mode === 'audio' && list[0]) {
      speak(list[0].word, list[0].direction === 'ar-en' ? 'ar' : 'en');
    }
    setRecallInput('');
    setRecallChecked(false);
    setRecallIsCorrect(false);
    setRecallShowHint(false);
    setShowReviewModal(true);
  };

  // Manual Word Creation Handler
  const handleSaveNewManualWord = async () => {
    if (!addWordTerm.trim() || !addWordMeanings.trim()) {
      showToast('يرجى إدخال المفردة والمعنى المقابل');
      return;
    }
    const meaningsList = addWordMeanings
      .split(/[,،;\n]+/)
      .map(m => m.trim())
      .filter(Boolean);

    const newEntry: SavedWord = {
      id: `word-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      word: addWordTerm.trim(),
      meanings: meaningsList,
      notes: addWordNotes.trim() || undefined,
      direction: addWordDirection,
      savedAt: Date.now(),
      mastered: false,
      level: 0,
      streak: 0,
      reviewCount: 0,
      intervalDays: 1,
      nextReviewAt: Date.now()
    };

    await saveWordEntry(newEntry);
    setSavedWords(prev => [newEntry, ...prev]);
    setShowAddWordModal(false);
    setAddWordTerm('');
    setAddWordMeanings('');
    setAddWordNotes('');
    showToast('تمت إضافة المفردة يدوياً إلى دفتر المراجعة ✦');
  };

  // Open Edit Word & Notes Modal
  const handleOpenEditWordModal = (word: SavedWord) => {
    setEditingWord(word);
    setEditWordMeanings(word.meanings.join('، '));
    setEditWordNotes(word.notes || '');
    setShowEditWordModal(true);
  };

  // Save Edit Word & Notes
  const handleSaveEditWord = async () => {
    if (!editingWord) return;
    const meaningsList = editWordMeanings
      .split(/[,،;\n]+/)
      .map(m => m.trim())
      .filter(Boolean);

    const updatedWord: SavedWord = {
      ...editingWord,
      meanings: meaningsList.length > 0 ? meaningsList : editingWord.meanings,
      notes: editWordNotes.trim() || undefined
    };

    await saveWordEntry(updatedWord);
    setSavedWords(prev => prev.map(w => w.id === updatedWord.id ? updatedWord : w));
    setShowEditWordModal(false);
    setEditingWord(null);
    showToast('تم تحديث بيانات المفردة والملاحظات بنجاح ✦');
  };

  // Export Vocabulary to JSON File
  const handleExportVocabulary = () => {
    if (savedWords.length === 0) {
      showToast('لا توجد مفردات لتصديرها');
      return;
    }
    const dataStr = JSON.stringify(savedWords, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocabulary_notebook_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير ملف المفردات بنجاح 💾');
  };

  // Import Vocabulary from JSON File
  const handleImportVocabulary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          let count = 0;
          for (const item of parsed) {
            if (item.word && Array.isArray(item.meanings)) {
              await saveWordEntry({
                ...item,
                id: item.id || `word-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
              });
              count++;
            }
          }
          const all = await getAllSavedWords();
          setSavedWords(all);
          showToast(`تم استيراد ${count} مفردة بنجاح ✦`);
        } else {
          showToast('تنسيق ملف المفردات غير صالح');
        }
      } catch {
        showToast('تعذر قراءة ملف الاستيراد');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Remove duplicate words
  const handleRemoveDuplicates = async () => {
    const seen = new Set<string>();
    let removedCount = 0;
    for (const w of savedWords) {
      const key = w.word.trim().toLowerCase();
      if (seen.has(key)) {
        await deleteWordEntry(w.id);
        removedCount++;
      } else {
        seen.add(key);
      }
    }
    const remaining = await getAllSavedWords();
    setSavedWords(remaining);
    showToast(removedCount > 0 ? `تم حذف ${removedCount} مفردة مكررة` : 'لا توجد مفردات مكررة');
  };

  // Reset SRS review dates
  const handleResetSrsSchedule = async () => {
    const now = Date.now();
    for (const w of savedWords) {
      await saveWordEntry({
        ...w,
        nextReviewAt: now,
        intervalDays: 1,
        level: 0
      });
    }
    const updated = await getAllSavedWords();
    setSavedWords(updated);
    showToast('تمت إعادة ضبط مواعيد مراجعة كافة المفردات ✦');
  };

  // SuperMemo SM-2 Spaced Repetition Algorithm Engine
  const handleRateCurrentWord = async (rating: 'again' | 'hard' | 'good') => {
    const currentWord = reviewQueue[reviewIndex];
    if (!currentWord) return;

    const prevLevel = currentWord.level ?? 0;
    const prevStreak = currentWord.streak ?? 0;
    const prevInterval = currentWord.intervalDays ?? 1;
    const prevEF = currentWord.easinessFactor ?? 2.5;

    let newLevel = prevLevel;
    let newStreak = prevStreak;
    let newInterval = prevInterval;
    let newEF = prevEF;

    if (rating === 'again') {
      // Grade 0: Failed recall
      newStreak = 0;
      newLevel = Math.max(0, prevLevel - 1);
      newInterval = 1;
      newEF = Math.max(1.3, prevEF - 0.2);
      setReviewStats(prev => ({ ...prev, again: prev.again + 1 }));
    } else if (rating === 'hard') {
      // Grade 1: Difficult recall
      newStreak = Math.max(1, prevStreak);
      newInterval = Math.max(1, Math.round(prevInterval * 1.2));
      newEF = Math.max(1.3, prevEF - 0.15);
      setReviewStats(prev => ({ ...prev, hard: prev.hard + 1 }));
    } else if (rating === 'good') {
      // Grade 2: Successful recall
      newStreak = prevStreak + 1;
      newLevel = Math.min(3, prevLevel + 1);
      if (prevStreak === 0) newInterval = 1;
      else if (prevStreak === 1) newInterval = 6;
      else newInterval = Math.round(prevInterval * prevEF);
      newEF = prevEF; // Constant
      setReviewStats(prev => ({ ...prev, good: prev.good + 1 }));
    }

    const nextReviewTimestamp = Date.now() + newInterval * 24 * 60 * 60 * 1000;

    const updatedWord: SavedWord = {
      ...currentWord,
      level: newLevel,
      streak: newStreak,
      intervalDays: newInterval,
      easinessFactor: parseFloat(newEF.toFixed(2)),
      lastReviewedAt: Date.now(),
      nextReviewAt: nextReviewTimestamp,
      reviewCount: (currentWord.reviewCount ?? 0) + 1,
      mastered: newLevel >= 3
    };

    await saveWordEntry(updatedWord);
    setSavedWords(prev => prev.map(w => w.id === updatedWord.id ? updatedWord : w));
    setReviewQueue(prev => prev.map(w => w.id === updatedWord.id ? updatedWord : w));

    // Next card or complete
    if (reviewIndex + 1 < reviewQueue.length) {
      const nextIdx = reviewIndex + 1;
      setReviewIndex(nextIdx);
      setIsFlipped(false);
      if (reviewMode === 'quiz' && reviewQueue[nextIdx]) {
        generateQuizOptions(reviewQueue[nextIdx], savedWords);
      }
      setRecallInput('');
      setRecallChecked(false);
      setRecallIsCorrect(false);
      setRecallShowHint(false);
    } else {
      setReviewStats(prev => ({ ...prev, completed: true }));
    }
  };

  // Check user answer in recall/spelling mode
  const handleCheckRecall = () => {
    const currentWord = reviewQueue[reviewIndex];
    if (!currentWord || !recallInput.trim()) return;
    const cleanUser = recallInput.trim().toLowerCase();
    const cleanTarget = currentWord.word.trim().toLowerCase();
    const isCorrect = cleanUser === cleanTarget;
    setRecallChecked(true);
    setRecallIsCorrect(isCorrect);
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

  // Helper for relative next review time badge
  const getRelativeNextReview = (nextReviewAt?: number) => {
    if (!nextReviewAt || nextReviewAt <= Date.now()) {
      return { label: 'مستحقة الآن', isDue: true, color: 'text-amber-300 bg-amber-950/60 border-amber-500/30 animate-pulse' };
    }
    const diffMs = nextReviewAt - Date.now();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return { label: `خلال ${Math.max(1, diffHours)} س`, isDue: false, color: 'text-purple-300 bg-purple-950/40 border-purple-500/20' };
    } else if (diffDays === 1) {
      return { label: 'غداً', isDue: false, color: 'text-blue-300 bg-blue-950/40 border-blue-500/20' };
    } else {
      return { label: `بعد ${diffDays} أيام`, isDue: false, color: 'text-slate-300 bg-slate-800/40 border-white/10' };
    }
  };
  const normalizeForMatch = (w: string) => {
    if (!w) return '';
    return w
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove Arabic tashkeel & tatweel
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/[ة]/g, 'ه')
      .replace(/[ى]/g, 'ي')
      .replace(/^[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+/gu, '')
      .replace(/[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+$/gu, '')
      .trim();
  };

  // Helper to extract base Arabic stem/lemma by stripping prefixes & attached pronouns (handles mega-words like أفأسقيناكموها)
  const stemArabicWord = (word: string): string => {
    if (!word) return '';
    let norm = normalizeForMatch(word);
    if (!norm) return '';

    // Strip compound prefixes (أفأس, أفأ, أوا, أفس, أوس, فسي, أف, أو, فبال, وبال, إلخ)
    const prefixes = [
      'أفأس', 'أفأ', 'أوا', 'أفس', 'أوس', 'فسي', 'فسأ', 'فسن', 'فست',
      'أف', 'أو', 'فلي', 'ولت', 'ولن', 'فلن', 'أبال', 'أفبال', 'أوبال',
      'فبال', 'وبال', 'فكال', 'وكال', 'فلل', 'ولل',
      'بال', 'فال', 'وال', 'كال', 'لل', 'ال',
      'وس', 'فس', 'وب', 'فب', 'ول', 'فل', 'وك', 'فك',
      'و', 'ف', 'ب', 'ل', 'ك', 'س', 'أ'
    ];
    for (const pref of prefixes) {
      if (norm.startsWith(pref) && norm.length - pref.length >= 2) {
        norm = norm.slice(pref.length);
        break;
      }
    }

    // Strip compound attached pronouns & multi-object clitics (ناكموها, ناكموه, تكموها, كموها, تموها, نيها, إلخ)
    const suffixes = [
      'ناكموها', 'ناكموه', 'تكموها', 'تكموه', 'كموها', 'كموه', 'تموها', 'تموه',
      'ناهموها', 'ناهموه', 'هموها', 'هموه', 'نيها', 'نيه', 'كها', 'كه',
      'ناكم', 'ناهم', 'تكم', 'تهم', 'تموني', 'تمونا', 'تموهم', 'تموهن',
      'تكما', 'تكم', 'تكن', 'تهما', 'تهم', 'تهن', 'تها', 'تنا', 'تك', 'ته', 'تي',
      'كما', 'هما', 'كم', 'كن', 'هم', 'هن', 'ها', 'نا', 'ك', 'ه', 'ي', 'ني',
      'تان', 'تين', 'ان', 'ين', 'ون', 'ات', 'وها', 'وه'
    ];
    for (const suf of suffixes) {
      if (norm.endsWith(suf) && norm.length - suf.length >= 2) {
        norm = norm.slice(0, -suf.length);
        break;
      }
    }

    // Weak vowel & Alif Maqsura normalization (اسقي -> اسقى / سقى)
    if (norm.endsWith('ي') && norm.length >= 3) {
      norm = norm.slice(0, -1) + 'ى';
    }

    // Five nouns weak vowel normalization (اخو/اخي/اخا -> اخ, ابو/ابي/ابا -> اب)
    if (['اخو', 'اخي', 'اخا'].includes(norm)) return 'اخ';
    if (['ابو', 'ابي', 'ابا'].includes(norm)) return 'اب';

    return norm;
  };

  // Check if two tokens match in base lemma, definite article, dual/plural pronouns, or singular
  const wordsMatchPattern = (wordA: string, wordB: string): boolean => {
    const a = normalizeForMatch(wordA);
    const b = normalizeForMatch(wordB);
    if (!a || !b) return false;
    if (a === b) return true;

    // Arabic Morphological Stemming Match
    const stemA = stemArabicWord(wordA);
    const stemB = stemArabicWord(wordB);
    if (stemA && stemB && stemA === stemB) return true;

    // English plural / singular (s / es)
    const stripEnglishSuffix = (s: string) => {
      if (s.endsWith('es') && s.length > 4) return s.slice(0, -2);
      if (s.endsWith('s') && s.length > 3) return s.slice(0, -1);
      return s;
    };
    if (stripEnglishSuffix(a) === stripEnglishSuffix(b) && stripEnglishSuffix(a).length >= 3) return true;

    return false;
  };

  // Parse sentence into interactive words with row context & active row pattern highlighting
  const parseInteractiveTokens = (
    sentence: string, 
    direction: 'ar-en' | 'en-ar',
    rowContext?: AlignedUnit
  ) => {
    const tokens = sentence.split(/(\s+|[،.؛:!؟«»""''`()\[\]{}\-_—–]+)/);
    const isRowActive = Boolean(
      rowContext && (activeRowId === rowContext.id || (!activeRowId && currentBook?.alignedRows[0]?.id === rowContext.id))
    );

    return tokens.map((token, idx) => {
      const isWord = /[^\s،.؛:!؟«»""''`()\[\]{}\-_—–]+/.test(token);
      if (!isWord) return <span key={idx}>{token}</span>;

      const cleanToken = token
        .replace(/^[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+/gu, '')
        .replace(/[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+$/gu, '')
        .trim();

      if (!cleanToken) return <span key={idx}>{token}</span>;

      // Check match with currently selected word (and its AI contextual translation if detected)
      const isDirectMatch = selectedWord ? wordsMatchPattern(cleanToken, selectedWord.word) : false;
      const isAiMatch = selectedWord?.aiExactMatch ? wordsMatchPattern(cleanToken, selectedWord.aiExactMatch) : false;
      const isPatternMatch = isDirectMatch || isAiMatch;

      // Check if this occurrence is in the currently active row
      const isHighlightedInActiveRow = isRowActive && isPatternMatch;
      const isExactSelected = Boolean(selectedWord && (cleanToken.toLowerCase() === selectedWord.word.toLowerCase()));

      let highlightClass = '';
      if (isExactSelected) {
        highlightClass = 'active-word selected-primary';
      } else if (isHighlightedInActiveRow) {
        highlightClass = 'active-word active-word-pattern-match';
      }

      return (
        <span
          key={idx}
          onClick={(e) => {
            e.stopPropagation();
            if (rowContext) {
              setActiveRowId(rowContext.id);
            }
            handleWordClick(token, direction, rowContext);
          }}
          className={`word-link ${highlightClass}`.trim()}
          title={isHighlightedInActiveRow ? `مفردة متكررة / متطابقة: ${cleanToken}` : cleanToken}
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

    let arSentences: string[] = [];
    let enSentences: string[] = [];

    // Helper to split text cleanly by custom delimiter string or punctuation
    if (customDelimiter && customDelimiter.trim()) {
      const delim = customDelimiter.trim();
      const escaped = delim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const delimRegex = new RegExp(escaped, 'g');

      arSentences = newArabicText
        .split(delimRegex)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      enSentences = newEnglishText
        .split(delimRegex)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    } else {
      // Default punctuation and newline split
      arSentences = newArabicText
        .split(/([.!\n؟?]+)/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !/^[.!\n؟?]+$/.test(s));

      enSentences = newEnglishText
        .split(/([.!\n?]+)/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !/^[.!\n?]+$/.test(s));
    }

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
      showToast(`تم إنشاء وتجزئة النص بنجاح (${rows.length} فقرة جرى فصلها بناءً على الرمز)`);
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
                              {parseInteractiveTokens(row.arabic, 'ar-en', row)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* English Page (Left Page) */}
                    <div 
                      ref={enPaneRef}
                      onScroll={handleEnScroll}
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
                              {parseInteractiveTokens(row.english, 'en-ar', row)}
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
                          {parseInteractiveTokens(row.arabic, 'ar-en', row)}
                        </p>
                        <p 
                          className="text-en" 
                          style={{ 
                            fontFamily: `${englishFont}, serif`, 
                            fontSize: `${Math.round(fontSize * 0.84)}px`, 
                            lineHeight: lineHeight 
                          }}
                        >
                          {parseInteractiveTokens(row.english, 'en-ar', row)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* MODE 3: SINGLE TEXT FOCUS MODE (عرض أحد النصين لوحده) */}
                {layoutMode === 'focus' && (
                  <div className="paper-focus-spread space-y-4">
                    {/* Language Selection Header Bar for Single Text Mode */}
                    <div className="flex items-center justify-center pt-1 pb-2">
                      <div className="inline-flex items-center gap-1 bg-black/30 p-1.5 rounded-2xl border border-white/10 text-xs">
                        <button
                          onClick={() => setFocusLanguage('ar')}
                          className={`py-1.5 px-4 rounded-xl font-bold transition-all ${
                            focusLanguage === 'ar'
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <i className="fa-solid fa-font ml-1.5"></i>
                          <span>عرض النص العربي فقط</span>
                        </button>
                        <button
                          onClick={() => setFocusLanguage('en')}
                          className={`py-1.5 px-4 rounded-xl font-bold transition-all ${
                            focusLanguage === 'en'
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <i className="fa-solid fa-language ml-1.5"></i>
                          <span>Show English Text Only</span>
                        </button>
                      </div>
                    </div>

                    {filteredRows.length === 0 ? (
                      <p className="paper-empty-notice">لا توجد فقرات مطابقة للبحث</p>
                    ) : (
                      filteredRows.map((row) => (
                        <div
                          key={row.id}
                          id={`sentence-${row.id}`}
                          onClick={() => setActiveRowId(row.id)}
                          onMouseEnter={() => setActiveRowId(row.id)}
                          className={`paper-focus-row ${activeRowId === row.id ? 'active-row' : ''}`}
                        >
                          {focusLanguage === 'ar' ? (
                            <p 
                              className="text-ar" 
                              style={{ 
                                fontFamily: `${arabicFont}, serif`, 
                                fontSize: `${fontSize + 1}px`, 
                                lineHeight: lineHeight 
                              }}
                            >
                              {parseInteractiveTokens(row.arabic, 'ar-en', row)}
                            </p>
                          ) : (
                            <p 
                              className="text-en" 
                              style={{ 
                                fontFamily: `${englishFont}, serif`, 
                                fontSize: `${fontSize}px`, 
                                lineHeight: lineHeight 
                              }}
                            >
                              {parseInteractiveTokens(row.english, 'en-ar', row)}
                            </p>
                          )}
                        </div>
                      ))
                    )}
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
                    title="الوضع الأول: عرض النصين بجانب بعضهما"
                  >
                    <i className="fa-solid fa-columns"></i>
                    <span className="hidden md:inline">بجانب بعضهما</span>
                  </button>
                  <button
                    onClick={() => setLayoutMode('interleaved')}
                    className={`paper-layout-btn px-2 py-1 text-xs gap-1.5 ${layoutMode === 'interleaved' ? 'active' : ''}`}
                    title="الوضع الثاني: عرض كل جملة وبعدها الجملة المقابلة لها"
                  >
                    <i className="fa-solid fa-bars-staggered"></i>
                    <span className="hidden md:inline">جملة بمقابلة</span>
                  </button>
                  <button
                    onClick={() => setLayoutMode('focus')}
                    className={`paper-layout-btn px-2 py-1 text-xs gap-1.5 ${layoutMode === 'focus' ? 'active' : ''}`}
                    title="الوضع الثالث: عرض أحد النصين لوحده"
                  >
                    <i className="fa-solid fa-eye"></i>
                    <span className="hidden md:inline">نص واحد</span>
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
              <div className="view-enter workspace-layout">
                <div className="workspace-intro">
                  <div>
                    <span className="eyebrow-label">مساحة العمل</span>
                    <h1 className="page-title">ابدأ جلسة قراءة جديدة</h1>
                    <p className="page-lede">أدخل النصين المتوازيين، ثم دع التطبيق يرتبهما في تجربة قراءة هادئة وواضحة.</p>
                  </div>
                  <span className="workspace-step"><span>01</span> إعداد النص</span>
                </div>
                
                {/* The Two Parallel Text Editors */}
                <div className="alignment-grid workspace-main">
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

                    {/* Sentence Count & Balance Indicator */}
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-400">عدد الجمل:</span>
                        <span className="font-bold text-white bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded-md">
                          {parsedArSentences.length} جملة
                        </span>
                      </div>

                      {parsedArSentences.length > 0 && parsedEnSentences.length > 0 && (
                        <div>
                          {parsedArSentences.length === parsedEnSentences.length ? (
                            <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <i className="fa-solid fa-check text-[10px]"></i>
                              <span>متطابق تماماً</span>
                            </span>
                          ) : parsedArSentences.length > parsedEnSentences.length ? (
                            <span className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
                              <i className="fa-solid fa-triangle-exclamation text-[10px] text-amber-400"></i>
                              <span>توجد {parsedArSentences.length - parsedEnSentences.length} جملة زائدة</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              أقل بـ ({parsedEnSentences.length - parsedArSentences.length}) جمل
                            </span>
                          )}
                        </div>
                      )}
                    </div>
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

                    {/* Sentence Count & Balance Indicator */}
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-400">Sentences:</span>
                        <span className="font-bold text-white bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded-md">
                          {parsedEnSentences.length} sentences
                        </span>
                      </div>

                      {parsedArSentences.length > 0 && parsedEnSentences.length > 0 && (
                        <div>
                          {parsedArSentences.length === parsedEnSentences.length ? (
                            <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <i className="fa-solid fa-check text-[10px]"></i>
                              <span>Matched Perfectly</span>
                            </span>
                          ) : parsedEnSentences.length > parsedArSentences.length ? (
                            <span className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
                              <i className="fa-solid fa-triangle-exclamation text-[10px] text-amber-400"></i>
                              <span>Extra ({parsedEnSentences.length - parsedArSentences.length}+) sentences</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Fewer by ({parsedArSentences.length - parsedEnSentences.length})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Book Metadata, Custom Sentence Delimiter, and Hero Start Button */}
                <div className="workspace-card workspace-context space-y-4">
                  <div className="context-heading">
                    <span className="eyebrow-label">تفاصيل الجلسة</span>
                    <h2>معلومات النص</h2>
                    <p>اختيارات اختيارية تساعدك على تنظيم الكتاب قبل بدء القراءة.</p>
                  </div>
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

                  {/* Custom Sentence Boundary Delimiter Input */}
                  <div className="space-y-1.5 p-3.5 bg-black/30 rounded-2xl border border-white/10">
                    <label className="form-label text-sm text-purple-300 font-semibold mb-1">
                      رمز الفصل
                    </label>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative flex-1 min-w-[180px]">
                        <input
                          type="text"
                          value={customDelimiter}
                          onChange={(e) => setCustomDelimiter(e.target.value)}
                          placeholder="رمز الفصل (مثال: | أو # أو ~)..."
                          className="form-input w-full text-sm font-mono py-2"
                        />
                        {customDelimiter && (
                          <button
                            type="button"
                            onClick={() => setCustomDelimiter('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            title="مسح"
                          >
                            <i className="fa-solid fa-xmark text-xs"></i>
                          </button>
                        )}
                      </div>

                      {/* Presets Bar */}
                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setCustomDelimiter('|')}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                            customDelimiter === '|' ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-sm' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          |
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomDelimiter('#')}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                            customDelimiter === '#' ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-sm' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          #
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomDelimiter('~')}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                            customDelimiter === '~' ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-sm' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          ~
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomDelimiter('//')}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                            customDelimiter === '//' ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-sm' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          //
                        </button>
                      </div>
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
              <div className="view-enter lexicon-layout">
                <div className="lexicon-heading">
                  <span className="eyebrow-label">قاموسك السريع</span>
                  <h2 className="section-title">المعجم</h2>
                  <p className="page-lede">ابحث عن كلمة واحدة، واحصل على معناها في سياق القراءة.</p>
                </div>

                {/* Search Box */}
                <div className="library-controls lexicon-search-panel flex-col items-stretch gap-3">
                  <label className="panel-label">ابحث في المعجم</label>
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
                  <div className="interleaved-card card-active lexicon-result p-6 space-y-4">
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
                  <div className="text-center py-12 text-slate-400 interleaved-card lexicon-result">
                    <p>لا توجد نتائج مطابقة</p>
                  </div>
                ) : null}

              </div>
            )}

            {/* --- VIEW 3: VOCABULARY NOTEBOOK & SPACED REPETITION REVIEW --- */}
            {activeTab === 'notebook' && (
              <div className="view-enter notebook-layout">
                {/* Header & Quick Action */}
                <div className="flex items-center justify-between flex-wrap gap-4 notebook-header">
                  <div>
                    <h2 className="section-title">المفردات والبطاقات الذكية ({savedWords.length})</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      نظام المراجعة الفعّالة بالتكرار المتباعد واختبارات التذكر التفاعلية
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setShowAddWordModal(true)}
                      className="btn btn-secondary text-purple-300 hover:text-white"
                      title="إضافة مفردة جديدة يدوياً"
                    >
                      <i className="fa-solid fa-plus"></i>
                      <span>إضافة مفردة</span>
                    </button>

                    {savedWords.length > 0 && (
                      <>
                        <button
                          onClick={() => startReviewSession('flashcard')}
                          className="btn btn-primary shadow-lg shadow-purple-950/40"
                          title="مراجعة المفردات بنظام التكرار المتباعد"
                        >
                          <i className="fa-solid fa-layer-group"></i>
                          <span>البطاقات الذكية</span>
                          {dueWords.length > 0 && (
                            <span className="bg-amber-400 text-black text-[11px] font-bold px-1.5 py-0.5 rounded-full mr-1">
                              {dueWords.length}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => startReviewSession('matching')}
                          className="btn bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                          title="لعبة ربط ومطابقة الكلمات والمعاني"
                        >
                          <i className="fa-solid fa-puzzle-piece"></i>
                          <span>لعبة المطابقة</span>
                        </button>

                        <button
                          onClick={() => startReviewSession('quiz')}
                          className="btn btn-secondary text-violet-300 hover:text-white"
                          title="اختبار التسميع السريع بالاختيار من متعدد"
                        >
                          <i className="fa-solid fa-list-check"></i>
                          <span>اختبار التسميع</span>
                        </button>

                        <button
                          onClick={() => startReviewSession('recall')}
                          className="btn btn-secondary text-violet-300 hover:text-white"
                          title="اختبار الإملاء والكتابة"
                        >
                          <i className="fa-solid fa-keyboard"></i>
                          <span>اختبار الكتابة</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Vocabulary Tools Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-2xl bg-black/30 border border-white/10 text-xs text-slate-300 notebook-tools">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-toolbox text-purple-400"></i>
                    <span className="font-semibold text-white">أدوات إدارة البطاقات:</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleExportVocabulary}
                      className="hover:text-white transition-colors flex items-center gap-1 bg-white/5 py-1 px-2.5 rounded-lg border border-white/5"
                      title="تصدير جميع المفردات كملف JSON للنسخ الاحتياطي"
                    >
                      <i className="fa-solid fa-download text-purple-300"></i>
                      <span>تصدير (Backup)</span>
                    </button>

                    <label
                      className="hover:text-white transition-colors flex items-center gap-1 bg-white/5 py-1 px-2.5 rounded-lg border border-white/5 cursor-pointer"
                      title="استيراد مفردات من ملف JSON"
                    >
                      <i className="fa-solid fa-file-import text-purple-300"></i>
                      <span>استيراد</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportVocabulary}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={handleRemoveDuplicates}
                      className="hover:text-white transition-colors flex items-center gap-1 bg-white/5 py-1 px-2.5 rounded-lg border border-white/5"
                      title="تنظيف المفردات المكررة"
                    >
                      <i className="fa-solid fa-broom text-amber-300"></i>
                      <span>حذف المكرر</span>
                    </button>

                    <button
                      onClick={handleResetSrsSchedule}
                      className="hover:text-white transition-colors flex items-center gap-1 bg-white/5 py-1 px-2.5 rounded-lg border border-white/5 text-amber-300"
                      title="إعادة المواعيد لتصبح جميع البطاقات مستحقة الآن"
                    >
                      <i className="fa-solid fa-rotate text-amber-400"></i>
                      <span>تصفير المواعيد</span>
                    </button>
                  </div>
                </div>

                {/* Vocabulary Review Stats Dashboard */}
                {savedWords.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 notebook-summary">
                    <div className="interleaved-card p-3 text-center">
                      <div className="text-xs text-slate-400 mb-1">إجمالي المفردات</div>
                      <div className="text-xl font-bold font-serif text-white">{savedWords.length}</div>
                    </div>
                    
                    <div 
                      onClick={() => setVocabFilter('due')}
                      className={`interleaved-card p-3 text-center cursor-pointer transition-all ${
                        vocabFilter === 'due' ? 'border-amber-500/50 bg-amber-950/20 ring-1 ring-amber-500/30' : 'hover:border-amber-500/30'
                      }`}
                    >
                      <div className="text-xs text-amber-300/90 mb-1 flex items-center justify-center gap-1">
                        <i className="fa-solid fa-clock-rotate-left text-xs"></i>
                        <span>مستحقة للمراجعة</span>
                      </div>
                      <div className="text-xl font-bold font-serif text-amber-300">{dueWords.length}</div>
                    </div>

                    <div 
                      onClick={() => setVocabFilter('learning')}
                      className={`interleaved-card p-3 text-center cursor-pointer transition-all ${
                        vocabFilter === 'learning' ? 'border-purple-500/50 bg-purple-950/20 ring-1 ring-purple-500/30' : 'hover:border-purple-500/30'
                      }`}
                    >
                      <div className="text-xs text-purple-300/90 mb-1 flex items-center justify-center gap-1">
                        <i className="fa-solid fa-seedling text-xs"></i>
                        <span>قيد التعلّم</span>
                      </div>
                      <div className="text-xl font-bold font-serif text-purple-300">{learningWords.length}</div>
                    </div>

                    <div 
                      onClick={() => setVocabFilter('mastered')}
                      className={`interleaved-card p-3 text-center cursor-pointer transition-all ${
                        vocabFilter === 'mastered' ? 'border-emerald-500/50 bg-emerald-950/20 ring-1 ring-emerald-500/30' : 'hover:border-emerald-500/30'
                      }`}
                    >
                      <div className="text-xs text-emerald-300/90 mb-1 flex items-center justify-center gap-1">
                        <i className="fa-solid fa-circle-check text-xs"></i>
                        <span>متقنة</span>
                      </div>
                      <div className="text-xl font-bold font-serif text-emerald-300">{masteredWords.length}</div>
                    </div>
                  </div>
                )}

                {/* Search & Filter Controls */}
                {savedWords.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 library-controls p-3 notebook-filters">
                    {/* Search Input */}
                    <div className="relative flex-1 w-full">
                      <input
                        type="text"
                        value={vocabSearch}
                        onChange={(e) => setVocabSearch(e.target.value)}
                        placeholder="ابحث في الكلمات أو المعاني أو الملاحظات..."
                        className="search-box w-full text-sm py-2"
                      />
                      {vocabSearch && (
                        <button
                          onClick={() => setVocabSearch('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                      )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                      <button
                        onClick={() => setVocabFilter('all')}
                        className={`preset-chip py-1.5 px-3 text-xs ${vocabFilter === 'all' ? 'btn-primary text-white' : ''}`}
                      >
                        الكل ({savedWords.length})
                      </button>
                      <button
                        onClick={() => setVocabFilter('due')}
                        className={`preset-chip py-1.5 px-3 text-xs ${vocabFilter === 'due' ? 'btn-primary text-white' : ''}`}
                      >
                        للمراجعة ({dueWords.length})
                      </button>
                      <button
                        onClick={() => setVocabFilter('learning')}
                        className={`preset-chip py-1.5 px-3 text-xs ${vocabFilter === 'learning' ? 'btn-primary text-white' : ''}`}
                      >
                        قيد التعلّم ({learningWords.length})
                      </button>
                      <button
                        onClick={() => setVocabFilter('mastered')}
                        className={`preset-chip py-1.5 px-3 text-xs ${vocabFilter === 'mastered' ? 'btn-primary text-white' : ''}`}
                      >
                        متقنة ({masteredWords.length})
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {savedWords.length === 0 ? (
                  <div className="interleaved-card text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300 text-2xl shadow-lg shadow-purple-950/50">
                      <i className="fa-solid fa-bookmark"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-serif text-white">دفتر المفردات فارغ</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        أثناء قراءة أي نص، اضغط على أي كلمة لعرض ترجمتها وحفظها مباشرة، أو أضف مفرداتك الخاصة يدوياً.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => setShowAddWordModal(true)}
                        className="btn btn-primary px-6"
                      >
                        <i className="fa-solid fa-plus ml-1"></i>
                        <span>إضافة أول مفردة الآن</span>
                      </button>
                    </div>
                  </div>
                ) : filteredSavedWords.length === 0 ? (
                  <div className="interleaved-card text-center py-12">
                    <p className="text-slate-400 text-sm">لا توجد نتائج مطابقة للفلتر المحدد</p>
                  </div>
                ) : (
                  /* Cards Grid */
                  <div className="vocab-list">
                    {filteredSavedWords.map((item) => {
                      const level = item.level ?? 0;
                      const isMastered = item.mastered || level >= 3;
                      const isDue = !item.nextReviewAt || item.nextReviewAt <= Date.now();

                      return (
                        <div key={item.id} className="vocab-card relative flex flex-col justify-between">
                          <div>
                            {/* Card Top Header */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xl font-bold font-serif text-white tracking-wide">{item.word}</h4>
                                  <span className="text-[10px] text-purple-300/80 bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.5 rounded">
                                    {item.direction === 'ar-en' ? 'عربي ➔ E' : 'English ➔ ع'}
                                  </span>
                                </div>
                                {item.bookTitle && (
                                  <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                                    <i className="fa-solid fa-book-open text-[10px] text-purple-400"></i>
                                    <span>{item.bookTitle}</span>
                                  </span>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => speak(item.word, item.direction === 'ar-en' ? 'ar' : 'en')}
                                  className="btn btn-ghost py-1 px-2 text-xs text-purple-300 hover:text-white"
                                  title="استمع للنطق"
                                >
                                  <i className="fa-solid fa-volume-high"></i>
                                </button>

                                <button
                                  onClick={() => handleOpenEditWordModal(item)}
                                  className="btn btn-ghost py-1 px-2 text-xs text-slate-400 hover:text-purple-300"
                                  title="تعديل الملاحظات والمعاني"
                                >
                                  <i className="fa-solid fa-pen-to-square"></i>
                                </button>

                                <button
                                  onClick={() => handleToggleMastered(item.id)}
                                  className={`btn btn-ghost py-1 px-2 text-xs ${
                                    isMastered ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-amber-300'
                                  }`}
                                  title={isMastered ? 'إلغاء الإتقان وإعادتها للمراجعة' : 'تحديد كمتقنة ⭐'}
                                >
                                  <i className={`fa-solid ${isMastered ? 'fa-star text-amber-400' : 'fa-star'}`}></i>
                                </button>

                                <button
                                  onClick={() => handleToggleSaveWord(item)}
                                  className="btn btn-ghost py-1 px-2 text-xs text-slate-500 hover:text-red-400"
                                  title="حذف من المفردات"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </div>

                            {/* Meanings */}
                            <div className="pt-2 pb-2.5 border-t border-white/5">
                              <div className="flex flex-wrap gap-1.5">
                                {item.meanings.map((m, i) => (
                                  <span key={i} className="btn btn-secondary py-0.5 px-2.5 text-xs text-violet-200">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Context Sentence or Notes */}
                            {item.notes && (
                              <div className="text-[11.5px] text-slate-300 bg-black/25 p-2 rounded-xl border border-white/5 mb-2.5 leading-relaxed">
                                <i className="fa-solid fa-sticky-note text-amber-400 ml-1 text-[11px]"></i>
                                <span>{item.notes}</span>
                              </div>
                            )}
                          </div>

                          {/* Spaced Repetition Footer */}
                          <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs mt-1 flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`vocab-level-badge level-badge-${Math.min(3, level)}`}>
                                {isMastered ? (
                                  <>
                                    <i className="fa-solid fa-circle-check text-xs"></i>
                                    <span>متقنة</span>
                                  </>
                                ) : level === 2 ? (
                                  <>
                                    <i className="fa-solid fa-layer-group text-xs"></i>
                                    <span>مألوفة</span>
                                  </>
                                ) : level === 1 ? (
                                  <>
                                    <i className="fa-solid fa-seedling text-xs"></i>
                                    <span>قيد التعلّم</span>
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-solid fa-sparkles text-xs"></i>
                                    <span>جديدة</span>
                                  </>
                                )}
                              </span>

                              {(() => {
                                const dueInfo = getRelativeNextReview(item.nextReviewAt);
                                return (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 font-semibold ${dueInfo.color}`}>
                                    <i className={`fa-solid ${dueInfo.isDue ? 'fa-bell text-[9px]' : 'fa-clock text-[9px]'}`}></i>
                                    <span>{dueInfo.label}</span>
                                  </span>
                                );
                              })()}

                              {item.easinessFactor && (
                                <span className="text-[10px] text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded" title="معامل سهولة الذاكرة SM-2">
                                  EF {item.easinessFactor.toFixed(1)}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => startReviewSession('flashcard', [item])}
                              className="text-purple-300 hover:text-white text-xs flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-purple-900/30 transition-all border border-purple-500/20 shadow-sm"
                            >
                              <i className="fa-solid fa-play text-[10px]"></i>
                              <span>مراجعة المفردة</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- VIEW 4: LIBRARY --- */}
            {activeTab === 'library' && (
              <div className="view-enter library-layout">
                <div className="flex items-center justify-between flex-wrap gap-4 library-heading">
                  <div>
                    <span className="eyebrow-label">مكتبتك</span>
                    <h2 className="section-title">المكتبة ({books.length})</h2>
                    <p className="page-lede">اختر كتابًا لمتابعة القراءة، أو أنشئ مساحة جديدة للنصوص المتوازية.</p>
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
                  <div className="library-controls library-context">
                    <span className="panel-label">تصفية المكتبة</span>
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
                  <div className="books-grid library-book-list">
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

      {/* ================= FLOATING SMART LEXICON & AI CONTEXT CARD ================= */}
      {selectedWord && (
        <div className="smart-lexicon-floating">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
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
              {(selectedWord.aiExactMatch || selectedWord.meanings.length > 0) && (
                <button
                  onClick={() => handleCopyMeanings(
                    [
                      selectedWord.aiExactMatch ? `[سياق]: ${selectedWord.aiExactMatch}` : '',
                      ...selectedWord.meanings
                    ].filter(Boolean).join(', ')
                  )}
                  className="btn btn-ghost py-1 px-2 text-xs text-purple-300 hover:text-white"
                  title="نسخ الترجمة"
                >
                  <i className={`fa-solid ${copyFeedback ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                  {copyFeedback && <span className="text-xs mr-1 text-emerald-400 font-sans">تم</span>}
                </button>
              )}
              <button
                onClick={() => handleToggleSaveWord({
                  word: selectedWord.word,
                  meanings: [
                    ...(selectedWord.aiExactMatch ? [selectedWord.aiExactMatch] : []),
                    ...selectedWord.meanings
                  ],
                  direction: selectedWord.direction
                })}
                className={`btn ${isWordSaved(selectedWord.word) ? 'btn-primary' : 'btn-secondary'} py-1 px-2.5 text-xs`}
                title={isWordSaved(selectedWord.word) ? 'محفوظة' : 'حفظ'}
              >
                <i className={`fa-solid ${isWordSaved(selectedWord.word) ? 'fa-check' : 'fa-bookmark'}`}></i>
                <span className="mr-1 hidden sm:inline">{isWordSaved(selectedWord.word) ? 'محفوظة' : 'حفظ'}</span>
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

          <div className="space-y-3 pt-2 border-t border-white/10">
            {/* 1. AI & CONTEXTUAL TRANSLATION SECTION */}
            <div className="ai-translation-box">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                {selectedWord.aiConnected ? (
                  <span className="ai-tag-badge bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
                    <span>ترجمة الذكاء الاصطناعي (Gemini 3.8)</span>
                  </span>
                ) : (
                  <span className="ai-tag-badge bg-amber-950/80 border border-amber-500/50 text-amber-200">
                    <i className="fa-solid fa-microchip text-xs text-amber-400"></i>
                    <span>المطابقة السياقية اللغوية (معالج محلي فوري)</span>
                  </span>
                )}

                {selectedWord.aiLoading ? (
                  <span className="text-[11px] text-purple-300 flex items-center gap-1">
                    <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                    <span>جارٍ البحث والتحليل...</span>
                  </span>
                ) : selectedWord.aiConnected ? (
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>متصل بـ Gemini</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <i className="fa-solid fa-triangle-exclamation text-[10px] text-amber-400"></i>
                    <span>الذكاء الاصطناعي غير متصل</span>
                  </span>
                )}
              </div>

              {/* Status Notice when AI is not connected */}
              {!selectedWord.aiLoading && !selectedWord.aiConnected && (
                <div className="text-[11px] text-amber-200/90 bg-amber-950/30 border border-amber-500/30 p-2 rounded-xl mb-2.5 flex items-start gap-2 leading-relaxed">
                  <i className="fa-solid fa-circle-info text-amber-400 mt-0.5 shrink-0"></i>
                  <div className="flex-1">
                    <p className="font-bold text-amber-200">
                      تنبيه: تعذر الاتصال بنموذج الذكاء الاصطناعي (Gemini)
                    </p>
                    <p className="text-slate-300 text-[10.5px] mt-0.5">
                      {selectedWord.aiStatusMessage || 'المفتاح غير متوفر في إعدادات البيئة. يتم عرض المطابقة السياقية عبر المعالج اللغوي المدمج.'}
                    </p>
                  </div>
                </div>
              )}

              {selectedWord.aiLoading ? (
                <div className="py-2 text-xs text-slate-400 flex items-center gap-2">
                  <i className="fa-solid fa-sparkles animate-pulse text-purple-400"></i>
                  <span>يتم فحص الجملة والجمل المحيطة لتحديد الترجمة الدقيقة للكلمة...</span>
                </div>
              ) : selectedWord.aiExactMatch ? (
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs text-slate-400">المقابل الدقيق في النص:</span>
                    <span className="ai-matched-word text-base">
                      {selectedWord.aiExactMatch}
                    </span>
                    {selectedWord.aiContextualMeaning && selectedWord.aiContextualMeaning !== selectedWord.aiExactMatch && (
                      <span className="text-xs text-emerald-300 font-medium">
                        ({selectedWord.aiContextualMeaning})
                      </span>
                    )}
                  </div>
                  {selectedWord.aiExplanation && (
                    <p className="text-[11px] text-slate-300 bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/5 leading-relaxed">
                      <i className="fa-solid fa-circle-info ml-1 text-purple-400"></i>
                      {selectedWord.aiExplanation}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-1">
                  اضغط على الكلمة داخل نص القراءة المزدوج للبحث عن مقابلها في الجملة المقابلة
                </p>
              )}
            </div>

            {/* 2. LEXICAL DICTIONARY MEANINGS SECTION */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <i className="fa-solid fa-book-bookmark text-purple-400 text-xs"></i>
                <span>الترجمة المعجمية الشاملة (القاموس):</span>
              </div>

              {selectedWord.loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                  <i className="fa-solid fa-spinner fa-spin text-purple-400"></i>
                  <span>جارٍ جلب المعاجم...</span>
                </div>
              ) : selectedWord.meanings.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedWord.meanings.map((m, idx) => (
                    <span
                      key={idx}
                      className="btn btn-secondary py-1 px-3 text-sm text-violet-200"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-1">
                  لا توجد ترجمة مسجلة في القاموس العام لهذه الكلمة
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= COMPREHENSIVE VOCABULARY REVIEW MODAL ================= */}
      {showReviewModal && reviewQueue.length > 0 && (
        <div className="modal-overlay active" onClick={() => setShowReviewModal(false)}>
          <div className="modal-card max-w-xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <i className="fa-solid fa-graduation-cap text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-bold font-serif text-white">
                    {reviewStats.completed
                      ? 'اكتملت الجلسة'
                      : `مراجعة: بطاقة ${reviewIndex + 1} من ${reviewQueue.length}`}
                  </h2>
                </div>
              </div>

              {/* Mode Switcher */}
              {!reviewStats.completed && (
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs flex-wrap">
                  <button
                    onClick={() => {
                      setReviewMode('flashcard');
                      setIsFlipped(false);
                    }}
                    className={`py-1 px-2.5 rounded-lg transition-all ${
                      reviewMode === 'flashcard' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="نمط البطاقات الذكية"
                  >
                    <i className="fa-solid fa-layer-group ml-1"></i>
                    <span className="hidden sm:inline">بطاقات</span>
                  </button>

                  <button
                    onClick={() => {
                      setReviewMode('matching');
                      setupMatchingGame(reviewQueue);
                    }}
                    className={`py-1 px-2.5 rounded-lg transition-all ${
                      reviewMode === 'matching' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="لعبة ربط الكلمة بمعناها"
                  >
                    <i className="fa-solid fa-puzzle-piece ml-1"></i>
                    <span className="hidden sm:inline">مطابقة</span>
                  </button>

                  <button
                    onClick={() => {
                      setReviewMode('quiz');
                      if (reviewQueue[reviewIndex]) {
                        generateQuizOptions(reviewQueue[reviewIndex], savedWords);
                      }
                    }}
                    className={`py-1 px-2.5 rounded-lg transition-all ${
                      reviewMode === 'quiz' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="اختبار التسميع السريع"
                  >
                    <i className="fa-solid fa-list-check ml-1"></i>
                    <span className="hidden sm:inline">تسميع</span>
                  </button>

                  <button
                    onClick={() => {
                      setReviewMode('recall');
                      setRecallInput('');
                      setRecallChecked(false);
                      setRecallIsCorrect(false);
                      setRecallShowHint(false);
                    }}
                    className={`py-1 px-2.5 rounded-lg transition-all ${
                      reviewMode === 'recall' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="اختبار الكتابة والإملاء"
                  >
                    <i className="fa-solid fa-keyboard ml-1"></i>
                    <span className="hidden sm:inline">كتابة</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowReviewModal(false)}
                className="modal-close"
                title="إغلاق الجلسة"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Progress Bar */}
            {!reviewStats.completed && (
              <div className="w-full bg-black/30 h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full transition-all duration-300"
                  style={{ width: `${Math.round(((reviewIndex) / reviewQueue.length) * 100)}%` }}
                ></div>
              </div>
            )}

            {/* Modal Body */}
            <div className="modal-body space-y-4">
              {reviewStats.completed ? (
                /* Session Complete Screen */
                <div className="text-center py-6 space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-900/40 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-300 text-2xl shadow-lg shadow-emerald-900/20 animate-bounce">
                    <i className="fa-solid fa-trophy"></i>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold font-serif text-white mb-1">
                      أحسنت! اكتملت جلسة المراجعة
                    </h3>
                    <p className="text-xs text-slate-400">
                      تم حفظ تقدمك وتحديث مواعيد المراجعة القادمة للمفردات بنجاح.
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                    <div className="interleaved-card p-3 text-center border-emerald-500/30 bg-emerald-950/20">
                      <div className="text-xs text-emerald-300 mb-1">أتقنتها</div>
                      <div className="text-xl font-bold text-emerald-300">{reviewStats.good}</div>
                    </div>
                    <div className="interleaved-card p-3 text-center border-amber-500/30 bg-amber-950/20">
                      <div className="text-xs text-amber-300 mb-1">صعبة</div>
                      <div className="text-xl font-bold text-amber-300">{reviewStats.hard}</div>
                    </div>
                    <div className="interleaved-card p-3 text-center border-red-500/30 bg-red-950/20">
                      <div className="text-xs text-red-300 mb-1">تحتاج إعادة</div>
                      <div className="text-xl font-bold text-red-300">{reviewStats.again}</div>
                    </div>
                  </div>

                  {/* Retention Score Index */}
                  {(() => {
                    const totalEvaluated = reviewStats.good + reviewStats.hard + reviewStats.again;
                    const accuracy = totalEvaluated > 0 ? Math.round(((reviewStats.good + reviewStats.hard * 0.5) / totalEvaluated) * 100) : 100;
                    return (
                      <div className="bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-purple-950/40 border border-purple-500/30 p-3 rounded-2xl max-w-sm mx-auto flex items-center justify-between shadow-lg shadow-purple-950/30">
                        <div className="text-right">
                          <div className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
                            <i className="fa-solid fa-brain text-purple-400"></i>
                            <span>مؤشر استقرار الذاكرة SM-2:</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">نسبة الفاعلية والاستدعاء الذهني لحفظ المفردات</div>
                        </div>
                        <div className="text-2xl font-bold font-serif text-emerald-300">
                          {accuracy}%
                        </div>
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-3 pt-3">
                    <button
                      onClick={() => startReviewSession(reviewMode, reviewQueue)}
                      className="btn btn-secondary"
                    >
                      <i className="fa-solid fa-rotate-right ml-1"></i>
                      <span>إعادة هذه الجلسة</span>
                    </button>
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="btn btn-primary px-6"
                    >
                      <i className="fa-solid fa-check ml-1"></i>
                      <span>إنهاء والعودة للمفردات</span>
                    </button>
                  </div>
                </div>
              ) : reviewMode === 'matching' ? (
                /* MODE: MATCHING PAIRS GAME */
                <div className="space-y-4">
                  <div className="text-center space-y-1 mb-2">
                    <p className="text-xs text-emerald-300 font-semibold">
                      اضغط على الكلمة ثم اضغط على معناها المناسب لمطابقتهما:
                    </p>
                    <p className="text-[11px] text-slate-400">
                      تم مطابقة {matchedCardIds.length / 2} من {matchingCards.length / 2} أزواج
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {matchingCards.map((card) => {
                      const isMatched = matchedCardIds.includes(card.id);
                      const isSelected = selectedMatching.includes(card.id);
                      const isError = matchingErrorIds.includes(card.id);

                      let cardStyle = 'bg-black/30 border-white/10 hover:border-purple-500/50 text-white';
                      if (isMatched) {
                        cardStyle = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 opacity-50 cursor-default scale-95';
                      } else if (isSelected) {
                        cardStyle = 'bg-purple-900/60 border-purple-400 text-white ring-2 ring-purple-400 scale-105';
                      } else if (isError) {
                        cardStyle = 'bg-red-950/60 border-red-500 text-red-200 animate-shake';
                      }

                      return (
                        <button
                          key={card.id}
                          disabled={isMatched}
                          onClick={() => handleMatchingCardClick(card.id)}
                          className={`p-3 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[75px] ${cardStyle}`}
                        >
                          <span className={`text-sm font-semibold ${card.type === 'term' ? 'font-serif text-base' : 'font-sans'}`}>
                            {card.text}
                          </span>
                          <span className="text-[10px] opacity-60 mt-1">
                            {card.type === 'term' ? 'مفردة' : 'معنى'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setupMatchingGame(reviewQueue)}
                      className="btn btn-secondary text-xs"
                    >
                      <i className="fa-solid fa-shuffle ml-1"></i>
                      <span>توليد مجموعة مطابقة جديدة</span>
                    </button>
                  </div>
                </div>
              ) : reviewMode === 'flashcard' ? (
                /* MODE 1: SMART FLASHCARDS */
                <div className="space-y-4">
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className={`study-flip-card ${isFlipped ? 'is-flipped' : ''}`}
                  >
                    <div className="study-flip-inner">
                      {/* FRONT OF CARD */}
                      <div className="study-card-front">
                        <div className="text-xs text-purple-300 font-semibold mb-2">
                          {reviewQueue[reviewIndex]?.direction === 'ar-en' ? 'نص عربي' : 'English Term'}
                        </div>
                        <h3 className="text-3xl font-bold font-serif text-white mb-2">
                          {reviewQueue[reviewIndex]?.word}
                        </h3>
                        {reviewQueue[reviewIndex]?.bookTitle && (
                          <p className="text-xs text-slate-400 mb-4 line-clamp-1">
                            {reviewQueue[reviewIndex]?.bookTitle}
                          </p>
                        )}
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-auto">
                          <i className="fa-solid fa-hand-pointer text-[10px]"></i>
                          <span>اضغط لقلب البطاقة [المسافة Space]</span>
                        </div>
                      </div>

                      {/* BACK OF CARD */}
                      <div className="study-card-back">
                        <div className="text-xs text-emerald-300 font-semibold mb-2">المعنى المقابل والترجمة</div>
                        <h3 className="text-xl font-bold font-serif text-white mb-3">
                          {reviewQueue[reviewIndex]?.word}
                        </h3>
                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                          {reviewQueue[reviewIndex]?.meanings.map((m, idx) => (
                            <span key={idx} className="btn btn-secondary py-1 px-3 text-base text-violet-200">
                              {m}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(
                              reviewQueue[reviewIndex]?.word,
                              reviewQueue[reviewIndex]?.direction === 'ar-en' ? 'ar' : 'en'
                            );
                          }}
                          className="btn btn-ghost py-1 px-3 text-xs text-purple-300 hover:text-white"
                        >
                          <i className="fa-solid fa-volume-high ml-1"></i>
                          <span>استمع للنطق [P]</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rating Buttons */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs text-center text-slate-400 flex items-center justify-center gap-1">
                      <span>قيّم مستوى تذكرك لتحديث جدول التكرار المتباعد:</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleRateCurrentWord('again')}
                        className="btn bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-200 py-2.5 text-xs flex flex-col items-center justify-center gap-0.5 relative group"
                      >
                        <span className="font-bold flex items-center gap-1">
                          <i className="fa-solid fa-xmark text-red-400"></i>
                          <span>لم أتذكرها</span>
                        </span>
                        <span className="text-[10px] text-red-300/70">إعادة [1]</span>
                      </button>

                      <button
                        onClick={() => handleRateCurrentWord('hard')}
                        className="btn bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 py-2.5 text-xs flex flex-col items-center justify-center gap-0.5 relative group"
                      >
                        <span className="font-bold flex items-center gap-1">
                          <i className="fa-solid fa-question text-amber-400"></i>
                          <span>صعبة قليلاً</span>
                        </span>
                        <span className="text-[10px] text-amber-300/70">بعد يومين [2]</span>
                      </button>

                      <button
                        onClick={() => handleRateCurrentWord('good')}
                        className="btn bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 py-2.5 text-xs flex flex-col items-center justify-center gap-0.5 relative group"
                      >
                        <span className="font-bold flex items-center gap-1">
                          <i className="fa-solid fa-check text-emerald-400"></i>
                          <span>أتقنتها</span>
                        </span>
                        <span className="text-[10px] text-emerald-300/70">بعد أسبوع [3]</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : reviewMode === 'quiz' ? (
                /* MODE 2: MULTIPLE CHOICE QUIZ */
                <div className="space-y-4">
                  {/* Prompt Card */}
                  <div className="interleaved-card text-center p-6 space-y-2 border-purple-500/30">
                    <div className="text-xs text-purple-300 font-semibold">ما هو المعنى الصحيح لهذه المفردة؟</div>
                    <h3 className="text-3xl font-bold font-serif text-white">
                      {reviewQueue[reviewIndex]?.word}
                    </h3>
                    <div className="pt-1">
                      <button
                        onClick={() =>
                          speak(
                            reviewQueue[reviewIndex]?.word,
                            reviewQueue[reviewIndex]?.direction === 'ar-en' ? 'ar' : 'en'
                          )
                        }
                        className="btn btn-ghost py-1 px-3 text-xs text-purple-300 hover:text-white"
                      >
                        <i className="fa-solid fa-volume-high ml-1"></i>
                        <span>استمع</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Choices */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {quizOptions.map((opt, idx) => {
                      const isCorrectAnswer = reviewQueue[reviewIndex]?.meanings.includes(opt);
                      let optionClass = '';
                      if (quizRevealed) {
                        if (isCorrectAnswer) optionClass = 'correct';
                        else if (quizSelected === opt) optionClass = 'incorrect';
                      }

                      return (
                        <button
                          key={idx}
                          disabled={quizRevealed}
                          onClick={() => {
                            setQuizSelected(opt);
                            setQuizRevealed(true);
                          }}
                          className={`review-quiz-option ${optionClass}`}
                        >
                          <span className="font-serif text-base">{opt}</span>
                          <span className="text-xs opacity-60">
                            {quizRevealed && isCorrectAnswer && (
                              <i className="fa-solid fa-circle-check text-emerald-400"></i>
                            )}
                            {quizRevealed && !isCorrectAnswer && quizSelected === opt && (
                              <i className="fa-solid fa-circle-xmark text-red-400"></i>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback & Next Action */}
                  {quizRevealed && (
                    <div className="pt-2 flex items-center justify-between gap-3 animate-fade-in">
                      <div className="text-xs">
                        {quizSelected && reviewQueue[reviewIndex]?.meanings.includes(quizSelected) ? (
                          <span className="text-emerald-300 font-bold flex items-center gap-1">
                            <i className="fa-solid fa-check"></i>
                            <span>إجابة صحيحة وممتازة!</span>
                          </span>
                        ) : (
                          <span className="text-red-300 font-bold flex items-center gap-1">
                            <i className="fa-solid fa-xmark"></i>
                            <span>الإجابة الصحيحة: {reviewQueue[reviewIndex]?.meanings.join('، ')}</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          const wasCorrect =
                            quizSelected && reviewQueue[reviewIndex]?.meanings.includes(quizSelected);
                          handleRateCurrentWord(wasCorrect ? 'good' : 'again');
                        }}
                        className="btn btn-primary py-2 px-5 text-xs"
                      >
                        <span>المتابعة للكلمة التالية</span>
                        <i className="fa-solid fa-arrow-left mr-1"></i>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* MODE 3: ACTIVE RECALL / SPELLING */
                <div className="space-y-4">
                  <div className="interleaved-card text-center p-6 space-y-2 border-purple-500/30">
                    <div className="text-xs text-purple-300 font-semibold">اكتب الكلمة المقابلة لهذا المعنى:</div>
                    <div className="flex flex-wrap gap-2 justify-center py-2">
                      {reviewQueue[reviewIndex]?.meanings.map((m, idx) => (
                        <span key={idx} className="btn btn-secondary py-1 px-3 text-lg font-serif text-violet-200">
                          {m}
                        </span>
                      ))}
                    </div>
                    {reviewQueue[reviewIndex]?.bookTitle && (
                      <p className="text-xs text-slate-500">{reviewQueue[reviewIndex]?.bookTitle}</p>
                    )}
                  </div>

                  {/* Typing input */}
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={recallInput}
                        onChange={(e) => {
                          setRecallInput(e.target.value);
                          setRecallChecked(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (!recallChecked) handleCheckRecall();
                            else handleRateCurrentWord(recallIsCorrect ? 'good' : 'again');
                          }
                        }}
                        placeholder="اكتب المفردة هنا..."
                        className="form-input w-full text-center text-lg font-serif py-3"
                        autoFocus
                      />
                    </div>

                    {/* Hint / Answer reveal */}
                    {recallShowHint && (
                      <div className="interleaved-card p-3 text-center text-xs text-amber-300 bg-amber-950/20 border-amber-500/30">
                        الكلمة المطلوبة تبدأ بـ: <strong>{reviewQueue[reviewIndex]?.word.substring(0, 2)}...</strong>
                        <span className="block mt-1 text-slate-400">({reviewQueue[reviewIndex]?.word})</span>
                      </div>
                    )}

                    {/* Result feedback */}
                    {recallChecked && (
                      <div
                        className={`p-3 rounded-xl text-center text-sm font-bold ${
                          recallIsCorrect
                            ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                            : 'bg-red-950/40 border border-red-500/40 text-red-300'
                        }`}
                      >
                        {recallIsCorrect ? (
                          <div className="flex items-center justify-center gap-2">
                            <i className="fa-solid fa-circle-check text-emerald-400"></i>
                            <span>صحيح تماماً! كتابة متقنة.</span>
                          </div>
                        ) : (
                          <div>
                            <div>للأسف كتابة غير مطابقة.</div>
                            <div className="text-xs font-normal text-slate-300 mt-1">
                              الإملاء الصحيح: <strong>{reviewQueue[reviewIndex]?.word}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      onClick={() => setRecallShowHint(!recallShowHint)}
                      className="btn btn-ghost text-xs text-amber-300"
                    >
                      <i className="fa-solid fa-lightbulb ml-1"></i>
                      <span>{recallShowHint ? 'إخفاء التلميح' : 'إظهار تلميح'}</span>
                    </button>

                    {!recallChecked ? (
                      <button
                        onClick={handleCheckRecall}
                        disabled={!recallInput.trim()}
                        className="btn btn-primary"
                      >
                        <span>التحقق من الإجابة</span>
                        <i className="fa-solid fa-magnifying-glass mr-1"></i>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRateCurrentWord(recallIsCorrect ? 'good' : 'again')}
                        className="btn btn-primary"
                      >
                        <span>المتابعة</span>
                        <i className="fa-solid fa-arrow-left mr-1"></i>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= READING SETTINGS MODAL ================= */}
      {/* ================= ADD NEW WORD MODAL ================= */}
      {showAddWordModal && (
        <div className="modal-overlay active" onClick={() => setShowAddWordModal(false)}>
          <div className="modal-card max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-plus-circle text-purple-400"></i>
                <h2 className="text-base font-bold font-serif text-white">إضافة مفردة جديدة</h2>
              </div>
              <button onClick={() => setShowAddWordModal(false)} className="modal-close" title="إغلاق">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div>
                <label className="form-label">الكلمة / المفردة *</label>
                <input
                  type="text"
                  value={addWordTerm}
                  onChange={(e) => setAddWordTerm(e.target.value)}
                  placeholder="مثال: Almustafa أو المصطفى..."
                  className="form-input w-full text-lg font-serif"
                  autoFocus
                />
              </div>

              <div>
                <label className="form-label">المعاني / الترجمات * (افصل بينها بفواصل)</label>
                <textarea
                  rows={3}
                  value={addWordMeanings}
                  onChange={(e) => setAddWordMeanings(e.target.value)}
                  placeholder="مثال: المختار، الحبيب، الصفوة..."
                  className="form-textarea w-full text-sm"
                />
              </div>

              <div>
                <label className="form-label">الاتجاه</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddWordDirection('ar-en')}
                    className={`btn text-xs py-2 ${addWordDirection === 'ar-en' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    عربي ➔ إنجليزي
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddWordDirection('en-ar')}
                    className={`btn text-xs py-2 ${addWordDirection === 'en-ar' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    إنجليزي ➔ عربي
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">ملاحظات حرة / شواهد لغوية (اختياري)</label>
                <textarea
                  rows={2}
                  value={addWordNotes}
                  onChange={(e) => setAddWordNotes(e.target.value)}
                  placeholder="ملاحظات حول الجذر، السياق، أو طريقة التذكر..."
                  className="form-textarea w-full text-xs"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowAddWordModal(false)} className="btn btn-secondary text-xs">
                إلغاء
              </button>
              <button onClick={handleSaveNewManualWord} className="btn btn-primary text-xs px-5">
                <i className="fa-solid fa-check ml-1"></i>
                <span>حفظ المفردة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT WORD & NOTES MODAL ================= */}
      {showEditWordModal && editingWord && (
        <div className="modal-overlay active" onClick={() => setShowEditWordModal(false)}>
          <div className="modal-card max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square text-purple-400"></i>
                <h2 className="text-base font-bold font-serif text-white">تعديل: {editingWord.word}</h2>
              </div>
              <button onClick={() => setShowEditWordModal(false)} className="modal-close" title="إغلاق">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div>
                <label className="form-label">المعاني / الترجمات (افصل بينها بفواصل)</label>
                <textarea
                  rows={3}
                  value={editWordMeanings}
                  onChange={(e) => setEditWordMeanings(e.target.value)}
                  className="form-textarea w-full text-sm font-serif"
                />
              </div>

              <div>
                <label className="form-label">الملاحظات والشواهد اللغوية</label>
                <textarea
                  rows={3}
                  value={editWordNotes}
                  onChange={(e) => setEditWordNotes(e.target.value)}
                  placeholder="أضف ملاحظتك أو تلميح التذكر هنا..."
                  className="form-textarea w-full text-xs"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowEditWordModal(false)} className="btn btn-secondary text-xs">
                إلغاء
              </button>
              <button onClick={handleSaveEditWord} className="btn btn-primary text-xs px-5">
                <i className="fa-solid fa-check ml-1"></i>
                <span>حفظ التعديلات</span>
              </button>
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
                <label className="form-label text-sm font-semibold">نمط العرض في القارئ</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setLayoutMode('dual')}
                    className={`btn text-xs py-2.5 px-2 flex flex-col gap-1 items-center justify-center ${layoutMode === 'dual' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <i className="fa-solid fa-columns text-sm"></i>
                    <span className="font-bold">1. النصان بجانب بعضهما</span>
                    <span className="text-[10px] opacity-70">صفحتان متقابلتان</span>
                  </button>
                  <button
                    onClick={() => setLayoutMode('interleaved')}
                    className={`btn text-xs py-2.5 px-2 flex flex-col gap-1 items-center justify-center ${layoutMode === 'interleaved' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <i className="fa-solid fa-bars-staggered text-sm"></i>
                    <span className="font-bold">2. جملة ثم المقابلة</span>
                    <span className="text-[10px] opacity-70">عرض سطر بسطر</span>
                  </button>
                  <button
                    onClick={() => setLayoutMode('focus')}
                    className={`btn text-xs py-2.5 px-2 flex flex-col gap-1 items-center justify-center ${layoutMode === 'focus' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <i className="fa-solid fa-eye text-sm"></i>
                    <span className="font-bold">3. أحد النصين لوحده</span>
                    <span className="text-[10px] opacity-70">نص منفرد</span>
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
