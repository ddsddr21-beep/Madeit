import json
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
DICT_DIR = os.path.join(PROJECT_ROOT, 'public', 'dictionary')

NOISE_PATTERNS = [
    re.compile(r'\b(singular|plural|masculine|feminine|active participle|passive participle|verbal noun|verbal adjective)\s+of\b', re.IGNORECASE),
    re.compile(r'\b(form\s+[ivxlcdm]+|aspect|subjunctive|jussive|imperative|imperfect|perfect|nominative|genitive|accusative)\s+of\b', re.IGNORECASE),
    re.compile(r'\b(definite|indefinite|construct)\s+(singular|plural|form|state)\b', re.IGNORECASE),
    re.compile(r'\b(alternative|informal|obsolete|archaic|historical|dialectal)\s+(form|spelling|variant)\s+of\b', re.IGNORECASE),
    re.compile(r'\b(see\s+also|synonym\s+of|misspelling\s+of|short\s+for|abbreviation\s+of)\b', re.IGNORECASE),
    re.compile(r'^\s*\(.*?\)\s*$'),
    re.compile(r'^\s*\[.*?\]\s*$'),
    re.compile(r'http[s]?://'),
    re.compile(r'[{}]'),
]

GENDER_CONTRADICTIONS = {
    'أخ': {'sister', 'daughter', 'mother', 'female'},
    'اخ': {'sister', 'daughter', 'mother', 'female'},
    'أخت': {'brother', 'son', 'father', 'male'},
    'اخت': {'brother', 'son', 'father', 'male'},
    'ابن': {'daughter', 'sister', 'mother'},
    'ابنة': {'son', 'brother', 'father'},
    'بنت': {'son', 'brother', 'father'},
    'رجل': {'woman', 'pedestrian', 'girl'},
    'امرأة': {'man', 'boy', 'male'},
    'امراة': {'man', 'boy', 'male'},
}

def clean_english_meaning(text: str) -> str:
    if not text:
        return ''
    s = text.strip()
    # Remove leading/trailing brackets, quotes
    s = re.sub(r'^[«»"\'`(\[{]+|[«»"\'`)\]}]+$', '', s).strip()
    # Remove parenthetical tags like (grammar), (n.), (v.), (adj.)
    s = re.sub(r'\s*\((?:n\.|v\.|adj\.|adv\.|transitive|intransitive|archaic|obsolete|slang|rare|poetic|colloquial|dated|literally|figuratively|chiefly|esp\.|especially|often|usually|formal|informal)[^)]*\)', '', s, flags=re.IGNORECASE)
    # Remove remaining short parentheticals if at end
    s = re.sub(r'\s*\([^)]*\)$', '', s).strip()
    s = re.sub(r'^\([^)]*\)\s*', '', s).strip()
    s = re.sub(r'\s+', ' ', s).strip()
    return s.lower()

def is_valid_english_meaning(meaning: str, arabic_word: str) -> bool:
    if not meaning or len(meaning) < 2:
        return False
    # Check noise patterns
    for pat in NOISE_PATTERNS:
        if pat.search(meaning):
            return False
    # Check word count - prefer concise definitions (<= 4 words)
    words = meaning.split()
    if len(words) > 4:
        return False
    # Check gender contradictions
    clean_ar = arabic_word.replace('ال', '').strip()
    if clean_ar in GENDER_CONTRADICTIONS:
        if any(bad in meaning for bad in GENDER_CONTRADICTIONS[clean_ar]):
            return False
    if arabic_word in GENDER_CONTRADICTIONS:
        if any(bad in meaning for bad in GENDER_CONTRADICTIONS[arabic_word]):
            return False
    # Avoid pure numbers or punctuation
    if re.match(r'^[\d\W_]+$', meaning):
        return False
    return True

def clean_arabic_meaning(text: str) -> str:
    if not text:
        return ''
    s = text.strip()
    s = re.sub(r'^[«»"\'`(\[{]+|[«»"\'`)\]}]+$', '', s).strip()
    s = re.sub(r'\s*\([^)]*\)', '', s).strip()
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def normalize_ar_root(ar: str) -> str:
    return re.sub(r'[\u064B-\u0652\u0640]', '', ar).replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ٱ', 'ا').replace('ى', 'ي')

def process_ar_en():
    path = os.path.join(DICT_DIR, 'ar_en_lexicon.json')
    print(f'Refining {path}...')
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    refined = {}
    cleaned_count = 0

    for ar_word, raw_meanings in data.items():
        if not isinstance(raw_meanings, list) or len(raw_meanings) == 0:
            continue

        seen = set()
        pruned_meanings = []

        for m in raw_meanings:
            cleaned_m = clean_english_meaning(str(m))
            if not is_valid_english_meaning(cleaned_m, ar_word):
                continue
            if cleaned_m not in seen:
                seen.add(cleaned_m)
                pruned_meanings.append(cleaned_m)
            # Max 2 concise, accurate meanings per user instruction
            if len(pruned_meanings) >= 2:
                break

        # Fallback if all were pruned: take first raw cleaned
        if not pruned_meanings and raw_meanings:
            first = clean_english_meaning(str(raw_meanings[0]))
            if first and not any(p.search(first) for p in NOISE_PATTERNS[:2]):
                pruned_meanings.append(first)

        if pruned_meanings:
            refined[ar_word] = pruned_meanings
            cleaned_count += 1

    print(f'Arabic-English refined entries: {len(refined):,} (pruned to top 1-2 concise meanings)')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(refined, f, ensure_ascii=False, separators=(',', ':'))

def process_en_ar():
    path = os.path.join(DICT_DIR, 'en_ar_lexicon.json')
    print(f'Refining {path}...')
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    refined = {}

    for en_word, raw_meanings in data.items():
        if not isinstance(raw_meanings, list) or len(raw_meanings) == 0:
            continue

        seen_roots = set()
        pruned_meanings = []

        for m in raw_meanings:
            cleaned_ar = clean_arabic_meaning(str(m))
            if not cleaned_ar or len(cleaned_ar) < 2:
                continue
            # Avoid duplicate spelling variants of the exact same word (e.g. أب and اب)
            root_key = normalize_ar_root(cleaned_ar)
            if root_key not in seen_roots:
                seen_roots.add(root_key)
                pruned_meanings.append(cleaned_ar)
            if len(pruned_meanings) >= 2:
                break

        if pruned_meanings:
            refined[en_word] = pruned_meanings

    print(f'English-Arabic refined entries: {len(refined):,} (pruned to top 1-2 concise meanings)')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(refined, f, ensure_ascii=False, separators=(',', ':'))

def update_metadata():
    path = os.path.join(DICT_DIR, 'dataset_metadata.json')
    meta = {
        "datasetName": "Wiktionary Master Arabic-English Lexicon (Precision Calibrated)",
        "datasetAuthor": "Wiktionary Linguistic Community & Kaikki.org",
        "description": "High-accuracy, curated bidirectional Arabic-English dictionary pruned to concise, contextual 1-2 meanings per term, free of lexicographical noise.",
        "maxMeaningsPerWord": 2,
        "calibration": "Pruned noise, grammatical glosses, and redundant morphological variants",
        "generatedAt": "2026-10-31"
    }
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    process_ar_en()
    process_en_ar()
    update_metadata()
    print('Refinement complete!')
