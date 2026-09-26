# Arabic-English Dictionary Metadata

- **Source Dataset**: `DrAbdulmalek/arabic-dictionaries-master`
- **URL**: https://huggingface.co/datasets/DrAbdulmalek/arabic-dictionaries-master
- **Author/Curator**: DrAbdulmalek
- **Format in Application**: Letter-sharded JSON (`/public/dictionary/{letter}.json`), total 28 shards.
- **Total Clean Entries**: 80,580 words
- **Size**: ~3505.9 KB (compact, fast client-side caching & instant lookup)
- **Meanings per Word**: Maximum 3 concise, common English translations.
- **Cleaning Applied**:
  1. Fixed Windows-1256 and double-encoded UTF-8 strings.
  2. Removed non-Arabic/other language records (Persian, Turkish, Spanish, Portuguese, German, Polish).
  3. Stripped binary index tags, control characters (`\x00-\x1f`), and HTML tags.
  4. Normalized Arabic words (diacritics, hamza, alif maqsura, taa marbuta).
  5. Inverted and aggregated mappings to create direct Arabic -> English lookup.
