// server.ts
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
  const cleanKey = (apiKey || "").trim();
  if (!cleanKey || cleanKey === "undefined" || cleanKey === "null") {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: cleanKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  } catch (err) {
    console.error("[Gemini Client Init Error]:", err);
    return null;
  }
}
async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3e3;
  app.use(express.json());
  const possibleDictDirs = [
    path.join(__dirname, "public", "dictionary"),
    path.join(__dirname, "..", "public", "dictionary"),
    path.join(__dirname, "dist", "dictionary"),
    path.join(__dirname, "..", "dist", "dictionary"),
    path.join(process.cwd(), "public", "dictionary"),
    path.join(process.cwd(), "dist", "dictionary")
  ];
  const dictDir = possibleDictDirs.find((d) => fs.existsSync(d)) || path.join(__dirname, "public", "dictionary");
  let arEnLexicon = {};
  let enArLexicon = {};
  let metadata = {};
  function loadLexicons() {
    try {
      const arEnPath = path.join(dictDir, "ar_en_lexicon.json");
      if (fs.existsSync(arEnPath)) {
        arEnLexicon = JSON.parse(fs.readFileSync(arEnPath, "utf-8"));
        console.log(`[Server] Loaded ${Object.keys(arEnLexicon).length} Arabic-English entries.`);
      }
      const enArPath = path.join(dictDir, "en_ar_lexicon.json");
      if (fs.existsSync(enArPath)) {
        enArLexicon = JSON.parse(fs.readFileSync(enArPath, "utf-8"));
        console.log(`[Server] Loaded ${Object.keys(enArLexicon).length} English-Arabic entries.`);
      }
      const metaPath = path.join(dictDir, "dataset_metadata.json");
      if (fs.existsSync(metaPath)) {
        metadata = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      }
    } catch (err) {
      console.error("[Server] Error loading lexicons:", err);
    }
  }
  loadLexicons();
  const ENGLISH_STOPWORDS = /* @__PURE__ */ new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "in",
    "on",
    "at",
    "to",
    "of",
    "for",
    "with",
    "by",
    "from",
    "as",
    "is",
    "was",
    "were",
    "be",
    "been",
    "it",
    "its",
    "his",
    "her",
    "their",
    "my",
    "your",
    "our",
    "that",
    "this",
    "who",
    "whom",
    "which",
    "unto",
    "into",
    "he",
    "she",
    "they",
    "we",
    "i",
    "you"
  ]);
  function normalizeArabic(str) {
    if (!str) return "";
    return str.replace(/[\u064B-\u0652\u0640]/g, "").replace(/[أإآٱ]/g, "\u0627").replace(/ى/g, "\u064A").replace(/ک/g, "\u0643").replace(/ی/g, "\u064A").trim();
  }
  function normalizeEnglish(str) {
    if (!str) return "";
    return str.replace(/^[\s\p{P}«»“”"''`()\[\]{}،.:؛!؟\-_—–]+/gu, "").replace(/[\s\p{P}«»“”"''`()\[\]{}،.:؛!؟\-_—–]+$/gu, "").toLowerCase().trim();
  }
  function tryArabicDirect(query) {
    if (!query) return null;
    if (arEnLexicon[query] && arEnLexicon[query].length > 0) return arEnLexicon[query];
    const norm = normalizeArabic(query);
    if (arEnLexicon[norm] && arEnLexicon[norm].length > 0) return arEnLexicon[norm];
    if (norm.endsWith("\u0647")) {
      const withTeh = norm.slice(0, -1) + "\u0629";
      if (arEnLexicon[withTeh]) return arEnLexicon[withTeh];
    } else if (norm.endsWith("\u0629")) {
      const withHeh = norm.slice(0, -1) + "\u0647";
      if (arEnLexicon[withHeh]) return arEnLexicon[withHeh];
    }
    return null;
  }
  function lookupArabic(rawWord) {
    if (!rawWord) return { word: "", normalized: "", meanings: [] };
    const clean = rawWord.replace(/^[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+/gu, "").replace(/[\s\p{P}«»“”()\[\]{}،.:؛!؟-]+$/gu, "").trim();
    const norm = normalizeArabic(clean);
    const direct = tryArabicDirect(clean) || tryArabicDirect(norm);
    if (direct) {
      return { word: clean, normalized: norm, meanings: direct.slice(0, 3), root: norm };
    }
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
    const evaluateBase = (stem) => {
      if (!stem || stem.length < 2) return null;
      const hit = tryArabicDirect(stem);
      if (hit) return { meanings: hit, matchedLemma: stem };
      if (stem.endsWith("\u062A") && stem.length >= 2) {
        const withMarbuta = stem.slice(0, -1) + "\u0629";
        const hitMarbuta = tryArabicDirect(withMarbuta);
        if (hitMarbuta) return { meanings: hitMarbuta, matchedLemma: withMarbuta };
      }
      const withAddedTeh = tryArabicDirect(stem + "\u0629");
      if (withAddedTeh) return { meanings: withAddedTeh, matchedLemma: stem + "\u0629" };
      if (["\u0627\u062E\u0648", "\u0627\u062E\u064A", "\u0627\u062E\u0627"].includes(stem)) {
        const hitAkh = tryArabicDirect("\u0627\u062E") || tryArabicDirect("\u0627\u062E\u0648");
        if (hitAkh) return { meanings: hitAkh, matchedLemma: "\u0627\u062E" };
      }
      if (["\u0627\u0628\u0648", "\u0627\u0628\u064A", "\u0627\u0628\u0627"].includes(stem)) {
        const hitAb = tryArabicDirect("\u0627\u0628") || tryArabicDirect("\u0627\u0628\u0648");
        if (hitAb) return { meanings: hitAb, matchedLemma: "\u0627\u0628" };
      }
      return null;
    };
    const ARABIC_ATTACHED_PRONOUNS = [
      "\u062A\u0643\u0645\u0627",
      "\u062A\u0643\u0645",
      "\u062A\u0643\u0646",
      "\u062A\u0647\u0645\u0627",
      "\u062A\u0647\u0645",
      "\u062A\u0647\u0646",
      "\u062A\u0647\u0627",
      "\u062A\u0646\u0627",
      "\u062A\u0643",
      "\u062A\u0647",
      "\u062A\u064A",
      "\u0643\u0645\u0627",
      "\u0647\u0645\u0627",
      "\u0643\u0645",
      "\u0643\u0646",
      "\u0647\u0645",
      "\u0647\u0646",
      "\u0647\u0627",
      "\u0646\u0627",
      "\u0643",
      "\u0647",
      "\u064A",
      "\u0646\u064A"
    ];
    const ARABIC_SUFFIXES = [
      "\u062A\u0627\u0646",
      "\u062A\u064A\u0646",
      "\u0627\u0646",
      "\u064A\u0646",
      "\u0648\u0646",
      "\u0627\u062A",
      "\u0648\u0627"
    ];
    const ARABIC_PREFIXES = [
      "\u0641\u0628\u0627\u0644",
      "\u0648\u0628\u0627\u0644",
      "\u0641\u0643\u0627\u0644",
      "\u0648\u0643\u0627\u0644",
      "\u0641\u0644\u0644",
      "\u0648\u0644\u0644",
      "\u0628\u0627\u0644",
      "\u0641\u0627\u0644",
      "\u0648\u0627\u0644",
      "\u0643\u0627\u0644",
      "\u0644\u0644",
      "\u0627\u0644",
      "\u0648\u0633",
      "\u0641\u0633",
      "\u0648\u0628",
      "\u0641\u0628",
      "\u0648\u0644",
      "\u0641\u0644",
      "\u0648\u0643",
      "\u0641\u0643",
      "\u0648",
      "\u0641",
      "\u0628",
      "\u0644",
      "\u0643",
      "\u0633"
    ];
    for (const pron of ARABIC_ATTACHED_PRONOUNS) {
      if (norm.endsWith(pron) && norm.length - pron.length >= 2) {
        const base = norm.slice(0, -pron.length);
        const res = evaluateBase(base);
        if (res) {
          return { word: clean, normalized: norm, meanings: res.meanings.slice(0, 3), root: res.matchedLemma };
        }
      }
    }
    for (const suf of ARABIC_SUFFIXES) {
      if (norm.endsWith(suf) && norm.length - suf.length >= 2) {
        const base = norm.slice(0, -suf.length);
        const res = evaluateBase(base);
        if (res) {
          return { word: clean, normalized: norm, meanings: res.meanings.slice(0, 3), root: res.matchedLemma };
        }
      }
    }
    for (const pref of ARABIC_PREFIXES) {
      if (norm.startsWith(pref) && norm.length - pref.length >= 2) {
        const stripped = norm.slice(pref.length);
        const res = evaluateBase(stripped);
        if (res) {
          return { word: clean, normalized: norm, meanings: res.meanings.slice(0, 3), root: res.matchedLemma };
        }
        for (const pron of ARABIC_ATTACHED_PRONOUNS) {
          if (stripped.endsWith(pron) && stripped.length - pron.length >= 2) {
            const subBase = stripped.slice(0, -pron.length);
            const subRes = evaluateBase(subBase);
            if (subRes) {
              return { word: clean, normalized: norm, meanings: subRes.meanings.slice(0, 3), root: subRes.matchedLemma };
            }
          }
        }
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
  function deconstructComplexArabicWord(normWord) {
    if (!normWord || normWord.length < 4) return null;
    let norm = normalizeArabic(normWord);
    const COMPOUND_CLITICS = [
      "\u0646\u0627\u0643\u0645\u0648\u0647\u0627",
      "\u0646\u0627\u0643\u0645\u0648\u0647",
      "\u062A\u0643\u0645\u0648\u0647\u0627",
      "\u062A\u0643\u0645\u0648\u0647",
      "\u0643\u0645\u0648\u0647\u0627",
      "\u0643\u0645\u0648\u0647",
      "\u062A\u0645\u0648\u0647\u0627",
      "\u062A\u0645\u0648\u0647",
      "\u0646\u0627\u0647\u0645\u0648\u0647\u0627",
      "\u0646\u0627\u0647\u0645\u0648\u0647",
      "\u0647\u0645\u0648\u0647\u0627",
      "\u0647\u0645\u0648\u0647",
      "\u0646\u064A\u0647\u0627",
      "\u0646\u064A\u0647",
      "\u0643\u0647\u0627",
      "\u0643\u0647",
      "\u0646\u0627\u0643\u0645",
      "\u0646\u0627\u0647\u0645",
      "\u062A\u0643\u0645",
      "\u062A\u0647\u0645",
      "\u062A\u0645\u0648\u0646\u064A",
      "\u062A\u0645\u0648\u0646\u0627",
      "\u062A\u0645\u0648\u0647\u0645",
      "\u062A\u0645\u0648\u0647\u0646",
      "\u0648\u0647\u0627",
      "\u0648\u0647",
      "\u0648\u0647\u0645\u0627",
      "\u0648\u0647\u0645",
      "\u0648\u0647\u0646",
      "\u0646\u0627",
      "\u0643\u0645",
      "\u0647\u0645",
      "\u0647\u0646",
      "\u0647\u0627",
      "\u0643",
      "\u0647",
      "\u064A",
      "\u0646\u064A"
    ];
    const COMPOUND_PREFIXES = [
      "\u0623\u0641\u0623\u0633",
      "\u0623\u0641\u0623",
      "\u0623\u0648\u0627",
      "\u0623\u0641\u0633",
      "\u0623\u0648\u0633",
      "\u0641\u0633\u064A",
      "\u0641\u0633\u0623",
      "\u0641\u0633\u0646",
      "\u0641\u0633\u062A",
      "\u0623\u0641",
      "\u0623\u0648",
      "\u0641\u0644\u064A",
      "\u0648\u0644\u062A",
      "\u0648\u0644\u0646",
      "\u0641\u0644\u0646",
      "\u0623\u0628\u0627\u0644",
      "\u0623\u0641\u0628\u0627\u0644",
      "\u0623\u0648\u0628\u0627\u0644",
      "\u0641\u0628\u0627\u0644",
      "\u0648\u0628\u0627\u0644",
      "\u0641\u0643\u0627\u0644",
      "\u0648\u0643\u0627\u0644",
      "\u0641\u0644\u0644",
      "\u0648\u0644\u0644",
      "\u0628\u0627\u0644",
      "\u0641\u0627\u0644",
      "\u0648\u0627\u0644",
      "\u0643\u0627\u0644",
      "\u0644\u0644",
      "\u0627\u0644",
      "\u0648\u0633",
      "\u0641\u0633",
      "\u0648\u0628",
      "\u0641\u0628",
      "\u0648\u0644",
      "\u0641\u0644",
      "\u0648\u0643",
      "\u0641\u0643",
      "\u0648",
      "\u0641",
      "\u0628",
      "\u0644",
      "\u0643",
      "\u0633",
      "\u0623"
    ];
    for (const pref of COMPOUND_PREFIXES) {
      if (norm.startsWith(pref) && norm.length - pref.length >= 3) {
        const afterPref = norm.slice(pref.length);
        const directHit = tryArabicDirect(afterPref);
        if (directHit) return { meanings: directHit, rootLemma: afterPref, details: `\u0633\u0627\u0628\u0642: ${pref}` };
        for (const clitic of COMPOUND_CLITICS) {
          if (afterPref.endsWith(clitic) && afterPref.length - clitic.length >= 2) {
            let candidate = afterPref.slice(0, -clitic.length);
            const candidatesToTry = [
              candidate,
              candidate + "\u0649",
              candidate + "\u0627",
              candidate.replace(/ي$/, "\u0649"),
              candidate.replace(/ي$/, "\u0627"),
              candidate.startsWith("\u0623") ? candidate.slice(1) : candidate,
              candidate.startsWith("\u0627") ? candidate.slice(1) : candidate
            ];
            for (const cand of candidatesToTry) {
              if (cand.length >= 2) {
                const hit = tryArabicDirect(cand);
                if (hit) {
                  return {
                    meanings: hit,
                    rootLemma: cand,
                    details: `\u0633\u0627\u0628\u0642: ${pref} + \u0644\u0627\u062D\u0642: ${clitic}`
                  };
                }
              }
            }
          }
        }
      }
    }
    for (const clitic of COMPOUND_CLITICS) {
      if (norm.endsWith(clitic) && norm.length - clitic.length >= 3) {
        let candidate = norm.slice(0, -clitic.length);
        const candidatesToTry = [
          candidate,
          candidate + "\u0649",
          candidate + "\u0627",
          candidate.replace(/ي$/, "\u0649"),
          candidate.replace(/ي$/, "\u0627")
        ];
        for (const cand of candidatesToTry) {
          if (cand.length >= 2) {
            const hit = tryArabicDirect(cand);
            if (hit) {
              return {
                meanings: hit,
                rootLemma: cand,
                details: `\u0644\u0627\u062D\u0642: ${clitic}`
              };
            }
          }
        }
      }
    }
    return null;
  }
  function lookupEnglish(rawWord) {
    if (!rawWord) return { word: "", normalized: "", meanings: [] };
    const norm = normalizeEnglish(rawWord);
    if (!norm) return { word: rawWord, normalized: "", meanings: [] };
    if (enArLexicon[norm]) {
      return { word: rawWord, normalized: norm, meanings: enArLexicon[norm].slice(0, 3) };
    }
    if (norm.endsWith("s") && norm.length > 3 && enArLexicon[norm.slice(0, -1)]) {
      return { word: rawWord, normalized: norm.slice(0, -1), meanings: enArLexicon[norm.slice(0, -1)].slice(0, 3) };
    }
    if (norm.endsWith("es") && norm.length > 4 && enArLexicon[norm.slice(0, -2)]) {
      return { word: rawWord, normalized: norm.slice(0, -2), meanings: enArLexicon[norm.slice(0, -2)].slice(0, 3) };
    }
    if (norm.endsWith("ed") && norm.length > 4) {
      if (enArLexicon[norm.slice(0, -2)]) {
        return { word: rawWord, normalized: norm.slice(0, -2), meanings: enArLexicon[norm.slice(0, -2)].slice(0, 3) };
      }
      if (enArLexicon[norm.slice(0, -1)]) {
        return { word: rawWord, normalized: norm.slice(0, -1), meanings: enArLexicon[norm.slice(0, -1)].slice(0, 3) };
      }
    }
    if (norm.endsWith("ing") && norm.length > 5) {
      if (enArLexicon[norm.slice(0, -3)]) {
        return { word: rawWord, normalized: norm.slice(0, -3), meanings: enArLexicon[norm.slice(0, -3)].slice(0, 3) };
      }
      if (enArLexicon[norm.slice(0, -3) + "e"]) {
        return { word: rawWord, normalized: norm.slice(0, -3) + "e", meanings: enArLexicon[norm.slice(0, -3) + "e"].slice(0, 3) };
      }
    }
    return { word: rawWord, normalized: norm, meanings: [] };
  }
  app.get("/api/lexicon/ar-en", (req, res) => {
    const word = req.query.word || "";
    if (Object.keys(arEnLexicon).length === 0) {
      loadLexicons();
    }
    const result = lookupArabic(word);
    res.json(result);
  });
  app.get("/api/lexicon/en-ar", (req, res) => {
    const word = req.query.word || "";
    if (Object.keys(enArLexicon).length === 0) {
      loadLexicons();
    }
    const result = lookupEnglish(word);
    res.json(result);
  });
  app.get("/api/metadata", (_req, res) => {
    if (Object.keys(arEnLexicon).length === 0) {
      loadLexicons();
    }
    res.json({
      ...metadata,
      loadedArabicEntries: Object.keys(arEnLexicon).length,
      loadedEnglishEntries: Object.keys(enArLexicon).length,
      status: "healthy"
    });
  });
  function arabicToPhonetic(ar) {
    if (!ar) return "";
    let s = normalizeArabic(ar);
    if (s.startsWith("\u0627\u0644") && s.length > 3) s = s.slice(2);
    s = s.replace(/[أإآء]/g, "").replace(/ب/g, "b").replace(/ت/g, "t").replace(/ث/g, "th").replace(/ج/g, "j").replace(/ح/g, "h").replace(/خ/g, "kh").replace(/د/g, "d").replace(/ذ/g, "dh").replace(/ر/g, "r").replace(/ز/g, "z").replace(/س/g, "s").replace(/ش/g, "sh").replace(/ص/g, "s").replace(/ض/g, "d").replace(/ط/g, "t").replace(/ظ/g, "z").replace(/ع/g, "").replace(/غ/g, "gh").replace(/ف/g, "f").replace(/ق/g, "q").replace(/ك/g, "k").replace(/ل/g, "l").replace(/م/g, "m").replace(/ن/g, "n").replace(/ه/g, "h").replace(/و/g, "w").replace(/ي/g, "y").replace(/ة/g, "a").replace(/ى/g, "a");
    return s.toLowerCase().trim();
  }
  function englishToPhonetic(en) {
    if (!en) return "";
    let s = normalizeEnglish(en);
    if (s.startsWith("al-")) s = s.slice(3);
    else if (s.startsWith("al") && s.length > 4) s = s.slice(2);
    s = s.replace(/ph/g, "f").replace(/ck/g, "k").replace(/c(?=[eiy])/g, "s").replace(/c/g, "k").replace(/ee/g, "i").replace(/oo/g, "u").replace(/ou/g, "u").replace(/ea/g, "i");
    return s.toLowerCase().trim();
  }
  function phoneticSimilarity(arWord, enWord) {
    const normAr = normalizeArabic(arWord);
    const cleanEn = normalizeEnglish(enWord);
    if (!normAr || !cleanEn) return 0;
    if (cleanEn.length < 3 || normAr.length < 3) return 0;
    if (ENGLISH_STOPWORDS.has(cleanEn)) return 0;
    const arPhon = arabicToPhonetic(normAr);
    const enPhon = englishToPhonetic(cleanEn);
    if (arPhon.length >= 3 && enPhon.length >= 3) {
      if (arPhon === enPhon) return 1;
      if (cleanEn === "almustafa" && normAr.includes("\u0645\u0635\u0637\u0641\u064A")) return 1;
      if (cleanEn === "mustafa" && normAr.includes("\u0645\u0635\u0637\u0641\u064A")) return 1;
      if (cleanEn.includes("orphalese") && normAr.includes("\u0627\u0648\u0631\u0641\u0644\u064A\u0633")) return 1;
      if (cleanEn.includes("gibran") && normAr.includes("\u062C\u0628\u0631\u0627\u0646")) return 1;
      if (cleanEn.includes("khalil") && normAr.includes("\u062E\u0644\u064A\u0644")) return 1;
      const arConsonants = arPhon.replace(/[aeiouwy]/g, "");
      const enConsonants = enPhon.replace(/[aeiouwy]/g, "");
      if (arConsonants.length >= 3 && enConsonants.length >= 3) {
        if (arConsonants === enConsonants) return 0.95;
      }
    }
    return 0;
  }
  function findContextualMatchInTarget(word, direction, sourceSentence, targetSentence, lexiconMeanings) {
    if (!targetSentence || !targetSentence.trim()) {
      return {
        exactMatchedWord: lexicalMeanings[0] || word,
        contextualMeaning: lexicalMeanings[0] || word,
        explanation: "\u0627\u0644\u062A\u0631\u062C\u0645\u0629 \u0627\u0644\u0645\u0639\u062C\u0645\u064A\u0629 \u0627\u0644\u0639\u0627\u0645\u0629."
      };
    }
    if (direction === "ar-en") {
      const enTokens = targetSentence.split(/[\s\p{P}«»“”()\[\]{}،.:؛!؟\-_—–]+/u).filter(Boolean);
      const arTokens = sourceSentence ? sourceSentence.split(/[\s\p{P}«»“”()\[\]{}،.:؛!؟\-_—–]+/u).filter(Boolean) : [];
      const cleanWord = normalizeArabic(word);
      const wordIdx = arTokens.findIndex((t) => normalizeArabic(t).includes(cleanWord) || cleanWord.includes(normalizeArabic(t)));
      const relPosSource = wordIdx >= 0 && arTokens.length > 0 ? wordIdx / arTokens.length : 0.5;
      const candidates = [];
      for (let j = 0; j < enTokens.length; j++) {
        const token = enTokens[j];
        const cleanTok = normalizeEnglish(token);
        if (!cleanTok) continue;
        const isStopword = ENGLISH_STOPWORDS.has(cleanTok);
        const relPosTarget = j / enTokens.length;
        const posDistance = Math.abs(relPosSource - relPosTarget);
        const posPenalty = 1 - posDistance * 0.4;
        if (!isStopword) {
          const phonSim = phoneticSimilarity(word, token);
          if (phonSim > 0.85) {
            candidates.push({
              token,
              meaning: token,
              score: 300 * phonSim * posPenalty,
              reason: "\u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0633\u0645 \u0639\u0644\u0645 / \u0645\u0635\u0637\u0644\u062D \u0645\u0639\u0631\u0628 \u0645\u0628\u0627\u0634\u0631 \u0641\u064A \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0642\u0627\u0628\u0644."
            });
          }
        }
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
              reason: "\u0645\u0637\u0627\u0628\u0642\u0629 \u0645\u0639\u062C\u0645\u064A\u0629 \u062F\u0642\u064A\u0642\u0629 \u0645\u0639 \u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0642\u0627\u0628\u0644."
            });
          } else if (cleanTok.length >= 3 && cleanMeaning.length >= 3) {
            if (cleanTok.startsWith(cleanMeaning) || cleanMeaning.startsWith(cleanTok)) {
              const rankScore = mIdx === 0 ? 150 : 110;
              candidates.push({
                token,
                meaning,
                score: rankScore * posPenalty,
                reason: "\u0645\u0637\u0627\u0628\u0642\u0629 \u062C\u0630\u0631 \u0644\u063A\u0648\u064A \u0645\u0639 \u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0642\u0627\u0628\u0644."
              });
            }
          }
        }
        if (!isStopword && cleanTok.length >= 3) {
          const positionScore = 80 * (1 - posDistance);
          candidates.push({
            token,
            meaning: token,
            score: positionScore,
            reason: "\u0645\u0637\u0627\u0628\u0642\u0629 \u0645\u0648\u0642\u0639\u064A\u0629 \u0633\u064A\u0627\u0642\u064A\u0629 \u062F\u0627\u062E\u0644 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0642\u0627\u0628\u0644 (\u0627\u0644\u0645\u0639\u0627\u0644\u062C \u0627\u0644\u0645\u062D\u0631\u0643 \u0627\u0644\u0645\u062D\u0644\u064A)."
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
      const nonStopTokens = enTokens.filter((t) => !ENGLISH_STOPWORDS.has(normalizeEnglish(t)));
      const chosenToken = nonStopTokens[0] || enTokens[0] || lexicalMeanings[0] || word;
      return {
        exactMatchedWord: chosenToken,
        contextualMeaning: chosenToken,
        explanation: "\u0645\u0637\u0627\u0628\u0642\u0629 \u0645\u0648\u0642\u0639\u064A\u0629 \u062F\u0627\u062E\u0644 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0642\u0627\u0628\u0644."
      };
    } else {
      const arTokens = targetSentence.split(/[\s\p{P}«»“”()\[\]{}،.:؛!؟\-_—–]+/u).filter(Boolean);
      const enTokens = sourceSentence ? sourceSentence.split(/[\s\p{P}«»“”()\[\]{}،.:؛!؟\-_—–]+/u).filter(Boolean) : [];
      const cleanWord = normalizeEnglish(word);
      const wordIdx = enTokens.findIndex((t) => normalizeEnglish(t) === cleanWord);
      const relPosSource = wordIdx >= 0 && enTokens.length > 0 ? wordIdx / enTokens.length : 0.5;
      const candidates = [];
      for (let j = 0; j < arTokens.length; j++) {
        const token = arTokens[j];
        const normTok = normalizeArabic(token);
        if (!normTok || normTok.length < 2) continue;
        const relPosTarget = j / arTokens.length;
        const posDistance = Math.abs(relPosSource - relPosTarget);
        const posPenalty = 1 - posDistance * 0.4;
        const phonSim = phoneticSimilarity(token, word);
        if (phonSim > 0.85) {
          candidates.push({
            token,
            meaning: token,
            score: 300 * phonSim * posPenalty,
            reason: "\u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0633\u0645 \u0639\u0644\u0645 / \u0645\u0635\u0637\u0644\u062D \u0645\u0639\u0631\u0628 \u0645\u0628\u0627\u0634\u0631 \u0641\u064A \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0642\u0627\u0628\u0644."
          });
        }
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
              reason: "\u0645\u0637\u0627\u0628\u0642\u0629 \u0645\u0639\u062C\u0645\u064A\u0629 \u062F\u0642\u064A\u0642\u0629 \u0645\u0639 \u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0642\u0627\u0628\u0644."
            });
          } else if (normTok.length >= 3 && (normTok.includes(normMeaning) || normMeaning.includes(normTok))) {
            const rankScore = mIdx === 0 ? 150 : 110;
            candidates.push({
              token,
              meaning,
              score: rankScore * posPenalty,
              reason: "\u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u063A\u0648\u064A\u0629 \u0645\u0639 \u0643\u0644\u0645\u0629 \u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0642\u0627\u0628\u0644."
            });
          }
        }
        if (normTok.length >= 3) {
          const positionScore = 80 * (1 - posDistance);
          candidates.push({
            token,
            meaning: token,
            score: positionScore,
            reason: "\u0645\u0637\u0627\u0628\u0642\u0629 \u0645\u0648\u0642\u0639\u064A\u0629 \u0633\u064A\u0627\u0642\u064A\u0629 \u062F\u0627\u062E\u0644 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0642\u0627\u0628\u0644 (\u0627\u0644\u0645\u0639\u0627\u0644\u062C \u0627\u0644\u0645\u062D\u0644\u064A)."
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
        explanation: "\u0645\u0637\u0627\u0628\u0642\u0629 \u0645\u0648\u0642\u0639\u064A\u0629 \u062F\u0627\u062E\u0644 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0642\u0627\u0628\u0644."
      };
    }
  }
  app.get("/api/ai/status", (_req, res) => {
    const client = getGeminiClient();
    res.json({
      aiAvailable: !!client,
      model: "gemini-2.5-flash",
      status: client ? "connected" : "no_api_key",
      message: client ? "\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0645\u062A\u0635\u0644 \u0648\u062C\u0627\u0647\u0632 (Gemini 2.5 Flash / 3.8 Flash)" : "\u0645\u0641\u062A\u0627\u062D Gemini API \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0628\u064A\u0626\u0629 (Settings > Secrets)."
    });
  });
  app.post("/api/ai/context-translation", async (req, res) => {
    const { word, direction, sourceContext, targetContext } = req.body;
    if (!word) {
      return res.status(400).json({ error: "Word is required" });
    }
    const dictLookup = direction === "ar-en" ? lookupArabic(word) : lookupEnglish(word);
    const lexicalMeanings2 = dictLookup?.meanings || [];
    const sourceSentence = sourceContext?.current || "";
    const targetSentence = targetContext?.current || "";
    const geminiClient = getGeminiClient();
    let geminiFailureReason = "";
    if (geminiClient) {
      try {
        const sourceLang = direction === "ar-en" ? "Arabic" : "English";
        const targetLang = direction === "ar-en" ? "English" : "Arabic";
        const prompt = `Task: Given a selected ${sourceLang} word from the source sentence, identify the exact corresponding counterpart word/phrase in the facing ${targetLang} sentence.

Source Sentence (${sourceLang}): "${sourceSentence}"
Selected Word: "${word}"
Facing Target Sentence (${targetLang}): "${targetSentence}"

Guidelines:
- If the word is a proper name/transliteration (e.g. "\u0627\u0644\u0645\u0635\u0637\u0641\u0649" -> "Almustafa", not "the chosen"), return the exact transliterated name.
- Distinguish carefully between adjacent adjectives and nouns (e.g., in "\u0627\u0644\u0645\u0635\u0637\u0641\u0649\u060C \u0627\u0644\u0645\u062E\u062A\u0627\u0631", "\u0627\u0644\u0645\u0635\u0637\u0641\u0649" is "Almustafa", "\u0627\u0644\u0645\u062E\u062A\u0627\u0631" is "chosen").
- Return valid JSON matching the schema.`;
        let aiResult = null;
        const modelsToTry = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
        for (const mName of modelsToTry) {
          try {
            const response = await geminiClient.models.generateContent({
              model: mName,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    exactMatchedWord: {
                      type: Type.STRING,
                      description: "The exact word or phrase in the facing target text corresponding to the clicked word."
                    },
                    contextualMeaning: {
                      type: Type.STRING,
                      description: "The contextual translation of the selected word in this specific passage."
                    },
                    explanation: {
                      type: Type.STRING,
                      description: "A brief note explaining why this counterpart was matched."
                    }
                  },
                  required: ["exactMatchedWord", "contextualMeaning"]
                }
              }
            });
            const parsed = JSON.parse(response.text?.trim() || "{}");
            if (parsed && parsed.exactMatchedWord) {
              aiResult = parsed;
              break;
            }
          } catch (modelErr) {
            geminiFailureReason = modelErr?.message || "\u062A\u0639\u0630\u0631 \u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0627\u0644\u0646\u0645\u0648\u0630\u062C";
          }
        }
        if (aiResult && aiResult.exactMatchedWord) {
          return res.json({
            word,
            exactMatchedWord: aiResult.exactMatchedWord,
            contextualMeaning: aiResult.contextualMeaning || aiResult.exactMatchedWord,
            explanation: aiResult.explanation || "\u062A\u0645 \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0648\u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629 \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A (Gemini).",
            status: "success",
            source: "gemini",
            aiConnected: true,
            aiStatusMessage: "\u062A\u0645\u062A \u0627\u0644\u062A\u0631\u062C\u0645\u0629 \u0648\u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629 \u0628\u0646\u062C\u0627\u062D \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A (Gemini)."
          });
        }
      } catch (aiErr) {
        geminiFailureReason = aiErr?.message || "\u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639";
      }
    } else {
      geminiFailureReason = "\u0645\u0641\u062A\u0627\u062D Gemini API \u063A\u064A\u0631 \u0645\u0641\u0639\u0644 \u0623\u0648 \u063A\u064A\u0631 \u0645\u0645\u0631\u0631 \u0644\u0644\u0628\u064A\u0626\u0629";
    }
    const fallbackMatch = findContextualMatchInTarget(word, direction, sourceSentence, targetSentence, lexicalMeanings2);
    return res.json({
      word,
      exactMatchedWord: fallbackMatch.exactMatchedWord,
      contextualMeaning: fallbackMatch.contextualMeaning,
      explanation: fallbackMatch.explanation,
      status: "success",
      source: "local_engine",
      aiConnected: false,
      aiStatusMessage: geminiFailureReason ? `\u062A\u0639\u0630\u0631 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0640 Gemini (${geminiFailureReason}). \u062A\u0645 \u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629 \u0645\u0646 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0642\u0627\u0628\u0644 \u0639\u0628\u0631 \u0627\u0644\u0645\u062D\u0631\u0643 \u0627\u0644\u0645\u062D\u0644\u064A.` : "\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u063A\u064A\u0631 \u0645\u062A\u0635\u0644. \u062A\u0645 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u062D\u0631\u0643 \u0627\u0644\u0633\u064A\u0627\u0642\u064A \u0627\u0644\u0645\u062D\u0644\u064A \u0627\u0644\u0641\u0648\u0631\u064A."
    });
  });
  const possibleDistDirs = [
    path.join(__dirname, "dist"),
    path.join(__dirname, "..", "dist"),
    path.join(process.cwd(), "dist")
  ];
  const distDir = possibleDistDirs.find((d) => fs.existsSync(path.join(d, "index.html"))) || path.join(__dirname, "dist");
  const isProd = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distDir, "index.html"));
  if (isProd) {
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
  });
}
startServer();
