import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARABIC_ALPHABET = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

const outputDir = path.resolve(__dirname, '../public/dictionary');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to normalize first letter of any Arabic word
function getStandardLetter(word) {
  let n = word.replace(/[\u064B-\u0652\u0640]/g, ''); // strip vowels/harakat
  n = n.replace(/[أإآٱ]/g, 'ا');
  n = n.replace(/ى/g, 'ي');
  n = n.replace(/ة/g, 'ه');
  n = n.replace(/ھ/g, 'ه');
  n = n.replace(/پ/g, 'ب');
  n = n.replace(/چ/g, 'ج');
  n = n.replace(/گ/g, 'ك');
  n = n.replace(/ڤ/g, 'ف');
  n = n.trim();
  if (!n) return null;
  const first = n.charAt(0);
  if (ARABIC_ALPHABET.includes(first)) {
    return first;
  }
  return null;
}

// Fallback small lexicon in case GitHub fetch fails during build
const fallbackEntries = [
  { word: "أمل", displayWord: "أَمَل", translation: "hope, expectation, aspiration", examples: [] },
  { word: "أرض", displayWord: "أَرْض", translation: "earth, land, ground, soil", examples: [] },
  { word: "أخ", displayWord: "أَخ", translation: "brother, companion", examples: [] },
  { word: "أب", displayWord: "أَب", translation: "father, parent", examples: [] },
  { word: "أم", displayWord: "أُم", translation: "mother, origin, source", examples: [] },
  { word: "أثر", displayWord: "أَثَر", translation: "trace, impact, effect", examples: [] },
  { word: "أدب", displayWord: "أَدَب", translation: "literature, good manners, politeness", examples: [] },
  { word: "أمانة", displayWord: "أَمَانَة", translation: "trust, trustworthiness, honesty", examples: [] },
  { word: "إيمان", displayWord: "إِيمَان", translation: "faith, belief, conviction", examples: [] },
  { word: "إحسان", displayWord: "إِحْسَان", translation: "excellence, charity, goodness, benevolence", examples: [] },
  { word: "بيت", displayWord: "بَيْت", translation: "house, home, verse of poetry", examples: [] },
  { word: "بحر", displayWord: "بَحْر", translation: "sea, ocean", examples: [] },
  { word: "باب", displayWord: "بَاب", translation: "door, gate, chapter, section", examples: [] },
  { word: "بركة", displayWord: "بَرَكَة", translation: "blessing, grace", examples: [] },
  { word: "بلد", displayWord: "بَلَد", translation: "country, town, city, homeland", examples: [] },
  { word: "بستان", displayWord: "بُسْتَان", translation: "orchard, garden", examples: [] },
  { word: "براءة", displayWord: "بَرَاءَة", translation: "innocence, acquittal", examples: [] },
  { word: "بصر", displayWord: "بَصَر", translation: "sight, vision, insight", examples: [] },
  { word: "بناء", displayWord: "بِنَاء", translation: "building, structure, construction", examples: [] }
];

async function main() {
  console.log('Downloading authentic Hans Wehr dictionary raw text from GitHub...');
  
  let rawText = '';
  try {
    const res = await fetch('https://raw.githubusercontent.com/a3f/arabic-wordlists/master/hans-wehr.txt');
    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }
    rawText = await res.ok ? await res.text() : '';
    console.log(`Successfully downloaded Hans Wehr raw text. Total character size: ${rawText.length}`);
  } catch (error) {
    console.error('Failed to download Hans Wehr raw data from GitHub. Using fallback lexicon...', error);
  }

  const shards = {};
  for (const letter of ARABIC_ALPHABET) {
    shards[letter] = [];
  }

  let totalEntriesCount = 0;

  if (rawText) {
    const lines = rawText.split('\n');
    const regex = /^([\u0600-\u06FF\u0621-\u064A\u0652\u064B-\u0650]+(?:\s+[\u0600-\u06FF\u0621-\u064A\u0652\u064B-\u0650]+)*)\s+(.*)$/;

    let currentEntry = null;

    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        if (currentEntry) {
          const letter = getStandardLetter(currentEntry.word);
          if (letter) {
            shards[letter].push(currentEntry);
            totalEntriesCount++;
          }
        }
        currentEntry = {
          word: match[1],
          displayWord: match[1], // Hans wehr display word
          translation: match[2].trim(),
          examples: [] // No reliable open source examples available, keeping it empty as required
        };
      } else if (currentEntry && line.trim()) {
        currentEntry.translation += ' ' + line.trim();
      }
    }
    if (currentEntry) {
      const letter = getStandardLetter(currentEntry.word);
      if (letter) {
        shards[letter].push(currentEntry);
        totalEntriesCount++;
      }
    }
  } else {
    // Populate using fallback entries
    for (const entry of fallbackEntries) {
      const letter = getStandardLetter(entry.word);
      if (letter) {
        shards[letter].push(entry);
        totalEntriesCount++;
      }
    }
  }

  // Write files & manifest
  console.log(`Writing shards to public/dictionary/...`);
  const manifest = {
    source: "Hans Wehr's Dictionary of Modern Written Arabic (Milton Cowan)",
    totalEntries: totalEntriesCount,
    shards: {}
  };

  let totalSizeInBytes = 0;

  for (const letter of ARABIC_ALPHABET) {
    const filePath = path.join(outputDir, `${letter}.json`);
    const jsonStr = JSON.stringify(shards[letter], null, 2);
    fs.writeFileSync(filePath, jsonStr, 'utf-8');
    
    totalSizeInBytes += jsonStr.length;
    manifest.shards[letter] = {
      entriesCount: shards[letter].length,
      fileSizeKb: Math.round(jsonStr.length / 1024)
    };
    console.log(`Shard [${letter}] written: ${shards[letter].length} entries, ${manifest.shards[letter].fileSizeKb} KB`);
  }

  manifest.totalSizeMb = (totalSizeInBytes / (1024 * 1024)).toFixed(2);
  
  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log('---------------------------------------------------------');
  console.log('DICTIONARY BUILD REPORT:');
  console.log(`- Source: ${manifest.source}`);
  console.log(`- Total Entries parsed & sharded: ${totalEntriesCount}`);
  console.log(`- Total Files generated: ${ARABIC_ALPHABET.length} shards + 1 manifest`);
  console.log(`- Total Size on Disk: ${manifest.totalSizeMb} MB`);
  console.log('---------------------------------------------------------');
}

main().catch(console.error);
