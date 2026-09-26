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

interface DictionaryEntry {
  word: string;
  displayWord: string;
  root?: string;
  translation: string;
  examples: { ar: string; en: string; source?: string }[];
}

export default function App() {
  // Navigation / Tab States
  const [currentTab, setCurrentTab] = useState<'library' | 'reader' | 'dictionary' | 'help'>('library');
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // App views within Reader
  const [readerMode, setReaderMode] = useState<'sideBySide' | 'arabicAbove' | 'arabicOnly' | 'englishOnly'>('sideBySide');
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

  // Local Dictionary States
  const [manifest, setManifest] = useState<any>(null);
  const [dictionaryCache, setDictionaryCache] = useState<{ [letter: string]: DictionaryEntry[] }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [directSearchResult, setDirectSearchResult] = useState<DictionaryEntry[]>([]);
  const [isSearchingDirect, setIsSearchingDirect] = useState(false);

  // Clicked Word Popover / Dialog
  const [clickedWord, setClickedWord] = useState<string | null>(null);
  const [clickedWordData, setClickedWordData] = useState<DictionaryEntry | null>(null);
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

  // Load a single letter dictionary file from server and cache it
  const fetchLetterEntries = async (letter: string): Promise<DictionaryEntry[]> => {
    if (dictionaryCache[letter]) {
      return dictionaryCache[letter];
    }
    try {
      const res = await fetch(`/dictionary/${encodeURIComponent(letter)}.json`);
      if (res.ok) {
        const list: DictionaryEntry[] = await res.json();
        setDictionaryCache(prev => ({ ...prev, [letter]: list }));
        return list;
      }
    } catch (e) {
      console.error(`Error fetching dictionary for letter ${letter}:`, e);
    }
    return [];
  };

  // Find all candidate matches for a normalized word (without using Array.find)
  const findCandidatesInList = (normalizedWord: string, list: DictionaryEntry[]): DictionaryEntry[] => {
    return list.filter(entry => {
      const normWord = normalizeArabicWordForLookup(entry.word);
      const normDisplay = normalizeArabicWordForLookup(entry.displayWord);
      const normRoot = entry.root ? normalizeArabicWordForLookup(entry.root) : '';
      return normWord === normalizedWord || normDisplay === normalizedWord || normRoot === normalizedWord;
    });
  };

  // Clean up raw dictionary translation text for readable user-friendly display without losing original content
  const formatTranslationForDisplay = (text: string): string => {
    if (!text) return '';

    let cleaned = text;

    // 1. Remove non-printable control characters (such as ASCII 0x1F unit separators)
    cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    // 2. Replace raw pipe symbols '│' used in Hans Wehr as sense/idiom separators with clean '; '
    cleaned = cleaned.replace(/\s*│\s*/g, ' ; ');

    // 3. Expand standard dictionary abbreviations for clear reading
    cleaned = cleaned.replace(/\bs\.o\./gi, 'someone');
    cleaned = cleaned.replace(/\bs\.th\./gi, 'something');
    cleaned = cleaned.replace(/\bs\.t\./gi, 'something');
    cleaned = cleaned.replace(/\bo\.s\./gi, 'oneself');

    // 4. Remove isolated typography/OCR placeholder marks like 'ھ' or 'هـ' inside English parentheticals
    cleaned = cleaned.replace(/\(\s*[ھهـ]\s*/g, '(');
    cleaned = cleaned.replace(/\s+[ھهـ]\s+/g, ' ');

    // 5. Clean up weird spaces before punctuation and ensure single space after
    cleaned = cleaned.replace(/\s+([,;:.!?])/g, '$1');
    cleaned = cleaned.replace(/([,;:.!?])(?=[a-zA-Z])/g, '$1 ');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');

    // 6. Clean up leading/trailing orphan punctuation
    cleaned = cleaned.replace(/^[;,.\s]+/, '');
    cleaned = cleaned.replace(/[;,.\s]+$/, '');

    return cleaned.trim();
  };

  // Combine all matching candidate entries for a word preserving original dictionary file order
  const rankAndSelectEntries = (surfaceWord: string, candidates: DictionaryEntry[]): DictionaryEntry | null => {
    if (!candidates || candidates.length === 0) return null;

    const hasHarakat = /[\u064B-\u0652]/.test(surfaceWord);

    // Filter by exact surface match if surfaceWord has harakat
    let matchingCandidates = candidates;
    if (hasHarakat) {
      const exactMatches = candidates.filter(
        entry => (entry.displayWord && entry.displayWord === surfaceWord) || entry.word === surfaceWord
      );
      if (exactMatches.length > 0) {
        matchingCandidates = exactMatches;
      }
    }

    // Preserve the original dictionary file order
    // Collect all unique translations from matching candidates
    const uniqueTranslations: string[] = [];
    const seenTrans = new Set<string>();

    for (const entry of matchingCandidates) {
      const rawTrans = entry.translation ? entry.translation.trim() : '';
      if (!rawTrans) continue;

      const formattedTrans = formatTranslationForDisplay(rawTrans);
      if (!formattedTrans) continue;

      const normTransKey = formattedTrans.toLowerCase();
      if (!seenTrans.has(normTransKey)) {
        seenTrans.add(normTransKey);
        uniqueTranslations.push(formattedTrans);
      }
    }

    if (uniqueTranslations.length === 0) {
      return null;
    }

    // Combine all unique translations preserving dictionary order
    let combinedTranslation = '';
    if (uniqueTranslations.length === 1) {
      combinedTranslation = uniqueTranslations[0];
    } else {
      combinedTranslation = uniqueTranslations.map((t, i) => `${i + 1}) ${t}`).join('\n');
    }

    // Aggregate examples from all matching candidates without duplicates
    const aggregatedExamples: { ar: string; en: string; source?: string }[] = [];
    const seenExamples = new Set<string>();

    for (const entry of matchingCandidates) {
      if (entry.examples && Array.isArray(entry.examples)) {
        for (const ex of entry.examples) {
          if (ex && ex.ar) {
            const key = `${ex.ar.trim()}|${(ex.en || '').trim()}`;
            if (!seenExamples.has(key)) {
              seenExamples.add(key);
              aggregatedExamples.push(ex);
            }
          }
        }
      }
    }

    const primaryEntry = matchingCandidates[0];

    return {
      word: primaryEntry.word,
      displayWord: primaryEntry.displayWord || primaryEntry.word,
      root: primaryEntry.root || primaryEntry.word,
      translation: combinedTranslation,
      examples: aggregatedExamples
    };
  };

  const localDictionaryLookup = (surfaceWord: string, entries: DictionaryEntry[]): DictionaryEntry | null => {
    const normalized = normalizeArabicWordForLookup(surfaceWord);
    if (!normalized) return null;

    // Level 1: Direct match without stemming
    let candidates = findCandidatesInList(normalized, entries);
    if (candidates.length > 0) {
      return rankAndSelectEntries(surfaceWord, candidates);
    }

    // Level 2: Prefix / Suffix stripping (Morphological Stemming Fallback)
    // Prefix "ال"
    if (normalized.startsWith('ال') && normalized.length > 3) {
      const stripped = normalized.substring(2);
      candidates = findCandidatesInList(stripped, entries);
      if (candidates.length > 0) {
        return rankAndSelectEntries(surfaceWord, candidates);
      }
    }

    // Coordinating prefixes
    const prefixes = ['وال', 'بال', 'فال', 'لال', 'كال', 'و', 'ب', 'ف', 'ل', 'ك'];
    for (const prefix of prefixes) {
      if (normalized.startsWith(prefix) && normalized.length > prefix.length + 1) {
        const stripped = normalized.substring(prefix.length);
        candidates = findCandidatesInList(stripped, entries);
        if (candidates.length > 0) {
          return rankAndSelectEntries(surfaceWord, candidates);
        }
      }
    }

    // Suffixes
    const suffixes = ['ون', 'ين', 'ات', 'ان', 'ها', 'هم', 'كم', 'نا', 'ه', 'ت'];
    for (const suffix of suffixes) {
      if (normalized.endsWith(suffix) && normalized.length > suffix.length + 2) {
        const stripped = normalized.substring(0, normalized.length - suffix.length);
        candidates = findCandidatesInList(stripped, entries);
        if (candidates.length > 0) {
          return rankAndSelectEntries(surfaceWord, candidates);
        }
      }
    }

    // Combination (Al- + Suffix)
    if (normalized.startsWith('ال') && normalized.length > 4) {
      const strippedPrefix = normalized.substring(2);
      for (const suffix of suffixes) {
        if (strippedPrefix.endsWith(suffix) && strippedPrefix.length > suffix.length + 2) {
          const strippedBoth = strippedPrefix.substring(0, strippedPrefix.length - suffix.length);
          candidates = findCandidatesInList(strippedBoth, entries);
          if (candidates.length > 0) {
            return rankAndSelectEntries(surfaceWord, candidates);
          }
        }
      }
    }

    return null;
  };

  // Click handler for Arabic words in Reader view
  const handleWordClick = async (word: string, rowIndex: number, row: AlignedUnit) => {
    const surfaceWord = getSurfaceForm(word);
    if (!surfaceWord) return;

    setClickedWord(surfaceWord);
    setClickedWordRowIndex(rowIndex);
    setClickedWordRow(row);
    setClickedWordData(null);
    setAiContextResult(null);
    setAiError(null);
    setIsDictionaryLoading(true);

    const letter = getNormalizedFirstLetter(surfaceWord);
    const entries = await fetchLetterEntries(letter);
    const lookupResult = localDictionaryLookup(surfaceWord, entries);

    setClickedWordData(lookupResult);
    setIsDictionaryLoading(false);
  };

  // AI Context Interpretation Call
  const handleAiInterpret = async () => {
    if (!selectedBook || !clickedWord || clickedWordRowIndex === null || !clickedWordRow) return;
    
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

  // Helper to split sentence into individual interactive words
  const renderInteractiveArabicText = (sentence: string, rowIndex: number, row: AlignedUnit) => {
    if (!sentence) return <span className="text-stone-300 italic">مساحة فارغة (محاذاة يدوية)</span>;
    
    // Split by space to get tokens
    const tokens = sentence.split(/(\s+)/);
    
    return (
      <p className="font-amiri text-2xl leading-relaxed text-right font-medium tracking-wide">
        {tokens.map((token, i) => {
          const isSpace = /\s+/.test(token);
          if (isSpace) {
            return token;
          }
          
          const cleaned = cleanArabicWord(token);
          if (!cleaned) {
            return <span key={i} className="text-stone-500">{token}</span>;
          }

          const isCurrentlyClicked = clickedWord === token && clickedWordRowIndex === rowIndex;

          return (
            <span
              key={i}
              onClick={() => handleWordClick(token, rowIndex, row)}
              className={`cursor-pointer transition-all duration-150 rounded px-1 ${
                isCurrentlyClicked 
                  ? 'bg-amber-700 text-white font-semibold scale-105 shadow-sm' 
                  : 'hover:bg-amber-100 hover:text-amber-900 focus:bg-amber-100 focus:text-amber-900'
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
    setClickedWordData(null);
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
    setDirectSearchResult([]);

    const surfaceWord = getSurfaceForm(searchTerm);
    const letter = getNormalizedFirstLetter(surfaceWord);
    const entries = await fetchLetterEntries(letter);
    const match = localDictionaryLookup(surfaceWord, entries);

    if (match) {
      setDirectSearchResult([match]);
    } else {
      setDirectSearchResult([]);
    }
    setIsSearchingDirect(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans select-none bg-[#FDFBF7]">
      
      {/* 1. Header (Top Navigation Bar - 3-Zone Contract) */}
      <header className="border-b border-stone-200/80 bg-[#FCFAF2] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          
          {/* Zone 1: Brand Title (One Single text wordmark) */}
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-amber-800" />
            <h1 className="text-xl font-bold font-amiri tracking-wider text-stone-900 select-none">
              مِحْرَابُ القِرَاءَةِ المِوَازِيَةِ
            </h1>
          </div>

          {/* Zone 2: Navigation links */}
          <nav className="flex items-center gap-6 text-sm font-medium">
            <button 
              onClick={() => { setCurrentTab('library'); setClickedWord(null); }}
              className={`hover:text-amber-800 transition-colors select-none ${currentTab === 'library' ? 'text-amber-900 border-b-2 border-amber-800 pb-1 font-semibold' : 'text-stone-600'}`}
            >
              المكتبة اللغوية
            </button>
            {selectedBook && (
              <button 
                onClick={() => setCurrentTab('reader')}
                className={`hover:text-amber-800 transition-colors select-none ${currentTab === 'reader' ? 'text-amber-900 border-b-2 border-amber-800 pb-1 font-semibold' : 'text-stone-600'}`}
              >
                قارئ النصوص
              </button>
            )}
            <button 
              onClick={() => { setCurrentTab('dictionary'); setClickedWord(null); }}
              className={`hover:text-amber-800 transition-colors select-none ${currentTab === 'dictionary' ? 'text-amber-900 border-b-2 border-amber-800 pb-1 font-semibold' : 'text-stone-600'}`}
            >
              المعجم المحلي
            </button>
            <button 
              onClick={() => { setCurrentTab('help'); setClickedWord(null); }}
              className={`hover:text-amber-800 transition-colors select-none ${currentTab === 'help' ? 'text-amber-900 border-b-2 border-amber-800 pb-1 font-semibold' : 'text-stone-600'}`}
            >
              دليل المستخدم
            </button>
          </nav>

          {/* Zone 3: Primary action button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsAddingBook(true); setClickedWord(null); }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-800 hover:bg-amber-900 text-white shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة نص جديد</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Viewports */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">

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
                        className="p-5 rounded-xl border border-stone-200 bg-[#FCFAF2] hover:border-amber-700/50 hover:shadow-md transition-all cursor-pointer text-right flex flex-col justify-between h-48 group"
                      >
                        <div className="space-y-2">
                          <h4 className="text-lg font-bold font-amiri text-stone-900 group-hover:text-amber-900 line-clamp-1">
                            {book.title}
                          </h4>
                          {book.author && (
                            <p className="text-stone-600 text-sm font-medium">المؤلف: {book.author}</p>
                          )}
                          
                          {/* UNBOXED Static Metadata (no pills) with clean separators */}
                          <div className="flex items-center gap-2 text-xs text-stone-500 font-mono mt-1">
                            <span>جمل متوازية: {totalUnits}</span>
                            <span>·</span>
                            <span>أضيف: {new Date(book.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-stone-200/50 flex items-center justify-between">
                          <span className="text-amber-850 group-hover:underline text-xs font-bold flex items-center gap-1">
                            <span>افتح القارئ</span>
                            <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                          </span>
                          <button
                            onClick={(e) => handleDeleteBook(book.id, e)}
                            className="p-1.5 rounded-md text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors"
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
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#FCFAF2] border border-stone-200/80 rounded-xl gap-4">
              <div className="space-y-1 text-right">
                <span className="text-xs font-mono text-stone-500">مستند قيد القراءة</span>
                <h2 className="text-xl font-bold font-amiri text-stone-900">{selectedBook.title}</h2>
                {selectedBook.author && <p className="text-stone-600 text-xs">بقلم: {selectedBook.author}</p>}
              </div>

              {/* Reader Modes & Alignment Switchers */}
              <div className="flex flex-wrap items-center gap-2 justify-end">
                
                {/* Segemented Filter Tabs for Display Mode */}
                <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs font-medium">
                  <button 
                    onClick={() => { setReaderMode('sideBySide'); setIsEditingAlignments(false); }}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${readerMode === 'sideBySide' && !isEditingAlignments ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'}`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">جنباً إلى جنب</span>
                  </button>
                  <button 
                    onClick={() => { setReaderMode('arabicAbove'); setIsEditingAlignments(false); }}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${readerMode === 'arabicAbove' && !isEditingAlignments ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'}`}
                  >
                    <Rows className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">العربية فوق الإنجليزية</span>
                  </button>
                  <button 
                    onClick={() => { setReaderMode('arabicOnly'); setIsEditingAlignments(false); }}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${readerMode === 'arabicOnly' && !isEditingAlignments ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'}`}
                  >
                    <span className="font-amiri font-bold text-xs">ع</span>
                    <span>العربية فقط</span>
                  </button>
                  <button 
                    onClick={() => { setReaderMode('englishOnly'); setIsEditingAlignments(false); }}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${readerMode === 'englishOnly' && !isEditingAlignments ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'}`}
                  >
                    <span className="font-bold text-xs">EN</span>
                    <span>الإنجليزية فقط</span>
                  </button>
                </div>

                {/* Alignment mode Toggle */}
                <button
                  onClick={() => {
                    setIsEditingAlignments(!isEditingAlignments);
                    setEditRows(selectedBook.alignedRows);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer border ${
                    isEditingAlignments 
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' 
                      : 'border-stone-300 hover:bg-stone-50 text-stone-700'
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
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-600">
                  <input 
                    type="checkbox" 
                    checked={syncScroll} 
                    onChange={e => setSyncScroll(e.target.checked)}
                    className="rounded-sm accent-amber-800"
                  />
                  <span>تفعيل مزامنة التمرير الرأسي بين العمودين (scrollTop)</span>
                </label>
              </div>
            )}

            {/* --- CORE READER INTERFACE VIEWS --- */}
            {!isEditingAlignments ? (
              <div className="relative flex-1">
                
                {/* Mode A: Side by Side (2-Columns layout) */}
                {readerMode === 'sideBySide' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[60vh] min-h-[450px]">
                    
                    {/* Arabic Column Container */}
                    <div className="flex flex-col h-full bg-[#FAF8F4] border border-stone-200/80 rounded-xl overflow-hidden shadow-xs">
                      <div className="p-3 bg-stone-50 border-b border-stone-200/60 font-bold font-amiri text-lg text-stone-700 flex items-center justify-between">
                        <span>النص العربي الأصيل (انقر على الكلمات المظللة للترجمة)</span>
                        <span className="text-xs font-mono font-normal">dir: rtl</span>
                      </div>
                      
                      <div 
                        ref={arabicScrollRef}
                        onScroll={handleArabicScroll}
                        onMouseEnter={() => { activeScrollSource.current = 'arabic'; }}
                        onMouseLeave={() => { activeScrollSource.current = null; }}
                        className="flex-1 p-6 overflow-y-auto space-y-6 dir-rtl"
                      >
                        {selectedBook.alignedRows.map((row, index) => (
                          <div 
                            key={row.id} 
                            className="pb-4 border-b border-stone-100 last:border-0 hover:bg-stone-100/40 p-2 rounded-lg transition-colors"
                          >
                            {renderInteractiveArabicText(row.arabic, index, row)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* English Column Container */}
                    <div className="flex flex-col h-full bg-[#FAF8F4] border border-stone-200/80 rounded-xl overflow-hidden shadow-xs">
                      <div className="p-3 bg-stone-50 border-b border-stone-200/60 font-semibold text-sm text-stone-700 flex items-center justify-between">
                        <span>English Translation</span>
                        <span className="text-xs font-mono font-normal">dir: ltr</span>
                      </div>
                      
                      <div 
                        ref={englishScrollRef}
                        onScroll={handleEnglishScroll}
                        onMouseEnter={() => { activeScrollSource.current = 'english'; }}
                        onMouseLeave={() => { activeScrollSource.current = null; }}
                        className="flex-1 p-6 overflow-y-auto space-y-6 dir-ltr text-left font-serif text-lg leading-relaxed text-stone-700"
                      >
                        {selectedBook.alignedRows.map((row) => (
                          <div 
                            key={row.id} 
                            className="pb-4 border-b border-stone-100 last:border-0 hover:bg-stone-100/40 p-2 rounded-lg transition-colors min-h-[46px] flex items-center"
                          >
                            {row.english ? (
                              <p className="font-medium">{row.english}</p>
                            ) : (
                              <p className="text-stone-300 italic text-sm">Spacer (Empty align unit)</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* Mode B: Arabic Above English */}
                {readerMode === 'arabicAbove' && (
                  <div className="bg-[#FAF8F4] border border-stone-200/80 rounded-xl p-6 space-y-8 max-h-[60vh] overflow-y-auto">
                    {selectedBook.alignedRows.map((row, index) => (
                      <div key={row.id} className="p-4 rounded-lg bg-stone-50/50 border border-stone-150 flex flex-col gap-3 hover:bg-amber-50/30 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-xs font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">وحدة {index + 1}</span>
                          <div className="flex-1">
                            {renderInteractiveArabicText(row.arabic, index, row)}
                          </div>
                        </div>
                        {row.english && (
                          <div className="pt-2 border-t border-stone-200/60 text-left font-serif text-base text-stone-600 pl-8 dir-ltr">
                            {row.english}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Mode C: Arabic Only */}
                {readerMode === 'arabicOnly' && (
                  <div className="bg-[#FAF8F4] border border-stone-200/80 rounded-xl p-8 max-h-[65vh] overflow-y-auto space-y-6 text-right">
                    {selectedBook.alignedRows.map((row, index) => (
                      <div key={row.id} className="pb-4 border-b border-stone-100 last:border-0">
                        {renderInteractiveArabicText(row.arabic, index, row)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Mode D: English Only */}
                {readerMode === 'englishOnly' && (
                  <div className="bg-[#FAF8F4] border border-stone-200/80 rounded-xl p-8 max-h-[65vh] overflow-y-auto space-y-6 text-left dir-ltr font-serif text-lg leading-relaxed text-stone-700">
                    {selectedBook.alignedRows.map((row) => (
                      <div key={row.id} className="pb-4 border-b border-stone-100 last:border-0">
                        {row.english ? (
                          <p className="font-medium">{row.english}</p>
                        ) : (
                          <p className="text-stone-300 italic text-sm">Spacer</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* --- FLOATING DICTIONARY CARD MODAL/DIALOG --- */}
                {clickedWord && (
                  <div className="mt-6 p-5 rounded-xl border border-amber-250 bg-[#FCFAF0] shadow-md text-right relative space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    
                    <button 
                      onClick={() => { setClickedWord(null); setClickedWordData(null); setAiContextResult(null); }}
                      className="absolute top-4 left-4 p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-800 font-mono">الكلمة المحددة:</span>
                        <h4 className="text-2xl font-bold font-amiri text-stone-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">{clickedWord}</h4>
                      </div>
                      
                      {/* AI Context activator when available */}
                      {isAiAvailable && (
                        <button
                          onClick={handleAiInterpret}
                          disabled={isAiLoading}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-950 border border-amber-300 hover:bg-amber-50 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-850 animate-pulse" />
                          <span>{isAiLoading ? 'جاري الاستعلام عن السياق...' : 'تحديد الترجمة الأنسب للسياق بالذكاء الاصطناعي'}</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                      
                      {/* SECTION 1: الترجمة المباشرة */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-stone-500 font-mono block border-b border-stone-100 pb-1">الترجمة المباشرة</span>
                        
                        {isDictionaryLoading ? (
                          <div className="p-4 space-y-2 animate-pulse text-center text-stone-500">
                            <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-1 text-amber-800" />
                            <span>يبحث المعجم في ملف الحرف المطلوب...</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {clickedWordData ? (
                              <div className="bg-white p-4 rounded-lg border border-stone-200">
                                <span className="text-[10px] text-stone-400 block font-mono">المعنى المعجمي الموثق:</span>
                                <p className="text-lg font-bold text-stone-900 capitalize dir-ltr text-left whitespace-pre-line">
                                  {clickedWordData.translation}
                                </p>
                              </div>
                            ) : !aiContextResult && (
                              <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 text-center text-stone-500 text-xs">
                                لا توجد بيانات معجمية محلية لهذه الكلمة
                              </div>
                            )}

                            {/* Show contextual choice inside the translation section instead of a separate column */}
                            {aiContextResult && (
                              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-1">
                                <span className="text-[10px] text-amber-800 font-bold block font-mono flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-700" />
                                  <span>الترجمة السياقية الأنسب (مستنبطة من السياق):</span>
                                </span>
                                <p className="text-lg font-bold text-amber-950 capitalize dir-ltr text-left">
                                  {aiContextResult.contextualMeaning}
                                </p>
                              </div>
                            )}

                            {aiError && (
                              <p className="text-xs text-red-600 mt-1">{aiError}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* SECTION 2: أمثلة على الكلمة */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-stone-500 font-mono block border-b border-stone-100 pb-1">أمثلة على الكلمة</span>
                        
                        {clickedWordData && clickedWordData.examples && clickedWordData.examples.length > 0 ? (
                          <div className="space-y-3 max-h-[180px] overflow-y-auto">
                            {clickedWordData.examples.map((ex, i) => (
                              <div key={i} className="p-3 rounded-lg bg-white border border-stone-200 border-r-4 border-r-amber-800 text-xs space-y-1">
                                <p className="font-amiri font-bold text-stone-900 leading-relaxed">{ex.ar}</p>
                                <p className="font-serif text-stone-600 italic text-left dir-ltr">{ex.en}</p>
                                {ex.source && (
                                  <p className="text-[10px] text-stone-400 text-right mt-1 font-mono">المصدر المعجمي المعتمد: {ex.source}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 text-center text-stone-400 text-xs italic">
                            لا تتوفر أمثلة معجمية حقيقية موثقة لهذه الكلمة في المعجم المحلي.
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                )}

              </div>
            ) : (
              
              // --- MANUAL ALIGNMENT EDITOR WORKSPACE ---
              <div className="bg-[#FAF8F4] border border-stone-200/80 rounded-xl p-6 space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4 text-right">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-amber-800" />
                      <span>محرر المحاذاة والترتيب اليدوي الكامل</span>
                    </h3>
                    <p className="text-stone-500 text-xs">
                      قم بضبط توازي الأسطر وإدراج خلايا فارغة ليتساوى العمودان تماماً.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleSaveAlignments}
                      className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>حفظ التعديلات والتوازي</span>
                    </button>
                    <button
                      onClick={() => setIsEditingAlignments(false)}
                      className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs cursor-pointer"
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-right text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold">آلية الضبط اليدوي:</p>
                  <p>إذا كانت الجملة العربية متقدمة على الإنجليزية بفقرة، قم بالضغط على <span className="font-bold">"إدراج مساحة إنجليزية"</span> لدفع النص الإنجليزي لأسفل ومقابلة السطر المقابل بدقة.</p>
                </div>

                {/* Editor Alignment Rows */}
                <div className="space-y-4 max-h-[50vh] overflow-y-auto p-1">
                  {editRows.map((row, index) => (
                    <div 
                      key={row.id}
                      className="p-4 bg-white border border-stone-200 rounded-lg space-y-3 hover:shadow-xs relative"
                    >
                      
                      {/* Row Label & Actions */}
                      <div className="flex items-center justify-between text-xs text-stone-500 border-b border-stone-100 pb-2">
                        <span className="font-bold text-stone-700">السطر / Row {index + 1}</span>
                        <div className="flex items-center gap-2">
                          
                          {/* Push controllers */}
                          <button
                            type="button"
                            onClick={() => insertArabicSpacer(index)}
                            className="px-2 py-1 text-[10px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100"
                            title="إدراج سطر فارغ في العمود العربي لدفع النصوص العربية لأسفل"
                          >
                            + مساحة فارغة عربية
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => insertEnglishSpacer(index)}
                            className="px-2 py-1 text-[10px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100"
                            title="إدراج سطر فارغ في العمود الإنجليزي لدفع النصوص الإنجليزية لأسفل"
                          >
                            + مساحة فارغة إنجليزية
                          </button>

                          {row.arabic === '' && (
                            <button
                              type="button"
                              onClick={() => removeArabicSpacer(index)}
                              className="px-1.5 py-1 text-[10px] text-red-700 hover:bg-red-50 rounded font-semibold"
                            >
                              حذف الفراغ العربي
                            </button>
                          )}

                          {row.english === '' && (
                            <button
                              type="button"
                              onClick={() => removeEnglishSpacer(index)}
                              className="px-1.5 py-1 text-[10px] text-red-700 hover:bg-red-50 rounded font-semibold"
                            >
                              حذف الفراغ الإنجليزي
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => deleteRowCompletely(index)}
                            className="p-1 text-stone-400 hover:text-red-700 rounded"
                            title="حذف هذا السطر بالكامل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </div>

                      {/* Bilingual inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-stone-400 text-right">النص العربي</label>
                          <textarea
                            value={row.arabic}
                            onChange={e => updateRowText(index, 'arabic', e.target.value)}
                            rows={2}
                            dir="rtl"
                            placeholder="(مساحة فارغة)"
                            className="w-full px-2.5 py-1.5 border border-stone-200 rounded text-sm font-amiri text-stone-900 focus:outline-hidden focus:border-amber-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-stone-400 text-left">النص الإنجليزي</label>
                          <textarea
                            value={row.english}
                            onChange={e => updateRowText(index, 'english', e.target.value)}
                            rows={2}
                            dir="ltr"
                            placeholder="(Empty Spacer)"
                            className="w-full px-2.5 py-1.5 border border-stone-200 rounded text-xs font-sans text-stone-900 focus:outline-hidden focus:border-amber-800"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Add new rows manually */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={addEmptyRow}
                    className="px-4 py-2 rounded-lg border-2 border-dashed border-stone-300 hover:border-amber-700/50 text-stone-700 hover:text-amber-900 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة سطر إضافي مخصص بالأسفل</span>
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveAlignments}
                      className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      حفظ كافة التوازيات
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* --- VIEW: 3. LOCAL DICTIONARY LOOKUP (Search Tab) --- */}
        {currentTab === 'dictionary' && (
          <div className="space-y-6">
            
            <div className="text-right space-y-2">
              <h2 className="text-2xl font-bold font-amiri text-stone-900">المعجم المحلي العربي-الإنجليزي الموثوق</h2>
              <p className="text-stone-500 text-sm max-w-2xl leading-relaxed">
                ابحث عن أي كلمة عربية (مثال: كتاب، صبر، حياة، علم) لتصل فوراً إلى ترجمتها المباشرة من المصادر المفتوحة المعتمدة والأمثلة الأدبية الحقيقية. المعجم يعمل بشكل كامل على جهازك دون الحاجة للاتصال بالإنترنت.
              </p>
            </div>

            {/* Direct search input bar */}
            <form onSubmit={handleDirectSearch} className="max-w-xl mx-auto space-y-3">
              <div className="relative">
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="اكتب الكلمة العربية هنا واضغط بحث..."
                  dir="rtl"
                  className="w-full pl-12 pr-4 py-3 border border-stone-300 rounded-xl text-base font-amiri bg-white shadow-xs focus:outline-hidden focus:border-amber-800 focus:ring-1 focus:ring-amber-800"
                  required
                />
                <button
                  type="submit"
                  className="absolute left-3 top-2.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-800 hover:bg-amber-900 text-white transition-all cursor-pointer"
                >
                  بحث معجمي
                </button>
              </div>
            </form>

            {/* Dictionary Manifest Stats (no boxes, elegant design) */}
            {manifest && (
              <div className="flex items-center justify-center gap-4 text-xs text-stone-500 font-mono">
                <span>إجمالي الكلمات المدرجة: {manifest.totalEntries}</span>
                <span>·</span>
                <span>تخزين القاموس: مقسم إلى {Object.keys(manifest.letters).length} ملفاً حسب الحرف الأول</span>
              </div>
            )}

            {/* Direct Search results */}
            <div className="max-w-xl mx-auto">
              {isSearchingDirect ? (
                <div className="p-8 text-center animate-pulse text-stone-500 space-y-2">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-amber-800" />
                  <span>يبحث المعجم في ملف الحرف المطلوب...</span>
                </div>
              ) : directSearchResult.length > 0 ? (
                <div className="p-6 rounded-xl border border-amber-200 bg-white shadow-xs text-right space-y-4">
                  
                  <div className="flex items-center justify-between border-b border-stone-150 pb-3">
                    <span className="text-xs text-amber-850 font-semibold font-mono">النتيجة المعجمية</span>
                    <h3 className="text-2xl font-bold font-amiri text-stone-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">{directSearchResult[0].displayWord}</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold text-stone-400 font-mono">الترجمة المباشرة (Direct Translation)</span>
                      <p className="text-xl font-bold text-stone-900 capitalize text-left dir-ltr whitespace-pre-line">
                        {directSearchResult[0].translation}
                      </p>
                    </div>

                    {directSearchResult[0].root && (
                      <div>
                        <span className="text-xs font-bold text-stone-400 font-mono">الجذر الأصلي (Lemma/Root)</span>
                        <p className="text-sm font-bold font-amiri text-amber-900">{directSearchResult[0].root}</p>
                      </div>
                    )}

                    {directSearchResult[0].examples && directSearchResult[0].examples.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-bold text-stone-400 font-mono block">أمثلة معجمية حقيقية موثقة</span>
                        <div className="space-y-2">
                          {directSearchResult[0].examples.map((ex, i) => (
                            <div key={i} className="p-3 rounded-lg bg-stone-50 border-r-4 border-amber-800 text-xs space-y-1">
                              <p className="font-amiri font-bold text-stone-900 text-sm leading-relaxed">{ex.ar}</p>
                              <p className="font-serif text-stone-600 italic text-left dir-ltr">{ex.en}</p>
                              {ex.source && (
                                <p className="text-[10px] text-stone-400 text-right mt-1">المصدر: {ex.source}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : searchTerm && (
                <div className="bg-stone-50 p-8 rounded-xl border border-stone-200 text-center space-y-1">
                  <Info className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <p className="text-stone-600 font-semibold">لم نعثر على نتائج مطابقة لـ "{searchTerm}"</p>
                  <p className="text-stone-400 text-xs max-w-sm mx-auto leading-relaxed">
                    تأكد من كتابة الكلمة بشكل صحيح. المعجم المحلي المدمج يركز حالياً على الأصول الكلاسيكية الهامة والكلمات الأكثر استخداماً.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- VIEW: 4. HELP & EXPLANATIONS (Help Tab) --- */}
        {currentTab === 'help' && (
          <div className="space-y-6 text-right max-w-3xl mx-auto">
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-amiri text-stone-900">دليل ومبادئ مِحراب القراءة الموازية</h2>
              <p className="text-stone-500 text-sm">أهداف وطريقة عمل التطبيق لقراءة النصوص اللغوية ومحاذاتها يدوياً.</p>
            </div>

            <div className="space-y-6 bg-white p-6 rounded-xl border border-stone-200 text-stone-700 leading-relaxed text-sm">
              
              <div className="space-y-2">
                <h3 className="font-bold text-base text-stone-900">1. القراءة المتوازية والفاصل الرمزي "&"</h3>
                <p>
                  يهدف التطبيق لتمكين القراء والمترجمين والطلاب من موازنة النصوص يدوياً. يتم ذلك عن طريق إضافة الرمز <strong className="font-mono text-sm text-amber-800">"&"</strong> قبل كل جملة عربية وجملتها المترجمة بالإنجليزية.
                </p>
                <p>
                  يقوم التطبيق بتقسيم النصين لوحدات مستقلة. وبما أن الموازنة الآلية تخطئ كثيراً ولا تفي بالدقة الأدبية والفلسفية، فإن المستخدم يستطيع تعديل المحاذاة والترتيب يدوياً لإدراج مساحات فارغة (موازين) ليتطابق النصان تماماً.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-stone-150">
                <h3 className="font-bold text-base text-stone-900">2. المعجم المحلي وسرعة الاستعلام</h3>
                <p>
                  لضمان بقاء التطبيق خفيفاً وسريعاً وخالياً من التعقيد، لا يضم قاعدة بيانات معجمية عملاقة داخل ملف تشغيل واحد. بدلاً من ذلك، تم تقسيم القاموس لملفات JSON مستقلة تحمل اسم الحرف الأول من الكلمة (ا.json، ب.json، إلخ).
                </p>
                <p>
                  عند نقرك على الكلمة، يقوم التطبيق بتجريدها من الحركات وتحديد حرفها الأول، ثم تحميل ملف الحرف المطلوب فقط، والبحث السريع فيه. ويحتفظ التطبيق بهذا الملف بذاكرة المؤقتة (cache) لتصبح الاستعلامات اللاحقة لحظية وخاطفة.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-stone-150">
                <h3 className="font-bold text-base text-stone-900">3. دور الذكاء الاصطناعي (أداة تفاعلية سياقية)</h3>
                <p>
                  الذكاء الاصطناعي ليس معجماً ثابتاً ولا نعتمد عليه في اختراع كلمات أو تشكيك دقة المعاجم الحقيقية. دوره اختياري وبطلب منك لتفسير "سياق البلاغة اللفظي" في الجمل الأدبية المعقدة.
                </p>
                <p>
                  عند تفعيل تفسير السياق، يتم إرسال الكلمة المحددة مع الجملة الحالية وثلاث جمل قبلها وثلاث بعدها، إضافة للنص الإنجليزي المقابل (إن وجد) لنموذج Gemini، ليقوم بتقديم تفسير علمي دقيق لمراد الكلمة في هذا الموضع تحديداً دون تخزينها كقاموس.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-stone-150">
                <h3 className="font-bold text-base text-stone-900">4. مصادر القاموس والبيانات المفتوحة</h3>
                <p>
                  كل البيانات المعجمية الموجودة في المعجم مستخرجة ومبنية على مصادر حقيقية وعلنية مفتوحة، من أبرزها معاجم FreeDict ومصادر اشتقاق الجذور العربية العريقة وقاموس WordNet للأمثلة الإنجليزية، بعيداً تماماً عن البيانات المصطنعة أو الترجمات الوهمية.
                </p>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer Block */}
      <footer className="border-t border-stone-200 bg-stone-50 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-stone-500 font-mono space-y-1">
          <p>محراب القراءة الموازية — تطبيق قراءة تفاعلي علمي مفتوح المصدر يعمل محلياً بالكامل</p>
          <p>© {new Date().getFullYear()} جميع الحقوق محفوظة لجمهور القراء والباحثين اللغويين</p>
        </div>
      </footer>

    </div>
  );
}
