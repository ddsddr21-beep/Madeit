import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure public/dictionary exists
const outputDir = path.resolve(__dirname, '../public/dictionary');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Complete real dictionary entries representing classical & modern standard Arabic
const dictionaryEntries = [
  // --- ا ---
  {
    word: "امل",
    displayWord: "أَمَل",
    root: "أمل",
    translation: "hope, expectation, aspiration",
    examples: [
      { ar: "أَمَلُنَا فِي اللهِ كَبِيرٌ فِي تَخَطِّي هَذِهِ العَقَبَاتِ.", en: "Our hope in God is great in overcoming these obstacles.", source: "Classical Prose" },
      { ar: "يَحْمِلُ الشَّبَابُ أَمَلَ الأُمَّةِ وَمُسْتَقْبَلَهَا.", en: "The youth carry the hope and the future of the nation.", source: "Modern Standard Arabic" }
    ]
  },
  {
    word: "ارض",
    displayWord: "أَرْض",
    root: "أرض",
    translation: "earth, land, ground, soil",
    examples: [
      { ar: "وَالأَرْضَ وَضَعَهَا لِلأَنَامِ.", en: "And the earth He has laid out for the creatures.", source: "Holy Quran" },
      { ar: "تَدُورُ الأَرْضُ حَوْلَ الشَّمْسِ دَوْرَةً كَامِلَةً كُلَّ عَامٍ.", en: "The earth revolves around the sun once every year.", source: "Scientific Text" }
    ]
  },
  {
    word: "اخ",
    displayWord: "أَخ",
    root: "أخو",
    translation: "brother, companion",
    examples: [
      { ar: "الأَخُ الصَّالِحُ سَنَدٌ لِأَخِيهِ فِي المُلِمَّاتِ.", en: "A righteous brother is a support for his brother in calamities.", source: "Classical Prose" },
      { ar: "إِنَّمَا المُؤْمِنُونَ إِخْوَةٌ.", en: "The believers are but brothers.", source: "Holy Quran" }
    ]
  },
  {
    word: "اب",
    displayWord: "أَب",
    root: "أبو",
    translation: "father, parent",
    examples: [
      { ar: "يَنْصَحُ الأَبُ أَبْنَاءَهُ بِحِكْمَةٍ وَعَطْفٍ.", en: "The father advises his children with wisdom and kindness.", source: "Modern Prose" },
      { ar: "وَبِالْوَالِدَيْنِ إِحْسَانًا.", en: "And show kindness to parents.", source: "Holy Quran" }
    ]
  },
  {
    word: "ام",
    displayWord: "أُم",
    root: "أمم",
    translation: "mother, origin, source",
    examples: [
      { ar: "الأُمُّ مَدْرَسَةٌ إِذَا أَعْدَدْتَهَا أَعْدَدْتَ شَعْبًا طَيِّبَ الأَعْرَاقِ.", en: "The mother is a school; if you prepare her, you prepare a nation of noble descent.", source: "Arabic Poetry (Hafez Ibrahim)" },
      { ar: "وَحَمَلَتْهُ أُمُّهُ كُرْهًا وَوَضَعَتْهُ كُرْهًا.", en: "And his mother carried him with hardship and gave birth to him with hardship.", source: "Holy Quran" }
    ]
  },
  {
    word: "اثر",
    displayWord: "أَثَر",
    root: "أثر",
    translation: "trace, impact, effect, historical ruin",
    examples: [
      { ar: "تَرَكَ المُعَلِّمُ أَثَرًا طَيِّبًا فِي نُفُوسِ تَلَامِيذِهِ.", en: "The teacher left a good impact in the souls of his pupils.", source: "Educational Essay" },
      { ar: "تِلْكَ آثَارُنَا تَدُلُّ عَلَيْنَا.", en: "These are our ruins; they indicate who we were.", source: "Classical Poetry" }
    ]
  },
  {
    word: "ادب",
    displayWord: "أَدَب",
    root: "أدب",
    translation: "literature, good manners, politeness",
    examples: [
      { ar: "الأَدَبُ يَرْفَعُ شَأْنَ صَاحِبِهِ وَلَوْ كَانَ فَقِيرًا.", en: "Good manners elevate the status of their owner even if he is poor.", source: "Classical Wisdom" },
      { ar: "يَدْرُسُ الطُّلَّابُ الأَدَبَ العَرَبِيَّ الكِلَاسِيكِيَّ.", en: "The students study classical Arabic literature.", source: "Academic Syllabus" }
    ]
  },
  {
    word: "امانه",
    displayWord: "أَمَانَة",
    root: "أمن",
    translation: "trust, trustworthiness, honesty",
    examples: [
      { ar: "إِنَّ اللَّهَ يَأْمُرُكُمْ أَنْ تُؤَدُّوا الْأَمَانَاتِ إِلَىٰ أَهْلِهَا.", en: "Indeed, God commands you to render trusts to their owners.", source: "Holy Quran" },
      { ar: "الأَمَانَةُ صِفَةٌ أَسَاسِيَّةٌ لِتَحْقِيقِ الثِّقَةِ بَيْنَ النَّاسِ.", en: "Trustworthiness is an essential trait for building confidence among people.", source: "Ethical Treatise" }
    ]
  },
  {
    word: "ايمان",
    displayWord: "إِيمَان",
    root: "أمن",
    translation: "faith, belief, conviction",
    examples: [
      { ar: "يَبْعَثُ الإِيمَانُ الطُّمَأْنِينَةَ وَالسَّكِينَةَ فِي القُلُوبِ.", en: "Faith sends tranquility and peace into hearts.", source: "Spiritual Discourse" },
      { ar: "الإِيمَانُ مَا وَقَرَ فِي القَلْبِ وَصَدَّقَهُ العَمَلُ.", en: "Faith is what is established in the heart and verified by deeds.", source: "Classical Saying" }
    ]
  },
  {
    word: "احسان",
    displayWord: "إِحْسَان",
    root: "حسن",
    translation: "excellence, charity, goodness, benevolence",
    examples: [
      { ar: "هَلْ جَزَاءُ الْإِحْسَانِ إِلَّا الْإِحْسَانُ.", en: "Is the reward for goodness anything but goodness?", source: "Holy Quran" },
      { ar: "يَجِبُ أَنْ نُعَامِلَ النَّاسَ بِإِحْسَانٍ وَلُطْفٍ كُلَّ يَوْمٍ.", en: "We must treat people with excellence and kindness every day.", source: "Moral Literature" }
    ]
  },

  // --- ب ---
  {
    word: "بيت",
    displayWord: "بَيْت",
    root: "بيت",
    translation: "house, home, verse of poetry",
    examples: [
      { ar: "هَذَا بَيْتٌ قَدِيمٌ مَبْنِيٌّ مِنَ الحَجَرِ الأَبْيَضِ.", en: "This is an old house built of white stone.", source: "Travel Journal" },
      { ar: "حَفِظْتُ بَيْتًا مِنَ الشِّعْرِ الجَاهِلِيِّ العَرِيقِ.", en: "I memorized a verse from the ancient pre-Islamic poetry.", source: "Literary Studies" }
    ]
  },
  {
    word: "بحر",
    displayWord: "بَحْر",
    root: "بحر",
    translation: "sea, ocean",
    examples: [
      { ar: "البَحْرُ وَاسِعٌ وَعَمِيقٌ وَمَلِيءٌ بِالكِائِنَاتِ المَائِيَّةِ.", en: "The sea is vast, deep, and full of marine creatures.", source: "Nature Geography" },
      { ar: "رَكِبَ التَّاجِرُ البَحْرَ فِي طَرِيقِهِ إِلَى السِّنْدِ.", en: "The merchant traveled by sea on his way to Sindh.", source: "Historical Tales" }
    ]
  },
  {
    word: "باب",
    displayWord: "بَاب",
    root: "بوب",
    translation: "door, gate, chapter, section",
    examples: [
      { ar: "فَتَحَ الحَارِسُ بَابَ المَدْرَسَةِ لِلزُّوَّارِ.", en: "The guard opened the school gate for the visitors.", source: "Modern Narrative" },
      { ar: "هَذَا البَابُ مِنَ الكِتَابِ يَتَحَدَّثُ عَنِ النَّحْوِ.", en: "This chapter of the book speaks about grammar.", source: "Grammar Manual" }
    ]
  },
  {
    word: "بركه",
    displayWord: "بَرَكَة",
    root: "برك",
    translation: "blessing, grace",
    examples: [
      { ar: "القَنَاعَةُ كَنْزٌ يَجْلِبُ البَرَكَةَ فِي الرِّزْقِ.", en: "Contentment is a treasure that brings blessing in livelihood.", source: "Ethical Saying" },
      { ar: "حَلَّتِ البَرَكَةُ فِي المَنْزِلِ بِحُضُورِ الجَدِّ.", en: "Blessing descended upon the house with the grandfather's presence.", source: "Family Story" }
    ]
  },
  {
    word: "بلد",
    displayWord: "بَلَد",
    root: "بلد",
    translation: "country, town, city, homeland",
    examples: [
      { ar: "وَهَٰذَا الْبَلَدِ الْأَمِينِ.", en: "And by this secure city.", source: "Holy Quran" },
      { ar: "سَافَرْتُ إِلَى بَلَدٍ جَدِيدٍ لِأَوَّلِ مَرَّةٍ فِي حَيَاتِي.", en: "I traveled to a new country for the first time in my life.", source: "Modern Memoir" }
    ]
  },
  {
    word: "بستان",
    displayWord: "بُسْتَان",
    root: "بستن",
    translation: "orchard, garden",
    examples: [
      { ar: "فِي البُسْتَانِ زُهُورٌ مُلَوَّنَةٌ وَأَشْجَارُ تُفَّاحٍ.", en: "In the garden are colorful flowers and apple trees.", source: "Descriptive Essay" }
    ]
  },
  {
    word: "براءه",
    displayWord: "بَرَاءَة",
    root: "برأ",
    translation: "innocence, acquittal",
    examples: [
      { ar: "تَتَجَلَّى البَرَاءَةُ فِي عُيُونِ الأَطْفَالِ الصِّغَارِ.", en: "Innocence is manifested in the eyes of young children.", source: "Psychological Essay" }
    ]
  },
  {
    word: "بصر",
    displayWord: "بَصَر",
    root: "بصر",
    translation: "sight, vision, insight",
    examples: [
      { ar: "فَجَعَلْنَاهُ سَمِيعًا بَصِيرًا.", en: "And We made him hearing and seeing.", source: "Holy Quran" },
      { ar: "فَكَشَفْنَا عَنكَ غِطَاءَكَ فَبَصَرُكَ الْيَوْمَ حَدِيدٌ.", en: "And We have removed from you your cover, so your sight today is sharp.", source: "Holy Quran" }
    ]
  },
  {
    word: "بناء",
    displayWord: "بِنَاء",
    root: "بني",
    translation: "building, structure, construction, grammatical indeclining",
    examples: [
      { ar: "يَتَطَلَّبُ بِنَاءُ الأُمَمِ تَعْلِيمًا قَوِيًّا وَأَخْلَاقًا عَالِيَةً.", en: "Building nations requires strong education and high morals.", source: "Political Treatise" }
    ]
  },

  // --- ت ---
  {
    word: "تاريخ",
    displayWord: "تَارِيخ",
    root: "أرخ",
    translation: "history, date, chronicle",
    examples: [
      { ar: "التَّارِيخُ يُسَجِّلُ مَآثِرَ الرُّوَّادِ بِكَلِمَاتٍ مِنْ ذَهَبٍ.", en: "History records the pioneers' achievements in words of gold.", source: "Biographical Works" },
      { ar: "مَا هُوَ تَارِيخُ عِيدِ الجَلَاءِ فِي وَطَنِكَ؟", en: "What is the date of the Evacuation Day in your country?", source: "Civics Text" }
    ]
  },
  {
    word: "تقوى",
    displayWord: "تَقْوَى",
    root: "وقي",
    translation: "piety, righteousness, fear of God",
    examples: [
      { ar: "وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ.", en: "And take provisions, but indeed, the best provision is piety.", source: "Holy Quran" },
      { ar: "الْتَّقْوَى صِلَةٌ رُوحِيَّةٌ بَيْنَ العَبْدِ وَخَالِقِهِ.", en: "Piety is a spiritual link between the servant and his Creator.", source: "Theological Text" }
    ]
  },
  {
    word: "تجاره",
    displayWord: "تِجَارَة",
    root: "تجر",
    translation: "trade, commerce, business",
    examples: [
      { ar: "إِلَّا أَنْ تَكُونَ تِجَارَةً عَنْ تَرَاضٍ مِنْكُمْ.", en: "Except that it be a trade conducted by mutual consent among you.", source: "Holy Quran" }
    ]
  },
  {
    word: "تفوق",
    displayWord: "تَفَوُّق",
    root: "فوق",
    translation: "superiority, excellence, distinction",
    examples: [
      { ar: "نَالَ الطَّالِبُ كَأْسَ التَّفَوُّقِ الأَكَادِيمِيِّ لِهَذَا العَامِ.", en: "The student received the academic excellence cup for this year.", source: "School Gazette" }
    ]
  },
  {
    word: "تعاون",
    displayWord: "تَعَاوُن",
    root: "عون",
    translation: "cooperation, mutual assistance",
    examples: [
      { ar: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ.", en: "And cooperate in righteousness and piety.", source: "Holy Quran" }
    ]
  },
  {
    word: "تعليم",
    displayWord: "تَعْلِيم",
    root: "علم",
    translation: "education, instruction, teaching",
    examples: [
      { ar: "الْتَّعْلِيمُ حَقٌّ أَسَاسِيٌّ لِكُلِّ طِفْلٍ فِي المَعْمُورَةِ.", en: "Education is a fundamental right for every child in the world.", source: "Humanitarian Charter" }
    ]
  },
  {
    word: "تسامح",
    displayWord: "تَسَامُح",
    root: "سمح",
    translation: "tolerance, forbearance, forgiveness",
    examples: [
      { ar: "التَّسَامُحُ رِسَالَةُ الحَضَارَاتِ الرَّاقِيَةِ لِبِنَاءِ السَّلَامِ.", en: "Tolerance is the message of refined civilizations to build peace.", source: "Diplomatic Speech" }
    ]
  },
  {
    word: "توبه",
    displayWord: "تَوْبَة",
    root: "توب",
    translation: "repentance, returning to righteousness",
    examples: [
      { ar: "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ.", en: "Indeed, God loves those who are constantly repentant and loves those who purify themselves.", source: "Holy Quran" }
    ]
  },

  // --- ث ---
  {
    word: "ثمر",
    displayWord: "ثَمَر",
    root: "ثمر",
    translation: "fruit, result, yield",
    examples: [
      { ar: "كُلُوا مِنْ ثَمَرِهِ إِذَا أَثْمَرَ وَآتُوا حَقَّهُ يَوْمَ حَصَادِهِ.", en: "Eat of its fruit when it yields and give its due on the day of its harvest.", source: "Holy Quran" },
      { ar: "يَجْنِي الإِنْسَانُ ثَمَرَةَ جُهْدِهِ نَجَاحًا بَاهِرًا.", en: "A human reaps the fruit of their effort as a dazzling success.", source: "Modern Prose" }
    ]
  },
  {
    word: "ثقافه",
    displayWord: "ثَقَافَة",
    root: "ثقف",
    translation: "culture, refinement, education",
    examples: [
      { ar: "تَتَنَوَّعُ الثَّقَافَاتُ وَتَلْتَقِي لِتُغْنِيَ الحَضَارَةَ الإِنْسَانِيَّةَ.", en: "Cultures diversify and meet to enrich human civilization.", source: "Sociological Study" }
    ]
  },
  {
    word: "ثقه",
    displayWord: "ثِقَة",
    root: "وثق",
    translation: "trust, confidence, faith",
    examples: [
      { ar: "الْتَّقَدُّمُ السَّرِيعُ يَحْتَاجُ إِلَى ثِقَةٍ بِالنَّفْسِ وَالمُثَابَرَةِ.", en: "Fast progress needs self-confidence and perseverance.", source: "Motivational Book" }
    ]
  },
  {
    word: "ثبات",
    displayWord: "ثَبَات",
    root: "ثبت",
    translation: "stability, firmness, consistency",
    examples: [
      { ar: "وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ.", en: "And make our feet firm and grant us victory over the disbelieving people.", source: "Holy Quran" }
    ]
  },
  {
    word: "ثروه",
    displayWord: "ثَرْوَة",
    root: "ثري",
    translation: "wealth, fortune, resource",
    examples: [
      { ar: "المَاءُ هُوَ الثَّرْوَةُ الحَقِيقِيَّةُ لِلأَجْيَالِ القَادِمَةِ.", en: "Water is the true wealth for the coming generations.", source: "Ecological Article" }
    ]
  },
  {
    word: "ثوب",
    displayWord: "ثَوْب",
    root: "ثوب",
    translation: "garment, dress, robe",
    examples: [
      { ar: "وَثِيَابَكَ فَطَهِّرْ.", en: "And your clothing purify.", source: "Holy Quran" }
    ]
  },
  {
    word: "ثمين",
    displayWord: "ثَمِين",
    root: "ثمن",
    translation: "precious, valuable, costly",
    examples: [
      { ar: "هَذَا كَنْزٌ ثَمِينٌ تَنَاقَلَتْهُ الأَجْيَالُ.", en: "This is a precious treasure passed down through generations.", source: "Folkloric History" }
    ]
  },

  // --- ج ---
  {
    word: "جبل",
    displayWord: "جَبَل",
    root: "جبل",
    translation: "mountain",
    examples: [
      { ar: "وَإِلَى الْجِبَالِ كَيْفَ نُصِبَتْ.", en: "And at the mountains - how they are erected?", source: "Holy Quran" },
      { ar: "تَسَلَّقَ المِغَامِرُونَ قِمَّةَ الجَبَلِ بِصُعُوبَةٍ.", en: "The adventurers climbed the peak of the mountain with difficulty.", source: "Adventure Travel" }
    ]
  },
  {
    word: "جميل",
    displayWord: "جَمِيل",
    root: "جمل",
    translation: "beautiful, handsome, kind deed",
    examples: [
      { ar: "إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الجَمَالَ.", en: "Indeed, God is beautiful and loves beauty.", source: "Hadith" },
      { ar: "فَصَبْرٌ جَمِيلٌ ۖ وَاللَّهُ الْمُسْتَعَانُ.", en: "So beautiful patience [is fitting], and God is the one sought for help.", source: "Holy Quran" }
    ]
  },
  {
    word: "جهد",
    displayWord: "جُهْد",
    root: "جهد",
    translation: "effort, strain, exertion, energy",
    examples: [
      { ar: "بَذَلَ العُلَمَاءُ جُهْدًا عَالِيًا فِي مَعْمَلِ الأَبْحَاثِ.", en: "The scientists made a high effort in the research laboratory.", source: "Academic Paper" }
    ]
  },
  {
    word: "جسد",
    displayWord: "جَسَد",
    root: "جسد",
    translation: "body, physique",
    examples: [
      { ar: "الرِّيَاضَةُ تُغَذِّي الجَسَدَ وَتَمْنَحُهُ حَيَوِيَّةً كَبِيرَةً.", en: "Sports nourish the body and grant it great vitality.", source: "Health Guide" }
    ]
  },
  {
    word: "جامعه",
    displayWord: "جَامِعَة",
    root: "جمع",
    translation: "university, assembly",
    examples: [
      { ar: "يَدْرُسُ أَخِي الهَنْدَسَةَ فِي جَامِعَةِ بَغْدَادَ العَرِيقَةِ.", en: "My brother studies engineering at the ancient University of Baghdad.", source: "Personal Diary" }
    ]
  },
  {
    word: "جنه",
    displayWord: "جَنَّة",
    root: "جنن",
    translation: "heaven, paradise, orchard",
    examples: [
      { ar: "تَجْرِي مِنْ تَحْتِهَا الْأَنْهَارُ خَالِدِينَ فِيهَا.", en: "Rivers flowing beneath them, wherein they abide eternally.", source: "Holy Quran" }
    ]
  },
  {
    word: "جهل",
    displayWord: "جَهْل",
    root: "جهل",
    translation: "ignorance, foolishness",
    examples: [
      { ar: "العِلْمُ يَبْنِي بُيُوتًا لَا عِمَادَ لَهَا .. وَالجَهْلُ يَهْدِمُ بَيْتَ العِزِّ وَالشَّرَفِ.", en: "Knowledge builds houses that have no pillars, while ignorance destroys the house of glory and honor.", source: "Classical Arabic Poetry" }
    ]
  },
  {
    word: "جيل",
    displayWord: "جِيل",
    root: "جيل",
    translation: "generation, era",
    examples: [
      { ar: "تَنْتَقِلُ التَّقَالِيدُ مِنْ جِيلٍ إِلَى آخَرَ بِفَخْرٍ.", en: "Traditions are passed from one generation to another with pride.", source: "Cultural Studies" }
    ]
  },

  // --- ح ---
  {
    word: "حياه",
    displayWord: "حَيَاة",
    root: "حيي",
    translation: "life, livelihood, existence",
    examples: [
      { ar: "وَمَا الْحَيَاةُ الدُّنْيَا إِلَّا لَعِبٌ وَلَهْوٌ.", en: "And the worldly life is not but play and amusement.", source: "Holy Quran" },
      { ar: "تَحْمِلُ الحَيَاةُ بَيْنَ طَيَّاتِهَا فُرَصًا لَا تَنْتَهِي.", en: "Life carries within its folds endless opportunities.", source: "Modern Philosophical Prose" }
    ]
  },
  {
    word: "حب",
    displayWord: "حُبّ",
    root: "حبب",
    translation: "love, affection, seeds",
    examples: [
      { ar: "يَسُودُ الحُبُّ الصَّادِقُ بَيْنَ النَّاسِ بِالاحْتِرَامِ المُتَبَادَلِ.", en: "True love prevails among people through mutual respect.", source: "Humanitarian Writing" }
    ]
  },
  {
    word: "حق",
    displayWord: "حَقّ",
    root: "حقق",
    translation: "right, truth, justice, reality",
    examples: [
      { ar: "ذَٰلِكَ بِأَنَّ اللَّهَ هُوَ الْحَقُّ.", en: "That is because God is the Truth.", source: "Holy Quran" },
      { ar: "مِنْ حَقِّ كُلِّ مُوَاطِنٍ التَّعْبِيرُ عَنْ رَأْيِهِ بِحُرِّيَّةٍ.", en: "It is the right of every citizen to express their opinion with freedom.", source: "Constitutional Charter" }
    ]
  },
  {
    word: "حكمه",
    displayWord: "حِكْمَة",
    root: "حكم",
    translation: "wisdom, philosophy, saying",
    examples: [
      { ar: "يُؤْتِي الْحِكْمَةَ مَنْ يَشَاءُ ۚ وَمَنْ يُؤْتَ الْحِكْمَةَ فَقَدْ أُوتِيَ خَيْرًا كَثِيرًا.", en: "He gives wisdom to whom He wills, and whoever has been given wisdom has certainly been given much good.", source: "Holy Quran" }
    ]
  },
  {
    word: "حريه",
    displayWord: "حُرِّيَّة",
    root: "حرر",
    translation: "freedom, liberty",
    examples: [
      { ar: "الحُرِّيَّةُ مَسْؤُولِيَّةٌ تَتَطَلَّبُ احْتِرَامَ الآخَرِينَ.", en: "Freedom is a responsibility that requires respecting others.", source: "Philosophical Treatise" }
    ]
  },
  {
    word: "حوار",
    displayWord: "حِوَار",
    root: "حور",
    translation: "dialogue, conversation, debate",
    examples: [
      { ar: "الْتَّفَاهُمُ يَبْدَأُ بِحِوَارٍ هَادِئٍ وَبَنَّاءٍ بَيْنَ الأَطْرَافِ.", en: "Understanding begins with a calm and constructive dialogue between the parties.", source: "Conflict Resolution Guide" }
    ]
  },
  {
    word: "حلم",
    displayWord: "حُلْم",
    root: "حلم",
    translation: "dream, aspiration, vision / also (حِلْم) forbearance, tolerance",
    examples: [
      { ar: "تَحَقَّقَ حُلْمُ التَّخَرُّجِ بَعْدَ سَنَوَاتٍ مِنَ الجِدِّ.", en: "The graduation dream was achieved after years of diligence.", source: "Personal Memoir" }
    ]
  },
  {
    word: "حضاره",
    displayWord: "حَضَارَة",
    root: "حضر",
    translation: "civilization, culture, settled way of life",
    examples: [
      { ar: "الحَضَارَةُ العَرَبِيَّةُ الأَنْدَلُسِيَّةُ كَانَتْ مَنَارَةً لِلعِلْمِ.", en: "The Arabic Andalusian civilization was a beacon of science.", source: "Historical Analysis" }
    ]
  },

  // --- خ ---
  {
    word: "خير",
    displayWord: "خَيْر",
    root: "خير",
    translation: "goodness, better, best, charity",
    examples: [
      { ar: "فَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ.", en: "So whoever does an atom's weight of good will see it.", source: "Holy Quran" },
      { ar: "الخَيْرُ مَوْجُودٌ فِي أُمَّتِي إِلَى يَوْمِ القِيَامَةِ.", en: "Goodness is present in my nation until the Day of Resurrection.", source: "Hadith" }
    ]
  },
  {
    word: "خلق",
    displayWord: "خُلُق",
    root: "خلق",
    translation: "character, morals, ethics, behavior",
    examples: [
      { ar: "وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ.", en: "And indeed, you are of a great moral character.", source: "Holy Quran" }
    ]
  },
  {
    word: "خوف",
    displayWord: "خَوْف",
    root: "خوف",
    translation: "fear, dread",
    examples: [
      { ar: "فَلَا تَخَافُوهُمْ وَخَافُونِ إِن كُنتُم مُّؤْمِنِينَ.", en: "So fear them not, but fear Me, if you should be believers.", source: "Holy Quran" }
    ]
  },
  {
    word: "خدمه",
    displayWord: "خِدْمَة",
    root: "خدم",
    translation: "service, assistance",
    examples: [
      { ar: "خِدْمَةُ النَّاسِ صِيغَةٌ رَاقِيَةٌ مِنَ التَّضَامُنِ.", en: "Serving people is a refined formula of solidarity.", source: "Sociological Treatise" }
    ]
  },
  {
    word: "خيال",
    displayWord: "خَيَال",
    root: "خيل",
    translation: "imagination, shadow, specter",
    examples: [
      { ar: "يُوَسِّعُ القَارِئُ خَيَالَهُ عَبْرَ كُتُبِ الخَيَالِ العِلْمِيِّ.", en: "The reader expands their imagination through science fiction books.", source: "Literary Essay" }
    ]
  },
  {
    word: "خطوه",
    displayWord: "خُطْوَة",
    root: "خطو",
    translation: "step, stride",
    examples: [
      { ar: "خُطْوَةٌ تِلْوَ الأُخْرَى، تَقَدَّمْنَا نَحْوَ الهَدَفِ.", en: "Step by step, we advanced toward the goal.", source: "Modern Story" }
    ]
  },
  {
    word: "خساره",
    displayWord: "خَسَارَة",
    root: "خسر",
    translation: "loss, damage, deficit",
    examples: [
      { ar: "تِلْكَ إِذًا كَرَّةٌ خَاسِرَةٌ.", en: "That, then, would be a losing return.", source: "Holy Quran" }
    ]
  },

  // --- د ---
  {
    word: "درس",
    displayWord: "دَرْس",
    root: "درس",
    translation: "lesson, class, study",
    examples: [
      { ar: "فَهِمَ الطُّلَّابُ الدَّرْسَ بَعْدَ تَفْصِيلِ المُعَلِّمِ.", en: "The students understood the lesson after the teacher's detailing.", source: "Educational Record" }
    ]
  },
  {
    word: "دوله",
    displayWord: "دَوْلَة",
    root: "دول",
    translation: "state, country, administration",
    examples: [
      { ar: "الدَّوْلَةُ مَسْؤُولَةٌ عَنْ حِمَايَةِ المَوَارِدِ العَامَّةِ.", en: "The state is responsible for protecting public resources.", source: "Legal Code" }
    ]
  },
  {
    word: "دنيا",
    displayWord: "دُنْيَا",
    root: "دنو",
    translation: "world, wordly life",
    examples: [
      { ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً.", en: "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good.", source: "Holy Quran" }
    ]
  },
  {
    word: "دين",
    displayWord: "دِين",
    root: "دين",
    translation: "religion, debt, custom, creed",
    examples: [
      { ar: "لَكُمْ دِينُكُمْ وَلِيَ دِينِ.", en: "For you is your religion, and for me is my religion.", source: "Holy Quran" },
      { ar: "الدِّينُ المُعَامَلَةُ.", en: "Religion is [good] treatment [of others].", source: "Hadith" }
    ]
  },
  {
    word: "دليل",
    displayWord: "دَلِيل",
    root: "دلل",
    translation: "evidence, guide, directory, proof",
    examples: [
      { ar: "هَاتُوا بُرْهَانَكُمْ إِن كُنتُمْ صَادِقِينَ.", en: "Produce your proof, if you should be truthful.", source: "Holy Quran" }
    ]
  },
  {
    word: "دعاء",
    displayWord: "دُعَاء",
    root: "دعو",
    translation: "supplication, prayer, invocation",
    examples: [
      { ar: "الدُّعَاءُ سِلَاحُ المُؤْمِنِ فِي المِحَنِ.", en: "Supplication is the believer's weapon in trials.", source: "Spiritual Text" }
    ]
  },
  {
    word: "دفء",
    displayWord: "دِفْء",
    root: "دفأ",
    translation: "warmth, comfort",
    examples: [
      { ar: "يَبْحَثُ النَّاسُ عَنْ دِفْءِ العَائِلَةِ فِي لَيَالِي الشِّتَاءِ.", en: "People seek the warmth of the family in winter nights.", source: "Literary Novel" }
    ]
  },

  // --- ذ ---
  {
    word: "ذهب",
    displayWord: "ذَهَب",
    root: "ذهب",
    translation: "gold, wealth / also (ذَهَبَ) he went",
    examples: [
      { ar: "زُيِّنَ لِلنَّاسِ حُبُّ الشَّهَوَاتِ مِنَ النِّسَاءِ وَالْبَنِينَ وَالْقَنَاطِيرِ الْمُقَنْطَرَةِ مِنَ الذَّهَبِ وَالْفِضَّةِ.", en: "Beautified for people is the love of that which they desire - of women and sons, heaped-up sums of gold and silver.", source: "Holy Quran" }
    ]
  },
  {
    word: "ذكر",
    displayWord: "ذِكْر",
    root: "ذكر",
    translation: "remembrance, mention, invocation",
    examples: [
      { ar: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ.", en: "Unquestionably, by the remembrance of God do hearts find peace.", source: "Holy Quran" }
    ]
  },
  {
    word: "ذكاء",
    displayWord: "ذَكَاء",
    root: "ذكي",
    translation: "intelligence, sharpness",
    examples: [
      { ar: "الْتَّمَارِينُ العَقْلِيَّةُ تُنَمِّي ذَكَاءَ الطِّفْلِ.", en: "Mental exercises develop the child's intelligence.", source: "Pediatric Science" }
    ]
  },
  {
    word: "ذوق",
    displayWord: "ذَوْق",
    root: "ذوق",
    translation: "taste, politeness, etiquette",
    examples: [
      { ar: "أَظْهَرَ الطَّالِبُ ذَوْقًا عَالِيًا فِي الحِوَارِ مَعَ مُعَلِّمِهِ.", en: "The student showed high politeness in dialogue with his teacher.", source: "Modern Ethics" }
    ]
  },
  {
    word: "ذنب",
    displayWord: "ذَنْب",
    root: "ذنب",
    translation: "sin, fault, tail",
    examples: [
      { ar: "رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا.", en: "Our Lord, forgive us our sins and the excess [committed] in our affairs.", source: "Holy Quran" }
    ]
  },
  {
    word: "ذكريات",
    displayWord: "ذِكْرَيَات",
    root: "ذكر",
    translation: "memories, recollections",
    examples: [
      { ar: "نَحْتَفِظُ بِالذِّكْرَيَاتِ الجَمِيلَةِ فِي صُوَرٍ قَدِيمَةٍ.", en: "We keep beautiful memories in old photos.", source: "Modern Essay" }
    ]
  },

  // --- ر ---
  {
    word: "رجل",
    displayWord: "رَجُل",
    root: "رجل",
    translation: "man",
    examples: [
      { ar: "مِّنَ الْمُؤْمِنِينَ رِجَالٌ صَدَقُوا مَا عَاهَدُوا اللَّهَ عَلَيْهِ.", en: "Among the believers are men who have been true to their covenant with God.", source: "Holy Quran" }
    ]
  },
  {
    word: "رحمه",
    displayWord: "رَحْمَة",
    root: "رحم",
    translation: "mercy, compassion",
    examples: [
      { ar: "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ.", en: "And We have not sent you except as a mercy to the worlds.", source: "Holy Quran" }
    ]
  },
  {
    word: "روح",
    displayWord: "رُوح",
    root: "روح",
    translation: "spirit, soul",
    examples: [
      { ar: "وَيَسْأَلُونَكَ عَنِ الرُّوحِ ۖ قُلِ الرُّوحُ مِنْ أَمْرِ رَبِّي.", en: "And they ask you about the soul. Say, 'The soul is of the affair of my Lord.'", source: "Holy Quran" }
    ]
  },
  {
    word: "رزق",
    displayWord: "رِزْق",
    root: "رزق",
    translation: "livelihood, provision, bounty",
    examples: [
      { ar: "إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ.", en: "Indeed, God is the Provider, the possessor of power, the Mighty.", source: "Holy Quran" }
    ]
  },
  {
    word: "راي",
    displayWord: "رَأْي",
    root: "رأي",
    translation: "opinion, view, judgment",
    examples: [
      { ar: "رَأْيِي أَنَّ التَّعَاوُنَ هُوَ مِفْتَاحُ حَلِّ الأَزْمَةِ.", en: "My opinion is that cooperation is the key to resolving the crisis.", source: "Debate Panel" }
    ]
  },
  {
    word: "رغبه",
    displayWord: "رَغْبَة",
    root: "رغب",
    translation: "desire, wish, inclination",
    examples: [
      { ar: "لَدَيَّ رَغْبَةٌ شَدِيدَةٌ فِي تَعَلُّمِ لُغَاتٍ جَدِيدَةٍ.", en: "I have a strong desire to learn new languages.", source: "Personal Journal" }
    ]
  },
  {
    word: "رساله",
    displayWord: "رِسَالَة",
    root: "رسل",
    translation: "message, letter, epistle, mission",
    examples: [
      { ar: "أُبَلِّغُكُمْ رِسَالَاتِ رَبِّي وَأَنَا لَكُمْ نَاصِحٌ أَمِينٌ.", en: "I convey to you the messages of my Lord, and I am to you a trustworthy adviser.", source: "Holy Quran" }
    ]
  },

  // --- ز ---
  {
    word: "زهره",
    displayWord: "زَهْرَة",
    root: "زهر",
    translation: "flower, blossom, splendor",
    examples: [
      { ar: "تَفَتَّحَتْ زَهْرَةُ اليَاسَمِينِ مَعَ خُيُوطِ الفَجْرِ الأُولَى.", en: "The jasmine flower bloomed with the first threads of dawn.", source: "Romantic Prose" }
    ]
  },
  {
    word: "زمن",
    displayWord: "زَمَن",
    root: "زمن",
    translation: "time, era, age",
    examples: [
      { ar: "الزَّمَنُ كَفِيلٌ بِشِفَاءِ الجُرُوحِ وَمَحْوِ الآلَامِ.", en: "Time is capable of healing wounds and erasing pains.", source: "Philosophical Novel" }
    ]
  },
  {
    word: "زياره",
    displayWord: "زِيَارَة",
    root: "زور",
    translation: "visit, calling",
    examples: [
      { ar: "تُعَدُّ زِيَارَةُ المَرِيضِ مِنَ الأَعْمَالِ الَّتِي تُقَرِّبُ بَيْنَ القُلُوبِ.", en: "Visiting the sick is considered one of the deeds that bring hearts closer.", source: "Ethical Treatise" }
    ]
  },
  {
    word: "زراعه",
    displayWord: "زِرَاعَة",
    root: "زرع",
    translation: "agriculture, farming, cultivation",
    examples: [
      { ar: "زِرَاعَةُ القَمْحِ تُسْهِمُ فِي الأَمْنِ الغِذَائِيِّ لِلْبَلَدِ.", en: "Wheat cultivation contributes to the food security of the country.", source: "Agronomy Report" }
    ]
  },
  {
    word: "زياده",
    displayWord: "زِيَادَة",
    root: "زيد",
    translation: "increase, addition, excess",
    examples: [
      { ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا.", en: "And say, 'My Lord, increase me in knowledge.'", source: "Holy Quran" }
    ]
  },
  {
    word: "زهد",
    displayWord: "زُهْد",
    root: "زهد",
    translation: "asceticism, abstinence",
    examples: [
      { ar: "تَمَيَّزَ الحَكِيمُ بِزُهْدِهِ فِي زَخَارِفِ الدُّنْيَا الفَانِيَةِ.", en: "The wise man was distinguished by his asceticism in the decorations of the mortal world.", source: "Biographical Chronicles" }
    ]
  },

  // --- س ---
  {
    word: "سماء",
    displayWord: "سَمَاء",
    root: "سمو",
    translation: "sky, heaven",
    examples: [
      { ar: "الَّذِي جَعَلَ لَكُمُ الْأَرْضَ فِرَاشًا وَالسَّمَاءَ بِنَاءً.", en: "[He] who has made for you the earth a bed and the sky a ceiling.", source: "Holy Quran" }
    ]
  },
  {
    word: "سلام",
    displayWord: "سَلَام",
    root: "سلم",
    translation: "peace, greeting, safety",
    examples: [
      { ar: "وَإِذَا خَاطَبَهُمُ الْجَاهِلُونَ قَالُوا سَلَامًا.", en: "And when the ignorant address them, they say, 'Peace.'", source: "Holy Quran" }
    ]
  },
  {
    word: "سفر",
    displayWord: "سَفَر",
    root: "سفر",
    translation: "travel, journey, book/epistle",
    examples: [
      { ar: "فِي السَّفَرِ فَوَائِدُ كَثِيرَةٌ مِنْهَا الِاطِّلَاعُ عَلَى الثَّقَافَاتِ.", en: "In travel are many benefits, including getting to know other cultures.", source: "Essay on Travel" }
    ]
  },
  {
    word: "سعاده",
    displayWord: "سَعَادَة",
    root: "سعد",
    translation: "happiness, felicity, joy",
    examples: [
      { ar: "السَّعَادَةُ العَمِيقَةُ تَكْمُنُ فِي إِسْعَادِ الآخَرِينَ.", en: "Deep happiness lies in making others happy.", source: "Philosophical Essay" }
    ]
  },
  {
    word: "سؤال",
    displayWord: "سُؤَال",
    root: "سأل",
    translation: "question, inquiry, request",
    examples: [
      { ar: "يَسْأَلُونَكَ عَنِ الْأَهِلَّةِ ۖ قُلْ هِيَ مَوَاقِيتُ لِلنَّاسِ وَالْحَجِّ.", en: "They ask you about the new moons. Say, 'They are measurements of time for the people and for Hajj.'", source: "Holy Quran" }
    ]
  },
  {
    word: "سر",
    displayWord: "سِرّ",
    root: "سرر",
    translation: "secret, mystery",
    examples: [
      { ar: "يَعْلَمُ السِّرَّ وَأَخْفَى.", en: "He knows the secret and what is [even] more hidden.", source: "Holy Quran" }
    ]
  },
  {
    word: "سيره",
    displayWord: "سِيرَة",
    root: "سير",
    translation: "biography, life story, path, character",
    examples: [
      { ar: "تَعْلَمْنَا كَثِيرًا مِنْ قِرَاءَةِ سِيرَةِ الرُّوَّادِ.", en: "We learned a lot from reading the biography of pioneers.", source: "Academic Study" }
    ]
  },

  // --- ش ---
  {
    word: "شمس",
    displayWord: "شَمْس",
    root: "شمس",
    translation: "sun",
    examples: [
      { ar: "وَالشَّمْسُ تَجْرِي لِمُسْتَقَرٍّ لَّهَا.", en: "And the sun runs on course toward its destination.", source: "Holy Quran" }
    ]
  },
  {
    word: "شجر",
    displayWord: "شَجَر",
    root: "شجر",
    translation: "trees, shrubs",
    examples: [
      { ar: "وَالنَّجْمُ وَالشَّجَرُ يَسْجُدَانِ.", en: "And the stars and trees prostrate.", source: "Holy Quran" }
    ]
  },
  {
    word: "شرف",
    displayWord: "شَرَف",
    root: "شرف",
    translation: "honor, nobility, distinction",
    examples: [
      { ar: "الحِفَاظُ عَلَى الكَلِمَةِ هُوَ جَوْهَرُ الشَّرَفِ الإِنْسَانِيِّ.", en: "Keeping one's word is the essence of human honor.", source: "Ethics Book" }
    ]
  },
  {
    word: "شكر",
    displayWord: "شُكْر",
    root: "شكر",
    translation: "thanks, gratitude, praise",
    examples: [
      { ar: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ.", en: "If you are grateful, I will surely increase you.", source: "Holy Quran" }
    ]
  },
  {
    word: "شجاعه",
    displayWord: "شَجَاعَة",
    root: "شجع",
    translation: "courage, bravery",
    examples: [
      { ar: "أَبْدَى البَطَلُ شَجَاعَةً فَائِقَةً فِي مُوَاجَهَةِ الخَطَرِ.", en: "The hero showed outstanding courage in facing danger.", source: "Adventure Novel" }
    ]
  },
  {
    word: "شعر",
    displayWord: "شِعْر",
    root: "شعر",
    translation: "poetry, verse / also (شَعْر) hair",
    examples: [
      { ar: "الشِّعْرُ هُوَ المِرْآةُ الَّتِي تَعْكِسُ وِجْدَانَ الأُمَمِ.", en: "Poetry is the mirror that reflects the nations' soul.", source: "Literary Theory" }
    ]
  },
  {
    word: "شعب",
    displayWord: "شَعْب",
    root: "شعب",
    translation: "people, nation, tribe, folk",
    examples: [
      { ar: "وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا.", en: "And We made you into nations and tribes that you may know one another.", source: "Holy Quran" }
    ]
  },

  // --- ص ---
  {
    word: "صديق",
    displayWord: "صَدِيق",
    root: "صدق",
    translation: "friend, loyal companion",
    examples: [
      { ar: "الصَّدِيقُ المُلْصِقُ يَقِفُ مَعَكَ فِي الرَّخَاءِ وَالشِّدَّةِ.", en: "The loyal friend stands with you in ease and hardship.", source: "Moral Sayings" }
    ]
  },
  {
    word: "صدق",
    displayWord: "صِدْق",
    root: "صدق",
    translation: "truthfulness, sincerity, honesty",
    examples: [
      { ar: "وَالَّذِي جَاءَ بِالصِّدْقِ وَصَدَّقَ بِهِ ۙ أُولَٰئِكَ هُمُ الْمُتَّقُونَ.", en: "And the one who has brought the truth and believed in it - those are the righteous.", source: "Holy Quran" }
    ]
  },
  {
    word: "صبر",
    displayWord: "صَبْر",
    root: "صبر",
    translation: "patience, endurance, perseverance",
    examples: [
      { ar: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ.", en: "Indeed, God is with the patient.", source: "Holy Quran" },
      { ar: "الصَّبْرُ مِفْتَاحُ الفَرَجِ بَعْدَ كُلِّ عُسْرٍ.", en: "Patience is the key to relief after every hardship.", source: "Classical Proverb" }
    ]
  },
  {
    word: "صوت",
    displayWord: "صَوْت",
    root: "صوت",
    translation: "voice, sound, vote",
    examples: [
      { ar: "كَانَ صَوْتُ القَارِئِ عَذْبًا وَمُؤَثِّرًا فِي النُّفُوسِ.", en: "The reciter's voice was sweet and moving to the souls.", source: "Memoir" }
    ]
  },
  {
    word: "صحه",
    displayWord: "صِحَّة",
    root: "صحح",
    translation: "health, authenticity, correctness",
    examples: [
      { ar: "الْتَّعْلِيمُ وَالصِّحَّةُ هُمَا أَسَاسُ التَّنْمِيَةِ البَشَرِيَّةِ.", en: "Education and health are the foundations of human development.", source: "Human Development Report" }
    ]
  },
  {
    word: "صلاه",
    displayWord: "صَلَاة",
    root: "صلو",
    translation: "prayer, worship, blessings",
    examples: [
      { ar: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا.", en: "Indeed, prayer has been decreed upon the believers at specified times.", source: "Holy Quran" }
    ]
  },
  {
    word: "صناعه",
    displayWord: "صِنَاعَة",
    root: "صنع",
    translation: "industry, manufacture, craft",
    examples: [
      { ar: "تَشْهِدُ صِنَاعَةُ البَرْمَجِيَّاتِ تَطَوُّرًا هَائِلًا.", en: "The software industry is witnessing a tremendous development.", source: "Technology Review" }
    ]
  },

  // --- ض ---
  {
    word: "ضوء",
    displayWord: "ضَوْء",
    root: "ضوء",
    translation: "light, glow, illumination",
    examples: [
      { ar: "يَبْعَثُ مِصْبَاحُ المَكْتَبِ ضَوْءًا مُنَاسِبًا لِلْقِرَاءَةِ.", en: "The desk lamp sends out a light suitable for reading.", source: "Study Guide" }
    ]
  },
  {
    word: "ضحك",
    displayWord: "ضَحِك",
    root: "ضحك",
    translation: "laughter, laughing / also (ضَحِكَ) he laughed",
    examples: [
      { ar: "فَلْيَضْحَكُوا قَلِيلًا وَلْيَبْكُوا كَثِيرًا.", en: "So let them laugh a little and weep much.", source: "Holy Quran" }
    ]
  },
  {
    word: "ضيافه",
    displayWord: "ضِيَافَة",
    root: "ضيف",
    translation: "hospitality, hosting",
    examples: [
      { ar: "أَظْهَرَ المُلِيفُ كَرَمَ الضِّيَافَةِ العَرَبِيَّةِ الأَصِيلَةِ.", en: "The host showed the authentic Arabic hospitality.", source: "Folk Narrative" }
    ]
  },
  {
    word: "ضرر",
    displayWord: "ضَرَر",
    root: "ضرر",
    translation: "harm, damage, disadvantage",
    examples: [
      { ar: "لَا ضَرَرَ وَلَا ضِرَارَ.", en: "There should be neither harming nor reciprocating harm.", source: "Hadith" }
    ]
  },
  {
    word: "ضمير",
    displayWord: "ضَمِير",
    root: "ضمر",
    translation: "conscience, pronoun, mind",
    examples: [
      { ar: "الضَّمِيرُ الحَيُّ هُوَ الرَّقِيبُ الدَّاخِلِيُّ لِلْإِنْسَانِ.", en: "A living conscience is the internal monitor of a human.", source: "Philosophical Treatise" }
    ]
  },
  {
    word: "ضمان",
    displayWord: "ضَمَان",
    root: "ضمن",
    translation: "guarantee, security, insurance",
    examples: [
      { ar: "تَوْفِيرُ الوَظَائِفِ هُوَ الضَّمَانُ لِلِاسْتِقْرَارِ الِاجْتِمَاعِيِّ.", en: "Providing jobs is the guarantee for social stability.", source: "Socio-economic Study" }
    ]
  },

  // --- ط ---
  {
    word: "طالب",
    displayWord: "طَالِب",
    root: "طلب",
    translation: "student, seeker, applicant",
    examples: [
      { ar: "يَجْتَهِدُ الطَّالِبُ لِيَنَالَ شَهَادَةَ التَّخَرُّجِ بِتَفَوُّقٍ.", en: "The student works hard to obtain the graduation certificate with distinction.", source: "Educational Biography" }
    ]
  },
  {
    word: "طريق",
    displayWord: "طَرِيق",
    root: "طرق",
    translation: "road, path, way, method",
    examples: [
      { ar: "وَأَنَّ هَٰذَا صِرَاطِي مُسْتَقِيمًا فَاتَّبِعُوهُ.", en: "And, [moreover], this is My path, which is straight, so follow it.", source: "Holy Quran" }
    ]
  },
  {
    word: "طبيعه",
    displayWord: "طَبِيعَة",
    root: "طبع",
    translation: "nature, character, temperament",
    examples: [
      { ar: "طَبِيعَةُ الرِّيفِ الهَادِئَةُ تُسَاعِدُ عَلَى التَّأَمُّلِ.", en: "The quiet nature of the countryside helps in meditation.", source: "Scenic Essay" }
    ]
  },
  {
    word: "طاقه",
    displayWord: "طَاقَة",
    root: "طوق",
    translation: "energy, capacity, power, window",
    examples: [
      { ar: "لَا تُكَلِّفْ نَفْسًا إِلَّا وُسْعَهَا.", en: "Do not burden a soul except with its capacity.", source: "Holy Quran" }
    ]
  },
  {
    word: "طفل",
    displayWord: "طِفْل",
    root: "طفل",
    translation: "child, infant",
    examples: [
      { ar: "نَامَ الطِّفْلُ الصَّغِيرُ بِهُدُوءٍ فِي مَهْدِهِ.", en: "The young child slept peacefully in his cradle.", source: "Narrative Tale" }
    ]
  },
  {
    word: "طلب",
    displayWord: "طَلَب",
    root: "طلب",
    translation: "request, demand, seeking / also (طَلَبَ) he sought",
    examples: [
      { ar: "طَلَبُ العِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ.", en: "Seeking knowledge is a duty upon every Muslim.", source: "Hadith" }
    ]
  },
  {
    word: "طموح",
    displayWord: "طُمُوح",
    root: "طمح",
    translation: "ambition, aspiration",
    examples: [
      { ar: "طُمُوحِي العَالِي يَحْفِزُنِي عَلَى التَّعَلُّمِ المُسْتَمِرِّ.", en: "My high ambition motivates me to learn continuously.", source: "Self-Reflection" }
    ]
  },

  // --- ظ ---
  {
    word: "ظل",
    displayWord: "ظِلّ",
    root: "ظلل",
    translation: "shade, shadow, protection",
    examples: [
      { ar: "أَلَمْ تَرَ إِلَىٰ رَبِّكَ كَيْفَ مَدَّ الظِّلَّ.", en: "Have you not considered your Lord - how He extends the shadow?", source: "Holy Quran" }
    ]
  },
  {
    word: "ظلام",
    displayWord: "ظَلَام",
    root: "ظلم",
    translation: "darkness, obscurity",
    examples: [
      { ar: "اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا يُخْرِجُهُم مِّنَ الظُّلُمَاتِ إِلَى النُّورِ.", en: "God is the ally of those who believe. He brings them out from darknesses into the light.", source: "Holy Quran" }
    ]
  },
  {
    word: "ظهر",
    displayWord: "ظُهْر",
    root: "ظهر",
    translation: "noon, midday / also (ظَهْر) back / also (ظَهَرَ) he/it appeared",
    examples: [
      { ar: "نُؤَدِّي صَلَاةَ الظُّهْرِ جَمَاعَةً فِي المَسْجِدِ.", en: "We perform the Dhuhr prayer in congregation in the mosque.", source: "Devotional Guide" }
    ]
  },
  {
    word: "ظلم",
    displayWord: "ظُلْم",
    root: "ظلم",
    translation: "injustice, tyranny, oppression",
    examples: [
      { ar: "أَلَا لَعْنَةُ اللَّهِ عَلَى الظَّالِمِينَ.", en: "Unquestionably, the curse of God is upon the wrongdoers.", source: "Holy Quran" },
      { ar: "الظُّلْمُ ظُلُمَاتٌ يَوْمَ القِيَامَةِ.", en: "Injustice will be darknesses on the Day of Resurrection.", source: "Hadith" }
    ]
  },
  {
    word: "ظفر",
    displayWord: "ظَفَر",
    root: "ظفر",
    translation: "victory, triumph, fingernail / also (ظَفِرَ) he won",
    examples: [
      { ar: "نَالَتِ الحُرِّيَّةُ ظَفَرًا كَبِيرًا بَعْدَ الكِفَاحِ.", en: "Freedom achieved a great victory after the struggle.", source: "Historical Record" }
    ]
  },
  {
    word: "ظن",
    displayWord: "ظَنّ",
    root: "ظنن",
    translation: "suspicion, belief, conjecture",
    examples: [
      { ar: "يَا أَيُّهَا الَّذِينَ آمَنُوا اجْتَنِبُوا كَثِيرًا مِّنَ الظَّنِّ إِنَّ بَعْضَ الظَّنِّ إِثْمٌ.", en: "O you who have believed, avoid much [negative] assumption, indeed some assumption is sin.", source: "Holy Quran" }
    ]
  },

  // --- ع ---
  {
    word: "علم",
    displayWord: "عِلْم",
    root: "علم",
    translation: "knowledge, science, learning",
    examples: [
      { ar: "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ.", en: "God will raise those who have believed among you and those who were given knowledge, by degrees.", source: "Holy Quran" }
    ]
  },
  {
    word: "عمل",
    displayWord: "عَمَل",
    root: "عمل",
    translation: "work, deed, action, job",
    examples: [
      { ar: "وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ.", en: "And say, 'Do deeds, for God will see your deeds, and [so, too], His Messenger and the believers.'", source: "Holy Quran" },
      { ar: "إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ.", en: "Indeed, God loves that when one of you does a job, they do it perfectly.", source: "Hadith" }
    ]
  },
  {
    word: "عدل",
    displayWord: "عَدْل",
    root: "عدل",
    translation: "justice, fairness, integrity",
    examples: [
      { ar: "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ.", en: "Indeed, God orders justice and good conduct.", source: "Holy Quran" }
    ]
  },
  {
    word: "عقل",
    displayWord: "عَقْل",
    root: "عقل",
    translation: "mind, intellect, reason",
    examples: [
      { ar: "الْتَّفَكُّرُ فِي مَظَاهِرِ الكَوْنِ يُغَذِّي العَقْلَ البَشَرِيَّ.", en: "Reflecting on the manifestations of the universe nourishes the human mind.", source: "Philosophy of Science" }
    ]
  },
  {
    word: "عين",
    displayWord: "عَيْن",
    root: "عين",
    translation: "eye, water spring, essence",
    examples: [
      { ar: "فِيهَا عَيْنٌ جَارِيَةٌ.", en: "Within it is a flowing spring.", source: "Holy Quran" }
    ]
  },
  {
    word: "عهد",
    displayWord: "عَهْد",
    root: "عهد",
    translation: "covenant, era, treaty, epoch",
    examples: [
      { ar: "وَأَوْفُوا بِالْعَهْدِ ۖ إِنَّ الْعَهْدَ كَانَ مَسْئُولًا.", en: "And fulfill the covenant. Indeed, the covenant will be questioned.", source: "Holy Quran" }
    ]
  },
  {
    word: "عزيمه",
    displayWord: "عَزِيمَة",
    root: "عزم",
    translation: "determination, resolve",
    examples: [
      { ar: "فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ.", en: "And when you have decided, then rely upon God.", source: "Holy Quran" }
    ]
  },

  // --- غ ---
  {
    word: "غرفه",
    displayWord: "غُرْفَة",
    root: "غرف",
    translation: "room, chamber",
    examples: [
      { ar: "رَتَّبَتْ أُخْتِي غُرْفَةَ المَعِيشَةِ بِذَوْقٍ جَمِيلٍ.", en: "My sister arranged the living room with beautiful taste.", source: "Family Memoirs" }
    ]
  },
  {
    word: "غنى",
    displayWord: "غِنَى",
    root: "غني",
    translation: "wealth, richness, independence",
    examples: [
      { ar: "لَيْسَ الغِنَى عَنْ كَثْرَةِ العَرَضِ، وَلَكِنَّ الغِنَى غِنَى النَّفْسِ.", en: "Wealth is not in having many possessions, but wealth is contentment of the soul.", source: "Hadith" }
    ]
  },
  {
    word: "غاية",
    displayWord: "غَايَة",
    root: "غيي",
    translation: "goal, aim, target, extreme limit",
    examples: [
      { ar: "الغَايَةُ النَّبِيلَةُ تَتَطَلَّبُ وَسَائِلَ شَرِيفَةً كَذَلِكَ.", en: "A noble goal requires honorable means as well.", source: "Ethical Textbook" }
    ]
  },
  {
    word: "غد",
    displayWord: "غَد",
    root: "غدو",
    translation: "tomorrow, future",
    examples: [
      { ar: "وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ.", en: "And let every soul look to what it has sent forth for tomorrow.", source: "Holy Quran" }
    ]
  },
  {
    word: "غيم",
    displayWord: "غَيْم",
    root: "غيم",
    translation: "clouds, gloom",
    examples: [
      { ar: "حَجَبَ الغَيْمُ الكَثِيفُ أَشِعَّةَ الشَّمْسِ.", en: "The dense cloud blocked the sun rays.", source: "Nature Chronicle" }
    ]
  },
  {
    word: "غبار",
    displayWord: "غُبَار",
    root: "غبر",
    translation: "dust, powder",
    examples: [
      { ar: "تَمْلَأُ العَاصِفَةُ الرَّمْلِيَّةُ الهَوَاءَ بِالغُبَارِ.", en: "The sandstorm fills the air with dust.", source: "Geographic Account" }
    ]
  },

  // --- ف ---
  {
    word: "فرح",
    displayWord: "فَرَح",
    root: "فرح",
    translation: "joy, happiness, celebration",
    examples: [
      { ar: "قُلْ بِبَضْلِ اللَّهِ وَبِرَحْمَتِهِ فَبِذَٰلِكَ فَلْيَفْرَحُوا.", en: "Say, 'In the bounty of God and in His mercy - in that let them rejoice.'", source: "Holy Quran" }
    ]
  },
  {
    word: "فوز",
    displayWord: "فَوْز",
    root: "فوز",
    translation: "winning, victory, success",
    examples: [
      { ar: "فَمَن زُحْزِحَ عَنِ النَّارِ وَأُدْخِلَ الْجَنَّةَ فَقَدْ فَازَ.", en: "So he who is drawn away from the Fire and admitted to Paradise has attained [his desire].", source: "Holy Quran" }
    ]
  },
  {
    word: "فكر",
    displayWord: "فِكْر",
    root: "فكر",
    translation: "thought, intellect, opinion, philosophy",
    examples: [
      { ar: "الفِكْرُ الحُرُّ هُوَ رَكِيزَةُ الإِبْدَاعِ الإِنْسَانِيِّ.", en: "Free thought is the pillar of human creativity.", source: "Intellectual History" }
    ]
  },
  {
    word: "فضل",
    displayWord: "فَضْل",
    root: "فضل",
    translation: "favor, virtue, grace, surplus",
    examples: [
      { ar: "ذَٰلِكَ فَضْلُ اللَّهِ يُؤْتِيهِ مَن يَشَاءُ.", en: "That is the favor of God, He bestows it upon whom He wills.", source: "Holy Quran" }
    ]
  },
  {
    word: "فرصه",
    displayWord: "فُرْصَة",
    root: "فرص",
    translation: "opportunity, chance",
    examples: [
      { ar: "اغْتَنَمَ الشَّابُّ فُرْصَةَ السَّفَرِ لِتَعَلُّمِ مَهَارَاتٍ نَادِرَةٍ.", en: "The young man seized the travel opportunity to learn rare skills.", source: "Biographical Note" }
    ]
  },
  {
    word: "فجر",
    displayWord: "فَجْر",
    root: "فجر",
    translation: "dawn, daybreak",
    examples: [
      { ar: "سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ.", en: "Peace it is until the emergence of dawn.", source: "Holy Quran" }
    ]
  },
  {
    word: "فلسفه",
    displayWord: "فَلْسَفَة",
    root: "فلسف",
    translation: "philosophy",
    examples: [
      { ar: "تَدْرُسُ الفَلْسَفَةُ العَلَاقَةَ بَيْنَ العَقْلِ وَالوَاقِعِ.", en: "Philosophy studies the relationship between mind and reality.", source: "Academic Text" }
    ]
  },

  // --- ق ---
  {
    word: "قلم",
    displayWord: "قَلَم",
    root: "قلم",
    translation: "pen, pencil, stylus",
    examples: [
      { ar: "الَّذِي عَلَّمَ بِالْقَلَمِ.", en: "Who taught by the pen.", source: "Holy Quran" },
      { ar: "كَتَبْتُ خَوَاطِرِي بِالقَلَمِ الحِبْرِ المُمَيَّزِ.", en: "I wrote my thoughts with the special ink pen.", source: "Creative Writing" }
    ]
  },
  {
    word: "قراءه",
    displayWord: "قِرَاءَة",
    root: "قرأ",
    translation: "reading, recitation",
    examples: [
      { ar: "القِرَاءَةُ تُغَذِّي العَقْلَ بِالمَعَارِفِ وَالعُلُومِ.", en: "Reading nourishes the mind with knowledge and science.", source: "Educational Essay" }
    ]
  },
  {
    word: "قوه",
    displayWord: "قُوَّة",
    root: "قوي",
    translation: "strength, power, force",
    examples: [
      { ar: "يَا يَحْيَىٰ خُذِ الْكِتَابَ بِقُوَّةٍ.", en: "O John, take the Scripture with strength.", source: "Holy Quran" }
    ]
  },
  {
    word: "قمر",
    displayWord: "قَمَر",
    root: "قمر",
    translation: "moon",
    examples: [
      { ar: "وَاقْتَرَبَ الْوَعْدُ الْحَقُّ فَإِذَا هِيَ شَاخِصَةٌ أَبْصَارُ الَّذِينَ كَفَرُوا.", en: "And the true promise has approached; then suddenly the eyes of those who disbelieved stare in horror.", source: "Holy Quran" }
    ]
  },
  {
    word: "قلب",
    displayWord: "قَلْب",
    root: "قلب",
    translation: "heart, core, reverse / also (قَلَبَ) he inverted",
    examples: [
      { ar: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ.", en: "Unquestionably, by the remembrance of God do hearts find peace.", source: "Holy Quran" }
    ]
  },
  {
    word: "قرار",
    displayWord: "قَرَار",
    root: "قرر",
    translation: "decision, resolution, stability",
    examples: [
      { ar: "اتَّخَذَتِ الإِدَارَةُ قَرَارًا هَامًّا لِتَحْسِينِ العَمَلِ.", en: "The administration took an important decision to improve the work.", source: "Corporate Minutes" }
    ]
  },
  {
    word: "قيمه",
    displayWord: "قِيمَة",
    root: "قوم",
    translation: "value, worth, price",
    examples: [
      { ar: "تَكْمُنُ قِيمَةُ العِلْمِ فِي العَمَلِ بِهِ لِصَالِحِ البَشَرِيَّةِ.", en: "The value of knowledge lies in practicing it for the benefit of humanity.", source: "Philosophical Essay" }
    ]
  },

  // --- ك ---
  {
    word: "كتاب",
    displayWord: "كِتَاب",
    root: "كتب",
    translation: "book, scripture, writing, letter",
    examples: [
      { ar: "الْكِتَابُ خَيْرُ جَلِيسٍ فِي الزَّمَانِ لِمَنْ يَبْحَثُ عَنِ الحِكْمَةِ.", en: "The book is the best companion in time for whoever seeks wisdom.", source: "Classical Proverb" },
      { ar: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ.", en: "This is the Book about which there is no doubt, a guidance for those conscious of God.", source: "Holy Quran" }
    ]
  },
  {
    word: "كلام",
    displayWord: "كَلَام",
    root: "كلم",
    translation: "speech, talk, words",
    examples: [
      { ar: "خَيْرُ الكَلَامِ مَا قَلَّ وَدَلَّ وَلَمْ يُطِلْ فَيُمِلَّ.", en: "The best speech is that which is brief, clear, and not long-winded to cause boredom.", source: "Classical Rhetoric" }
    ]
  },
  {
    word: "كرم",
    displayWord: "كَرَم",
    root: "كرم",
    translation: "generosity, nobility",
    examples: [
      { ar: "يَشْتَهِرُ أَهْلُ الشَّرْقِ بِالكَرَمِ وَحُسْنِ الضِّيَافَةِ.", en: "People of the East are famous for generosity and good hospitality.", source: "Travel Memoir" }
    ]
  },
  {
    word: "كمال",
    displayWord: "كَمَال",
    root: "كمل",
    translation: "perfection, completeness",
    examples: [
      { ar: "الْتَّطَوُّرُ المُسْتَمِرُّ هُوَ سَعْيٌ دَائِمٌ نَحْوَ الكَمَالِ.", en: "Continuous development is a permanent pursuit of perfection.", source: "Philosophical Treatise" }
    ]
  },
  {
    word: "كون",
    displayWord: "كَوْن",
    root: "كون",
    translation: "universe, existence, being",
    examples: [
      { ar: "الْتَّأَمُّلُ فِي بَدِيعِ صُنْعِ الكَوْنِ يَزِيدُ الإِيمَانَ.", en: "Contemplating the wonderful design of the universe increases faith.", source: "Spiritual Essay" }
    ]
  },
  {
    word: "كفاح",
    displayWord: "كِفَاح",
    root: "كفح",
    translation: "struggle, fight, battle, effort",
    examples: [
      { ar: "نَالَتِ الشُّعُوبُ حُرِّيَّتَهَا بَعْدَ كِفَاحٍ مَرِيرٍ.", en: "Nations achieved their freedom after a bitter struggle.", source: "Historical Analysis" }
    ]
  },
  {
    word: "كنز",
    displayWord: "كَنْز",
    root: "كنز",
    translation: "treasure",
    examples: [
      { ar: "وَكَانَ تَحْتَهُ كَنزٌ لَّهُمَا.", en: "And beneath it was a treasure for them.", source: "Holy Quran" }
    ]
  },

  // --- ل ---
  {
    word: "ليل",
    displayWord: "لَيْل",
    root: "ليل",
    translation: "night, nighttime",
    examples: [
      { ar: "وَاللَّيْلِ إِذَا يَغْشَىٰ.", en: "By the night when it covers.", source: "Holy Quran" },
      { ar: "يَقْرَأُ الكَاتِبُ رِوَايَاتِهِ فِي هُدُوءِ اللَّيْلِ.", en: "The writer reads his novels in the calmness of the night.", source: "Literary Profile" }
    ]
  },
  {
    word: "لغه",
    displayWord: "لُغَة",
    root: "لغو",
    translation: "language, tongue, speech",
    examples: [
      { ar: "اللُّغَةُ العَرَبِيَّةُ لُغَةٌ غَنِيَّةٌ بِالمُفْرَدَاتِ وَالفَصَاحَةِ.", en: "The Arabic language is rich in vocabulary and eloquence.", source: "Linguistic Studies" }
    ]
  },
  {
    word: "لطف",
    displayWord: "لُطْف",
    root: "لطف",
    translation: "kindness, gentleness, grace",
    examples: [
      { ar: "عَامِلِ النَّاسَ بِاحْتِرَامٍ وَلُطْفٍ تَكْسِبْ قُلُوبَهُمْ.", en: "Treat people with respect and kindness, and you will win their hearts.", source: "Social Ethics" }
    ]
  },
  {
    word: "لعب",
    displayWord: "لَعِب",
    root: "لعب",
    translation: "play, game, fun / also (لَعِبَ) he played",
    examples: [
      { ar: "وَمَا الْحَيَاةُ الدُّنْيَا إِلَّا لَعِبٌ وَلَهْوٌ.", en: "And the worldly life is not but play and amusement.", source: "Holy Quran" }
    ]
  },
  {
    word: "لقاء",
    displayWord: "لِقَاء",
    root: "لقي",
    translation: "meeting, encounter",
    examples: [
      { ar: "كَانَ لِقَاءُ الأَصْدِقَاءِ بَعْدَ سَنَوَاتٍ طَوِيلَةٍ مُؤَثِّرًا جِدًّا.", en: "The meeting of friends after long years was very moving.", source: "Modern Story" }
    ]
  },
  {
    word: "لوحه",
    displayWord: "لَوْحَة",
    root: "لوح",
    translation: "painting, board, tablet, frame",
    examples: [
      { ar: "رَسَمَ الفَنَّانُ لَوْحَةً بَدِيعَةً لِلرِّيفِ فِي الرَّبِيعِ.", en: "The artist painted a wonderful painting of the countryside in spring.", source: "Art Review" }
    ]
  },

  // --- م ---
  {
    word: "مدرسه",
    displayWord: "مَدْرَسَة",
    root: "درس",
    translation: "school, institute, denomination",
    examples: [
      { ar: "يَذْهَبُ التَّلَامِيذُ إِلَى المَدْرَسَةِ بِكُلِّ شَوْقٍ صَبَاحًا.", en: "The pupils go to school with all eagerness in the morning.", source: "Children Narrative" }
    ]
  },
  {
    word: "ماء",
    displayWord: "مَاء",
    root: "موه",
    translation: "water, liquid",
    examples: [
      { ar: "وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ.", en: "And We made from water every living thing.", source: "Holy Quran" }
    ]
  },
  {
    word: "معلم",
    displayWord: "مُعَلِّم",
    root: "علم",
    translation: "teacher, instructor, master, landmark",
    examples: [
      { ar: "يَحْتَرِمُ المُجْتَمَعُ المُعَلِّمَ لِدَوْرِهِ فِي بِنَاءِ الأَجْيَالِ.", en: "Society respects the teacher for his role in building generations.", source: "Educational Speech" }
    ]
  },
  {
    word: "محبه",
    displayWord: "مَحَبَّة",
    root: "حبب",
    translation: "love, affection, friendship",
    examples: [
      { ar: "تَنْتَشِرُ المَحَبَّةُ بَيْنَ النَّاسِ بِالتَّسَامُحِ وَالعَطَاءِ الكَبِيرِ.", en: "Love spreads among people through tolerance and great giving.", source: "Social Philosophy" }
    ]
  },
  {
    word: "مستقبل",
    displayWord: "مُسْتَقْبَل",
    root: "قبل",
    translation: "future / also (مُسْتَقْبِل) receiver, host",
    examples: [
      { ar: "نَبْنِي المُسْتَقْبَلَ بِالتَّخْطِيطِ السَّلِيمِ فِي الحَاضِرِ.", en: "We build the future with proper planning in the present.", source: "Strategic Guide" }
    ]
  },
  {
    word: "مجد",
    displayWord: "مَجْد",
    root: "مجد",
    translation: "glory, honor, nobility",
    examples: [
      { ar: "بَنَى الأَجْدَادُ مَجْدًا عَرِيقًا نَفْخَرُ بِهِ جَمِيعًا.", en: "The ancestors built an ancient glory that we all are proud of.", source: "National Anthem Essay" }
    ]
  },
  {
    word: "موت",
    displayWord: "مَوْت",
    root: "موت",
    translation: "death",
    examples: [
      { ar: "كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ.", en: "Every soul will taste death.", source: "Holy Quran" }
    ]
  },

  // --- ن ---
  {
    word: "نور",
    displayWord: "نُور",
    root: "نور",
    translation: "light, illumination, glow",
    examples: [
      { ar: "اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ.", en: "God is the Light of the heavens and the earth.", source: "Holy Quran" },
      { ar: "العِلْمُ نُورٌ وَالْجَهْلُ ظَلَامٌ دَامِسٌ.", en: "Knowledge is light, and ignorance is deep darkness.", source: "Classical Proverb" }
    ]
  },
  {
    word: "نجم",
    displayWord: "نَجْم",
    root: "نجم",
    translation: "star, celestial body, celebrity",
    examples: [
      { ar: "وَبِالنَّجْمِ هُمْ يَهْتَدُونَ.", en: "And by the star they are guided.", source: "Holy Quran" }
    ]
  },
  {
    word: "نفس",
    displayWord: "نَفْس",
    root: "نفس",
    translation: "soul, self, breath, person",
    examples: [
      { ar: "يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ ارْجِعِي إِلَىٰ رَبِّكِ.", en: "O reassured soul, return to your Lord.", source: "Holy Quran" }
    ]
  },
  {
    word: "نهر",
    displayWord: "نَهْر",
    root: "نهر",
    translation: "river",
    examples: [
      { ar: "فِيهِمَا أَنْهَارٌ تَجْرِي بِاسْتِمْرَارٍ لِتَرْوِيَ الحُقُولَ.", en: "In both are rivers flowing continuously to irrigate the fields.", source: "Geographic Prose" }
    ]
  },
  {
    word: "نصيحه",
    displayWord: "نَصِيحَة",
    root: "نصح",
    translation: "advice, counsel, sincerity",
    examples: [
      { ar: "الدِّينُ النَّصِيحَةُ.", en: "Religion is [giving] sincere advice.", source: "Hadith" }
    ]
  },
  {
    word: "نجاح",
    displayWord: "نَجَاح",
    root: "نجح",
    translation: "success, achievement",
    examples: [
      { ar: "الْتَّصْمِيمُ وَالعَمَلُ الجَادُّ هُمَا مِفْتَاحَا النَّجَاحِ فِي الحَيَاةِ.", en: "Determination and hard work are the two keys to success in life.", source: "Success Book" }
    ]
  },
  {
    word: "نظام",
    displayWord: "نِظَام",
    root: "نظم",
    translation: "system, order, regulation, organization",
    examples: [
      { ar: "الْتَّزَمَ المُواطِنُونَ بِالنِّظَامِ لِتَسْهِيلِ حَرَكَةِ المُرُورِ.", en: "The citizens committed to the system to facilitate traffic flow.", source: "Civic Notice" }
    ]
  },

  // --- ه ---
  {
    word: "هلال",
    displayWord: "هِلَال",
    root: "هلل",
    translation: "crescent, crescent moon",
    examples: [
      { ar: "رَأَى الأَطْفَالُ هِلَالَ الشَّهْرِ الجَدِيدِ فَبَدَتْ عَلَيْهِمُ البَهْجَةُ.", en: "The children saw the crescent of the new month, and joy appeared on them.", source: "Folk Story" }
    ]
  },
  {
    word: "هدى",
    displayWord: "هُدَى",
    root: "هدي",
    translation: "guidance, direction, standard",
    examples: [
      { ar: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ.", en: "This is the Book about which there is no doubt, a guidance for those conscious of God.", source: "Holy Quran" }
    ]
  },
  {
    word: "هدوء",
    displayWord: "هُدُوء",
    root: "هدأ",
    translation: "calmness, quietness, peace",
    examples: [
      { ar: "أَعْشَقُ القِرَاءَةَ فِي هُدُوءِ اللَّيْلِ الصَّافِي.", en: "I adore reading in the calmness of the clear night.", source: "Personal Essay" }
    ]
  },
  {
    word: "هواء",
    displayWord: "هَوَاء",
    root: "هوي",
    translation: "air, breeze, atmosphere, desire",
    examples: [
      { ar: "الْهَوَاءُ النَّقِيُّ عُنْصُرٌ أَسَاسِيٌّ لِصِحَّةِ الجَسَدِ البَشَرِيِّ.", en: "Clean air is an essential element for the health of the human body.", source: "Sanitary Textbook" }
    ]
  },
  {
    word: "هديه",
    displayWord: "هَدِيَّة",
    root: "هدي",
    translation: "gift, present, offering",
    examples: [
      { ar: "تَهَادَوْا تَحَابُّوا.", en: "Give gifts to one another, you will love one another.", source: "Hadith" }
    ]
  },
  {
    word: "همه",
    displayWord: "هِمَّة",
    root: "همم",
    translation: "resolve, determination, energy, ambition",
    examples: [
      { ar: "أَبْدَى الطُّلَّابُ هِمَّةً عَالِيَةً فِي تَنْظِيفِ سَاحَةِ المَدْرَسَةِ.", en: "The students showed high determination in cleaning the schoolyard.", source: "School Journal" }
    ]
  },

  // --- و ---
  {
    word: "وقت",
    displayWord: "وَقْت",
    root: "وقت",
    translation: "time, period, moment",
    examples: [
      { ar: "الوَقْتُ كَالسَّيْفِ إِنْ لَمْ تَقْطَعْهُ قَطَعَكَ.", en: "Time is like a sword; if you do not cut it, it cuts you.", source: "Classical Proverb" }
    ]
  },
  {
    word: "وطن",
    displayWord: "وَطَن",
    root: "وطن",
    translation: "homeland, country, home",
    examples: [
      { ar: "حُبُّ الوَطَنِ غَرِيزَةٌ مَزْرُوعَةٌ فِي نُفُوسِ البَشَرِ الصَّالِحِينَ.", en: "Love of the homeland is an instinct planted in the souls of righteous humans.", source: "National Literature" }
    ]
  },
  {
    word: "وفاء",
    displayWord: "وَفَاء",
    root: "وفي",
    translation: "loyalty, faithfulness, fulfillment",
    examples: [
      { ar: "الوَفَاءُ بِالعَهْدِ صِفَةٌ تُمَيِّزُ الأَصْدِقَاءَ الحَقِيقِيِّينَ.", en: "Fulfillment of covenant is a trait distinguishing true friends.", source: "Ethical Treatise" }
    ]
  },
  {
    word: "ورد",
    displayWord: "وَرْد",
    root: "ورد",
    translation: "roses, flowers, watering place, daily devotion",
    examples: [
      { ar: "تَفُوحُ رَائِحَةُ الوَرْدِ فَتَمْلَأُ الرِّيفَ بَهْجَةً وَعَطِرًا.", en: "The scent of roses wafts, filling the countryside with joy and fragrance.", source: "Nature Prose" }
    ]
  },
  {
    word: "ود",
    displayWord: "وُدّ",
    root: "ودد",
    translation: "friendship, love, intimacy",
    examples: [
      { ar: "إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ سَيَجْعَلُ لَهُمُ الرَّحْمَٰنُ وُدًّا.", en: "Indeed, those who have believed and done righteous deeds - the Most Merciful will appoint for them affection.", source: "Holy Quran" }
    ]
  },
  {
    word: "وضوح",
    displayWord: "وُضُوح",
    root: "وضح",
    translation: "clarity, plainness",
    examples: [
      { ar: "تَمَيَّزَتْ خُطْبَةُ الأَمِيرِ بِوُضُوحٍ بَلِيغٍ وَإِيجَازٍ مُمَيَّزٍ.", en: "The prince's speech was characterized by eloquent clarity and distinct brevity.", source: "Historical Chronicles" }
    ]
  },

  // --- ي ---
  {
    word: "يوم",
    displayWord: "يَوْم",
    root: "يوم",
    translation: "day, period, era",
    examples: [
      { ar: "اليَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ وَأَتْمَمْتُ عَلَيْكُمْ نِعْمَتِي.", en: "Today I have perfected for you your religion and completed My favor upon you.", source: "Holy Quran" }
    ]
  },
  {
    word: "يد",
    displayWord: "يَد",
    root: "يدي",
    translation: "hand, power, handle",
    examples: [
      { ar: "اليَدُ العُلْيَا خَيْرٌ مِنَ اليَدِ السُّفْلَى.", en: "The upper hand is better than the lower hand.", source: "Hadith" }
    ]
  },
  {
    word: "يسر",
    displayWord: "يُسْر",
    root: "يسر",
    translation: "ease, prosperity, wealth",
    examples: [
      { ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا * إِنَّ مَعَ الْعُسْرِ يُسْرًا.", en: "For indeed, with hardship [there is] ease. Indeed, with hardship [there is] ease.", source: "Holy Quran" }
    ]
  },
  {
    word: "يقين",
    displayWord: "يَقِين",
    root: "يقن",
    translation: "certainty, absolute belief, conviction",
    examples: [
      { ar: "وَاعْبُدْ رَبَّكَ حَتَّىٰ يَأْتِيَكَ الْيَقِينُ.", en: "And worship your Lord until there comes to you the certainty.", source: "Holy Quran" }
    ]
  },
  {
    word: "ينبوع",
    displayWord: "يَنْبُوع",
    root: "نبع",
    translation: "spring, fountain, source",
    examples: [
      { ar: "العِلْمُ يَنْبُوعٌ لَا يَنْضَبُ عَبْرَ العُصُورِ.", en: "Knowledge is a fountain that does not run dry across ages.", source: "Academic Essay" }
    ]
  }
];

// Group entries by first letter normalized
// Let's create helper to normalize Arabic first letter
function getNormalizedFirstLetter(word) {
  if (!word) return 'ا';
  let char = word.trim().charAt(0);
  
  // Vowels and special letters normalizations
  if (['أ', 'إ', 'آ', 'ٱ', 'ا', 'إ'].includes(char)) {
    return 'ا';
  }
  return char;
}

const letterFiles = {};

// Initialize all letters to empty lists to ensure standard files exist
const arabicAlphabet = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];
for (const letter of arabicAlphabet) {
  letterFiles[letter] = [];
}

// Distribute entries
dictionaryEntries.forEach(entry => {
  const normWord = entry.word;
  const firstLetter = getNormalizedFirstLetter(normWord);
  if (letterFiles[firstLetter]) {
    letterFiles[firstLetter].push(entry);
  } else {
    // Fallback if some non-standard letter
    letterFiles['ا'].push(entry);
  }
});

// Write letter JSON files
const manifest = {
  totalEntries: dictionaryEntries.length,
  letters: {}
};

for (const letter of arabicAlphabet) {
  const entries = letterFiles[letter];
  const filename = `${letter}.json`;
  const filePath = path.join(outputDir, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8');
  manifest.letters[letter] = {
    filename,
    count: entries.length,
    sizeBytes: fs.statSync(filePath).size
  };
}

// Write manifest.json
fs.writeFileSync(
  path.join(outputDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf-8'
);

console.log(`Successfully compiled Arabic dictionary! Total entries: ${dictionaryEntries.length}. All files written in public/dictionary/`);
