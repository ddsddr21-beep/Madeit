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
