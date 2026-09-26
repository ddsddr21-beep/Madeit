import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production' || fs.existsSync(path.resolve(__dirname, 'dist'));

async function startServer() {
  const app = express();
  app.use(express.json());

  // Gemini API setup
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Check if Gemini is available
  app.get('/api/ai-status', (req, res) => {
    return res.json({ available: !!apiKey });
  });

  // Arabic-English Lexical Dictionary (DrAbdulmalek dataset)
  let lexiconMap: Record<string, string[]> = {};
  try {
    const lexiconPath = path.resolve(__dirname, 'public/dictionary/ar_en_lexicon.json');
    if (fs.existsSync(lexiconPath)) {
      const raw = fs.readFileSync(lexiconPath, 'utf-8');
      lexiconMap = JSON.parse(raw);
      console.log(`Loaded ${Object.keys(lexiconMap).length} lexical dictionary entries into memory.`);
    }
  } catch (e) {
    console.error('Failed to load ar_en_lexicon.json in server:', e);
  }

  function normalizeArabicWord(str: string): string {
    if (!str) return '';
    return str
      .replace(/[\u064B-\u0652\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ک/g, 'ك')
      .replace(/ی/g, 'ي')
      .trim();
  }

  function lookupLexicon(rawWord: string): { word: string; normalized: string; meanings: string[] } {
    if (!rawWord) return { word: '', normalized: '', meanings: [] };
    const clean = rawWord
      .replace(/^[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+/gu, '')
      .replace(/[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+$/gu, '')
      .trim();
    const norm = normalizeArabicWord(clean);

    if (lexiconMap[clean]) {
      return { word: clean, normalized: norm, meanings: lexiconMap[clean].slice(0, 3) };
    }
    if (lexiconMap[norm]) {
      return { word: clean, normalized: norm, meanings: lexiconMap[norm].slice(0, 3) };
    }

    // Try stripping definite article 'ال'
    if (norm.startsWith('ال') && norm.length > 3) {
      const stripped = norm.slice(2);
      if (lexiconMap[stripped]) {
        return { word: clean, normalized: norm, meanings: lexiconMap[stripped].slice(0, 3) };
      }
    }

    // Try stripping common Arabic conjunction prefixes (و, ف, ب, ل, ك)
    for (const prefix of ['و', 'ف', 'ب', 'ل', 'ك']) {
      if (norm.startsWith(prefix) && norm.length > 3) {
        const strippedConj = norm.slice(1);
        if (lexiconMap[strippedConj]) {
          return { word: clean, normalized: norm, meanings: lexiconMap[strippedConj].slice(0, 3) };
        }
        if (strippedConj.startsWith('ال') && strippedConj.length > 3) {
          const strippedBoth = strippedConj.slice(2);
          if (lexiconMap[strippedBoth]) {
            return { word: clean, normalized: norm, meanings: lexiconMap[strippedBoth].slice(0, 3) };
          }
        }
      }
    }

    return { word: clean, normalized: norm, meanings: [] };
  }

  // Local Arabic -> English Lexical Dictionary (DrAbdulmalek dataset)
  app.get('/api/lexicon', (req, res) => {
    const word = (req.query.word || req.query.q || req.query.term || '').toString();
    if (!word) {
      return res.status(400).json({ error: 'word parameter is required', word: '', meanings: [] });
    }
    const result = lookupLexicon(word);
    return res.json(result);
  });

  app.get('/api/lexicon/metadata', (req, res) => {
    try {
      const metaPath = path.resolve(__dirname, 'public/dictionary/dataset_metadata.json');
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        return res.json(meta);
      }
    } catch (e) {
      console.error('Error serving dataset metadata:', e);
    }
    return res.json({
      datasetName: 'arabic-dictionaries-master',
      datasetAuthor: 'DrAbdulmalek',
      sourceUrl: 'https://huggingface.co/datasets/DrAbdulmalek/arabic-dictionaries-master'
    });
  });

  app.post('/api/translate-context', async (req, res) => {
    try {
      if (!ai) {
        return res.status(400).json({ error: 'Gemini API key is not configured.' });
      }

      const { word, sentence, prevSentences, nextSentences, parallelEnglish } = req.body;

      if (!word) {
        return res.status(400).json({ error: 'Word is required' });
      }

      const contextPrompt = `
You are an expert bilingual Arabic-English reading assistant and lexicographer.
Explain the specific contextual meaning of the Arabic word "${word}" in the following sentence:
"${sentence}"

Nearby context sentences (for additional understanding):
${prevSentences && prevSentences.length > 0 ? `- Sentences Before: ${JSON.stringify(prevSentences)}` : '(None)'}
${nextSentences && nextSentences.length > 0 ? `- Sentences After: ${JSON.stringify(nextSentences)}` : '(None)'}
${parallelEnglish ? `- Parallel English Sentence: "${parallelEnglish}"` : ''}

Identify what this Arabic word means *specifically in this sentence context*. 
Return a concise, clean JSON object with two fields:
{
  "contextualMeaning": "Single precise English translation/equivalent for the word in this context",
  "explanation": "A very brief explanation (at most 20 words) explaining why this translation fits this specific context."
}

Do not include any markdown format blocks or code wrap tags. Return the raw JSON string directly.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contextPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText.trim());
      return res.json(parsed);
    } catch (error: any) {
      console.error('Error translating context:', error);
      return res.status(500).json({ error: error?.message || 'Server error translating context' });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // In production, serve build files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
