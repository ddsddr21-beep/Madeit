import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  Check, 
  X, 
  Sliders, 
  Eye, 
  Info, 
  Languages, 
  ChevronRight, 
  ArrowLeftRight, 
  Columns, 
  Rows, 
  BookOpenCheck,
  ChevronLeft,
  ChevronDown,
  HelpCircle,
  Undo
} from 'lucide-react';
import { 
  saveBook, 
  getBook, 
  getAllBooks, 
  deleteBook, 
  Book, 
  AlignedUnit 
} from './db/indexedDB';

// BUNDLED PRE-ALIGNED SAMPLE BOOKS
const SAMPLE_BOOKS: Omit<Book, 'createdAt' | 'lastReadAt'>[] = [
  {
    id: 'sample-1',
    title: 'طوق الحمامة في الألفة والألاف (مقتطفات)',
    author: 'ابن حزم الأندلسي',
    arabicText: 'الحُبُّ - أَعَزَّكَ اللَّهُ - أَوَّلُهُ هَزْلٌ وَآخِرُهُ جِدٌّ. &دَقَّتْ مَعَانِيهِ لِجَلَالَتِهَا عَنْ أَنْ تُوصَفَ، فَلَا تُدْرَكُ حَقِيقَتُهَا إِلَّا بِالمُعَايَنَةِ. &وَلَيْسَ هُوَ بِمُنْكَرٍ فِي الدِّينِ، وَلَا بِمَحْظُورٍ فِي الشَّرِيعَةِ، إِذِ القُلُوبُ بِيَدِ اللهِ عَزَّ وَجَلَّ.',
    englishText: 'Love - may God exalt you - begins in jest, but its end is full of seriousness. &Its meanings are too subtle, due to their majesty, to be described, and their reality cannot be grasped except by direct experience. &And it is not condemned in religion, nor is it forbidden in the sacred law, since hearts are in the hand of God, the Almighty.',
    alignedRows: [
      {
        id: 'sample-1-row-0',
        arabic: 'الحُبُّ - أَعَزَّكَ اللَّهُ - أَوَّلُهُ هَزْلٌ وَآخِرُهُ جِدٌّ.',
        english: 'Love - may God exalt you - begins in jest, but its end is full of seriousness.'
      },
      {
        id: 'sample-1-row-1',
        arabic: 'دَقَّتْ مَعَانِيهِ لِجَلَالَتِهَا عَنْ أَنْ تُوصَفَ، فَلَا تُدْرَكُ حَقِيقَتُهَا إِلَّا بِالمُعَايَنَةِ.',
        english: 'Its meanings are too subtle, due to their majesty, to be described, and their reality cannot be grasped except by direct experience.'
      },
      {
        id: 'sample-1-row-2',
        arabic: 'وَلَيْسَ هُوَ بِمُنْكَرٍ فِي الدِّينِ، وَلَا بِمَحْظُورٍ فِي الشَّرِيعَةِ، إِذِ القُلُوبُ بِيَدِ اللهِ عَزَّ وَجَلَّ.',
        english: 'And it is not condemned in religion, nor is it forbidden in the sacred law, since hearts are in the hand of God, the Almighty.'
      }
    ]
  },
  {
    id: 'sample-2',
    title: 'حي بن يقظان (مقتطفات في الحكمة)',
    author: 'ابن طفيل الأندلسي',
    arabicText: 'لَقَدْ كَانَ سَلَفُنَا الصَّالِحُ يَطْلُبُونَ العِلْمَ لِيَعْمَلُوا بِهِ، وَلَا يَبْتَغُونَ بِهِ عَرَضًا مِنَ الدُّنْيَا. &وَكَانَ حَيُّ بْنُ يَقْظَانَ نَشَأَ فِي جَزِيرَةٍ نَائِيَةٍ مِنَ الجَزَائِرِ العَرَبِيَّةِ دُونَ أَبٍ وَلَا أُمٍّ. &فَنَظَرَ فِي مَظَاهِرِ الطَّبِيعَةِ وَالكَوْنِ بِعَقْلِهِ البَصِيرِ، فَعَرَفَ الخَالِقَ بِيَقِينٍ تَامٍّ دُونَ مُعَلِّمٍ بَشَرِيٍّ.',
    englishText: 'Our righteous predecessors used to seek knowledge to practice it, and did not desire any worldly gain through it. &And Hayy ibn Yaqdhan grew up in a remote island among the Arabian islands, without a father or a mother. &So he contemplated the manifestations of nature and the universe with his insightful mind, thus knowing the Creator with absolute certainty without a human teacher.',
    alignedRows: [
      {
        id: 'sample-2-row-0',
        arabic: 'لَقَدْ كَانَ سَلَفُنَا الصَّالِحُ يَطْلُبُونَ العِلْمَ لِيَعْمَلُوا بِهِ، وَلَا يَبْتَغُونَ بِهِ عَرَضًا مِنَ الدُّنْيَا.',
        english: 'Our righteous predecessors used to seek knowledge to practice it, and did not desire any worldly gain through it.'
      },
      {
        id: 'sample-2-row-1',
        arabic: 'وَكَانَ حَيُّ بْنُ يَقْظَانَ نَشَأَ فِي جَزِيرَةٍ نَائِيَةٍ مِنَ الجَزَائِرِ العَرَبِيَّةِ دُونَ أَبٍ وَلَا أُمٍّ.',
        english: 'And Hayy ibn Yaqdhan grew up in a remote island among the Arabian islands, without a father or a mother.'
      },
      {
        id: 'sample-2-row-2',
        arabic: 'فَنَظَرَ فِي مَظَاهِرِ الطَّبِيعَةِ وَالكَوْنِ بِعَقْلِهِ البَصِيرِ، فَعَرَفَ الخَالِقَ بِيَقِينٍ تَامٍّ دُونَ مُعَلِّمٍ بَشَرِيٍّ.',
        english: 'So he contemplated the manifestations of nature and the universe with his insightful mind, thus knowing the Creator with absolute certainty without a human teacher.'
      }
    ]
  },
  {
    id: 'sample-3',
    title: 'مقدمة ابن خلدون (العمران البشري والعدل)',
    author: 'ابن خلدون',
    arabicText: 'إِنَّ التَّارِيخَ فِي ظَاهِرِهِ لَا يَزِيدُ عَنْ أَخْبَارِ الأَيَّامِ وَالدُّوَلِ، وَفِي بَاطِنِهِ نَظَرٌ وَتَحْقِيقٌ. &وَالعُمْرَانُ البَشَرِيُّ يَحْتَاجُ إِلَى التَّعَاوُنِ بَيْنَ النَّاسِ لِتَحْقِيقِ الغِذَاءِ وَالدفءِ وَالسَّلَامِ. &وَالعَدْلُ هُوَ أَسَاسُ المُلْكِ، وَبِهِ تَسْتَقِيمُ أَحْوَالُ الرَّعِيَّةِ وَتَزْدَهِرُ الصِّنَاعَةُ وَالتِّجَارَةُ.',
    englishText: 'Indeed, history on its surface is no more than stories of days and states, but in its depth, it is observation and verification. &And human civilization requires cooperation among people to achieve sustenance, warmth, and peace. &And justice is the foundation of governance, and by it the affairs of the subjects are straightened and industry and commerce flourish.',
    alignedRows: [
      {
        id: 'sample-3-row-0',
        arabic: 'إِنَّ التَّارِيخَ فِي ظَاهِرِهِ لَا يَزِيدُ عَنْ أَخْبَارِ الأَيَّامِ وَالدُّوَلِ، وَفِي بَاطِنِهِ نَظَرٌ وَتَحْقِيقٌ.',
        english: 'Indeed, history on its surface is no more than stories of days and states, but in its depth, it is observation and verification.'
      },
      {
        id: 'sample-3-row-1',
        arabic: 'وَالعُمْرَانُ البَشَرِيُّ يَحْتَاجُ إِلَى التَّعَاوُنِ بَيْنَ النَّاسِ لِتَحْقِيقِ الغِذَاءِ وَالدفءِ وَالسَّلَامِ.',
        english: 'And human civilization requires cooperation among people to achieve sustenance, warmth, and peace.'
      },
      {
        id: 'sample-3-row-2',
        arabic: 'وَالعَدْلُ هُوَ أَسَاسُ المُلْكِ، وَبِهِ تَسْتَقِيمُ أَحْوَالُ الرَّعِيَّةِ وَتَزْدَهِرُ الصِّنَاعَةُ وَالتِّجَارَةُ.',
        english: 'And justice is the foundation of governance, and by it the affairs of the subjects are straightened and industry and commerce flourish.'
      }
    ]
  }
];

export default function App() {
  // Navigation / Tab States
  const [currentTab, setCurrentTab] = useState<'library' | 'reader' | 'dictionary'>('library');
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // App views within Reader
  const [readerMode, setReaderMode] = useState<'sideBySide' | 'arabicAbove' | 'arabicOnly' | 'englishOnly'>('arabicAbove');
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const [isEditingAlignments, setIsEditingAlignments] = useState<boolean>(false);

  // New Book Input Fields
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newArabicText, setNewArabicText] = useState('');
  const [newEnglishText, setNewEnglishText] = useState('');
  const [isAddingBook, setIsAddingBook] = useState(false);

  // Active book row alignment working state (for local updates before saving)
  const [editRows, setEditRows] = useState<AlignedUnit[]>([]);
  const [activeRowActionMenu, setActiveRowActionMenu] = useState<number | null>(null);

  // Local Dictionary States
  const [manifest, setManifest] = useState<any>(null);
  const [dictionaryCache, setDictionaryCache] = useState<{ [letter: string]: Record<string, string[]> }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [directLexicalResult, setDirectLexicalResult] = useState<{ word: string; meanings: string[]; dir?: 'ar-en' | 'en-ar' } | null>(null);
  const [isSearchingDirect, setIsSearchingDirect] = useState(false);

  // Clicked Word Popover / Dialog
  const [clickedWord, setClickedWord] = useState<string | null>(null);
  const [clickedWordLang, setClickedWordLang] = useState<'ar' | 'en'>('ar');
  const [clickedWordLexicalMeanings, setClickedWordLexicalMeanings] = useState<string[] | null>(null);
  const [clickedWordRowIndex, setClickedWordRowIndex] = useState<number | null>(null);
  const [clickedWordRow, setClickedWordRow] = useState<AlignedUnit | null>(null);
  const [isDictionaryLoading, setIsDictionaryLoading] = useState(false);

  // AI Context Helper State
  const [isAiAvailable, setIsAiAvailable] = useState<boolean>(false);
  const [aiContextResult, setAiContextResult] = useState<{ contextualMeaning: string; explanation: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Layout / Scroll Syncing Refs
  const arabicScrollRef = useRef<HTMLDivElement>(null);
  const englishScrollRef = useRef<HTMLDivElement>(null);
  const activeScrollSource = useRef<'arabic' | 'english' | null>(null);

  // Load books & dictionary manifest on mount
  useEffect(() => {
    refreshBooks();
    loadDictionaryManifest();
    checkAiStatus();
  }, []);

  const refreshBooks = async () => {
    try {
      const all = await getAllBooks();
      setBooks(all);
    } catch (e) {
      console.error('Error loading books:', e);
    }
  };

  const loadDictionaryManifest = async () => {
    try {
      const res = await fetch('/dictionary/manifest.json');
      if (res.ok) {
        const data = await res.json();
        setManifest(data);
      }
    } catch (e) {
      console.error('Failed to load dictionary manifest', e);
    }
  };

  const checkAiStatus = async () => {
    try {
      const res = await fetch('/api/ai-status');
      if (res.ok) {
        const data = await res.json();
        setIsAiAvailable(data.available);
      }
    } catch (e) {
      console.error('Failed to check AI status', e);
    }
  };

  // Helper to pre-load sample books if the list is empty
  const loadSamples = async () => {
    for (const sample of SAMPLE_BOOKS) {
      const book: Book = {
        ...sample,
        createdAt: Date.now(),
        lastReadAt: Date.now()
      };
      await saveBook(book);
    }
    await refreshBooks();
  };

  // Scrolling Synchronization Mechanism
  const handleArabicScroll = () => {
    if (!syncScroll || activeScrollSource.current !== 'arabic') return;
    if (arabicScrollRef.current && englishScrollRef.current) {
      englishScrollRef.current.scrollTop = arabicScrollRef.current.scrollTop;
    }
  };

  const handleEnglishScroll = () => {
    if (!syncScroll || activeScrollSource.current !== 'english') return;
    if (arabicScrollRef.current && englishScrollRef.current) {
      arabicScrollRef.current.scrollTop = englishScrollRef.current.scrollTop;
    }
  };

  // Surface Form vs Normalization Helpers
  const getSurfaceForm = (word: string): string => {
    return word
      .replace(/^[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+/gu, '')
      .replace(/[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+$/gu, '')
      .trim();
  };

  const cleanEnglishWord = (word: string): string => {
    return word
      .replace(/^[\s\p{P}«»“”"''`()\[\]{}،.:؛!؟\-_—–]+/gu, '')
      .replace(/[\s\p{P}«»“”"''`()\[\]{}،.:؛!؟\-_—–]+$/gu, '')
      .trim();
  };

  const normalizeEnglishWordForLookup = (word: string): string => {
    return cleanEnglishWord(word).toLowerCase();
  };

  const stripDiacritics = (word: string): string => {
    return word.replace(/[\u064B-\u0652\u0640]/g, '');
  };

  const cleanArabicWord = (word: string): string => {
    const surface = getSurfaceForm(word);
    return stripDiacritics(surface).toLowerCase();
  };

  const normalizeArabicWordForLookup = (word: string): string => {
    let normalized = cleanArabicWord(word);
    normalized = normalized.replace(/[أإآٱ]/g, 'ا');
    normalized = normalized.replace(/ى/g, 'ي');
    normalized = normalized.replace(/ة/g, 'ه');
    normalized = normalized.replace(/ھ/g, 'ه');
    return normalized;
  };

  const getNormalizedFirstLetter = (word: string): string => {
    const normalized = normalizeArabicWordForLookup(word);
    if (!normalized) return 'ا';
    const firstChar = normalized.charAt(0);
    // standard Arabic alphabet mapping
    const arabicAlphabet = [
      'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
    ];
    if (arabicAlphabet.includes(firstChar)) {
      return firstChar;
    }
    return 'ا';
  };

  // Lexical Cache Refs for instant lookup
  const lexicalCacheRef = useRef<Map<string, string[]>>(new Map());
  const enLexicalCacheRef = useRef<Map<string, string[]>>(new Map());

  // Fetch 2-3 concise English lexical meanings from DrAbdulmalek dataset (Arabic -> English)
  const fetchLexicalMeanings = async (surfaceWord: string): Promise<string[]> => {
    if (!surfaceWord) return [];
    const clean = cleanArabicWord(surfaceWord);
    const norm = normalizeArabicWordForLookup(clean);
    if (!norm) return [];

    if (lexicalCacheRef.current.has(norm)) {
      return lexicalCacheRef.current.get(norm)!;
    }

    try {
      const res = await fetch(`/api/lexicon/ar-en?word=${encodeURIComponent(surfaceWord)}`);
      if (res.ok) {
        const data = await res.json();
        const meanings: string[] = data.meanings || [];
        lexicalCacheRef.current.set(norm, meanings);
        return meanings;
      }
    } catch (e) {
      console.error('Failed to fetch from /api/lexicon/ar-en:', e);
    }

    // Client-side fallback to /dictionary/ar_en_lexicon.json
    try {
      const res = await fetch('/dictionary/ar_en_lexicon.json');
      if (res.ok) {
        const fullLexicon = await res.json();
        const meanings = fullLexicon[surfaceWord] || fullLexicon[clean] || fullLexicon[norm] || [];
        const top3 = meanings.slice(0, 3);
        lexicalCacheRef.current.set(norm, top3);
        return top3;
      }
    } catch (e) {
      console.error('Fallback lexical lookup failed:', e);
    }

    lexicalCacheRef.current.set(norm, []);
    return [];
  };

  // Fetch 1-3 concise Arabic lexical meanings from DrAbdulmalek dataset (English -> Arabic)
  const fetchEnglishLexicalMeanings = async (surfaceWord: string): Promise<string[]> => {
    if (!surfaceWord) return [];
    const clean = cleanEnglishWord(surfaceWord);
    const norm = normalizeEnglishWordForLookup(clean);
    if (!norm) return [];

    if (enLexicalCacheRef.current.has(norm)) {
      return enLexicalCacheRef.current.get(norm)!;
    }

    try {
      const res = await fetch(`/api/lexicon/en-ar?word=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        const meanings: string[] = data.meanings || [];
        enLexicalCacheRef.current.set(norm, meanings);
        return meanings;
      }
    } catch (e) {
      console.error('Failed to fetch from /api/lexicon/en-ar:', e);
    }

    // Client-side fallback to /dictionary/en_ar_lexicon.json
    try {
      const res = await fetch('/dictionary/en_ar_lexicon.json');
      if (res.ok) {
        const fullEnLexicon = await res.json();
        const meanings = fullEnLexicon[norm] || fullEnLexicon[clean.toLowerCase()] || [];
        const top3 = meanings.slice(0, 3);
        enLexicalCacheRef.current.set(norm, top3);
        return top3;
      }
    } catch (e) {
      console.error('Fallback English lexical lookup failed:', e);
    }

    enLexicalCacheRef.current.set(norm, []);
    return [];
  };

  // Click handler for Arabic words in Reader view
  const handleWordClick = async (word: string, rowIndex: number, row: AlignedUnit) => {
    const surfaceWord = getSurfaceForm(word);
    if (!surfaceWord) return;

    setClickedWord(surfaceWord);
    setClickedWordLang('ar');
    setClickedWordRowIndex(rowIndex);
    setClickedWordRow(row);
    setClickedWordLexicalMeanings(null);
    setAiContextResult(null);
    setAiError(null);
    setIsDictionaryLoading(true);

    // Instant local lexical dictionary lookup from DrAbdulmalek dataset (Arabic -> English)
    const lexicalMeanings = await fetchLexicalMeanings(surfaceWord);
    setClickedWordLexicalMeanings(lexicalMeanings);

    setIsDictionaryLoading(false);
  };

  // Click handler for English words in Reader view
  const handleEnglishWordClick = async (word: string, rowIndex: number, row: AlignedUnit) => {
    const surfaceWord = cleanEnglishWord(word);
    if (!surfaceWord) return;

    setClickedWord(surfaceWord);
    setClickedWordLang('en');
    setClickedWordRowIndex(rowIndex);
    setClickedWordRow(row);
    setClickedWordLexicalMeanings(null);
    setAiContextResult(null);
    setAiError(null);
    setIsDictionaryLoading(true);

    // Instant local lexical dictionary lookup from DrAbdulmalek dataset (English -> Arabic)
    const lexicalMeanings = await fetchEnglishLexicalMeanings(surfaceWord);
    setClickedWordLexicalMeanings(lexicalMeanings);

    setIsDictionaryLoading(false);
  };

  // AI Context Interpretation Call (Arabic words only)
  const handleAiInterpret = async () => {
    if (!selectedBook || !clickedWord || clickedWordRowIndex === null || !clickedWordRow || clickedWordLang !== 'ar') return;
    
    setIsAiLoading(true);
    setAiError(null);
    setAiContextResult(null);

    // Get up to 3 sentences before and after
    const rows = selectedBook.alignedRows;
    const prevRows = rows.slice(Math.max(0, clickedWordRowIndex - 3), clickedWordRowIndex).map(r => r.arabic);
    const nextRows = rows.slice(clickedWordRowIndex + 1, Math.min(rows.length, clickedWordRowIndex + 4)).map(r => r.arabic);

    try {
      const res = await fetch('/api/translate-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: clickedWord,
          sentence: clickedWordRow.arabic,
          prevSentences: prevRows,
          nextSentences: nextRows,
          parallelEnglish: clickedWordRow.english || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiContextResult(data);
      } else {
        const err = await res.json();
        setAiError(err.error || 'فشل الاتصال بخدمة الذكاء الاصطناعي.');
      }
    } catch (e: any) {
      setAiError('فشل الاتصال بالخادم الرئيسي.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Helper to split sentence into individual interactive words (Arabic)
  const renderInteractiveArabicText = (sentence: string, rowIndex: number, row: AlignedUnit) => {
    if (!sentence) return <span className="text-stone-400 italic font-amiri text-lg">مساحة فارغة (محاذاة يدوية)</span>;
    
    const tokens = sentence.split(/(\s+)/);
    
    return (
      <p className="font-amiri text-[25px] leading-[2.1] text-right text-stone-900 font-normal tracking-wide">
        {tokens.map((token, i) => {
          const isSpace = /\s+/.test(token);
          if (isSpace) {
            return token;
          }
          
          const cleaned = cleanArabicWord(token);
          if (!cleaned) {
            return <span key={i} className="text-stone-500">{token}</span>;
          }

          const isCurrentlyClicked = clickedWord === getSurfaceForm(token) && clickedWordRowIndex === rowIndex && clickedWordLang === 'ar';

          return (
            <span
              key={i}
              onClick={() => handleWordClick(token, rowIndex, row)}
              className={`cursor-pointer transition-all duration-150 rounded px-1 ${
                isCurrentlyClicked 
                  ? 'bg-amber-800 text-[#FAF8F5] font-semibold scale-102 shadow-xs' 
                  : 'hover:bg-[#EBE7DD]/70 hover:text-amber-950 focus:bg-[#EBE7DD]/70 focus:text-amber-950'
              }`}
            >
              {token}
            </span>
          );
        })}
      </p>
    );
  };

  // Helper to split English sentence into individual interactive words (English)
  const renderInteractiveEnglishText = (sentence: string, rowIndex: number, row: AlignedUnit) => {
    if (!sentence) return <p className="text-stone-400 italic text-[14px]">Spacer (Empty align unit)</p>;
    
    const tokens = sentence.split(/(\s+)/);
    
    return (
      <p className="font-sans text-[15.5px] leading-[1.8] text-left text-stone-600 font-normal">
        {tokens.map((token, i) => {
          const isSpace = /\s+/.test(token);
          if (isSpace) {
            return token;
          }
          
          const clean = cleanEnglishWord(token);
          if (!clean) {
            return <span key={i} className="text-stone-400">{token}</span>;
          }

          const isCurrentlyClicked = clickedWord?.toLowerCase() === clean.toLowerCase() && clickedWordRowIndex === rowIndex && clickedWordLang === 'en';

          return (
            <span
              key={i}
              onClick={() => handleEnglishWordClick(token, rowIndex, row)}
              className={`cursor-pointer transition-all duration-150 rounded px-1 inline-block ${
                isCurrentlyClicked 
                  ? 'bg-amber-800 text-[#FAF8F5] font-semibold scale-102 shadow-xs' 
                  : 'hover:bg-[#EBE7DD]/70 hover:text-amber-950 focus:bg-[#EBE7DD]/70 focus:text-amber-950'
              }`}
            >
              {token}
            </span>
          );
        })}
      </p>
    );
  };

  // Import New Book
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Split texts by &
    const arUnits = newArabicText.split('&')
      .map(u => u.trim())
      .filter(u => u.length > 0);
      
    const enUnits = newEnglishText.split('&')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    const alignedRows: AlignedUnit[] = [];
    const maxLen = Math.max(arUnits.length, enUnits.length);

    for (let i = 0; i < maxLen; i++) {
      alignedRows.push({
        id: `row-${Date.now()}-${i}`,
        arabic: arUnits[i] || '',
        english: enUnits[i] || ''
      });
    }

    const newBook: Book = {
      id: `book-${Date.now()}`,
      title: newTitle.trim(),
      author: newAuthor.trim() || undefined,
      arabicText: newArabicText,
      englishText: newEnglishText,
      alignedRows,
      createdAt: Date.now(),
      lastReadAt: Date.now()
    };

    await saveBook(newBook);
    setNewTitle('');
    setNewAuthor('');
    setNewArabicText('');
    setNewEnglishText('');
    setIsAddingBook(false);
    await refreshBooks();
    
    // Select the new book
    setSelectedBook(newBook);
    setEditRows(newBook.alignedRows);
    setCurrentTab('reader');
  };

  const handleSelectBook = (book: Book) => {
    // Update lastReadAt
    const updatedBook = {
      ...book,
      lastReadAt: Date.now()
    };
    saveBook(updatedBook);
    setSelectedBook(updatedBook);
    setEditRows(updatedBook.alignedRows);
    setClickedWord(null);
    setClickedWordLexicalMeanings(null);
    setAiContextResult(null);
    setCurrentTab('reader');
    refreshBooks();
  };

  const handleDeleteBook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الكتاب نهائياً؟')) {
      await deleteBook(id);
      if (selectedBook?.id === id) {
        setSelectedBook(null);
      }
      refreshBooks();
    }
  };

  // Manual Alignment editing handlers
  const handleSaveAlignments = async () => {
    if (!selectedBook) return;
    const updated: Book = {
      ...selectedBook,
      alignedRows: editRows,
      lastReadAt: Date.now()
    };
    await saveBook(updated);
    setSelectedBook(updated);
    setIsEditingAlignments(false);
    refreshBooks();
  };

  const insertArabicSpacer = (index: number) => {
    const arabicList = editRows.map(r => r.arabic);
    const englishList = editRows.map(r => r.english);
    
    arabicList.splice(index, 0, ''); // insert spacer
    
    const newRows: AlignedUnit[] = [];
    const maxLen = Math.max(arabicList.length, englishList.length);
    for (let i = 0; i < maxLen; i++) {
      newRows.push({
        id: `edit-row-${Date.now()}-${i}`,
        arabic: arabicList[i] || '',
        english: englishList[i] || ''
      });
    }
    setEditRows(newRows);
  };

  const insertEnglishSpacer = (index: number) => {
    const arabicList = editRows.map(r => r.arabic);
    const englishList = editRows.map(r => r.english);
    
    englishList.splice(index, 0, ''); // insert spacer
    
    const newRows: AlignedUnit[] = [];
    const maxLen = Math.max(arabicList.length, englishList.length);
    for (let i = 0; i < maxLen; i++) {
      newRows.push({
        id: `edit-row-${Date.now()}-${i}`,
        arabic: arabicList[i] || '',
        english: englishList[i] || ''
      });
    }
    setEditRows(newRows);
  };

  const removeArabicSpacer = (index: number) => {
    const arabicList = editRows.map(r => r.arabic);
    const englishList = editRows.map(r => r.english);
    
    arabicList.splice(index, 1); // remove spacer/element
    
    const newRows: AlignedUnit[] = [];
    const maxLen = Math.max(arabicList.length, englishList.length);
    for (let i = 0; i < maxLen; i++) {
      newRows.push({
        id: `edit-row-${Date.now()}-${i}`,
        arabic: arabicList[i] || '',
        english: englishList[i] || ''
      });
    }
    setEditRows(newRows);
  };

  const removeEnglishSpacer = (index: number) => {
    const arabicList = editRows.map(r => r.arabic);
    const englishList = editRows.map(r => r.english);
    
    englishList.splice(index, 1); // remove spacer/element
    
    const newRows: AlignedUnit[] = [];
    const maxLen = Math.max(arabicList.length, englishList.length);
    for (let i = 0; i < maxLen; i++) {
      newRows.push({
        id: `edit-row-${Date.now()}-${i}`,
        arabic: arabicList[i] || '',
        english: englishList[i] || ''
      });
    }
    setEditRows(newRows);
  };

  const updateRowText = (index: number, type: 'arabic' | 'english', text: string) => {
    const updated = [...editRows];
    updated[index] = {
      ...updated[index],
      [type]: text
    };
    setEditRows(updated);
  };

  const addEmptyRow = () => {
    setEditRows(prev => [
      ...prev,
      {
        id: `new-row-${Date.now()}`,
        arabic: '',
        english: ''
      }
    ]);
  };

  const deleteRowCompletely = (index: number) => {
    const updated = [...editRows];
    updated.splice(index, 1);
    setEditRows(updated);
  };

  // Direct Dictionary Lookup Search Tab
  const handleDirectSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearchingDirect(true);
    setDirectLexicalResult(null);

    const isEnglish = /^[a-zA-Z]/.test(searchTerm.trim());

    if (isEnglish) {
      const surfaceWord = cleanEnglishWord(searchTerm);
      const meanings = await fetchEnglishLexicalMeanings(surfaceWord);
      setDirectLexicalResult({
        word: surfaceWord,
        meanings: meanings || [],
        dir: 'en-ar'
      });
    } else {
      const surfaceWord = getSurfaceForm(searchTerm);
      const meanings = await fetchLexicalMeanings(surfaceWord);
      setDirectLexicalResult({
        word: surfaceWord,
        meanings: meanings || [],
        dir: 'ar-en'
      });
    }

    setIsSearchingDirect(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans select-none bg-[#FAF8F5] overflow-x-hidden pb-16 md:pb-0">
      
      {/* 1. Header (Top Navigation Bar - 3-Zone Contract) */}
      <header className="border-b border-[#DCD7CA]/40 bg-[#FAF8F5] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          
          {/* Zone 1: Brand Title (One Single text wordmark) */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-850 shrink-0" />
            <h1 className="text-base sm:text-lg md:text-xl font-bold font-amiri tracking-wide text-stone-900 select-none truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
              مِحراب القراءة الموازية
            </h1>
          </div>

          {/* Zone 2: Navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium h-full pt-1">
            <button 
              onClick={() => { setCurrentTab('library'); setClickedWord(null); }}
              className={`hover:text-amber-800 transition-all select-none pb-2 -mb-px cursor-pointer ${currentTab === 'library' ? 'text-amber-900 border-b-2 border-amber-800 font-semibold' : 'text-stone-500'}`}
            >
              المكتبة اللغوية
            </button>
            {selectedBook && (
              <button 
                onClick={() => setCurrentTab('reader')}
                className={`hover:text-amber-800 transition-all select-none pb-2 -mb-px cursor-pointer ${currentTab === 'reader' ? 'text-amber-900 border-b-2 border-amber-800 font-semibold' : 'text-stone-500'}`}
              >
                قارئ النصوص
              </button>
            )}
            <button 
              onClick={() => { setCurrentTab('dictionary'); setClickedWord(null); }}
              className={`hover:text-amber-800 transition-all select-none pb-2 -mb-px cursor-pointer ${currentTab === 'dictionary' ? 'text-amber-900 border-b-2 border-amber-800 font-semibold' : 'text-stone-500'}`}
            >
              المعجم المحلي
            </button>
          </nav>

          {/* Zone 3: Primary action button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsAddingBook(true); setClickedWord(null); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-lg bg-amber-800 hover:bg-amber-900 text-white transition-all whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">إضافة نص جديد</span>
              <span className="sm:hidden text-[11px]">أضف نصاً</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Viewports */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 overflow-x-hidden">

        {/* --- ADD BOOK OVERLAY PANEL / DIALOG --- */}
        {isAddingBook && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-[#FAF8F5] border border-stone-200 shadow-xl rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              
              <div className="p-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-800" />
                  <h3 className="text-lg font-bold text-stone-900">إضافة كتاب أو نص متوازٍ جديد</h3>
                </div>
                <button 
                  onClick={() => setIsAddingBook(false)}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBook} className="p-6 overflow-y-auto space-y-4 text-right">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-stone-700">عنوان الكتاب / النص</label>
                    <input 
                      type="text" 
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="مثال: طوق الحمامة - الباب الأول"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-hidden focus:border-amber-800"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-stone-700">المؤلف (اختياري)</label>
                    <input 
                      type="text" 
                      value={newAuthor}
                      onChange={e => setNewAuthor(e.target.value)}
                      placeholder="مثال: ابن حزم الأندلسي"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-hidden focus:border-amber-800"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-150 text-right flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed space-y-1">
                    <p className="font-bold text-sm">تنبيه لضمان صحة مطابقة الجملة موازاةً لجملتها:</p>
                    <p>قم بتقسيم النصين لوحدات أو جمل بوضع الفاصل <strong className="text-amber-950 font-mono text-sm">"&"</strong> قبل كل جملة عربية وجملتها الإنجليزية المقابلة.</p>
                    <p>على سبيل المثال: &الحب جميل. &الماء سر الحياة.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-stone-700">النص العربي (Arabic Text)</label>
                    <textarea 
                      value={newArabicText}
                      onChange={e => setNewArabicText(e.target.value)}
                      placeholder="مثال: &الحُبُّ أَوَّلُهُ هَزْلٌ وَآخِرُهُ جِدٌّ. &دَقَّتْ مَعَانِيهِ لِجَلَالَتِهَا."
                      rows={8}
                      dir="rtl"
                      className="w-full p-3 border border-stone-300 rounded-lg text-base font-amiri bg-white focus:outline-hidden focus:border-amber-800"
                      required
                    ></textarea>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-stone-700 text-left">النص الإنجليزي (English Text)</label>
                    <textarea 
                      value={newEnglishText}
                      onChange={e => setNewEnglishText(e.target.value)}
                      placeholder="Example: &Love begins in jest, but its end is full of seriousness. &Its meanings are too subtle due to majesty."
                      rows={8}
                      dir="ltr"
                      className="w-full p-3 border border-stone-300 rounded-lg text-sm font-sans bg-white focus:outline-hidden focus:border-amber-800"
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200/80 flex items-center justify-start gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-semibold text-sm shadow-sm cursor-pointer"
                  >
                    حفظ وإدراج بالمكتبة
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingBook(false)}
                    className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* --- VIEW: 1. LIBRARY (books catalog) --- */}
        {currentTab === 'library' && (
          <div className="space-y-6">
            
            {/* Library Hero Header */}
            <div className="p-8 rounded-xl bg-radial from-amber-900 to-stone-900 text-stone-50 border border-stone-800 text-right space-y-3 shadow-lg">
              <h2 className="text-3xl font-bold font-amiri tracking-wide text-amber-200">مرحباً بك في محراب القراءة الموازية</h2>
              <p className="text-stone-300 text-base max-w-3xl leading-relaxed">
                منصة قراءة علمية تفاعلية تمكنك من مقارنة وتحليل النصوص الفلسفية والأدبية الكلاسيكية باللغتين العربية والإنجليزية جنباً إلى جنب، مع معجم محلي متكامل يستكشف الكلمات عند النقر المباشر عليها.
              </p>
              
              {books.length === 0 && (
                <div className="pt-4 flex items-center gap-3">
                  <button
                    onClick={loadSamples}
                    className="px-5 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>تنزيل المقتطفات الكلاسيكية النموذجية (1-click)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Books Catalogue List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-stone-800">الكتب والنصوص المخزنة محلياً ({books.length})</h3>
                {books.length > 0 && (
                  <button
                    onClick={() => setIsAddingBook(true)}
                    className="text-sm text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة كتاب جديد</span>
                  </button>
                )}
              </div>

              {books.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center text-center bg-[#FAF8F5]">
                  <FileText className="w-12 h-12 text-stone-400 mb-3" />
                  <p className="text-stone-600 font-semibold text-lg mb-1">المكتبة خالية من الكتب المضافة</p>
                  <p className="text-stone-500 text-sm max-w-md leading-relaxed mb-6">
                    ابدأ الآن وأضف كتابك أو مذكراتك الخاصة، أو قم بتحميل المقتطفات النموذجية التي أعددناها لك لتجربة القراءة التفاعلية على الفور.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setIsAddingBook(true)}
                      className="px-6 py-2.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-semibold text-sm flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة نص جديد الآن</span>
                    </button>
                    <button
                      onClick={loadSamples}
                      className="px-5 py-2.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      <span>تنزيل المقتطفات الكلاسيكية</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {books.map(book => {
                    const totalUnits = book.alignedRows.length;
                    return (
                      <div 
                        key={book.id}
                        onClick={() => handleSelectBook(book)}
                        className="p-5.5 rounded-xl border border-[#DCD7CA]/45 bg-[#FCFAF8] hover:border-amber-800 hover:bg-[#F3EFE6]/35 transition-all duration-150 cursor-pointer text-right flex flex-col justify-between h-48 group"
                      >
                        <div className="space-y-2">
                          <h4 className="text-lg font-bold font-amiri text-stone-900 group-hover:text-amber-900 line-clamp-1">
                            {book.title}
                          </h4>
                          {book.author && (
                            <p className="text-stone-500 text-sm font-medium">المؤلف: {book.author}</p>
                          )}
                          
                          {/* UNBOXED Static Metadata (no pills) with clean separators */}
                          <div className="flex items-center gap-2 text-xs text-stone-400 font-mono mt-1">
                            <span>جمل متوازية: {totalUnits}</span>
                            <span>·</span>
                            <span>أضيف: {new Date(book.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#DCD7CA]/35 flex items-center justify-between">
                          <span className="text-amber-850 group-hover:underline text-xs font-bold flex items-center gap-1">
                            <span>افتح القارئ</span>
                            <ChevronLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" />
                          </span>
                          <button
                            onClick={(e) => handleDeleteBook(book.id, e)}
                            className="p-1.5 rounded-md text-stone-400 hover:text-red-700 hover:bg-red-50/50 transition-colors"
                            title="حذف هذا الكتاب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- VIEW: 2. BILINGUAL TEXT READER & ALIGNMENT EDITOR --- */}
        {currentTab === 'reader' && selectedBook && (
          <div className="flex flex-col gap-6">
            
            {/* Reader Header Block */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#F3EFE6]/50 border border-[#DCD7CA]/40 rounded-xl gap-4">
              <div className="space-y-1 text-right">
                <span className="text-xs font-mono text-stone-400">مستند قيد القراءة</span>
                <h2 className="text-xl font-bold font-amiri text-stone-900">{selectedBook.title}</h2>
                {selectedBook.author && <p className="text-stone-500 text-xs">بقلم: {selectedBook.author}</p>}
              </div>

              {/* Reader Modes & Alignment Switchers */}
              <div className="flex flex-wrap items-center gap-2.5 justify-end w-full md:w-auto">
                
                {/* Segemented Filter Tabs for Display Mode */}
                <div className="flex items-center gap-1 p-1 bg-[#EBE7DD]/60 border border-[#DCD7CA]/30 rounded-lg text-xs font-medium w-full sm:w-auto justify-between sm:justify-start">
                  <button 
                    onClick={() => { setReaderMode('sideBySide'); setIsEditingAlignments(false); }}
                    className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none ${readerMode === 'sideBySide' && !isEditingAlignments ? 'bg-amber-800 text-white shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-[#EBE7DD]/40'}`}
                    title="قراءة جنباً إلى جنب"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline whitespace-nowrap">جنباً إلى جنب</span>
                  </button>
                  <button 
                    onClick={() => { setReaderMode('arabicAbove'); setIsEditingAlignments(false); }}
                    className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none ${readerMode === 'arabicAbove' && !isEditingAlignments ? 'bg-amber-800 text-white shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-[#EBE7DD]/40'}`}
                    title="قراءة العربية فوق الإنجليزية"
                  >
                    <Rows className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline whitespace-nowrap">العربية فوق الإنجليزية</span>
                  </button>
                  <button 
                    onClick={() => { setReaderMode('arabicOnly'); setIsEditingAlignments(false); }}
                    className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none ${readerMode === 'arabicOnly' && !isEditingAlignments ? 'bg-amber-800 text-white shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-[#EBE7DD]/40'}`}
                    title="قراءة العربية فقط"
                  >
                    <span className="font-amiri font-bold text-xs">ع</span>
                    <span className="hidden sm:inline whitespace-nowrap">العربية فقط</span>
                  </button>
                  <button 
                    onClick={() => { setReaderMode('englishOnly'); setIsEditingAlignments(false); }}
                    className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none ${readerMode === 'englishOnly' && !isEditingAlignments ? 'bg-amber-800 text-white shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-[#EBE7DD]/40'}`}
                    title="قراءة الإنجليزية فقط"
                  >
                    <span className="font-bold text-[10px] sm:text-xs">EN</span>
                    <span className="hidden sm:inline whitespace-nowrap">الإنجليزية فقط</span>
                  </button>
                </div>

                {/* Alignment mode Toggle */}
                <button
                  onClick={() => {
                    setIsEditingAlignments(!isEditingAlignments);
                    setEditRows(selectedBook.alignedRows);
                  }}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border transition-all w-full sm:w-auto ${
                    isEditingAlignments 
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' 
                      : 'border-[#DCD7CA]/60 hover:bg-[#EBE7DD]/40 text-stone-700'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>محاذاة يدوية كاملة</span>
                </button>
              </div>
            </div>

            {/* Sync Scrolling controls when side-by-side active */}
            {readerMode === 'sideBySide' && !isEditingAlignments && (
              <div className="flex items-center justify-end px-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-500">
                  <input 
                    type="checkbox" 
                    checked={syncScroll} 
                    onChange={e => setSyncScroll(e.target.checked)}
                    className="rounded-xs accent-amber-850"
                  />
                  <span>تفعيل مزامنة التمرير الرأسي بين العمودين</span>
                </label>
              </div>
            )}

            {/* --- CORE READER INTERFACE VIEWS --- */}
            {!isEditingAlignments ? (
              <div className="relative flex-1">
                
                 {/* Mode A: Side by Side (2-Columns layout) */}
                {readerMode === 'sideBySide' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[68vh] min-h-[500px]">
                    
                    {/* Arabic Column Container */}
                    <div className="flex flex-col h-full bg-[#FCFAF8] border border-[#DCD7CA]/45 rounded-xl overflow-hidden">
                      <div className="p-3.5 bg-[#F3EFE6] border-b border-[#DCD7CA]/40 font-bold font-amiri text-lg text-stone-850">
                        <span>النص العربي الأصيل</span>
                      </div>
                      
                      <div 
                        ref={arabicScrollRef}
                        onScroll={handleArabicScroll}
                        onMouseEnter={() => { activeScrollSource.current = 'arabic'; }}
                        onMouseLeave={() => { activeScrollSource.current = null; }}
                        className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8 dir-rtl"
                      >
                        {selectedBook.alignedRows.map((row, index) => (
                          <div 
                            key={row.id} 
                            className="pb-5 hover:bg-[#F3EFE6]/40 px-3.5 py-3 rounded-xl transition-all duration-150"
                          >
                            {renderInteractiveArabicText(row.arabic, index, row)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* English Column Container */}
                    <div className="flex flex-col h-full bg-[#FCFAF8] border border-[#DCD7CA]/45 rounded-xl overflow-hidden">
                      <div className="p-3.5 bg-[#F3EFE6] border-b border-[#DCD7CA]/40 font-semibold text-sm text-stone-700">
                        <span>الترجمة الإنجليزية</span>
                      </div>
                      
                      <div 
                        ref={englishScrollRef}
                        onScroll={handleEnglishScroll}
                        onMouseEnter={() => { activeScrollSource.current = 'english'; }}
                        onMouseLeave={() => { activeScrollSource.current = null; }}
                        className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8 dir-ltr"
                      >
                        {selectedBook.alignedRows.map((row, index) => (
                          <div 
                            key={row.id} 
                            className="pb-5 hover:bg-[#F3EFE6]/40 px-3.5 py-3 rounded-xl transition-all duration-150 min-h-[46px] flex items-center"
                          >
                            {renderInteractiveEnglishText(row.english, index, row)}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* Mode B: Arabic Above English */}
                {readerMode === 'arabicAbove' && (
                  <div className="bg-[#FCFAF8] border border-[#DCD7CA]/45 rounded-xl p-4 sm:p-8 space-y-6 sm:space-y-8 max-h-[68vh] overflow-y-auto">
                    {selectedBook.alignedRows.map((row, index) => (
                      <div key={row.id} className="p-4 sm:p-6 rounded-xl bg-[#F3EFE6]/30 border border-[#DCD7CA]/30 flex flex-col gap-3 sm:gap-4 hover:bg-[#F3EFE6]/70 transition-all duration-150">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                          <span className="text-xs font-mono text-stone-400 bg-[#EBE7DD]/60 px-2.5 py-1 rounded-md self-start shrink-0">جملة {index + 1}</span>
                          <div className="flex-1 w-full text-right">
                            {renderInteractiveArabicText(row.arabic, index, row)}
                          </div>
                        </div>
                        {row.english && (
                          <div className="pt-3 border-t border-[#DCD7CA]/30 text-left sm:pl-8 dir-ltr">
                            {renderInteractiveEnglishText(row.english, index, row)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Mode C: Arabic Only */}
                {readerMode === 'arabicOnly' && (
                  <div className="bg-[#FCFAF8] border border-[#DCD7CA]/45 rounded-xl p-4 sm:p-8 max-h-[68vh] overflow-y-auto space-y-6 sm:space-y-8 text-right">
                    {selectedBook.alignedRows.map((row, index) => (
                      <div key={row.id} className="pb-6 hover:bg-[#F3EFE6]/30 px-4 py-2 rounded-lg transition-colors duration-150">
                        {renderInteractiveArabicText(row.arabic, index, row)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Mode D: English Only */}
                {readerMode === 'englishOnly' && (
                  <div className="bg-[#FCFAF8] border border-[#DCD7CA]/45 rounded-xl p-4 sm:p-8 max-h-[68vh] overflow-y-auto space-y-6 sm:space-y-8 text-left dir-ltr">
                    {selectedBook.alignedRows.map((row, index) => (
                      <div key={row.id} className="pb-6 hover:bg-[#F3EFE6]/30 px-4 py-2 rounded-lg transition-colors duration-150">
                        {renderInteractiveEnglishText(row.english, index, row)}
                      </div>
                    ))}
                  </div>
                )}

                {/* --- REDESIGNED DICTIONARY EXPERIENCE (Fixed Sidebar on Desktop / Bottom Sheet on Mobile) --- */}
                {clickedWord && (
                  <>
                    {/* Subtle click-outside scrim for mobile only to dismiss easily, on desktop we don't block clicks to allow instant word changes */}
                    <div 
                      className="block md:hidden fixed inset-0 bg-stone-900/15 backdrop-blur-3xs z-45" 
                      onClick={() => { setClickedWord(null); setClickedWordLexicalMeanings(null); setAiContextResult(null); }}
                    />
                    
                    <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl border-t border-[#DCD7CA]/80 bg-[#FAF8F5]/98 backdrop-blur-md shadow-2xl z-50 p-6 overflow-y-auto flex flex-col text-right animate-in slide-in-from-bottom duration-300
                      md:bottom-0 md:left-0 md:right-auto md:top-0 md:h-screen md:max-h-screen md:w-[440px] md:rounded-none md:border-t-0 md:border-r md:border-[#DCD7CA]/75 md:shadow-3xl md:flex md:flex-col md:p-8 md:animate-in md:slide-in-from-left md:duration-300">
                      
                      {/* Pull Bar Handle for Mobile Bottom Sheet */}
                      <div className="md:hidden flex items-center justify-center pb-3 -mt-2 shrink-0">
                        <div className="w-12 h-1.5 rounded-full bg-stone-300/70" />
                      </div>

                      {/* Panel Header */}
                      <div className="flex items-center justify-between border-b border-[#DCD7CA]/40 pb-4.5 mb-5 shrink-0">
                        <span className="text-xs font-mono text-stone-400 font-medium">المعجم المساعد المباشر</span>
                        
                        <button 
                          onClick={() => { setClickedWord(null); setClickedWordLexicalMeanings(null); setAiContextResult(null); }}
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-[#EBE7DD]/55 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                          title="إغلاق اللوحة"
                        >
                          <span className="text-xs font-semibold font-mono hidden md:inline text-stone-500">إغلاق</span>
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Main Scrollable Content */}
                      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pl-1">
                        
                        {/* 1. الكلمة المحددة (Selected Word) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                            <span>{clickedWordLang === 'en' ? 'Selected English Word' : 'الكلمة العربية المختارة'}</span>
                            <span>{clickedWordLang === 'en' ? 'EN' : 'عربي'}</span>
                          </div>
                          
                          <div className="bg-[#F3EFE6]/70 px-5 py-4 rounded-xl border border-[#DCD7CA]/50 shadow-2xs text-center flex flex-col items-center justify-center gap-2">
                            <h4 className={`text-3xl font-bold tracking-tight text-stone-900 ${
                              clickedWordLang === 'en' ? 'font-sans dir-ltr' : 'font-amiri'
                            }`}>
                              {clickedWord}
                            </h4>
                          </div>
                        </div>

                        {/* 2. المعاني المعجمية (Lexical Meanings) */}
                        <div className="space-y-3 pt-2 border-t border-[#DCD7CA]/30">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-950 font-mono flex items-center gap-1.5">
                              <BookOpenCheck className="w-4 h-4 text-amber-800" />
                              {clickedWordLang === 'en' ? 'القاموس المعجمي (إنجليزي ← عربي)' : 'القاموس المعجمي (عربي ← إنجليزي)'}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">DrAbdulmalek Dataset</span>
                          </div>

                          {clickedWordLexicalMeanings && clickedWordLexicalMeanings.length > 0 ? (
                            <div className="bg-[#F3EFE6]/35 p-4 rounded-xl border border-[#DCD7CA]/35 space-y-2.5">
                              <span className="text-[11px] text-stone-500 block font-mono">
                                {clickedWordLang === 'en' ? 'المعاني العربية المتطابقة مختصرة:' : 'أبرز المعاني الإنجليزية المختصرة:'}
                              </span>
                              {clickedWordLang === 'en' ? (
                                <div className="flex flex-col gap-1.5 dir-rtl text-right">
                                  {clickedWordLexicalMeanings.map((meaning, idx) => (
                                    <div 
                                      key={idx} 
                                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-base font-bold bg-white text-stone-900 border border-[#DCD7CA]/30 font-amiri shadow-2xs"
                                    >
                                      <span className="text-xs font-mono text-amber-850 bg-[#EBE7DD]/40 w-5 h-5 rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                                      <span>{meaning}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5 dir-ltr text-left">
                                  {clickedWordLexicalMeanings.map((meaning, idx) => (
                                    <div 
                                      key={idx} 
                                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-white text-stone-900 border border-[#DCD7CA]/30 font-sans shadow-2xs"
                                    >
                                      <span className="text-[10px] font-mono text-amber-850 bg-[#EBE7DD]/40 w-4 h-4 rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                                      <span>{meaning}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : isDictionaryLoading ? (
                            <div className="p-4 text-center text-xs text-stone-400 animate-pulse bg-[#F3EFE6]/10 rounded-xl border border-[#DCD7CA]/20">
                              جاري استرجاع معاني الكلمة من المعجم...
                            </div>
                          ) : (
                            <div className="bg-[#F3EFE6]/15 p-4 rounded-xl border border-[#DCD7CA]/25 text-stone-500 text-xs text-center">
                              لم يُعثر على مدخل مباشر لهذه الكلمة في المعجم المختصر.
                            </div>
                          )}
                        </div>

                        {/* 3. الترجمة السياقية بالذكاء الاصطناعي (AI Contextual Translation) (عربي فقط) */}
                        {clickedWordLang === 'ar' && (
                          <div className="space-y-3 pt-4 border-t border-[#DCD7CA]/30">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-950 font-mono flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-800 animate-pulse" />
                                الترجمة السياقية بالذكاء الاصطناعي
                              </span>
                            </div>

                            {/* Shortened activation button if result not loaded yet */}
                            {!isAiLoading && !aiContextResult && !aiError && isAiAvailable && (
                              <button
                                onClick={handleAiInterpret}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg text-amber-900 bg-[#EBE7DD]/50 hover:bg-[#EBE7DD]/90 border border-[#DCD7CA]/65 transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-4 h-4 text-amber-800" />
                                <span>ترجمة سياقية ذكية ✨</span>
                              </button>
                            )}

                            {isAiLoading && (
                              <div className="p-5 space-y-2.5 animate-pulse text-center text-stone-500 bg-[#F3EFE6]/40 rounded-xl border border-[#DCD7CA]/30">
                                <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-1 text-amber-800" />
                                <span className="text-xs font-medium">جاري تحليل سياق النص الحالي واستنتاج الترجمة...</span>
                              </div>
                            )}

                            {aiContextResult && (
                              <div className="bg-[#F3EFE6]/55 p-4.5 rounded-xl border border-[#DCD7CA]/40 space-y-3 text-right">
                                <span className="text-[11px] text-amber-900 font-bold font-mono block">الترجمة السياقية المستخرجة:</span>
                                <div className="bg-white/80 p-3 rounded-lg border border-[#DCD7CA]/20 text-center shadow-2xs">
                                  <p className="text-xl font-bold text-amber-900 capitalize dir-ltr">
                                    {aiContextResult.contextualMeaning}
                                  </p>
                                </div>
                                
                                {/* 4. الشرح (Explanation) */}
                                {aiContextResult.explanation && (
                                  <div className="space-y-1.5 pt-1">
                                    <span className="text-[11px] text-stone-500 font-bold font-mono block">شرح وتحليل السياق المختار:</span>
                                    <p className="text-xs text-stone-700 bg-white/50 p-3 rounded-lg border border-[#DCD7CA]/25 leading-relaxed">
                                      {aiContextResult.explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {aiError && (
                              <p className="text-xs text-red-600 mt-1 bg-red-50/50 p-2.5 rounded-lg border border-red-200/60">{aiError}</p>
                            )}
                          </div>
                        )}

                      </div>

                    </div>
                  </>
                )}

              </div>
            ) : (
              
              // --- MANUAL ALIGNMENT EDITOR WORKSPACE ---
              <div className="bg-[#FAF8F4] border border-stone-200/80 rounded-xl p-4 sm:p-6 space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4 text-right">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-amber-800 animate-pulse" />
                      <span>محرر المحاذاة والترتيب اليدوي الكامل</span>
                    </h3>
                    <p className="text-stone-500 text-xs">
                      قم بضبط توازي الأسطر وإدراج خلايا فارغة ليتساوى العمودان تماماً.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleSaveAlignments}
                      className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>حفظ التعديلات</span>
                    </button>
                    <button
                      onClick={() => setIsEditingAlignments(false)}
                      className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs cursor-pointer transition-colors"
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-right text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold">آلية الضبط اليدوي:</p>
                  <p>إذا كانت الجملة العربية متقدمة على الإنجليزية بفقرة، قم بالضغط على زر <span className="font-bold">"إجراءات"</span> ثم اختر إدراج مساحات فارغة لدفع النص المقابل لأسفل ومقابلته بدقة.</p>
                </div>

                {/* Editor Alignment Rows */}
                <div className="space-y-4 max-h-[50vh] overflow-y-auto p-1">
                  {editRows.map((row, index) => (
                    <div 
                      key={row.id}
                      className="p-4 bg-white border border-stone-200 rounded-lg space-y-3.5 hover:shadow-xs relative"
                    >
                      
                      {/* Row Label & Actions */}
                      <div className="flex items-center justify-between text-xs text-stone-500 border-b border-stone-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md font-mono text-[11px]">
                            {index + 1}
                          </span>
                          <span className="text-stone-400 font-mono">السطر اللغوي المتوازي</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Trash button directly visible with tooltip */}
                          <button
                            type="button"
                            onClick={() => deleteRowCompletely(index)}
                            className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف هذا السطر بالكامل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Elegant Actions Dropdown Menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveRowActionMenu(activeRowActionMenu === index ? null : index)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                                activeRowActionMenu === index 
                                  ? 'bg-amber-800 text-white border-amber-800' 
                                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                              }`}
                            >
                              <span>إجراءات</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {activeRowActionMenu === index && (
                              <>
                                {/* Backdrop overlay to close menu when tapping outside */}
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setActiveRowActionMenu(null)}
                                />
                                <div className="absolute left-0 mt-1.5 w-64 bg-white border border-stone-200 rounded-xl shadow-xl z-20 py-1.5 text-right animate-in fade-in slide-in-from-top-1 duration-100">
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      insertArabicSpacer(index);
                                      setActiveRowActionMenu(null);
                                    }}
                                    className="w-full text-right px-4 py-2 text-xs font-medium text-stone-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center justify-between"
                                  >
                                    <span>إدراج مساحة فارغة عربية</span>
                                    <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded font-mono">+ Arabic spacer</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      insertEnglishSpacer(index);
                                      setActiveRowActionMenu(null);
                                    }}
                                    className="w-full text-right px-4 py-2 text-xs font-medium text-stone-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center justify-between"
                                  >
                                    <span>إدراج مساحة فارغة إنجليزية</span>
                                    <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded font-mono">+ English spacer</span>
                                  </button>

                                  {row.arabic === '' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        removeArabicSpacer(index);
                                        setActiveRowActionMenu(null);
                                      }}
                                      className="w-full text-right px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      حذف الفراغ العربي المختار
                                    </button>
                                  )}

                                  {row.english === '' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        removeEnglishSpacer(index);
                                        setActiveRowActionMenu(null);
                                      }}
                                      className="w-full text-right px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      حذف الفراغ الإنجليزي المختار
                                    </button>
                                  )}

                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bilingual inputs with visual connector */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative items-center">
                        
                        {/* Arabic text input */}
                        <div className="space-y-1 bg-[#FCFAF8]/40 p-3 rounded-xl border border-stone-100 relative group/ar">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-stone-400 font-mono tracking-wider">النص العربي الأصيل</span>
                            <span className="text-[10px] text-stone-300 font-mono">AR</span>
                          </div>
                          <textarea
                            value={row.arabic}
                            onChange={e => updateRowText(index, 'arabic', e.target.value)}
                            rows={2}
                            dir="rtl"
                            placeholder="(مساحة فارغة - ستقابل النص المقابل)"
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-base font-amiri text-stone-900 bg-white/70 focus:bg-white focus:outline-none focus:border-amber-700 transition-colors resize-y shadow-2xs leading-relaxed"
                          />
                        </div>

                        {/* Interactive Connector Node for desktop */}
                        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center z-10">
                          <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200/80 shadow-xs flex items-center justify-center text-amber-800">
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Interactive Connector Node for mobile */}
                        <div className="flex md:hidden items-center justify-center py-1 -my-3 shrink-0 z-10">
                          <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200/80 shadow-xs flex items-center justify-center text-amber-800">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* English text input */}
                        <div className="space-y-1 bg-[#FCFAF8]/40 p-3 rounded-xl border border-stone-100 relative group/en">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-stone-300 font-mono">EN</span>
                            <span className="text-[10px] font-bold text-stone-400 font-mono tracking-wider">ENGLISH TRANSLATION</span>
                          </div>
                          <textarea
                            value={row.english}
                            onChange={e => updateRowText(index, 'english', e.target.value)}
                            rows={2}
                            dir="ltr"
                            placeholder="(Empty Spacer - will match Arabic text)"
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-sans text-stone-800 bg-white/70 focus:bg-white focus:outline-none focus:border-amber-700 transition-colors resize-y shadow-2xs leading-relaxed"
                          />
                        </div>

                      </div>

                    </div>
                  ))}
                </div>

                {/* Add new rows manually */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    onClick={addEmptyRow}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg border-2 border-dashed border-stone-300 hover:border-amber-700/50 text-stone-700 hover:text-amber-900 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة سطر إضافي مخصص بالأسفل</span>
                  </button>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleSaveAlignments}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm cursor-pointer text-center transition-colors"
                    >
                      حفظ كافة التوازيات
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* --- VIEW: 3. DICTIONARY LOOKUP (Lexicon Tab) --- */}
        {currentTab === 'dictionary' && (
          <div className="space-y-6">
            
            <div className="text-right space-y-2">
              <h2 className="text-2xl font-bold font-amiri text-stone-900">القاموس المعجمي المباشر (مزدوج: عربي ⇄ إنجليزي)</h2>
              <p className="text-stone-500 text-sm max-w-2xl leading-relaxed">
                ابحث عن أي كلمة عربية أو إنجليزية (مثال: عين، عمل، كتاب، book, spring, peace, courage) للاطلاع الفوري على المعاني المعجمية المختصرة (1–3 معانٍ رئيسية).
              </p>
            </div>

            {/* Direct search input bar */}
            <form onSubmit={handleDirectSearch} className="max-w-xl mx-auto space-y-3">
              <div className="relative">
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="اكتب الكلمة هنا (عربية مثل: كتاب، عين أو إنجليزية مثل: book, eye)..."
                  className="w-full pl-24 pr-4 py-3 border border-stone-300 rounded-xl text-base bg-white shadow-xs focus:outline-hidden focus:border-amber-800 focus:ring-1 focus:ring-amber-800"
                  required
                />
                <button
                  type="submit"
                  className="absolute left-3 top-2.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-800 hover:bg-amber-900 text-white transition-all cursor-pointer"
                >
                  بحث في المعجم
                </button>
              </div>
            </form>

            {/* Direct Search results */}
            <div className="max-w-xl mx-auto space-y-4">
              {isSearchingDirect ? (
                <div className="p-8 text-center animate-pulse text-stone-500 space-y-2">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-amber-800" />
                  <span>جاري استرجاع معاني الكلمة من المعجم...</span>
                </div>
              ) : directLexicalResult && directLexicalResult.meanings.length > 0 ? (
                <div className="space-y-4">
                  
                  {/* Lexical Result Card */}
                  <div className="p-6 rounded-xl border border-amber-300 bg-[#FCFAF2] shadow-xs text-right space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                      <span className="text-xs text-amber-900 font-bold font-mono flex items-center gap-1.5">
                        <BookOpenCheck className="w-4 h-4 text-amber-800" />
                        {directLexicalResult.dir === 'en-ar' ? 'القاموس المعجمي (إنجليزي ← عربي)' : 'القاموس المعجمي (عربي ← إنجليزي)'}
                      </span>
                      <h3 className={`text-2xl font-bold bg-white px-3 py-1 rounded-lg border border-amber-200 text-stone-900 ${
                        directLexicalResult.dir === 'en-ar' ? 'font-sans dir-ltr' : 'font-amiri'
                      }`}>
                        {directLexicalResult.word}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-stone-500 font-mono">
                        {directLexicalResult.dir === 'en-ar' ? 'أبرز 1–3 معانٍ عربية مختصرة:' : 'أبرز 2–3 معانٍ إنجليزية مختصرة:'}
                      </span>
                      {directLexicalResult.dir === 'en-ar' ? (
                        <div className="flex flex-wrap gap-2 dir-rtl text-right pt-1">
                          {directLexicalResult.meanings.map((m, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-base font-bold bg-white text-amber-950 border border-amber-300 shadow-2xs font-amiri"
                            >
                              <span className="text-xs font-mono text-amber-700 ml-2">{idx + 1}.</span>
                              {m}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 dir-ltr text-left pt-1">
                          {directLexicalResult.meanings.map((m, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-base font-bold bg-white text-amber-950 border border-amber-300 shadow-2xs font-sans"
                            >
                              <span className="text-xs font-mono text-amber-600 mr-2">{idx + 1}.</span>
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : searchTerm && directLexicalResult ? (
                <div className="bg-stone-50 p-8 rounded-xl border border-stone-200 text-center space-y-1">
                  <Info className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <p className="text-stone-600 font-semibold">لم نعثر على مدخل معجمي لـ "{searchTerm}"</p>
                  <p className="text-stone-400 text-xs max-w-sm mx-auto leading-relaxed">
                    تأكد من كتابة الكلمة بشكل صحيح (سواء بالعربية أو الإنجليزية) أو جرب صيغة مجردة.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Dataset Metadata Information Card */}
            <div className="max-w-xl mx-auto bg-stone-100/70 rounded-xl p-4 border border-stone-200/80 text-xs text-stone-600 space-y-2">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-800" />
                  معلومات مصدر القاموس المعجمي (Metadata)
                </span>
                <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-mono">Apache 2.0 / Open Access</span>
              </div>
              <p className="leading-relaxed">
                مستخرج ومُنقّح من قاعدة بيانات <span className="font-mono text-amber-900 font-semibold">DrAbdulmalek/arabic-dictionaries-master</span> على Hugging Face، ومخصص حصراً للبحث المعجمي الفوري المتبادل بين اللغتين (عربي ⇄ إنجليزي) بحد أقصى 3 معانٍ موجزة ومباشرة للمفردات.
              </p>
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 font-mono">
                <span>المداخل المعجمية المنقحة: 98,000+ مدخل متبادل</span>
                <a 
                  href="https://huggingface.co/datasets/DrAbdulmalek/arabic-dictionaries-master" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-amber-800 hover:underline"
                >
                  رابط المصدر على Hugging Face ↗
                </a>
              </div>
            </div>

          </div>
        )}



      </main>

      {/* Footer Block */}
      <footer className="border-t border-stone-200 bg-stone-50 py-6 mt-12 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-stone-500 font-mono space-y-1">
          <p>محراب القراءة الموازية — تطبيق قراءة تفاعلي علمي مفتوح المصدر يعمل محلياً بالكامل</p>
          <p>© {new Date().getFullYear()} جميع الحقوق محفوظة لجمهور القراء والباحثين اللغويين</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FAF8F5]/96 backdrop-blur-md border-t border-[#DCD7CA]/60 h-16 z-40 flex items-center justify-around px-4 shadow-lg pb-safe">
        <button
          onClick={() => { setCurrentTab('library'); setClickedWord(null); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors w-16 h-full ${
            currentTab === 'library' ? 'text-amber-900 font-bold' : 'text-stone-400'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">المكتبة</span>
        </button>

        {selectedBook && (
          <button
            onClick={() => { setCurrentTab('reader'); setClickedWord(null); }}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors w-16 h-full ${
              currentTab === 'reader' ? 'text-amber-900 font-bold' : 'text-stone-400'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">القارئ</span>
          </button>
        )}

        <button
          onClick={() => { setCurrentTab('dictionary'); setClickedWord(null); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors w-16 h-full ${
            currentTab === 'dictionary' ? 'text-amber-900 font-bold' : 'text-stone-400'
          }`}
        >
          <Languages className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">المعجم</span>
        </button>

      </div>

    </div>
  );
}
