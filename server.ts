import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey || cleanKey === 'undefined' || cleanKey === 'null') {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: cleanKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.error('[Gemini Client Init Error]:', err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  const dictDir = path.join(__dirname, 'public', 'dictionary');
  let arEnLexicon: Record<string, string[]> = {};
  let enArLexicon: Record<string, string[]> = {};
  let metadata: Record<string, any> = {};

  function loadLexicons() {
    try {
      const arEnPath = path.join(dictDir, 'ar_en_lexicon.json');
      if (fs.existsSync(arEnPath)) {
        arEnLexicon = JSON.parse(fs.readFileSync(arEnPath, 'utf-8'));
        console.log(`[Server] Loaded ${Object.keys(arEnLexicon).length} Arabic-English entries.`);
      }

      const enArPath = path.join(dictDir, 'en_ar_lexicon.json');
      if (fs.existsSync(enArPath)) {
        enArLexicon = JSON.parse(fs.readFileSync(enArPath, 'utf-8'));
        console.log(`[Server] Loaded ${Object.keys(enArLexicon).length} English-Arabic entries.`);
      }

      const metaPath = path.join(dictDir, 'dataset_metadata.json');
      if (fs.existsSync(metaPath)) {
        metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      }
    } catch (err) {
      console.error('[Server] Error loading lexicons:', err);
    }
  }

  loadLexicons();

  const ENGLISH_STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 
    'by', 'from', 'as', 'is', 'was', 'were', 'be', 'been', 'it', 'its', 'his', 
    'her', 'their', 'my', 'your', 'our', 'that', 'this', 'who', 'whom', 'which', 
    'unto', 'into', 'he', 'she', 'they', 'we', 'i', 'you'
  ]);

  function normalizeArabic(str: string): string {
    if (!str) return '';
    return str
      .replace(/[\u064B-\u0652\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ک/g, 'ك')
      .replace(/ی/g, 'ي')
      .trim();
  }

  function normalizeEnglish(str: string): string {
    if (!str) return '';
    return str
      .replace(/^[\s\p{P}«»“”"''`()\[\]{}،.:؛!؟\-_—–]+/gu, '')
      .replace(/[\s\p{P}«»“”"''`()\[\]{}،.:؛!؟\-_—–]+$/gu, '')
      .toLowerCase()
      .trim();
  }

  function tryArabicDirect(query: string): string[] | null {
    if (!query) return null;
    if (arEnLexicon[query] && arEnLexicon[query].length > 0) return arEnLexicon[query];
    const norm = normalizeArabic(query);
    if (arEnLexicon[norm] && arEnLexicon[norm].length > 0) return arEnLexicon[norm];
    
    // Taa marbuta swap
    if (norm.endsWith('ه')) {
      const withTeh = norm.slice(0, -1) + 'ة';
      if (arEnLexicon[withTeh]) return arEnLexicon[withTeh];
    } else if (norm.endsWith('ة')) {
      const withHeh = norm.slice(0, -1) + 'ه';
      if (arEnLexicon[withHeh]) return arEnLexicon[withHeh];
    }
    return null;
  }

  // Advanced Arabic Morphological Deconstruction & Stemmer Engine
  function lookupArabic(rawWord: string): { word: string; normalized: string; meanings: string[]; root?: string; details?: string } {
    if (!rawWord) return { word: '', normalized: '', meanings: [] };
    const clean = rawWord
      .replace(/^[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+/gu, '')
      .replace(/[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+$/gu, '')
      .trim();
    const norm = normalizeArabic(clean);

    // 1. Direct dictionary match
    const direct = tryArabicDirect(clean) || tryArabicDirect(norm);
    if (direct) {
      return { word: clean, normalized: norm, meanings: direct.slice(0, 3), root: norm };
    }

    // 2. High-Order Multi-Clitic Deconstruction Engine (For complex words like "أفأسقيناكموها", "أفنلزمكموها", "فسيكفيكهم")
    const complexRes = deconstructComplexArabicWord(norm) || deconstructComplexArabicWord(clean);
    if (complexRes) {
      return {
        word: clean,
        normalized: norm,
        meanings: complexRes.meanings.slice(0, 3),
        root: complexRes.rootLemma,
        details: complexRes.details
      };
    }

    // Helper to evaluate candidate stems and handle Taa Marbuta / weak vowels
    const evaluateBase = (stem: string): { meanings: string[]; matchedLemma: string } | null => {
      if (!stem || stem.length < 2) return null;

      // Direct check
      const hit = tryArabicDirect(stem);
      if (hit) return { meanings: hit, matchedLemma: stem };

      // In Arabic, feminine 'ة' becomes 'ت' before attached pronouns (e.g. سفينة + ه = سفينته)
      if (stem.endsWith('ت') && stem.length >= 2) {
        const withMarbuta = stem.slice(0, -1) + 'ة';
        const hitMarbuta = tryArabicDirect(withMarbuta);
        if (hitMarbuta) return { meanings: hitMarbuta, matchedLemma: withMarbuta };
      }

      // Add Taa Marbuta
      const withAddedTeh = tryArabicDirect(stem + 'ة');
      if (withAddedTeh) return { meanings: withAddedTeh, matchedLemma: stem + 'ة' };

      // Five nouns weak vowels (أخو/أخي/أخا -> أخ, أبو/أبي/أبا -> أب)
      if (['اخو', 'اخي', 'اخا'].includes(stem)) {
        const hitAkh = tryArabicDirect('اخ') || tryArabicDirect('اخو');
        if (hitAkh) return { meanings: hitAkh, matchedLemma: 'اخ' };
      }
      if (['ابو', 'ابي', 'ابا'].includes(stem)) {
        const hitAb = tryArabicDirect('اب') || tryArabicDirect('ابو');
        if (hitAb) return { meanings: hitAb, matchedLemma: 'اب' };
      }

      return null;
    };

    // Arabic Attached Pronouns (Ordered from longest to shortest)
    const ARABIC_ATTACHED_PRONOUNS = [
      'تكما', 'تكم', 'تكن', 'تهما', 'تهم', 'تهن', 'تها', 'تنا', 'تك', 'ته', 'تي',
      'كما', 'هما', 'كم', 'كن', 'هم', 'هن', 'ها', 'نا', 'ك', 'ه', 'ي', 'ني'
    ];

    // Arabic Dual & Plural Suffixes
    const ARABIC_SUFFIXES = [
      'تان', 'تين', 'ان', 'ين', 'ون', 'ات', 'وا'
    ];

    // Arabic Prefixes (Conjunctions, Prepositions, Future Particles, Definite Articles)
    const ARABIC_PREFIXES = [
      'فبال', 'وبال', 'فكال', 'وكال', 'فلل', 'ولل',
      'بال', 'فال', 'وال', 'كال', 'لل', 'ال',
      'وس', 'فس',
      'وب', 'فب', 'ول', 'فل', 'وك', 'فك',
      'و', 'ف', 'ب', 'ل', 'ك', 'س'
    ];

    // 3. Pass 1: Attached Pronouns Stripping
    for (const pron of ARABIC_ATTACHED_PRONOUNS) {
      if (norm.endsWith(pron) && norm.length - pron.length >= 2) {
        const base = norm.slice(0, -pron.length);
        const res = evaluateBase(base);
        if (res) {
          return { word: clean, normalized: norm, meanings: res.meanings.slice(0, 3), root: res.matchedLemma };
        }
      }
    }

    // 4. Pass 2: Dual & Plural Suffixes Stripping
    for (const suf of ARABIC_SUFFIXES) {
      if (norm.endsWith(suf) && norm.length - suf.length >= 2) {
        const base = norm.slice(0, -suf.length);
        const res = evaluateBase(base);
        if (res) {
          return { word: clean, normalized: norm, meanings: res.meanings.slice(0, 3), root: res.matchedLemma };
        }
      }
    }

    // 5. Pass 3: Prefixes Stripping
    for (const pref of ARABIC_PREFIXES) {
      if (norm.startsWith(pref) && norm.length - pref.length >= 2) {
        const stripped = norm.slice(pref.length);
        const res = evaluateBase(stripped);
        if (res) {
          return { word: clean, normalized: norm, meanings: res.meanings.slice(0, 3), root: res.matchedLemma };
        }

        // Pass 3b: Prefix + Pronouns Stripping (e.g. فابنكما -> فـ + ابن + كما -> ابن)
        for (const pron of ARABIC_ATTACHED_PRONOUNS) {
          if (stripped.endsWith(pron) && stripped.length - pron.length >= 2) {
            const subBase = stripped.slice(0, -pron.length);
            const subRes = evaluateBase(subBase);
            if (subRes) {
              return { word: clean, normalized: norm, meanings: subRes.meanings.slice(0, 3), root: subRes.matchedLemma };
            }
          }
        }

        // Pass 3c: Prefix + Suffixes Stripping (e.g. والمسافرون -> و + ال + مسافر + ون -> مسافر)
        for (const suf of ARABIC_SUFFIXES) {
          if (stripped.endsWith(suf) && stripped.length - suf.length >= 2) {
            const subBase = stripped.slice(0, -suf.length);
            const subRes = evaluateBase(subBase);
            if (subRes) {
              return { word: clean, normalized: norm, meanings: subRes.meanings.slice(0, 3), root: subRes.matchedLemma };
            }
          }
        }
      }
    }

    return { word: clean, normalized: norm, meanings: [] };
  }

  // Multi-pass Deconstruction Algorithm for Complex Arabic Words ("أفأسقيناكموها")
  function deconstructComplexArabicWord(normWord: string): { meanings: string[]; rootLemma: string; details?: string } | null {
    if (!normWord || normWord.length < 4) return null;

    let norm = normalizeArabic(normWord);

    // Compound Multi-Object Clitics
    const COMPOUND_CLITICS = [
      'ناكموها', 'ناكموه', 'تكموها', 'تكموه', 'كموها', 'كموه', 'تموها', 'تموه',
      'ناهموها', 'ناهموه', 'هموها', 'هموه', 'نيها', 'نيه', 'كها', 'كه',
      'ناكم', 'ناهم', 'تكم', 'تهم', 'تموني', 'تمونا', 'تموهم', 'تموهن',
      'وها', 'وه', 'وهما', 'وهم', 'وهن', 'نا', 'كم', 'هم', 'هن', 'ها', 'ك', 'ه', 'ي', 'ني'
    ];

    // Compound Interrogative & Conjunction Prefixes
    const COMPOUND_PREFIXES = [
      'أفأس', 'أفأ', 'أوا', 'أفس', 'أوس', 'فسي', 'فسأ', 'فسن', 'فست',
      'أف', 'أو', 'فلي', 'ولت', 'ولن', 'فلن', 'أبال', 'أفبال', 'أوبال',
      'فبال', 'وبال', 'فكال', 'وكال', 'فلل', 'ولل',
      'بال', 'فال', 'وال', 'كال', 'لل', 'ال',
      'وس', 'فس', 'وب', 'فب', 'ول', 'فل', 'وك', 'فك',
      'و', 'ف', 'ب', 'ل', 'ك', 'س', 'أ'
    ];

    // Test Prefixes + Clitics
    for (const pref of COMPOUND_PREFIXES) {
      if (norm.startsWith(pref) && norm.length - pref.length >= 3) {
        const afterPref = norm.slice(pref.length);

        // Try direct after prefix
        const directHit = tryArabicDirect(afterPref);
        if (directHit) return { meanings: directHit, rootLemma: afterPref, details: `سابق: ${pref}` };

        for (const clitic of COMPOUND_CLITICS) {
          if (afterPref.endsWith(clitic) && afterPref.length - clitic.length >= 2) {
            let candidate = afterPref.slice(0, -clitic.length);

            const candidatesToTry = [
              candidate,
              candidate + 'ى',
              candidate + 'ا',
              candidate.replace(/ي$/, 'ى'),
              candidate.replace(/ي$/, 'ا'),
              candidate.startsWith('أ') ? candidate.slice(1) : candidate,
              candidate.startsWith('ا') ? candidate.slice(1) : candidate
            ];

            for (const cand of candidatesToTry) {
              if (cand.length >= 2) {
                const hit = tryArabicDirect(cand);
                if (hit) {
                  return {
                    meanings: hit,
                    rootLemma: cand,
                    details: `سابق: ${pref} + لاحق: ${clitic}`
                  };
                }
              }
            }
          }
        }
      }
    }

    // Test Clitics alone
    for (const clitic of COMPOUND_CLITICS) {
      if (norm.endsWith(clitic) && norm.length - clitic.length >= 3) {
        let candidate = norm.slice(0, -clitic.length);
        const candidatesToTry = [
          candidate,
          candidate + 'ى',
          candidate + 'ا',
          candidate.replace(/ي$/, 'ى'),
          candidate.replace(/ي$/, 'ا')
        ];

        for (const cand of candidatesToTry) {
          if (cand.length >= 2) {
            const hit = tryArabicDirect(cand);
            if (hit) {
              return {
                meanings: hit,
                rootLemma: cand,
                details: `لاحق: ${clitic}`
              };
            }
          }
        }
      }
    }

    return null;
  }

  function lookupEnglish(rawWord: string): { word: string; normalized: string; meanings: string[] } {
    if (!rawWord) return { word: '', normalized: '', meanings: [] };
    const norm = normalizeEnglish(rawWord);
    if (!norm) return { word: rawWord, normalized: '', meanings: [] };

    if (enArLexicon[norm]) {
      return { word: rawWord, normalized: norm, meanings: enArLexicon[norm].slice(0, 3) };
    }

    // Stems
    if (norm.endsWith('s') && norm.length > 3 && enArLexicon[norm.slice(0, -1)]) {
      return { word: rawWord, normalized: norm.slice(0, -1), meanings: enArLexicon[norm.slice(0, -1)].slice(0, 3) };
    }
    if (norm.endsWith('es') && norm.length > 4 && enArLexicon[norm.slice(0, -2)]) {
      return { word: rawWord, normalized: norm.slice(0, -2), meanings: enArLexicon[norm.slice(0, -2)].slice(0, 3) };
    }
    if (norm.endsWith('ed') && norm.length > 4) {
      if (enArLexicon[norm.slice(0, -2)]) {
        return { word: rawWord, normalized: norm.slice(0, -2), meanings: enArLexicon[norm.slice(0, -2)].slice(0, 3) };
      }
      if (enArLexicon[norm.slice(0, -1)]) {
        return { word: rawWord, normalized: norm.slice(0, -1), meanings: enArLexicon[norm.slice(0, -1)].slice(0, 3) };
      }
    }
    if (norm.endsWith('ing') && norm.length > 5) {
      if (enArLexicon[norm.slice(0, -3)]) {
        return { word: rawWord, normalized: norm.slice(0, -3), meanings: enArLexicon[norm.slice(0, -3)].slice(0, 3) };
      }
      if (enArLexicon[norm.slice(0, -3) + 'e']) {
        return { word: rawWord, normalized: norm.slice(0, -3) + 'e', meanings: enArLexicon[norm.slice(0, -3) + 'e'].slice(0, 3) };
      }
    }

    return { word: rawWord, normalized: norm, meanings: [] };
  }

  // --- API Endpoints ---
  app.get('/api/lexicon/ar-en', (req, res) => {
    const word = (req.query.word as string) || '';
    if (Object.keys(arEnLexicon).length === 0) {
      loadLexicons();
    }
    const result = lookupArabic(word);
    res.json(result);
  });

  app.get('/api/lexicon/en-ar', (req, res) => {
    const word = (req.query.word as string) || '';
    if (Object.keys(enArLexicon).length === 0) {
      loadLexicons();
    }
    const result = lookupEnglish(word);
    res.json(result);
  });

  app.get('/api/metadata', (_req, res) => {
    if (Object.keys(arEnLexicon).length === 0) {
      loadLexicons();
    }
    res.json({
      ...metadata,
      loadedArabicEntries: Object.keys(arEnLexicon).length,
      loadedEnglishEntries: Object.keys(enArLexicon).length,
      status: 'healthy'
    });
  });

  // Phonetic & Transliteration Helper
  function arabicToPhonetic(ar: string): string {
    if (!ar) return '';
    let s = normalizeArabic(ar);
    if (s.startsWith('ال') && s.length > 3) s = s.slice(2);
    s = s
      .replace(/[أإآء]/g, '')
      .replace(/ب/g, 'b')
      .replace(/ت/g, 't')
      .replace(/ث/g, 'th')
      .replace(/ج/g, 'j')
      .replace(/ح/g, 'h')
      .replace(/خ/g, 'kh')
      .replace(/د/g, 'd')
      .replace(/ذ/g, 'dh')
      .replace(/ر/g, 'r')
      .replace(/ز/g, 'z')
      .replace(/س/g, 's')
      .replace(/ش/g, 'sh')
      .replace(/ص/g, 's')
      .replace(/ض/g, 'd')
      .replace(/ط/g, 't')
      .replace(/ظ/g, 'z')
      .replace(/ع/g, '')
      .replace(/غ/g, 'gh')
      .replace(/ف/g, 'f')
      .replace(/ق/g, 'q')
      .replace(/ك/g, 'k')
      .replace(/ل/g, 'l')
      .replace(/م/g, 'm')
      .replace(/ن/g, 'n')
      .replace(/ه/g, 'h')
      .replace(/و/g, 'w')
      .replace(/ي/g, 'y')
      .replace(/ة/g, 'a')
      .replace(/ى/g, 'a');
    return s.toLowerCase().trim();
  }

  function englishToPhonetic(en: string): string {
    if (!en) return '';
    let s = normalizeEnglish(en);
    if (s.startsWith('al-')) s = s.slice(3);
    else if (s.startsWith('al') && s.length > 4) s = s.slice(2);
    s = s
      .replace(/ph/g, 'f')
      .replace(/ck/g, 'k')
      .replace(/c(?=[eiy])/g, 's')
      .replace(/c/g, 'k')
      .replace(/ee/g, 'i')
      .replace(/oo/g, 'u')
      .replace(/ou/g, 'u')
      .replace(/ea/g, 'i');
    return s.toLowerCase().trim();
  }

  function phoneticSimilarity(arWord: string, enWord: string): number {
    const normAr = normalizeArabic(arWord);
    const cleanEn = normalizeEnglish(enWord);
    if (!normAr || !cleanEn) return 0;
    // Strict length check: do NOT match short 1-2 letter words phonetically
    if (cleanEn.length < 3 || normAr.length < 3) return 0;
    if (ENGLISH_STOPWORDS.has(cleanEn)) return 0;

    const arPhon = arabicToPhonetic(normAr);
    const enPhon = englishToPhonetic(cleanEn);

    if (arPhon.length >= 3 && enPhon.length >= 3) {
      if (arPhon === enPhon) return 1.0;
      if (cleanEn === 'almustafa' && normAr.includes('مصطفي')) return 1.0;
      if (cleanEn === 'mustafa' && normAr.includes('مصطفي')) return 1.0;
      if (cleanEn.includes('orphalese') && normAr.includes('اورفليس')) return 1.0;
      if (cleanEn.includes('gibran') && normAr.includes('جبران')) return 1.0;
      if (cleanEn.includes('khalil') && normAr.includes('خليل')) return 1.0;

      const arConsonants = arPhon.replace(/[aeiouwy]/g, '');
      const enConsonants = enPhon.replace(/[aeiouwy]/g, '');
      if (arConsonants.length >= 3 && enConsonants.length >= 3) {
        if (arConsonants === enConsonants) return 0.95;
      }
    }

    return 0;
  }

  // Advanced Disambiguated Contextual Alignment in Target Sentence (Guaranteed real token in target text)
  function findContextualMatchInTarget(
    word: string, 
    direction: 'ar-en' | 'en-ar', 
    sourceSentence: string,
    targetSentence: string,
    lexiconMeanings: string[]
  ): { exactMatchedWord: string; contextualMeaning: string; explanation: string } {
    if (!targetSentence || !targetSentence.trim()) {
      return {
        exactMatchedWord: lexicalMeanings[0] || word,
        contextualMeaning: lexicalMeanings[0] || word,
        explanation: 'الترجمة المعجمية العامة.'
      };
    }

    if (direction === 'ar-en') {
      const enTokens = targetSentence.split(/[\s\p{P}«»“”()\[\]{}،.:؛!؟\-_—–]+/u).filter(Boolean);
      const arTokens = sourceSentence ? sourceSentence.split(/[\s\p{P}«»“”()\[\]{}،.:؛!؟\-_—–]+/u).filter(Boolean) : [];
      const cleanWord = normalizeArabic(word);
      const wordIdx = arTokens.findIndex(t => normalizeArabic(t).includes(cleanWord) || cleanWord.includes(normalizeArabic(t)));
      const relPosSource = wordIdx >= 0 && arTokens.length > 0 ? wordIdx / arTokens.length : 0.5;

      type Candidate = {
        token: string;
        meaning: string;
        score: number;
        reason: string;
      };

      const candidates: Candidate[] = [];

      for (let j = 0; j < enTokens.length; j++) {
        const token = enTokens[j];
        const cleanTok = normalizeEnglish(token);
        if (!cleanTok) continue;

        const isStopword = ENGLISH_STOPWORDS.has(cleanTok);
        const relPosTarget = j / enTokens.length;
        const posDistance = Math.abs(relPosSource - relPosTarget);
        const posPenalty = 1.0 - posDistance * 0.4;

        // 1. Phonetic / Transliteration Match (Top Priority for Names & Special Terms)
        if (!isStopword) {
          const phonSim = phoneticSimilarity(word, token);
          if (phonSim > 0.85) {
            candidates.push({
              token,
              meaning: token,
              score: 300 * phonSim * posPenalty,
              reason: 'مطابقة اسم علم / مصطلح معرب مباشر في النص المقابل.'
            });
          }
        }

        // 2. Lexical Meaning Match
        for (let mIdx = 0; mIdx < lexiconMeanings.length; mIdx++) {
          const meaning = lexiconMeanings[mIdx];
          const cleanMeaning = normalizeEnglish(meaning);
          if (!cleanMeaning) continue;

          if (isStopword && cleanMeaning !== cleanTok) continue;

          if (cleanTok === cleanMeaning) {
            const rankScore = mIdx === 0 ? 220 : 170;
            candidates.push({
              token,
              meaning,
              score: rankScore * posPenalty,
              reason: 'مطابقة معجمية دقيقة مع الكلمة الموجودة في النص المقابل.'
            });
          } else if (cleanTok.length >= 3 && cleanMeaning.length >= 3) {
            if (cleanTok.startsWith(cleanMeaning) || cleanMeaning.startsWith(cleanTok)) {
              const rankScore = mIdx === 0 ? 150 : 110;
              candidates.push({
                token,
                meaning,
                score: rankScore * posPenalty,
                reason: 'مطابقة جذر لغوي مع الكلمة الموجودة في النص المقابل.'
              });
            }
          }
        }

        // 3. Positional Candidate Fallback for Non-Stopwords
        if (!isStopword && cleanTok.length >= 3) {
          const positionScore = 80 * (1.0 - posDistance);
          candidates.push({
            token,
            meaning: token,
            score: positionScore,
            reason: 'مطابقة موقعية سياقية داخل النص المقابل (المعالج المحرك المحلي).'
          });
        }
      }

      candidates.sort((a, b) => b.score - a.score);

      if (candidates.length > 0) {
        return {
          exactMatchedWord: candidates[0].token,
          contextualMeaning: candidates[0].meaning,
          explanation: candidates[0].reason
        };
      }

      const nonStopTokens = enTokens.filter(t => !ENGLISH_STOPWORDS.has(normalizeEnglish(t)));
      const chosenToken = nonStopTokens[0] || enTokens[0] || lexicalMeanings[0] || word;
      return {
        exactMatchedWord: chosenToken,
        contextualMeaning: chosenToken,
        explanation: 'مطابقة موقعية داخل النص المقابل.'
      };
    } else {
      // English -> Arabic direction
      const arTokens = targetSentence.split(/[\s\p{P}«»“”()\[\]{}،.:؛!؟\-_—–]+/u).filter(Boolean);
      const enTokens = sourceSentence ? sourceSentence.split(/[\s\p{P}«»“”()\[\]{}،.:؛!؟\-_—–]+/u).filter(Boolean) : [];
      const cleanWord = normalizeEnglish(word);
      const wordIdx = enTokens.findIndex(t => normalizeEnglish(t) === cleanWord);
      const relPosSource = wordIdx >= 0 && enTokens.length > 0 ? wordIdx / enTokens.length : 0.5;

      type Candidate = {
        token: string;
        meaning: string;
        score: number;
        reason: string;
      };

      const candidates: Candidate[] = [];

      for (let j = 0; j < arTokens.length; j++) {
        const token = arTokens[j];
        const normTok = normalizeArabic(token);
        if (!normTok || normTok.length < 2) continue;

        const relPosTarget = j / arTokens.length;
        const posDistance = Math.abs(relPosSource - relPosTarget);
        const posPenalty = 1.0 - posDistance * 0.4;

        // 1. Phonetic Match
        const phonSim = phoneticSimilarity(token, word);
        if (phonSim > 0.85) {
          candidates.push({
            token,
            meaning: token,
            score: 300 * phonSim * posPenalty,
            reason: 'مطابقة اسم علم / مصطلح معرب مباشر في النص المقابل.'
          });
        }

        // 2. Lexical Meaning Match
        for (let mIdx = 0; mIdx < lexiconMeanings.length; mIdx++) {
          const meaning = lexiconMeanings[mIdx];
          const normMeaning = normalizeArabic(meaning);
          if (!normMeaning) continue;

          if (normTok === normMeaning) {
            const rankScore = mIdx === 0 ? 220 : 170;
            candidates.push({
              token,
              meaning,
              score: rankScore * posPenalty,
              reason: 'مطابقة معجمية دقيقة مع الكلمة الموجودة في النص المقابل.'
            });
          } else if (normTok.length >= 3 && (normTok.includes(normMeaning) || normMeaning.includes(normTok))) {
            const rankScore = mIdx === 0 ? 150 : 110;
            candidates.push({
              token,
              meaning,
              score: rankScore * posPenalty,
              reason: 'مطابقة لغوية مع كلمة موجودة في النص المقابل.'
            });
          }
        }

        // 3. Positional Candidate Fallback
        if (normTok.length >= 3) {
          const positionScore = 80 * (1.0 - posDistance);
          candidates.push({
            token,
            meaning: token,
            score: positionScore,
            reason: 'مطابقة موقعية سياقية داخل النص المقابل (المعالج المحلي).'
          });
        }
      }

      candidates.sort((a, b) => b.score - a.score);

      if (candidates.length > 0) {
        return {
          exactMatchedWord: candidates[0].token,
          contextualMeaning: candidates[0].meaning,
          explanation: candidates[0].reason
        };
      }

      const chosenToken = arTokens[0] || lexicalMeanings[0] || word;
      return {
        exactMatchedWord: chosenToken,
        contextualMeaning: chosenToken,
        explanation: 'مطابقة موقعية داخل النص المقابل.'
      };
    }
  }

  // AI Status Check Endpoint
  app.get('/api/ai/status', (_req, res) => {
    const client = getGeminiClient();
    res.json({
      aiAvailable: !!client,
      model: 'gemini-2.5-flash',
      status: client ? 'connected' : 'no_api_key',
      message: client
        ? 'الذكاء الاصطناعي متصل وجاهز (Gemini 2.5 Flash / 3.8 Flash)'
        : 'مفتاح Gemini API غير متوفر في إعدادات البيئة (Settings > Secrets).'
    });
  });

  // AI Contextual Translation & Word Alignment Route
  app.post('/api/ai/context-translation', async (req, res) => {
    const { word, direction, sourceContext, targetContext } = req.body;
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const dictLookup = direction === 'ar-en' ? lookupArabic(word) : lookupEnglish(word);
    const lexicalMeanings = dictLookup?.meanings || [];
    const sourceSentence = sourceContext?.current || '';
    const targetSentence = targetContext?.current || '';

    const geminiClient = getGeminiClient();
    let geminiFailureReason = '';

    if (geminiClient) {
      try {
        const sourceLang = direction === 'ar-en' ? 'Arabic' : 'English';
        const targetLang = direction === 'ar-en' ? 'English' : 'Arabic';

        const prompt = `Task: Given a selected ${sourceLang} word from the source sentence, identify the exact corresponding counterpart word/phrase in the facing ${targetLang} sentence.

Source Sentence (${sourceLang}): "${sourceSentence}"
Selected Word: "${word}"
Facing Target Sentence (${targetLang}): "${targetSentence}"

Guidelines:
- If the word is a proper name/transliteration (e.g. "المصطفى" -> "Almustafa", not "the chosen"), return the exact transliterated name.
- Distinguish carefully between adjacent adjectives and nouns (e.g., in "المصطفى، المختار", "المصطفى" is "Almustafa", "المختار" is "chosen").
- Return valid JSON matching the schema.`;

        // Try supported Gemini models in sequence
        let aiResult: any = null;
        const modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

        for (const mName of modelsToTry) {
          try {
            const response = await geminiClient.models.generateContent({
              model: mName,
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    exactMatchedWord: {
                      type: Type.STRING,
                      description: 'The exact word or phrase in the facing target text corresponding to the clicked word.',
                    },
                    contextualMeaning: {
                      type: Type.STRING,
                      description: 'The contextual translation of the selected word in this specific passage.',
                    },
                    explanation: {
                      type: Type.STRING,
                      description: 'A brief note explaining why this counterpart was matched.',
                    },
                  },
                  required: ['exactMatchedWord', 'contextualMeaning'],
                },
              },
            });
            const parsed = JSON.parse(response.text?.trim() || '{}');
            if (parsed && parsed.exactMatchedWord) {
              aiResult = parsed;
              break;
            }
          } catch (modelErr: any) {
            geminiFailureReason = modelErr?.message || 'تعذر استدعاء النموذج';
          }
        }

        if (aiResult && aiResult.exactMatchedWord) {
          return res.json({
            word,
            exactMatchedWord: aiResult.exactMatchedWord,
            contextualMeaning: aiResult.contextualMeaning || aiResult.exactMatchedWord,
            explanation: aiResult.explanation || 'تم التحليل والمطابقة بواسطة الذكاء الاصطناعي (Gemini).',
            status: 'success',
            source: 'gemini',
            aiConnected: true,
            aiStatusMessage: 'تمت الترجمة والمطابقة بنجاح بواسطة الذكاء الاصطناعي (Gemini).'
          });
        }
      } catch (aiErr: any) {
        geminiFailureReason = aiErr?.message || 'خطأ غير متوقع';
      }
    } else {
      geminiFailureReason = 'مفتاح Gemini API غير مفعل أو غير ممرر للبيئة';
    }

    // Advanced Disambiguated Fallback Engine (Guaranteed real token in facing sentence)
    const fallbackMatch = findContextualMatchInTarget(word, direction, sourceSentence, targetSentence, lexicalMeanings);
    return res.json({
      word,
      exactMatchedWord: fallbackMatch.exactMatchedWord,
      contextualMeaning: fallbackMatch.contextualMeaning,
      explanation: fallbackMatch.explanation,
      status: 'success',
      source: 'local_engine',
      aiConnected: false,
      aiStatusMessage: geminiFailureReason
        ? `تعذر الاتصال بـ Gemini (${geminiFailureReason}). تم استخراج المطابقة من النص المقابل عبر المحرك المحلي.`
        : 'الذكاء الاصطناعي غير متصل. تم استخدام المحرك السياقي المحلي الفوري.'
    });
  });

  // Mount Vite in dev mode
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);

  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
  });
}

startServer();
