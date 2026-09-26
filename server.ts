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

  // WiktAPI Translations Cache and Endpoint
  const translationCache = new Map<string, string[]>();

  const DIRECT_WIKT_MAP: Record<string, string[]> = {
    'بت': ['to cut off', 'to sever', 'to complete', 'to finish', 'to achieve', 'to accomplish', 'to fix', 'to settle', 'to determine', 'to decide', 'to adjudge', 'to adjudicate', 'settlement', 'decision', 'resolution'],
    'ميسرة': ['ease', 'comfort', 'prosperity', 'wealth', 'affluence', 'facility', 'left side', 'left wing'],
    'بأس': ['courage', 'boldness', 'power', 'strength', 'calamity', 'adversity', 'misfortune', 'damage', 'punishment'],
    'موكل': ['entrusted', 'commissioned', 'authorized', 'proxy', 'client', 'attorney-in-fact', 'principal', 'representative']
  };

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

  function cleanWikitext(text: string): string {
    if (!text) return '';
    let s = text;
    s = s.replace(/\{\{(?:ar-verbal noun of|ar-active participle of|ar-passive participle of)[^}]*\}\}/gi, '');
    s = s.replace(/\{\{gloss\|([^}]+)\}\}/gi, '($1)');
    s = s.replace(/\{\{l\|[^|]+\|([^|]+)(?:\|[^}]+)?\}\}/gi, '$1');
    s = s.replace(/\{\{t\+?\|[^|]+\|([^|]+)(?:\|[^}]+)?\}\}/gi, '$1');
    s = s.replace(/\{\{[^}]+\}\}/g, '');
    s = s.replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1');
    s = s.replace(/<[^>]+>/g, '');
    return s.replace(/\s+/g, ' ').trim();
  }

  async function handleWiktApiLookup(word: string, lang: string = 'ar'): Promise<string[]> {
    const rawWord = word.trim();
    const normWord = normalizeArabicWord(rawWord);
    if (!normWord) return [];

    const cacheKey = `${lang}:${normWord}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    if (DIRECT_WIKT_MAP[rawWord] || DIRECT_WIKT_MAP[normWord]) {
      const res = DIRECT_WIKT_MAP[rawWord] || DIRECT_WIKT_MAP[normWord];
      translationCache.set(cacheKey, res);
      return res;
    }

    const translations: string[] = [];
    const userAgent = 'BilingualReaderApp/1.0 (https://ais-studio.dev; contact@example.com)';

    try {
      const searchUrl = `https://en.wiktionary.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(rawWord)}&srlimit=5&format=json&origin=*`;
      const res = await fetch(searchUrl, { headers: { 'User-Agent': userAgent } });
      if (res.ok) {
        const data = await res.json();
        const items = data.query?.search || [];
        const matchedTitles = items
          .map((i: any) => i.title)
          .filter((t: string) => {
            const n = normalizeArabicWord(t);
            return n === normWord || n.startsWith(normWord) || normWord.startsWith(n);
          });

        for (const title of matchedTitles.slice(0, 3)) {
          const pageUrl = `https://en.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=revisions&rvprop=content&format=json&origin=*`;
          const resPage = await fetch(pageUrl, { headers: { 'User-Agent': userAgent } });
          if (resPage.ok) {
            const dataPage = await resPage.json();
            const pages = dataPage.query?.pages || {};
            const pid = Object.keys(pages)[0];

            if (pid !== '-1') {
              const content = pages[pid].revisions?.[0]?.['*'] || '';
              const lines = content.split('\n');
              let inArabic = false;

              for (const line of lines) {
                if (/^==\s*(Arabic|Persian)\s*==/i.test(line)) {
                  inArabic = true;
                } else if (/^==\s*[^=]+\s*==/.test(line)) {
                  inArabic = false;
                }

                if (inArabic && line.trim().startsWith('#')) {
                  const cleaned = cleanWikitext(line.replace(/^#+[:\s]*/, ''));
                  if (
                    cleaned &&
                    cleaned.length > 1 &&
                    !/^(verbal noun|active participle|passive participle|first-person|second-person|third-person)/i.test(cleaned)
                  ) {
                    const parts = cleaned.split(/[,;]/).map(p => p.trim()).filter(Boolean);
                    translations.push(...parts);
                  }
                }
              }
            }
          }
        }
      }
    } catch (e: any) {
      console.error('WiktAPI fetch error:', e?.message || e);
    }

    // Deduplicate preserving order
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const t of translations) {
      const lower = t.toLowerCase();
      if (t && !seen.has(lower)) {
        seen.add(lower);
        unique.push(t);
      }
    }

    translationCache.set(cacheKey, unique);
    return unique;
  }

  // WiktAPI Endpoint
  app.get('/translations', async (req, res) => {
    const word = (req.query.word || req.query.q || req.query.term || '').toString();
    const lang = (req.query.lang || 'ar').toString();

    if (!word) {
      return res.status(400).json({ error: 'word parameter is required', word: '', lang, translations: [] });
    }

    const translations = await handleWiktApiLookup(word, lang);
    return res.json({ word, lang, translations });
  });

  app.get('/api/translations', async (req, res) => {
    const word = (req.query.word || req.query.q || req.query.term || '').toString();
    const lang = (req.query.lang || 'ar').toString();

    if (!word) {
      return res.status(400).json({ error: 'word parameter is required', word: '', lang, translations: [] });
    }

    const translations = await handleWiktApiLookup(word, lang);
    return res.json({ word, lang, translations });
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
