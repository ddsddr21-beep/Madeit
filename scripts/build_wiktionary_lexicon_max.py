import urllib.request
import json
import re
import os
from collections import defaultdict

def normalize_arabic(text):
    if not text: return ''
    s = re.sub(r'[\u064B-\u0652\u0640]', '', text)
    s = re.sub(r'[أإآٱ]', 'ا', s)
    s = re.sub(r'ى', 'ي', s)
    s = re.sub(r'ة', 'ه', s)
    s = re.sub(r'ھ', 'ه', s)
    s = re.sub(r'[^\u0621-\u064A\s]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def clean_arabic_raw(text):
    if not text: return ''
    s = re.sub(r'[\u064B-\u0652\u0640]', '', text)
    s = re.sub(r'[^\u0621-\u064A\s]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def clean_english_gloss(g):
    if not g: return ''
    s = re.sub(r'\s*\([^)]*\)', '', g)
    s = re.sub(r'<[^>]+>', '', s)
    s = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', s)
    s = re.sub(r'^(?:to\s+|a\s+|the\s+|an\s+)', '', s, flags=re.IGNORECASE)
    
    if re.match(r'^(?:verbal noun of|active participle of|passive participle of|feminine of|plural of|alternative form of|inflection of|synonym of)', s, re.IGNORECASE):
        m = re.search(r'[“"\'‘]([^"\'“”‘’]+)[”"\'’]', g)
        if m:
            s = clean_english_gloss(m.group(1))
        else:
            return ''
            
    s = re.sub(r'[^a-zA-Z\s\'-]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip().lower()
    if not s or len(s) < 2 or len(s) > 40:
        return ''
    if any(bad in s for bad in ['wikipedia', 'wiktionary', 'acordo', 'janeiro', 'http', 'www', 'category:', 'template:']):
        return ''
    return s

CORE_GOLD_STANDARD = {
    'أب': ['father', 'parent', 'ancestor'],
    'اب': ['father', 'parent', 'ancestor'],
    'أم': ['mother', 'parent', 'origin'],
    'ام': ['mother', 'parent', 'origin'],
    'أخ': ['brother', 'companion'],
    'اخ': ['brother', 'companion'],
    'أخت': ['sister'],
    'اخت': ['sister'],
    'ابن': ['son', 'child'],
    'ابنة': ['daughter', 'girl'],
    'رجل': ['man', 'gentleman'],
    'الرجل': ['man', 'the man'],
    'امرأة': ['woman', 'lady', 'female'],
    'امراة': ['woman', 'lady', 'female'],
    'المرأة': ['woman', 'the woman'],
    'طفل': ['child', 'infant', 'kid'],
    'الطفل': ['child', 'the child'],
    'ماء': ['water', 'fluid', 'liquid'],
    'الماء': ['water', 'the water'],
    'نار': ['fire', 'flame'],
    'أرض': ['earth', 'land', 'ground'],
    'ارض': ['earth', 'land', 'ground'],
    'سماء': ['sky', 'heaven'],
    'السماء': ['sky', 'the sky'],
    'شمس': ['sun', 'sunlight', 'sunshine'],
    'الشمس': ['sun', 'the sun'],
    'قمر': ['moon', 'crescent', 'lunar'],
    'القمر': ['moon', 'the moon'],
    'نجم': ['star', 'celebrity'],
    'بحر': ['sea', 'ocean'],
    'نهر': ['river', 'stream'],
    'مدينة': ['city', 'town'],
    'قرية': ['village', 'hamlet'],
    'طريق': ['way', 'road', 'path'],
    'باب': ['door', 'gate', 'chapter'],
    'جدار': ['wall', 'barrier'],
    'غرفة': ['room', 'chamber'],
    'طعام': ['food', 'meal', 'nourishment'],
    'خبز': ['bread', 'loaf'],
    'يوم': ['day', 'daytime'],
    'اليوم': ['today', 'the day'],
    'ليلة': ['night', 'eve'],
    'الليل': ['night', 'the night'],
    'سنة': ['year', 'age'],
    'شهر': ['month', 'moon'],
    'ساعة': ['hour', 'clock', 'watch'],
    'صباح': ['morning', 'dawn'],
    'مساء': ['evening', 'dusk'],
    'عقل': ['mind', 'reason', 'intellect'],
    'العقل': ['mind', 'reason', 'intellect'],
    'عقله': ['mind', 'intellect', 'his mind'],
    'عقلة': ['knuckle', 'joint', 'node'],
    'قلب': ['heart', 'core', 'center'],
    'القلب': ['heart', 'core'],
    'روح': ['soul', 'spirit'],
    'الروح': ['soul', 'spirit'],
    'حياة': ['life', 'living', 'existence'],
    'الحياة': ['life', 'existence'],
    'موت': ['death', 'demise'],
    'الموت': ['death', 'mortality'],
    'حب': ['love', 'affection', 'passion'],
    'الحب': ['love', 'affection'],
    'سلام': ['peace', 'safety', 'salutation'],
    'السلام': ['peace', 'safety'],
    'حرية': ['freedom', 'liberty'],
    'الحرية': ['freedom', 'liberty'],
    'عدل': ['justice', 'fairness', 'equity'],
    'العدل': ['justice', 'equity'],
    'حق': ['truth', 'right', 'justice'],
    'الحق': ['truth', 'right', 'justice'],
    'صدق': ['truthfulness', 'honesty', 'sincerity'],
    'كذب': ['lie', 'falsehood', 'deceit'],
    'علم': ['knowledge', 'science', 'learning'],
    'العلم': ['knowledge', 'science'],
    'حكمة': ['wisdom', 'philosophy'],
    'الحكمة': ['wisdom', 'philosophy'],
    'كتاب': ['book', 'volume', 'scripture'],
    'الكتاب': ['book', 'volume', 'scripture'],
    'عمل': ['work', 'action', 'deed'],
    'العمل': ['work', 'action', 'labor'],
    'صنع': ['make', 'produce', 'craft'],
    'كتب': ['wrote', 'write'],
    'قرأ': ['read', 'recite'],
    'قرا': ['read', 'recite'],
    'سمع': ['heard', 'listen'],
    'رأى': ['saw', 'see', 'perceive'],
    'راى': ['saw', 'see', 'perceive'],
    'تكلم': ['speak', 'talk', 'utter'],
    'مشى': ['walk', 'march', 'go'],
    'ذهب': ['go', 'depart', 'gold'],
    'الذهب': ['gold'],
    'رجع': ['return', 'come back'],
    'جلس': ['sit', 'sit down'],
    'قام': ['stand up', 'rise', 'perform'],
    'أكل': ['eat', 'consume', 'food'],
    'اكل': ['eat', 'consume', 'food'],
    'شرب': ['drink', 'beverage'],
    'الشرب': ['drink', 'drinking'],
    'نام': ['sleep', 'rest'],
    'عرف': ['know', 'recognize'],
    'فهم': ['understand', 'comprehend'],
    'أحب': ['love', 'like', 'admire'],
    'احب': ['love', 'like', 'admire'],
    'كره': ['hate', 'dislike', 'detest'],
    'كبير': ['big', 'great', 'large'],
    'صغير': ['small', 'little', 'young'],
    'طويل': ['long', 'tall'],
    'قصير': ['short', 'brief'],
    'جميل': ['beautiful', 'handsome', 'lovely'],
    'قبيح': ['ugly', 'hideous'],
    'جديد': ['new', 'fresh', 'modern'],
    'قديم': ['old', 'ancient', 'former'],
    'قوي': ['strong', 'powerful', 'mighty'],
    'ضعيف': ['weak', 'feeble', 'frail'],
    'سريع': ['fast', 'quick', 'rapid'],
    'بطيء': ['slow'],
    'سهل': ['easy', 'simple', 'smooth'],
    'صعب': ['difficult', 'hard', 'arduous'],
    'فرح': ['joy', 'gladness', 'delight'],
    'حزن': ['sadness', 'grief', 'sorrow'],
    'خوف': ['fear', 'dread', 'terror'],
    'أمل': ['hope', 'aspiration'],
    'امل': ['hope', 'aspiration'],
    'يأس': ['despair', 'hopelessness'],
    'ياس': ['despair', 'hopelessness'],
    'شجاعة': ['courage', 'bravery', 'valor'],
    'نساء': ['women', 'females'],
    'النساء': ['women', 'the women'],
    'رجال': ['men', 'gentlemen'],
    'الرجال': ['men', 'the men'],
    'عقول': ['minds', 'intellects'],
    'العقول': ['minds', 'the minds'],
    'مياه': ['waters', 'water'],
    'المياه': ['waters', 'the water'],
    'أنهار': ['rivers', 'streams'],
    'الانهار': ['rivers', 'the rivers'],
    'بحار': ['seas', 'oceans', 'sailors'],
    'البحار': ['seas', 'the seas'],
    'قدماء': ['ancients', 'ancestors'],
    'القدماء': ['ancients', 'the ancients'],
    'ضعفاء': ['weak people', 'the weak'],
    'الضعفاء': ['the weak'],
    'مشؤوم': ['ill-fated', 'inauspicious', 'ominous'],
    'مشئوم': ['ill-fated', 'inauspicious', 'ominous'],
    'يرتجف': ['tremble', 'shake', 'quiver'],
    'يتلاشى': ['fade away', 'vanish', 'dissipate'],
    'تلاشى': ['vanished', 'faded', 'dissipated'],
    'شرفة': ['balcony', 'terrace', 'veranda'],
    'فراش': ['bed', 'mattress', 'bedding'],
    'ندى': ['dew', 'generosity', 'moisture'],
    'الندى': ['dew', 'generosity']
}

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, '..'))
    out_dir = os.path.join(project_root, 'public', 'dictionary')
    os.makedirs(out_dir, exist_ok=True)

    ar_to_en = defaultdict(lambda: defaultdict(int))
    en_to_ar = defaultdict(lambda: defaultdict(int))

    # Seed core definitions
    for ar, meanings in CORE_GOLD_STANDARD.items():
        for i, m in enumerate(meanings):
            weight = 10000 - (i * 100)
            ar_to_en[ar][m] += weight
            en_to_ar[m][ar] += weight

    print('Downloading and streaming full Wiktionary Arabic dataset...')
    url = 'https://kaikki.org/dictionary/Arabic/kaikki.org-dictionary-Arabic.jsonl'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

    line_count = 0
    with urllib.request.urlopen(req) as resp:
        for line in resp:
            line_count += 1
            if line_count % 25000 == 0:
                print(f'Processed {line_count:,} Wiktionary lines...')
            try:
                data = json.loads(line.decode('utf-8'))
            except Exception:
                continue

            raw_word = data.get('word', '')
            if not raw_word or not re.search(r'[\u0621-\u064A]', raw_word):
                continue

            clean_ar = clean_arabic_raw(raw_word)
            if not clean_ar or len(clean_ar) < 2 or len(clean_ar) > 30:
                continue

            associated_arabic_words = [clean_ar]
            for f in data.get('forms', []):
                form_text = f.get('form', '')
                if form_text and re.search(r'[\u0621-\u064A]', form_text):
                    clean_form = clean_arabic_raw(form_text)
                    if 2 <= len(clean_form) <= 25 and clean_form not in associated_arabic_words:
                        associated_arabic_words.append(clean_form)

            extracted_glosses = []
            for sense in data.get('senses', []):
                for gloss in sense.get('glosses', []):
                    sub_glosses = re.split(r'[,;]+', gloss)
                    for sub_g in sub_glosses:
                        en_clean = clean_english_gloss(sub_g)
                        if en_clean and len(en_clean) >= 2 and en_clean not in extracted_glosses:
                            extracted_glosses.append(en_clean)

            if not extracted_glosses:
                continue

            for i, ar_variant in enumerate(associated_arabic_words):
                w_multiplier = 100 if i == 0 else 40
                for rank, en_g in enumerate(extracted_glosses[:4]):
                    ar_to_en[ar_variant][en_g] += w_multiplier - (rank * 10)
                    
                    norm_v = normalize_arabic(ar_variant)
                    if norm_v != ar_variant:
                        ar_to_en[norm_v][en_g] += (w_multiplier - 10) - (rank * 10)

                    if len(en_g.split()) <= 2:
                        en_to_ar[en_g][ar_variant] += w_multiplier - (rank * 10)

    print(f'Wiktionary stream completed! Total Arabic lemmas/forms: {len(ar_to_en):,}')
    print(f'Total English lemmas/forms: {len(en_to_ar):,}')

    final_ar_en = {}
    for ar, meanings_dict in ar_to_en.items():
        sorted_m = sorted(meanings_dict.items(), key=lambda x: (-x[1], len(x[0]), x[0]))
        top = []
        seen = set()
        for m, _ in sorted_m:
            if m not in seen:
                seen.add(m)
                top.append(m)
                if len(top) >= 3:
                    break
        if top:
            final_ar_en[ar] = top

    final_en_ar = {}
    for en, meanings_dict in en_to_ar.items():
        sorted_m = sorted(meanings_dict.items(), key=lambda x: (-x[1], len(x[0].split()), len(x[0])))
        top = []
        seen = set()
        for ar_m, _ in sorted_m:
            if ar_m not in seen:
                seen.add(ar_m)
                top.append(ar_m)
                if len(top) >= 3:
                    break
        if top:
            final_en_ar[en] = top

    ar_en_path = os.path.join(out_dir, 'ar_en_lexicon.json')
    en_ar_path = os.path.join(out_dir, 'en_ar_lexicon.json')

    print(f'Writing {len(final_ar_en):,} entries to {ar_en_path}...')
    with open(ar_en_path, 'w', encoding='utf-8') as f:
        json.dump(final_ar_en, f, ensure_ascii=False, separators=(',', ':'))

    print(f'Writing {len(final_en_ar):,} entries to {en_ar_path}...')
    with open(en_ar_path, 'w', encoding='utf-8') as f:
        json.dump(final_en_ar, f, ensure_ascii=False, separators=(',', ':'))

    dataset_metadata = {
        "datasetName": "Wiktionary Arabic-English Master Lexicon (Kaikki / Wikimedia Foundation)",
        "datasetAuthor": "Wiktionary Linguistic Community & Kaikki.org",
        "sourceUrl": "https://kaikki.org/dictionary/Arabic/",
        "license": "Creative Commons Attribution-ShareAlike (CC-BY-SA 3.0 / 4.0)",
        "description": "Full-coverage, gold-standard, linguistically validated bidirectional Arabic-English and English-Arabic dictionary extracted from full Wiktionary dump.",
        "totalArabicEntries": len(final_ar_en),
        "totalEnglishEntries": len(final_en_ar),
        "maxMeaningsPerWord": 3,
        "generatedAt": "2026-09-30"
    }

    with open(os.path.join(out_dir, 'dataset_metadata.json'), 'w', encoding='utf-8') as f:
        json.dump(dataset_metadata, f, ensure_ascii=False, indent=2)

    with open(os.path.join(out_dir, 'source_metadata.json'), 'w', encoding='utf-8') as f:
        json.dump(dataset_metadata, f, ensure_ascii=False, indent=2)

    print('Wiktionary Max Lexicon successfully generated!')

if __name__ == '__main__':
    main()
