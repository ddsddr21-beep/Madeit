import json
import csv
import sys
import re
import os
import glob
from collections import defaultdict

csv.field_size_limit(sys.maxsize)

CORE_VOCAB = {
    'love': ['حب', 'محبة', 'عشق'],
    'book': ['كتاب', 'سفر', 'مجلد'],
    'work': ['عمل', 'شغل', 'صنع'],
    'history': ['تاريخ', 'سجل', 'تراجم'],
    'justice': ['عدالة', 'عدل', 'انصاف'],
    'knowledge': ['معرفة', 'علم', 'دراية'],
    'nature': ['طبيعة', 'سليقة', 'فطرة'],
    'world': ['عالم', 'دنيا', 'كون'],
    'people': ['ناس', 'شعب', 'قوم'],
    'language': ['لغة', 'لسان', 'كلام'],
    'read': ['قرأ', 'تلا', 'طالع'],
    'reading': ['قراءة', 'تلاوة', 'مطالعة'],
    'life': ['حياة', 'عيش', 'وجود'],
    'heart': ['قلب', 'فؤاد', 'لب'],
    'water': ['ماء', 'مياه'],
    'day': ['يوم', 'نهار'],
    'night': ['ليل', 'ليلة'],
    'peace': ['سلام', 'صلح', 'سكينة'],
    'truth': ['حقيقة', 'حق', 'صدق'],
    'freedom': ['حرية', 'انعتاق'],
    'mind': ['عقل', 'ذهن', 'فكر'],
    'light': ['نور', 'ضوء', 'اشراق'],
    'darkness': ['ظلام', 'ظلمة', 'عتمة'],
    'earth': ['ارض', 'تراب'],
    'sky': ['سماء', 'فضاء'],
    'sun': ['شمس', 'اشراق'],
    'moon': ['قمر', 'بدر', 'هلال'],
    'star': ['نجم', 'كوكب'],
    'house': ['بيت', 'منزل', 'دار'],
    'man': ['رجل', 'انسان', 'مرء'],
    'woman': ['امراة', 'سيدة', 'انثى'],
    'child': ['طفل', 'ولد', 'صبية'],
    'friend': ['صديق', 'رفيق', 'خليل'],
    'time': ['وقت', 'زمن', 'حين'],
    'king': ['ملك', 'سلطان', 'حاكم'],
    'eye': ['عين', 'بصر', 'ينبوع'],
    'hand': ['يد', 'كف'],
    'body': ['جسد', 'جسم', 'بدن'],
    'soul': ['روح', 'نفس'],
    'city': ['مدينة', 'بلدة', 'حاضرة'],
    'country': ['بلد', 'دولة', 'قطر'],
    'story': ['قصة', 'حكاية', 'رواية'],
    'word': ['كلمة', 'لفظ', 'قول'],
    'school': ['مدرسة', 'معهد'],
    'good': ['خير', 'طيب', 'صالح'],
    'great': ['عظيم', 'كبير', 'جليل']
}

RE_ARABIC_CHAR = re.compile(r'[\u0621-\u064A]')
RE_PERSIAN_CHAR = re.compile(r'[گچپژکگی]')
RE_INVALID_CHARS = re.compile(r'[a-zA-Z<>{}\[\]_#\$\*]')
RE_HTML = re.compile(r'<[^>]+>')
RE_CTRL = re.compile(r'[\x00-\x1f\x7f-\x9f]')
RE_POS = re.compile(r'(?:اسْم|فِعْل|حال|صِفَة|ألاسم|الفعل|الصفة|الاسم|اسم|فعل|صفة|ظرف|سابقة|لاحقة)\s*[:：]?')
RE_HARAKAT = re.compile(r'[\u064B-\u0652\u0640]')
RE_PAREN = re.compile(r'\([^\)]*\)')
RE_EN_CLEAN = re.compile(r'^(?:to\s+|a\s+|the\s+|an\s+)', re.IGNORECASE)
RE_EN_CHARS = re.compile(r'[^a-zA-Z\s\'-]')
RE_SPLIT_AR = re.compile(r'[;،,.\n\r/]+')
RE_SPLIT_SUB = re.compile(r'[\x00-\x1f\x7f-\x9f\t\r\n;]+')

PERSIAN_WORDS = ('کلمات مرتبط', 'بازگشت به', 'درمورد', 'بصورت', 'زبان', 'كاريكه', 'مردم', 'بيان', 'سخنگويي')

def is_clean_arabic(text):
    if not text: return False
    if not RE_ARABIC_CHAR.search(text):
        return False
    if RE_PERSIAN_CHAR.search(text) or RE_INVALID_CHARS.search(text):
        return False
    if any(pw in text for pw in PERSIAN_WORDS):
        return False
    return True

def clean_en_word(text):
    if not text: return ''
    if '<' in text: text = RE_HTML.sub('', text)
    text = RE_CTRL.sub(' ', text)
    text = RE_EN_CLEAN.sub('', text)
    text = RE_EN_CHARS.sub(' ', text)
    text = ' '.join(text.split()).lower()
    if 2 <= len(text) <= 35 and text[0].isalpha() and text[-1].isalpha():
        return text
    return ''

def main():
    en_to_ar = defaultdict(list)

    # 1. Seed core vocabulary
    for en, ars in CORE_VOCAB.items():
        en_clean = clean_en_word(en)
        for ar in ars:
            if ar not in en_to_ar[en_clean]:
                en_to_ar[en_clean].append(ar)

    def add(en, ar):
        en_clean = clean_en_word(en)
        if not en_clean: return
        
        if '<' in ar: ar = RE_HTML.sub('', ar)
        ar = RE_CTRL.sub(' ', ar)
        ar = RE_POS.sub(' ', ar)
        
        for sub in RE_SPLIT_AR.split(ar):
            if '(' in sub: sub = RE_PAREN.sub('', sub)
            sub = RE_HARAKAT.sub('', sub)
            sub = ' '.join(sub.split())
            if is_clean_arabic(sub) and 2 <= len(sub) <= 25:
                if len(sub.split()) <= 2:
                    if sub not in en_to_ar[en_clean]:
                        if len(en_to_ar[en_clean]) < 8:
                            en_to_ar[en_clean].append(sub)

    # Shards in public/dictionary/
    print('Processing letter shards...')
    for sf in glob.glob('public/dictionary/[!adefm]*.json'):
        if any(x in sf for x in ['lexicon', 'manifest', 'metadata']): continue
        try:
            with open(sf, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for ar, ens in data.items():
                    for en in ens:
                        add(en, ar)
        except Exception:
            pass

    # ar_en_lexicon.json
    ar_en_path = 'public/dictionary/ar_en_lexicon.json'
    if os.path.exists(ar_en_path):
        print('Processing ar_en_lexicon.json...')
        with open(ar_en_path, 'r', encoding='utf-8') as f:
            ar_en = json.load(f)
            for ar, ens in ar_en.items():
                for en in ens:
                    add(en, ar)

    # unified_ar_en.csv
    csv_ar_en = '/tmp/unified_ar_en.csv'
    if os.path.exists(csv_ar_en):
        print('Processing unified_ar_en.csv...')
        with open(csv_ar_en, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.reader(f)
            next(reader)
            for r in reader:
                if len(r) < 2: continue
                c0, c1 = r[0], r[1]
                if 'English:' in c1 and 'Arabic:' in c1:
                    matches = re.findall(r'English:\s*([^;<\n\r]+?)\s*Arabic:\s*([^;<\n\r]+)', c0 + ' ' + c1, re.IGNORECASE)
                    for en_m, ar_m in matches:
                        add(en_m, ar_m)
                elif RE_ARABIC_CHAR.search(c0) and not RE_ARABIC_CHAR.search(c1):
                    add(c1, c0)
                elif RE_ARABIC_CHAR.search(c1) and not RE_ARABIC_CHAR.search(c0):
                    add(c0, c1)

    # unified_en_ar.csv
    csv_en_ar = '/tmp/unified_en_ar.csv'
    if os.path.exists(csv_en_ar):
        print('Processing unified_en_ar.csv...')
        with open(csv_en_ar, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.reader(f)
            next(reader)
            for r in reader:
                if len(r) < 2: continue
                c0, c1 = r[0], r[1]
                if not RE_ARABIC_CHAR.search(c1):
                    continue
                subparts = RE_SPLIT_SUB.split(c0)
                for sp in subparts:
                    sp_clean = sp.strip().strip('\"\'.,;:!?()[]{}<>-—_«»')
                    if 2 <= len(sp_clean) <= 35:
                        add(sp_clean, c1)

    print('Building prioritized 1-3 Arabic meanings per English word...')
    final_dict = {}
    for k, v in sorted(en_to_ar.items()):
        # Prioritize 1-word definitions first, then shorter definitions
        sorted_meanings = sorted(v, key=lambda x: (len(x.split()), len(x)))
        final_dict[k] = sorted_meanings[:3]

    out_path = 'public/dictionary/en_ar_lexicon.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(final_dict, f, ensure_ascii=False, separators=(',', ':'))

    print(f'Done! Saved {len(final_dict)} entries to {out_path}')
    file_size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f'File size: {file_size_mb:.2f} MB')

    # Verification Statistics
    total_entries = len(final_dict)
    with_1_or_more = sum(1 for v in final_dict.values() if len(v) >= 1)
    with_2_or_3 = sum(1 for v in final_dict.values() if len(v) in (2, 3))
    print(f'English entries: {total_entries}')
    print(f'Entries with Arabic meanings: {with_1_or_more}')
    print(f'Entries with 2 or 3 meanings: {with_2_or_3}')

    test_words = ['love', 'book', 'work', 'history', 'justice', 'knowledge', 'nature', 'world', 'people', 'language']
    successful = 0
    for w in test_words:
        meanings = final_dict.get(w, [])
        print(f'Test word [{w}]: {meanings}')
        if meanings and len(meanings) >= 1:
            successful += 1

    print(f'Tested common words: {successful}/{len(test_words)} successful')

if __name__ == '__main__':
    main()
