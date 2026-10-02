import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  function lookupArabic(rawWord: string): { word: string; normalized: string; meanings: string[]; root?: string } {
    if (!rawWord) return { word: '', normalized: '', meanings: [] };
    const clean = rawWord
      .replace(/^[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+/gu, '')
      .replace(/[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+$/gu, '')
      .trim();
    const norm = normalizeArabic(clean);

    // 1. Direct match
    if (arEnLexicon[clean]) {
      return { word: clean, normalized: norm, meanings: arEnLexicon[clean].slice(0, 3) };
    }
    if (arEnLexicon[norm]) {
      return { word: clean, normalized: norm, meanings: arEnLexicon[norm].slice(0, 3) };
    }

    // 2. Taa Marbuta / Heh interchangeable check
    if (norm.endsWith('ه')) {
      const withTeh = norm.slice(0, -1) + 'ة';
      if (arEnLexicon[withTeh]) {
        return { word: clean, normalized: norm, meanings: arEnLexicon[withTeh].slice(0, 3) };
      }
    } else if (norm.endsWith('ة')) {
      const withHeh = norm.slice(0, -1) + 'ه';
      if (arEnLexicon[withHeh]) {
        return { word: clean, normalized: norm, meanings: arEnLexicon[withHeh].slice(0, 3) };
      }
    }

    // 3. Attached Pronouns
    const pronouns = ['هما', 'كم', 'هن', 'هم', 'ها', 'نا', 'ه', 'ك', 'ي'];
    for (const pron of pronouns) {
      if (norm.endsWith(pron) && norm.length - pron.length >= 2) {
        const base = norm.slice(0, -pron.length);
        if (arEnLexicon[base]) {
          return { word: clean, normalized: norm, meanings: arEnLexicon[base].slice(0, 3) };
        }
        const baseTeh = base + 'ة';
        if (arEnLexicon[baseTeh]) {
          return { word: clean, normalized: norm, meanings: arEnLexicon[baseTeh].slice(0, 3) };
        }
      }
    }

    // 4. Plural / Dual Suffixes
    const suffixes = ['ون', 'ين', 'ان', 'ات'];
    for (const suf of suffixes) {
      if (norm.endsWith(suf) && norm.length - suf.length >= 2) {
        const base = norm.slice(0, -suf.length);
        if (arEnLexicon[base]) {
          return { word: clean, normalized: norm, meanings: arEnLexicon[base].slice(0, 3) };
        }
        const baseTeh = base + 'ة';
        if (arEnLexicon[baseTeh]) {
          return { word: clean, normalized: norm, meanings: arEnLexicon[baseTeh].slice(0, 3) };
        }
      }
    }

    // 5. Definite Article الـ
    if (norm.startsWith('ال') && norm.length > 3) {
      const stripped = norm.slice(2);
      if (arEnLexicon[stripped]) {
        return { word: clean, normalized: norm, meanings: arEnLexicon[stripped].slice(0, 3) };
      }
      for (const pron of pronouns) {
        if (stripped.endsWith(pron) && stripped.length - pron.length >= 2) {
          const base = stripped.slice(0, -pron.length);
          if (arEnLexicon[base]) {
            return { word: clean, normalized: norm, meanings: arEnLexicon[base].slice(0, 3) };
          }
        }
      }
    }

    // 6. Common Conjunctions / Prepositions (و, ف, ب, ل, ك)
    for (const pref of ['و', 'ف', 'ب', 'ل', 'ك']) {
      if (norm.startsWith(pref) && norm.length > 3) {
        const stripped = norm.slice(1);
        if (arEnLexicon[stripped]) {
          return { word: clean, normalized: norm, meanings: arEnLexicon[stripped].slice(0, 3) };
        }
        if (stripped.startsWith('ال') && stripped.length > 3) {
          const strippedBoth = stripped.slice(2);
          if (arEnLexicon[strippedBoth]) {
            return { word: clean, normalized: norm, meanings: arEnLexicon[strippedBoth].slice(0, 3) };
          }
        }
      }
    }

    return { word: clean, normalized: norm, meanings: [] };
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
