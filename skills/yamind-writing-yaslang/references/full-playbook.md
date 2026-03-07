---
name: arabic
description: "Arabic language mastery across MSA and major dialects for translation, localization, rewriting, and dialect-aware analysis. Use when handling Arabic text, detecting dialect, adapting tone/formality, or converting between Arabic and English."
---

# Arabic Language Mastery Skill

## Overview
Comprehensive Arabic language enhancement system designed to provide deep understanding of Modern Standard Arabic (MSA), dialectal variations, morphological structures, and cultural context. This skill transforms Claude's Arabic capabilities from basic translation to native-level comprehension across the Arab world's linguistic diversity.

## Progressive Loading
- Fast path first: `references/quickstart-runtime.md`
- Full language playbook: this file
- Source deep reference: `/Users/yascene/YaMind-Writer-Desk/Skills/Writing-Skills/Yaslang/SKILL.md`

## When to Use This Skill
**ALWAYS activate this skill when:**
- Processing any Arabic text (reading, writing, translation)
- Identifying or working with specific Arabic dialects
- Translating between Arabic and other languages
- Creating Arabic content (formal or informal)
- Analyzing Arabic morphology or grammar
- Interpreting cultural context in Arabic communications
- Providing dialect-specific responses
- Diacritizing text or resolving ambiguities
- Adapting tone/formality for Arabic audiences

## Core Capabilities

### 1. Dialectal Intelligence System
### 2. Morphological Analysis Framework
### 3. Cultural Context Engine
### 4. Translation Excellence Protocol
### 5. Diacritization & Disambiguation
---

## PART 1: DIALECTAL INTELLIGENCE SYSTEM

### Major Arabic Dialect Families

#### **1. EGYPTIAN ARABIC (Masri) - مصري**
**Speakers:** ~100 million | **Regions:** Egypt  
**Characteristics:**
- Most widely understood across Arab world (due to media/cinema)
- Present tense prefix: **ب (b-)** → بكتب (baktib) = "I write"
- Negation: **مش (mish)** → مش عارف (mish ʿārif) = "I don't know"
- "What": **ايه (eh)** → ايه ده؟ (eh da?) = "What's this?"
- "How": **ازاي (izzay)** → ازاي؟ (izzay?) = "How?"
- "Want": **عايز/عايزة (ʿāyiz/ʿāyza)** (m/f)
- Simplified grammar compared to MSA
- "J" sound (ج) pronounced as hard "G"

**Common Phrases:**
- أزيك؟ (izzayyak?) = How are you? (informal)
- تمام (tamām) = Fine/Good
- يلا (yalla) = Let's go/Come on
- معلش (maʿlesh) = Sorry/Never mind

---

#### **2. LEVANTINE ARABIC (Shami) - شامي**
**Speakers:** ~50 million | **Regions:** Syria, Lebanon, Jordan, Palestine  
**Characteristics:**
- Present tense prefix: **ب (b-)** → بكتب (biktob) = "I write"
- Negation: **ما...ش (ma...sh)** → ما بعرف ش (ma baʿrif sh) = "I don't know"
- "What": **شو (shu)** → شو هاد؟ (shu hād?) = "What's this?"
- "How": **كيف (keef)** → كيف؟ (keef?) = "How?"
- "Want": **بدي (biddi)** → بدي اروح (biddi arūḥ) = "I want to go"
- Heavy use of **ه (h)** suffix for "this/that"
- "Q" sound (ق) often becomes glottal stop or "g"

**Common Phrases:**
- كيفك؟ (keefak?) = How are you?
- منيح (mnīḥ) = Good/Fine
- يلا (yalla) = Let's go
- تفضل (tfaḍḍal) = Please/Go ahead
- مبسوط (mabsūṭ) = Happy

**Regional Variations:**
- Lebanese: More French loanwords, softer pronunciation
- Syrian: Clearer pronunciation, closer to MSA
- Palestinian: Mix of urban/rural variants
- Jordanian: Bedouin influences

---

#### **3. GULF ARABIC (Khaleeji) - خليجي**
**Speakers:** ~40 million | **Regions:** Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, Oman  
**Characteristics:**
- Present tense prefix: **ي/ت (yi-/ti-)** → يكتب (yiktib) = "He writes"
- Negation: **ما (ma)** → ما أدري (ma adri) = "I don't know"
- "What": **شنو/ويش (shinu/wēsh)** → شنو هذا؟ (shinu hātha?) = "What's this?"
- "How": **شلون (shlōn)** → شلون؟ (shlōn?) = "How?"
- "Want": **أبي/أبغى (abi/abgha)** → أبي أروح (abi arūḥ) = "I want to go"
- Retention of some classical features
- "K" sound (ك) often as "ch" sound

**Common Phrases:**
- شلونك؟ (shlōnak?) = How are you?
- زين (zēn) = Good/Fine
- تعال (taʿāl) = Come here
- إنشاء الله (inshallah) = God willing (very frequent)
- يزاك الله خير (yazāk allah khayr) = May God reward you

**Regional Variations:**
- Saudi: Multiple sub-dialects (Najdi, Hijazi, etc.)
- Emirati: Distinct pronunciation, many English loanwords
- Kuwaiti: Mix of Bedouin and urban features
- Omani: Unique vocabulary, some Swahili influence

---

#### **4. MAGHREBI ARABIC (North African) - مغربي**
**Speakers:** ~75 million | **Regions:** Morocco, Algeria, Tunisia, Libya, Mauritania  
**Characteristics:**
- Present tense prefix: **كا/تا (ka-/ta-)** → كنكتب (kanktib) = "I write" (Moroccan)
- Heavy Berber (Amazigh) and French influence
- "What": **شنو/اش (shnu/āsh)** → اش هذا؟ (āsh hātha?) = "What's this?"
- "How": **كيفاش (kifāsh)** → كيفاش؟ (kifāsh?) = "How?"
- Fastest spoken dialect, often incomprehensible to Eastern Arabs
- Many vowels dropped, consonant clusters common
- "Q" sound (ق) often becomes "g" or glottal stop

**Common Phrases (Moroccan):**
- كيداير؟ (ki dāyer?) = How are you? (m)
- لاباس (la bas) = Fine/No problem
- بزاف (bezzāf) = A lot/Very
- واخا (wākha) = OK/Alright
- بسلامة (b-slāma) = Goodbye

**Regional Variations:**
- Moroccan: Heaviest Berber influence, most distinct
- Algerian: Mix of Berber and French, regional diversity
- Tunisian: Closer to Eastern dialects, Italian influence
- Libyan: Bridges Maghrebi and Egyptian features

---

#### **5. IRAQI ARABIC - عراقي**
**Speakers:** ~35 million | **Regions:** Iraq  
**Characteristics:**
- Distinct from Gulf despite geographic proximity
- Present tense prefix: **د/دا (d-/da-)** or **كو (ko-)** → داكتب (dāktib) = "I write"
- "What": **شنو (shinu)** → شنو هذا؟ (shinu hātha?) = "What's this?"
- "Want": **أريد (urīd)** (closer to MSA) or **أريد (arīd)**
- Rich vocabulary, many Persian and Turkish loanwords
- Two main variants: Baghdadi (gilit) and Southern (qiltu)

**Common Phrases:**
- شلونك؟ (shlōnak?) = How are you?
- زين (zēn) = Good
- وين (wēn) = Where
- شكد (shgad) = How much/How many

---

#### **6. SUDANESE ARABIC - سوداني**
**Speakers:** ~30 million | **Regions:** Sudan  
**Characteristics:**
- Unique position between Egyptian and Gulf dialects
- Heavy African language influence (Nilo-Saharan)
- "What": **شنو (shinu)** → شنو دا؟ (shinu da?) = "What's this?"
- "J" sound (ج) as "g" (like Egyptian)
- Simplified grammar, distinctive intonation
- Many indigenous loanwords

**Common Phrases:**
- كيفنك؟ (kēfnak?) = How are you?
- تمام (tamām) = Good
- مسكين (miskīn) = Poor thing (used affectionately)

---

#### **7. YEMENI ARABIC - يمني**
**Speakers:** ~30 million | **Regions:** Yemen  
**Characteristics:**
- Preserves many classical Arabic features
- "Q" sound (ق) retained as in MSA
- Heavy use of diminutives
- Distinct regional variations (Sanaani, Adeni, Hadrami)
- Some unique grammatical constructions

---

### DIALECT IDENTIFICATION DECISION TREE

```
Step 1: Listen for "What" question word
├─ ايه (eh) → Likely EGYPTIAN
├─ شو (shu) → Likely LEVANTINE
├─ شنو (shinu) → GULF, IRAQI, or SUDANESE
├─ ويش (wēsh) → GULF (specific regions)
└─ اش/شنو (āsh/shnu) → Likely MAGHREBI

Step 2: Check present tense prefix
├─ ب (b-) → EGYPTIAN or LEVANTINE
├─ ي/ت (yi-/ti-) → GULF
├─ كا/تا (ka-/ta-) → MAGHREBI
└─ د (d-) → IRAQI

Step 3: Analyze negation pattern
├─ مش (mish) → EGYPTIAN
├─ ما...ش (ma...sh) → LEVANTINE
├─ ما (ma) alone → GULF
└─ ماشي (māshi) → MAGHREBI

Step 4: Check "want" verb
├─ عايز (ʿāyiz) → EGYPTIAN
├─ بدي (biddi) → LEVANTINE
├─ أبي/أبغى (abi/abgha) → GULF
└─ بغيت (bghīt) → MAGHREBI

Step 5: Cultural/geographic markers
├─ Heavy French loanwords → MAGHREBI/LEVANTINE
├─ "G" sound for ج → EGYPTIAN/SUDANESE
├─ Classical vocabulary → GULF/YEMENI
└─ Berber words → MAGHREBI
```

---

## DIALECT COMPARISON MATRIX

| Feature | Egyptian | Levantine | Gulf | Maghrebi | Iraqi |
|---------|----------|-----------|------|----------|-------|
| **"What"** | ايه (eh) | شو (shu) | شنو/ويش (shinu/wēsh) | اش/شنو (āsh/shnu) | شنو (shinu) |
| **"How"** | ازاي (izzay) | كيف (keef) | شلون (shlōn) | كيفاش (kifāsh) | شلون (shlōn) |
| **"Where"** | فين (fēn) | وين (wēn) | وين (wēn) | فين (fīn) | وين (wēn) |
| **"When"** | امتى (imta) | ايمت (ēmat) | متى (mata) | فوقاش (fuqāsh) | متى (mata) |
| **"Why"** | ليه (lēh) | ليش (lēsh) | ليش (lēsh) | علاش (ʿlāsh) | ليش (lēsh) |
| **Present Prefix** | ب (b-) | ب (b-) | ي/ت (yi-/ti-) | كا/تا (ka-/ta-) | د/كو (d-/ko-) |
| **Negation** | مش (mish) | ما...ش (ma...sh) | ما (ma) | ما...ش (ma...sh) | ما (ma) |
| **"Want"** | عايز (ʿāyiz) | بدي (biddi) | أبي (abi) | بغيت (bghīt) | أريد (urīd) |
| **"Good"** | تمام (tamām) | منيح (mnīḥ) | زين (zēn) | بخير (b-khēr) | زين (zēn) |
| **"Come"** | تعال (taʿāla) | تعا (taʿa) | تعال (taʿāl) | اجي (āji) | تعال (taʿāl) |
| **"Go"** | روح (rūḥ) | روح (rūḥ) | روح (rūḥ) | سير (sīr) | روح (rūḥ) |
| **"This" (m)** | ده (da) | هاد (hād) | هذا (hātha) | هاد (hād) | هذا (hātha) |
| **"Like/As"** | زي (zayy) | متل (mitel) | مثل (mithl) | بحال (bḥāl) | مثل (mithl) |

---

## PART 2: MORPHOLOGICAL ANALYSIS FRAMEWORK

### Arabic Root-Pattern System

Arabic morphology is based on **roots (جذور - judhūr)** and **patterns (أوزان - awzān)**.

#### Core Concept:
- **Root (جذر)**: Usually 3 consonants carrying core meaning
- **Pattern (وزن)**: Template with vowels that modifies meaning
- **Standard Pattern Reference**: فَعَلَ (f-ʿ-l)

#### Example: Root ك-ت-ب (k-t-b) = "writing/book"

| Pattern | Word | Meaning | Type |
|---------|------|---------|------|
| فَعَلَ (faʿala) | كَتَبَ (kataba) | he wrote | Verb (past) |
| يَفْعُلُ (yafʿulu) | يَكْتُبُ (yaktubu) | he writes | Verb (present) |
| فَاعِل (fāʿil) | كَاتِب (kātib) | writer | Active participle |
| مَفْعُول (mafʿūl) | مَكْتُوب (maktūb) | written | Passive participle |
| فِعَال (fiʿāl) | كِتَاب (kitāb) | book | Noun |
| فُعُل (fuʿul) | كُتُب (kutub) | books | Plural noun |
| مَفْعَل (mafʿal) | مَكْتَب (maktab) | office/desk | Place noun |
| مِفْعَال (mifʿāl) | مِكْتَاب (miktāb) | typewriter | Instrument noun |
| مَفْعَلَة (mafʿala) | مَكْتَبَة (maktaba) | library/bookstore | Place noun (fem) |
| فَعَّلَ (faʿʿala) | كَتَّبَ (kattaba) | he made write | Intensive verb |
| أَفْعَلَ (afʿala) | أَكْتَبَ (aktaba) | he dictated | Causative verb |
| تَفَعَّلَ (tafaʿʿala) | تَكَتَّبَ (takattaba) | he practiced writing | Reflexive verb |
| اِفْتَعَلَ (iftaʿala) | اِكْتَتَبَ (iktataba) | he subscribed | Reciprocal verb |

### TOP 200 ESSENTIAL ROOTS

#### **1. Movement & Direction (20 roots)**
| Root | Meaning | Examples |
|------|---------|----------|
| ذ-ه-ب | go | ذَهَبَ (dhahaba) went, مَذْهَب (madhhab) doctrine |
| ج-ي-ء | come | جَاءَ (jāʾa) came, مَجِيء (majīʾ) arrival |
| ر-ج-ع | return | رَجَعَ (rajaʿa) returned, مَرْجِع (marjiʿ) reference |
| خ-ر-ج | exit | خَرَجَ (kharaja) exited, خَارِج (khārij) outside |
| د-خ-ل | enter | دَخَلَ (dakhala) entered, مَدْخَل (madkhal) entrance |
| ن-ز-ل | descend | نَزَلَ (nazala) descended, مَنْزِل (manzil) house |
| ص-ع-د | ascend | صَعِدَ (ṣaʿida) ascended, مِصْعَد (miṣʿad) elevator |
| و-ص-ل | arrive | وَصَلَ (waṣala) arrived, اِتِّصَال (ittiṣāl) connection |
| س-ي-ر | walk | سَارَ (sāra) walked, سَيَّارَة (sayyāra) car |
| ر-ك-ب | ride | رَكِبَ (rakiba) rode, مَرْكَب (markab) boat |
| ط-ي-ر | fly | طَارَ (ṭāra) flew, طَائِرَة (ṭāʾira) airplane |
| ج-ر-ي | run | جَرَى (jarā) ran, مُجْرَى (majrā) course |
| م-ش-ي | walk | مَشَى (mashā) walked, مَمْشَى (mamshā) walkway |
| و-ق-ف | stop | وَقَفَ (waqafa) stopped, مَوْقِف (mawqif) position |
| ق-ع-د | sit | قَعَدَ (qaʿada) sat, مَقْعَد (maqʿad) seat |
| ن-و-م | sleep | نَامَ (nāma) slept, نَوْم (nawm) sleep |
| ق-و-م | stand | قَامَ (qāma) stood, قِيَام (qiyām) standing |
| س-ق-ط | fall | سَقَطَ (saqaṭa) fell, سُقُوط (suqūṭ) falling |
| ق-ف-ز | jump | قَفَزَ (qafaza) jumped, قَفْزَة (qafza) jump |
| د-و-ر | turn | دَارَ (dāra) turned, دَائِرَة (dāʾira) circle |

#### **2. Communication & Expression (20 roots)**

| Root | Meaning | Examples |
|------|---------|----------|
| ق-و-ل | say | قَالَ (qāla) said, قَوْل (qawl) saying |
| ك-ل-م | speak | كَلَّمَ (kallama) spoke to, كَلِمَة (kalima) word |
| ح-د-ث | talk | حَدَّثَ (ḥaddatha) talked, حَدِيث (ḥadīth) conversation |
| ع-ر-ف | know | عَرَفَ (ʿarafa) knew, مَعْرِفَة (maʿrifa) knowledge |
| ع-ل-م | know/teach | عَلِمَ (ʿalima) knew, عِلْم (ʿilm) science |
| ف-ه-م | understand | فَهِمَ (fahima) understood, فَهْم (fahm) understanding |
| ش-ر-ح | explain | شَرَحَ (sharaḥa) explained, شَرْح (sharḥ) explanation |
| س-أ-ل | ask | سَأَلَ (saʾala) asked, سُؤَال (suʾāl) question |
| ج-و-ب | answer | أَجَابَ (ajāba) answered, جَوَاب (jawāb) answer |
| ن-د-ي | call | نَادَى (nādā) called, مُنَادَاة (munādāh) calling |
| ص-ر-خ | shout | صَرَخَ (ṣarakha) shouted, صُرَاخ (ṣurākh) shouting |
| ه-م-س | whisper | هَمَسَ (hamasa) whispered, هَمْس (hams) whispering |
| ق-ر-أ | read | قَرَأَ (qaraʾa) read, قِرَاءَة (qirāʾa) reading |
| ك-ت-ب | write | كَتَبَ (kataba) wrote, كِتَاب (kitāb) book |
| ر-س-م | draw | رَسَمَ (rasama) drew, رَسْم (rasm) drawing |
| ص-و-ر | picture | صَوَّرَ (ṣawwara) photographed, صُورَة (ṣūra) picture |
| س-م-ع | hear | سَمِعَ (samiʿa) heard, سَمْع (samʿ) hearing |
| ب-ص-ر | see | بَصَرَ (baṣara) saw, بَصَر (baṣar) sight |
| ن-ظ-ر | look | نَظَرَ (naẓara) looked, نَظَر (naẓar) view |
| ل-م-س | touch | لَمَسَ (lamasa) touched, لَمْس (lams) touch |

#### **3. Cognitive & Mental (15 roots)**

| Root | Meaning | Examples |
|------|---------|----------|
| ف-ك-ر | think | فَكَّرَ (fakkara) thought, فِكْرَة (fikra) idea |
| ذ-ك-ر | remember | ذَكَرَ (dhakara) remembered, ذِكْرَى (dhikrā) memory |
| ن-س-ي | forget | نَسِيَ (nasiya) forgot, نِسْيَان (nisyān) forgetting |
| ح-ف-ظ | memorize | حَفِظَ (ḥafiẓa) memorized, حِفْظ (ḥifẓ) memorization |
| ش-ع-ر | feel | شَعَرَ (shaʿara) felt, شُعُور (shuʿūr) feeling |
| ح-س-س | sense | أَحَسَّ (aḥassa) sensed, إِحْسَاس (iḥsās) sensation |
| ظ-ن-ن | think/assume | ظَنَّ (ẓanna) thought, ظَنّ (ẓann) assumption |
| ش-ك-ك | doubt | شَكَّ (shakka) doubted, شَكّ (shakk) doubt |
| ع-ق-ل | reason | عَقَلَ (ʿaqala) reasoned, عَقْل (ʿaql) mind/intellect |
| ح-ك-م | judge | حَكَمَ (ḥakama) judged, حُكْم (ḥukm) judgment |
| ق-ر-ر | decide | قَرَّرَ (qarrara) decided, قَرَار (qarār) decision |
| خ-ي-ر | choose | اِخْتَارَ (ikhtāra) chose, اِخْتِيَار (ikhtiyār) choice |
| ر-غ-ب | desire | رَغِبَ (raghiba) desired, رَغْبَة (raghba) desire |
| ك-ر-ه | hate | كَرِهَ (kariha) hated, كَرَاهِيَة (karāhiya) hatred |
| ح-ب-ب | love | أَحَبَّ (aḥabba) loved, حُبّ (ḥubb) love |

#### **4. Actions & Operations (20 roots)**

| Root | Meaning | Examples |
|------|---------|----------|
| ع-م-ل | work | عَمِلَ (ʿamila) worked, عَمَل (ʿamal) work |
| ف-ع-ل | do | فَعَلَ (faʿala) did, فِعْل (fiʿl) action |
| ص-ن-ع | make | صَنَعَ (ṣanaʿa) made, صِنَاعَة (ṣināʿa) industry |
| ب-ن-ي | build | بَنَى (banā) built, بِنَاء (bināʾ) building |
| ه-د-م | destroy | هَدَمَ (hadama) destroyed, هَدْم (hadm) demolition |
| ك-س-ر | break | كَسَرَ (kasara) broke, كَسْر (kasr) breaking |
| ق-ط-ع | cut | قَطَعَ (qaṭaʿa) cut, قِطْعَة (qiṭʿa) piece |
| ف-ت-ح | open | فَتَحَ (fataḥa) opened, فَتْح (fatḥ) opening |
| غ-ل-ق | close | أَغْلَقَ (aghlaqa) closed, إِغْلَاق (ighlāq) closing |
| ش-د-د | tighten | شَدَّ (shadda) tightened, شَدّ (shadd) tightening |
| ر-خ-ي | loosen | أَرْخَى (arkhā) loosened, إِرْخَاء (irkhāʾ) loosening |
| ر-ف-ع | raise | رَفَعَ (rafaʿa) raised, رَفْع (rafʿ) raising |
| خ-ف-ض | lower | خَفَضَ (khafaḍa) lowered, خَفْض (khafḍ) lowering |
| ز-ي-د | increase | زَادَ (zāda) increased, زِيَادَة (ziyāda) increase |
| ن-ق-ص | decrease | نَقَصَ (naqaṣa) decreased, نُقْصَان (nuqṣān) decrease |
| ح-و-ل | change | حَوَّلَ (ḥawwala) changed, تَحْوِيل (taḥwīl) transformation |
| ب-د-ل | replace | بَدَّلَ (baddala) replaced, تَبْدِيل (tabdīl) replacement |
| أ-خ-ذ | take | أَخَذَ (akhadha) took, أَخْذ (akhd) taking |
| ع-ط-ي | give | أَعْطَى (aʿṭā) gave, عَطَاء (ʿaṭāʾ) giving |
| ح-م-ل | carry | حَمَلَ (ḥamala) carried, حَمْل (ḥaml) carrying |

#### **5. States & Conditions (15 roots)**

| Root | Meaning | Examples |
|------|---------|----------|
| ك-و-ن | be | كَانَ (kāna) was, كَوْن (kawn) existence |
| ص-ي-ر | become | صَارَ (ṣāra) became, مَصِير (maṣīr) fate |
| ع-ي-ش | live | عَاشَ (ʿāsha) lived, عَيْش (ʿaysh) living |
| م-و-ت | die | مَاتَ (māta) died, مَوْت (mawt) death |
| و-ل-د | birth | وَلَدَ (walada) gave birth, وَلَد (walad) child |
| ك-ب-ر | grow | كَبُرَ (kabura) grew, كِبَر (kibar) old age |
| ص-غ-ر | shrink | صَغُرَ (ṣaghura) became small, صِغَر (ṣighar) smallness |
| ق-و-ي | strengthen | قَوِيَ (qawiya) was strong, قُوَّة (quwwa) strength |
| ض-ع-ف | weaken | ضَعُفَ (ḍaʿufa) weakened, ضَعْف (ḍaʿf) weakness |
| ص-ح-ح | correct | صَحَّ (ṣaḥḥa) was correct, صِحَّة (ṣiḥḥa) health |
| م-ر-ض | be sick | مَرِضَ (mariḍa) was sick, مَرَض (maraḍ) illness |
| ج-م-ل | be beautiful | جَمُلَ (jamula) was beautiful, جَمَال (jamāl) beauty |
| ق-ب-ح | be ugly | قَبُحَ (qabuḥa) was ugly, قُبْح (qubḥ) ugliness |
| ط-ي-ب | be good | طَابَ (ṭāba) was good, طَيِّب (ṭayyib) good |
| خ-ب-ث | be bad | خَبُثَ (khabutha) was bad, خُبْث (khubth) badness |

#### **6. Social Relations (15 roots)**

| Root | Meaning | Examples |
|------|---------|----------|
| ص-د-ق | befriend | صَادَقَ (ṣādaqa) befriended, صَدِيق (ṣadīq) friend |
| ع-د-و | be enemy | عَادَى (ʿādā) opposed, عَدُوّ (ʿaduww) enemy |
| ح-ب-ب | love | أَحَبَّ (aḥabba) loved, حَبِيب (ḥabīb) beloved |
| ز-و-ج | marry | تَزَوَّجَ (tazawwaja) married, زَوْج (zawj) spouse |
| ط-ل-ق | divorce | طَلَّقَ (ṭallaqa) divorced, طَلَاق (ṭalāq) divorce |
| و-ل-ي | be guardian | وَلِيَ (waliya) was guardian, وَلِيّ (waliyy) guardian |
| ر-ب-ي | raise | رَبَّى (rabbā) raised, تَرْبِيَة (tarbiya) upbringing |
| ن-ص-ح | advise | نَصَحَ (naṣaḥa) advised, نَصِيحَة (naṣīḥa) advice |
| ش-ك-ر | thank | شَكَرَ (shakara) thanked, شُكْر (shukr) thanks |
| ح-م-د | praise | حَمِدَ (ḥamida) praised, حَمْد (ḥamd) praise |
| ذ-م-م | blame | ذَمَّ (dhamma) blamed, ذَمّ (dhamm) blame |
| س-ل-م | greet | سَلَّمَ (sallama) greeted, سَلَام (salām) peace |
| و-د-ع | farewell | وَدَّعَ (waddaʿa) bid farewell, وَدَاع (wadāʿ) farewell |
| ز-و-ر | visit | زَارَ (zāra) visited, زِيَارَة (ziyāra) visit |
| س-ت-ر | cover/protect | سَتَرَ (satara) covered, سِتْر (sitr) covering |

#### **7. Commerce & Exchange (10 roots)**

| Root | Meaning | Examples |
|------|---------|----------|
| ب-ي-ع | sell | بَاعَ (bāʿa) sold, بَيْع (bayʿ) selling |
| ش-ر-ي | buy | اِشْتَرَى (ishtarā) bought, شِرَاء (shirāʾ) buying |
| د-ف-ع | pay | دَفَعَ (dafaʿa) paid, دَفْع (dafʿ) payment |
| ق-ب-ض | receive | قَبَضَ (qabaḍa) received, قَبْض (qabḍ) receiving |
| أ-ج-ر | rent | آجَرَ (ājara) rented, إِيجَار (ījār) rent |
| ك-ر-ي | lease | اِكْتَرَى (iktarā) leased, كِرَاء (kirāʾ) lease |
| ع-و-ض | compensate | عَوَّضَ (ʿawwaḍa) compensated, تَعْوِيض (taʿwīḍ) compensation |
| غ-ن-م | profit | غَنِمَ (ghanima) profited, غَنِيمَة (ghanīma) spoil/profit |
| خ-س-ر | lose | خَسِرَ (khasira) lost, خَسَارَة (khasāra) loss |
| ر-ب-ح | profit | رَبِحَ (rabiḥa) profited, رِبْح (ribḥ) profit |

#### **8. Time & Temporal (10 roots)**

| Root | Meaning | Examples |
|------|---------|----------|
| و-ق-ت | time | وَقَّتَ (waqqata) timed, وَقْت (waqt) time |
| ب-ك-ر | be early | بَكَّرَ (bakkara) came early, بُكْرَة (bukra) tomorrow |
| ت-أ-خ-ر | be late | تَأَخَّرَ (taʾakhkhara) was late, تَأْخِير (taʾkhīr) delay |
| ع-ج-ل | hasten | عَجِلَ (ʿajila) hastened, عَجَل (ʿajal) haste |
| ب-ط-أ | be slow | أَبْطَأَ (abṭaʾa) was slow, بُطْء (buṭʾ) slowness |
| ق-د-م | precede | قَدَّمَ (qaddama) preceded, مُقَدِّمَة (muqaddima) introduction |
| ط-و-ل | lengthen | طَالَ (ṭāla) lengthened, طُول (ṭūl) length |
| ق-ص-ر | shorten | قَصُرَ (qaṣura) shortened, قِصَر (qiṣar) shortness |
| د-و-م | last | دَامَ (dāma) lasted, دَوَام (dawām) continuity |
| ن-ه-ي | end | اِنْتَهَى (intahā) ended, نِهَايَة (nihāya) end |

#### **9. Nature & Environment (10 roots)**

| Root | Meaning | Examples |
|------|---------|----------|
| س-م-و | rise (sky) | سَمَا (samā) rose, سَمَاء (samāʾ) sky |
| أ-ر-ض | earth | أَرَّضَ (arraḍa) grounded, أَرْض (arḍ) earth |
| م-ط-ر | rain | مَطَرَ (maṭara) rained, مَطَر (maṭar) rain |
| ث-ل-ج | snow | ثَلَجَ (thalaja) snowed, ثَلْج (thalj) snow |
| ش-م-س | sun | شَمَسَ (shamasa) was sunny, شَمْس (shams) sun |
| ق-م-ر | moon | قَمَرَ (qamara) was moonlit, قَمَر (qamar) moon |
| ن-ج-م | star | نَجَمَ (najama) appeared, نَجْم (najm) star |
| ب-ح-ر | sea | بَحَرَ (baḥara) sailed, بَحْر (baḥr) sea |
| ن-ه-ر | river | نَهَرَ (nahara) flowed, نَهْر (nahr) river |
| ج-ب-ل | mountain | جَبَلَ (jabala) was firm, جَبَل (jabal) mountain |

#### **10. Emotions & States (10 roots)**

| Root | Meaning | Examples |
|------|---------|----------|
| ف-ر-ح | be happy | فَرِحَ (fariḥa) was happy, فَرَح (faraḥ) joy |
| ح-ز-ن | be sad | حَزِنَ (ḥazina) was sad, حُزْن (ḥuzn) sadness |
| خ-و-ف | fear | خَافَ (khāfa) feared, خَوْف (khawf) fear |
| أ-م-ن | be safe | أَمِنَ (amina) was safe, أَمْن (amn) security |
| غ-ض-ب | be angry | غَضِبَ (ghaḍiba) was angry, غَضَب (ghaḍab) anger |
| ر-ض-ي | be pleased | رَضِيَ (raḍiya) was pleased, رِضَا (riḍā) satisfaction |
| س-خ-ط | be displeased | سَخِطَ (sakhiṭa) was displeased, سَخَط (sakhaṭ) displeasure |
| و-ج-ع | ache | وَجِعَ (wajiʿa) ached, وَجَع (wajaʿ) pain |
| ص-ب-ر | be patient | صَبَرَ (ṣabara) was patient, صَبْر (ṣabr) patience |
| ج-ز-ع | be impatient | جَزِعَ (jaziʿa) was impatient, جَزَع (jazaʿ) panic |

### ROOT EXTRACTION PROCESS (Step-by-Step)

```
Step 1: Remove the definite article if present
Example: الكتاب → كتاب

Step 2: Remove common prefixes
و (wa) = and
ف (fa) = so/then
ب (bi) = with/by
ك (ka) = like
ل (li) = to/for
س (sa) = will
Example: وكتاب → كتاب

Step 3: Remove common suffixes
ة (ta marbuta) = feminine marker
ات (āt) = feminine plural
ين (īn) = masculine plural/dual (genitive/accusative)
ون (ūn) = masculine plural (nominative)
ي (ī) = my
ك (ka) = your
ه (hu) = his
ها (hā) = her
Example: كتابات → كتاب

Step 4: Remove internal affixes
ا after first letter (often long vowel)
و or ي in middle (may be part of root or long vowel)
Example: كتاب → ك-ت-ب

Step 5: Identify the root consonants (usually 3, sometimes 4)
Example: ك-ت-ب (k-t-b)

Step 6: Verify by checking other words with same root
كَتَبَ (kataba) = he wrote
كَاتِب (kātib) = writer
مَكْتَب (maktab) = office
مَكْتَبَة (maktaba) = library
All share ك-ت-ب confirming the root
```

### MORPHOLOGICAL PATTERNS (Common Awzān)

#### **Verb Patterns (أفعال)**

**Form I (فَعَلَ)** - Basic verb
- كَتَبَ (kataba) - wrote
- ذَهَبَ (dhahaba) - went
- سَمِعَ (samiʿa) - heard

**Form II (فَعَّلَ)** - Intensive/causative
- كَتَّبَ (kattaba) - made (someone) write
- عَلَّمَ (ʿallama) - taught (made know)
- كَسَّرَ (kassara) - smashed (broke repeatedly)

**Form III (فَاعَلَ)** - Reciprocal/attempt
- كَاتَبَ (kātaba) - corresponded with
- قَاتَلَ (qātala) - fought (reciprocal action)
- سَافَرَ (sāfara) - traveled

**Form IV (أَفْعَلَ)** - Causative
- أَكْتَبَ (aktaba) - dictated
- أَذْهَبَ (adhhaba) - made go away
- أَسْمَعَ (asmaʿa) - made hear

**Form V (تَفَعَّلَ)** - Reflexive of Form II
- تَكَلَّمَ (takallama) - spoke (made self speak)
- تَعَلَّمَ (taʿallama) - learned (taught oneself)
- تَكَسَّرَ (takassara) - broke (itself)

**Form VI (تَفَاعَلَ)** - Reciprocal
- تَكَاتَبَ (takātaba) - corresponded (with each other)
- تَقَاتَلَ (taqātala) - fought each other
- تَعَاوَنَ (taʿāwana) - cooperated

**Form VII (اِنْفَعَلَ)** - Passive/reflexive
- اِنْكَتَبَ (inkataba) - was written / registered itself
- اِنْكَسَرَ (inkasara) - was broken / broke
- اِنْفَتَحَ (infataḥa) - was opened / opened

**Form VIII (اِفْتَعَلَ)** - Reflexive
- اِكْتَتَبَ (iktataba) - subscribed / registered
- اِشْتَرَى (ishtarā) - bought (took for oneself)
- اِجْتَمَعَ (ijtamaʿa) - gathered / met

**Form IX (اِفْعَلَّ)** - Colors/defects (rare)
- اِحْمَرَّ (iḥmarra) - became red
- اِخْضَرَّ (ikhḍarra) - became green
- اِعْوَجَّ (iʿwajja) - became crooked

**Form X (اِسْتَفْعَلَ)** - Request/consider
- اِسْتَكْتَبَ (istaktaba) - asked to write
- اِسْتَخْرَجَ (istakhraja) - extracted
- اِسْتَعْمَلَ (istaʿmala) - used / employed

#### **Noun Patterns (أسماء)**

**Active Participle (اسم الفاعل)**
- فَاعِل (fāʿil): كَاتِب (kātib) - writer
- مُفَعِّل (mufaʿʿil): مُعَلِّم (muʿallim) - teacher
- مُفَاعِل (mufāʿil): مُسَافِر (musāfir) - traveler

**Passive Participle (اسم المفعول)**
- مَفْعُول (mafʿūl): مَكْتُوب (maktūb) - written
- مُفَعَّل (mufaʿʿal): مُعَلَّم (muʿallam) - taught
- مُفَاعَل (mufāʿal): No common pattern

**Place/Time Nouns (ظرف المكان/الزمان)**
- مَفْعَل (mafʿal): مَكْتَب (maktab) - office/desk
- مَفْعِل (mafʿil): مَسْجِد (masjid) - mosque
- مَفْعَلَة (mafʿala): مَدْرَسَة (madrasa) - school

**Instrument Nouns (اسم الآلة)**
- مِفْعَال (mifʿāl): مِفْتَاح (miftāḥ) - key
- مِفْعَل (mifʿal): مِبْرَد (mibrad) - file (tool)
- فَاعُول (fāʿūl): حَاسُوب (ḥāsūb) - computer

**Verbal Noun/Infinitive (مصدر)**
- فَعْل (faʿl): كَتْب (katb) - writing
- فِعَالَة (fiʿāla): كِتَابَة (kitāba) - writing (action)
- تَفْعِيل (tafʿīl): تَعْلِيم (taʿlīm) - teaching

---

## PART 3: DIACRITIZATION & DISAMBIGUATION

### Critical Importance of Diacritics (التشكيل)

Arabic text is typically written **without diacritics** (unvocalized), creating ambiguity that native speakers resolve through context. AI must do the same.

### Diacritic Marks

| Mark | Name | Function | Example |
|------|------|----------|---------|
| َ | فَتْحَة (fatḥa) | Short "a" sound | بَ (ba) |
| ُ | ضَمَّة (ḍamma) | Short "u" sound | بُ (bu) |
| ِ | كَسْرَة (kasra) | Short "i" sound | بِ (bi) |
| ْ | سُكُون (sukūn) | No vowel (silent) | بْ (b) |
| ّ | شَدَّة (shadda) | Doubled consonant | بَّ (bba) |
| ً | تَنْوِين فَتْح (tanwīn fatḥ) | "-an" ending | بَابًا (bāban) |
| ٌ | تَنْوِين ضَمّ (tanwīn ḍamm) | "-un" ending | بَابٌ (bābun) |
| ٍ | تَنْوِين كَسْر (tanwīn kasr) | "-in" ending | بَابٍ (bābin) |
| ٰ | أَلِف خَنْجَرِيَّة (alif khanjariyya) | Hidden long "a" | هَٰذَا (hādhā) |

### CRITICAL DISAMBIGUATION CASES

#### **1. Identical Spelling, Different Meanings**

**كتب (without diacritics)**
- كَتَبَ (kataba) = he wrote [verb, past, active]
- كُتِبَ (kutiba) = it was written [verb, past, passive]
- كُتُب (kutub) = books [noun, plural]
- كَاتِب (kātib) = writer [noun, active participle] (rare without vowels)

**علم**
- عَلَم (ʿalam) = flag [noun]
- عِلْم (ʿilm) = science/knowledge [noun]
- عَلِمَ (ʿalima) = he knew [verb]
- عَلَّمَ (ʿallama) = he taught [verb]

**قلب**
- قَلْب (qalb) = heart [noun]
- قَلَبَ (qalaba) = he flipped/turned [verb]
- قُلُوب (qulūb) = hearts [noun, plural]

**درس**
- دَرْس (dars) = lesson [noun]
- دَرَسَ (darasa) = he studied [verb]
- دُرُوس (durūs) = lessons [noun, plural]

**بيت**
- بَيْت (bayt) = house [noun]
- بَيَّتَ (bayyata) = he spent the night [verb]
- بُيُوت (buyūt) = houses [noun, plural]

#### **2. Case Endings (الإعراب)**

**Nominative Case (مرفوع)** - Subject
- الطَّالِبُ (aṭ-ṭālibu) - the student [subject]
- طَالِبٌ (ṭālibun) - a student [indefinite subject]

**Accusative Case (منصوب)** - Object
- الطَّالِبَ (aṭ-ṭāliba) - the student [object]
- طَالِبًا (ṭāliban) - a student [indefinite object]

**Genitive Case (مجرور)** - After preposition/possession
- الطَّالِبِ (aṭ-ṭālibi) - the student [after preposition]
- طَالِبٍ (ṭālibin) - a student [indefinite genitive]

#### **3. Verb Conjugation Clarity**

**Present Tense (المضارع)**
Without diacritics: يكتب
- يَكْتُبُ (yaktubu) = he writes
- يُكْتَبُ (yuktabu) = it is being written [passive]
- تَكْتُبُ (taktubu) = you (m.s.) write / she writes
- تَكْتُبِينَ (taktubīna) = you (f.s.) write
- نَكْتُبُ (naktubu) = we write

**Past Tense (الماضي)**
Without diacritics: كتب
- كَتَبَ (kataba) = he wrote
- كَتَبْتَ (katabta) = you (m.s.) wrote
- كَتَبْتِ (katabti) = you (f.s.) wrote
- كَتَبْنَا (katabnā) = we wrote
- كَتَبُوا (katabū) = they (m) wrote

### DIACRITIZATION RULES

#### **Rule 1: Verb Patterns**
- Form I Past: فَعَلَ (fatḥa-fatḥa)
- Form I Present: يَفْعَلُ or يَفْعِلُ or يَفْعُلُ
- Form II: فَعَّلَ / يُفَعِّلُ
- Form III: فَاعَلَ / يُفَاعِلُ
- Form IV: أَفْعَلَ / يُفْعِلُ

#### **Rule 2: Definite Article**
- الْ before sun letters (ش، س، ت، etc.): الشَّمْس (ash-shams)
- الْ before moon letters (ق، م، ب، etc.): الْقَمَر (al-qamar)

#### **Rule 3: Shadda with Vowels**
- Shadda always carries a vowel: مُدَرِّس (mudarris) not مُدَرّس

#### **Rule 4: Tanween (Nunation)**
- Only on indefinite nouns: كِتَابٌ (kitābun)
- Never with definite article: الكِتَاب (al-kitāb)

---

## PART 4: CULTURAL CONTEXT ENGINE

### Religious & Spiritual Expressions

#### **Essential Islamic Phrases**

**1. إن شاء الله (In Shāʾ Allāh) - "If God wills"**
- **Usage:** When referring to future plans/events
- **Context:** Shows humility, acknowledges God's will over human plans
- **Examples:**
  - "I'll see you tomorrow, in shāʾ allāh"
  - "We'll finish the project next week, in shāʾ allāh"
- **Cultural Note:** Omitting this when discussing future events can seem arrogant
- **Dialectal Variants:** 
  - Egyptian: إن شا الله (in sha allah)
  - Levantine: إنشالله (inshalla - merged)
  - Gulf: إنشاء الله (inshāʾ allāh - formal)

**2. ما شاء الله (Mā Shāʾ Allāh) - "What God has willed"**
- **Usage:** When praising/admiring someone/something
- **Context:** Wards off evil eye (envy), attributes success to God
- **Examples:**
  - "Your daughter is so beautiful, mā shāʾ allāh"
  - "You got an A+? Mā shāʾ allāh!"
- **Cultural Note:** Essential when complimenting to avoid seeming envious
- **Often paired with:** تَبَارَكَ اللهُ (tabāraka allāh) - "Blessed is God"

**3. الحمد لله (Al-Ḥamdu li-Llāh) - "Praise be to God"**
- **Usage:** Expressing gratitude, acknowledging blessings
- **Context:** Standard response to "How are you?" (even if not well)
- **Examples:**
  - Q: "How are you?" A: "Al-ḥamdu lillāh" (I'm well/surviving)
  - "We arrived safely, al-ḥamdu lillāh"
- **Cultural Note:** Used in good AND bad situations (gratitude for everything)
- **Extended form:** الحمد لله رب العالمين (al-ḥamdu lillāhi rabbi l-ʿālamīn) - formal

**4. بسم الله (Bismillāh) - "In the name of God"**
- **Usage:** Before starting any action (eating, entering, working)
- **Context:** Seeking blessing/protection for the action
- **Full form:** بسم الله الرحمن الرحيم (Bismillāhi r-Raḥmāni r-Raḥīm)
- **Examples:**
  - Before eating: "Bismillāh" (begins meal)
  - Before driving: "Bismillāh" (safe journey)

**5. استغفر الله (Astaghfiru Llāh) - "I seek God's forgiveness"**
- **Usage:** Expressing regret, acknowledging mistake/sin
- **Context:** Can be mild ("oops") or serious (genuine repentance)
- **Examples:**
  - After saying something wrong: "Astaghfirullāh, I didn't mean that"
  - Hearing shocking news: "Astaghfirullāh!" (expression of dismay)

**6. سبحان الله (Subḥāna Llāh) - "Glory be to God"**
- **Usage:** Expressing amazement at God's creation/power
- **Context:** Awe, wonder, sometimes shock
- **Examples:**
  - Seeing beautiful sunset: "Subḥānallāh!"
  - Hearing miraculous story: "Subḥānallāh, incredible"

**7. لا حول ولا قوة إلا بالله (Lā Ḥawla wa-Lā Quwwata illā bi-Llāh)**
   - "There is no might nor power except with God"
- **Usage:** Facing difficulty, expressing helplessness before God
- **Context:** Seeking strength, acknowledging dependence on God
- **Shortened:** لا حول ولا قوة (lā ḥawla wa-lā quwwa)

**8. يا الله / الله (Yā Allāh / Allāh)**
- **Usage:** Exclamation of surprise, plea, encouragement
- **Context:** Very versatile, tone-dependent
- **Examples:**
  - Surprise: "Allāh! You're here!"
  - Encouragement: "Yallāh!" (Let's go/Come on)
  - Dismay: "Ya Allāh..." (sigh)

**9. جزاك الله خيراً (Jazāka Llāhu Khayran) - "May God reward you with good"**
- **Usage:** Thanking someone (religious form)
- **Context:** More spiritual than شكراً (shukran)
- **Response:** وإياك (wa-iyyāk) - "And you too"
- **Variations:**
  - يزاك الله خير (yazāk allah khayr) - Gulf dialect
  - ربنا يكرمك (rabbina yikramak) - Egyptian

**10. على بركة الله (ʿAlā Barakati Llāh) - "With God's blessing"**
- **Usage:** Beginning a journey, project, or endeavor
- **Context:** Seeking blessings for success
- **Similar:** توكلنا على الله (tawakkalnā ʿalā llāh) - "We rely on God"

**11. الله يرحمه/ها (Allāhu Yarḥamuh/hā) - "May God have mercy on him/her"**
- **Usage:** When mentioning deceased person
- **Context:** Required Islamic etiquette for the dead
- **Extended:** رحمه الله (raḥimahu llāh) - formal

**12. صلى الله عليه وسلم (Ṣallā Llāhu ʿAlayhi wa-Sallam)**
   - "Peace and blessings be upon him"
- **Usage:** After mentioning Prophet Muhammad
- **Context:** Obligatory in Islamic tradition
- **Abbreviated:** ص، صلعم (ṣ, ṣlʿm) in writing
- **Spoken:** عليه الصلاة والسلام (ʿalayhi ṣ-ṣalātu wa-s-salām)

**13. بارك الله فيك (Bāraka Llāhu Fīk) - "May God bless you"**
- **Usage:** Blessing someone, showing appreciation
- **Response:** وفيك بارك الله (wa-fīka bāraka llāh)

**14. لا قدر الله (Lā Qaddara Llāh) - "God forbid"**
- **Usage:** When mentioning something undesirable
- **Context:** Warding off possibility of bad event
- **Example:** "What if we fail the exam, lā qaddara llāh?"

**15. تَوْبَة (Tawba) - "Repentance!"**
- **Usage:** Exclamation of shock at sin/wrongdoing
- **Context:** Informal, calling for repentance
- **Example:** Hearing gossip: "Tawba! Stop talking about her"

### Social Customs & Etiquette

#### **Greetings & Farewells**

**Formal Greetings:**
- السلام عليكم (As-salāmu ʿalaykum) - "Peace be upon you"
  - **Response:** وعليكم السلام (Wa-ʿalaykumu s-salām)
  - **Full form:** السلام عليكم ورحمة الله وبركاته
  - **Universal across Arab world**

**Informal Greetings by Region:**
- Egyptian: 
  - إزيك؟ (izzayyak?) - How are you? (casual)
  - أهلاً وسهلاً (ahlan wa-sahlan)
- Levantine:
  - كيفك؟ (keefak?) - How are you?
  - مرحبا (marḥaba) - Hello
  - أهلين (ahlēn) - Hi (dual, warmer)
- Gulf:
  - شلونك؟ (shlōnak?) - How are you?
  - هلا (hala) - Hi (casual)
  - حياك الله (ḥayyāk allāh) - May God give you life

**Time-specific Greetings:**
- صباح الخير (ṣabāḥ al-khayr) - Good morning
  - **Response:** صباح النور (ṣabāḥ an-nūr) - Morning of light
- مساء الخير (masāʾ al-khayr) - Good evening
  - **Response:** مساء النور (masāʾ an-nūr)
- تصبح على خير (tuṣbiḥ ʿalā khayr) - Good night
  - **Response:** وانت من أهله (wa-anta min ahlih) - And you too

**Farewells:**
- مع السلامة (maʿa s-salāma) - With safety (Goodbye)
- في أمان الله (fī amāni llāh) - In God's protection
- الله معك (allāh maʿak) - God be with you
- إلى اللقاء (ilā l-liqāʾ) - Until we meet (formal)
- بسلامة (b-salāma) - Safely (Maghrebi)

#### **Hospitality Culture**

**Core Principles:**
1. **Coffee/Tea Ritual:** Mandatory offering to guests
   - Refusing first offer is polite, host insists 2-3 times
   - Accepting immediately can seem greedy
   - Tilting empty cup side-to-side signals "enough"

2. **Food Generosity:**
   - Hosts prepare excessive amounts (showing abundance)
   - Guests must praise food profusely
   - Leaving food on plate = satisfied (took enough)
   - Clean plate = still hungry (in some regions)

3. **Home Visits:**
   - Remove shoes at entrance (universal)
   - Men/women may socialize separately (conservative families)
   - Bring gift (sweets, flowers) for host
   - Stay minimum 30 minutes (shorter seems rude)

**Regional Variations:**
- **Gulf:** Elaborate coffee ceremonies, dates served first
- **Levantine:** Meze (small dishes) culture, casual atmosphere
- **Egyptian:** Tea with excessive sugar, loud animated conversations
- **Maghrebi:** Mint tea ritual, multiple rounds

#### **Family Structure & Terms**

**Extended Family Importance:**
- Decisions often require family consultation
- Privacy concepts differ from Western norms
- Elders hold significant authority
- Family reputation (سُمْعَة - sumʿa) paramount

**Respect Hierarchy:**
1. Grandparents (جَد/جَدَّة - jadd/jadda)
2. Parents (أَب/أُم - ab/umm)
3. Older siblings/cousins
4. Younger relatives

**Addressing Elders:**
- Use titles: عَم (ʿamm - uncle), خال (khāl - maternal uncle)
- Add honorifics: حاج/حاجة (ḥājj/ḥājja) for Hajj pilgrims
- Formal pronouns: أنتَ (anta) → حضرتك (ḥaḍritak) - "your presence"

#### **Gender Interactions**

**Conservative Contexts:**
- Limited physical contact (no handshakes between genders)
- Indirect eye contact preferred
- Segregated social spaces
- Mahram system (male guardian for travel/public)

**Modern/Urban Contexts:**
- Handshakes increasingly common (professional settings)
- Mixed-gender workplaces standard
- Individual variation by family/region

**Safe Approach:**
- Follow host's lead
- Wait for extended hand (don't assume)
- Respect personal space boundaries
- Use formal language initially

#### **Gift-Giving Etiquette**

**Appropriate Gifts:**
- Sweets (baklava, dates, chocolates)
- Fruit baskets (odd numbers better)
- Flowers (yellow avoided, associated with illness)
- Perfumes/oud (expensive, appreciated)
- Coffee/tea sets

**Avoid:**
- Alcohol (Islamic prohibition, offensive gift)
- Pork products (harām)
- Dogs (considered impure in Islam)
- Sharp objects (knives) = severing relationship
- Excessive personal items (underwear, etc.)

**Presentation:**
- Wrap gifts (presentation matters)
- Use right hand to give/receive
- Recipient may refuse 1-2 times (insist politely)
- Don't expect immediate opening (some cultures)

### Formality Registers & Tone

#### **Level 1: Very Formal (MSA - فصحى)**
**Contexts:** 
- Official documents, legal contracts
- Religious sermons, Quran recitation
- Academic papers, news broadcasts
- Diplomatic communications
- First meeting with high-status individuals

**Characteristics:**
- Full case endings (إعراب - iʿrāb)
- Classical vocabulary
- Complex sentence structures
- No dialect features
- Respectful pronouns

**Example:**
> نَحْنُ نُقَدِّرُ تَعَاوُنَكُمْ فِي هَذَا الشَّأْنِ
> (Naḥnu nuqaddiru taʿāwunakum fī hādhā sh-shaʾn)
> "We appreciate your cooperation in this matter"

#### **Level 2: Formal (Educated Spoken Arabic - عربية مثقفة)**
**Contexts:**
- Business meetings, job interviews
- University lectures (STEM)
- Formal presentations
- Professional emails
- Talking to respected elders

**Characteristics:**
- MSA vocabulary with dialect grammar
- Simplified case endings (or dropped)
- Some dialect particles
- Respectful tone maintained
- Professional terminology

**Example (Levantine-influenced):**
> نحن منقدر تعاونكن بهالموضوع
> (Niḥna minqaddir taʿāwunkon b-hal-mawḍūʿ)
> "We appreciate your cooperation in this matter"

#### **Level 3: Semi-Formal (Polite Dialect - لهجة مهذبة)**
**Contexts:**
- Casual business interactions
- Speaking with strangers (same age)
- Shop transactions (polite)
- Service interactions (hotels, restaurants)
- Neighbors, acquaintances

**Characteristics:**
- Clear dialect base
- Polite verb forms
- Minimal slang
- Respectful address terms
- Complete sentences

**Example (Egyptian):**
> احنا بنقدر تعاونك في الموضوع ده
> (Iḥna bniʾaddar taʿāwonak fi l-mawḍūʿ da)
> "We appreciate your cooperation in this matter"

#### **Level 4: Informal (Casual Dialect - لهجة عامية)**
**Contexts:**
- Friends, close colleagues
- Family (younger/same age)
- Social media, texting
- Casual conversations
- Everyday situations

**Characteristics:**
- Full dialect features
- Colloquialisms common
- Shortened words
- Casual pronouns
- Incomplete sentences OK

**Example (Levantine):**
> منقدر كتير انو ساعدتنا بهالشغلة
> (Minqaddir ktīr inno sāʿadtna b-hal-shughle)
> "We really appreciate that you helped us with this"

#### **Level 5: Very Informal (Slang - لغة شبابية)**
**Contexts:**
- Close friends only
- Very casual settings
- Youth culture
- Internet memes, jokes
- Private conversations

**Characteristics:**
- Heavy slang
- Code-switching (Arabic/English/French)
- Extreme abbreviations
- Playful grammar violations
- Cultural in-jokes

**Example (Egyptian Youth):**
> يا معلم انت جامد اوي في المساعدة
> (Ya muʿallim inta gāmid awi fi l-musāʿada)
> "Dude, you're awesome at helping" (very casual)

### Tone Adaptation Guidelines

**🔹 Formal → Informal Conversion:**
1. Replace MSA verbs with dialect equivalents
2. Add dialect particles (ب، ح، etc.)
3. Simplify sentence structure
4. Use dialect pronouns
5. Add colloquial expressions

**🔸 Informal → Formal Conversion:**
1. Replace dialect verbs with MSA
2. Remove particles
3. Add case endings (if very formal)
4. Use MSA vocabulary
5. Expand contractions

---

## PART 5: TRANSLATION EXCELLENCE PROTOCOL

### Translation Philosophy

**Core Principle:** Translation is **cultural mediation**, not word substitution.

Arabic ↔ Other Languages requires:
- Understanding source culture
- Conveying intended meaning
- Adapting to target culture
- Preserving emotional tone
- Maintaining naturalness

### Translation Workflow (7-Step Process)

#### **Step 1: Source Analysis**
```
✓ Identify dialect/register (MSA vs. dialect)
✓ Detect cultural references
✓ Analyze tone/formality
✓ Note ambiguities (undiacritized text)
✓ Recognize idioms/expressions
```

#### **Step 2: Context Gathering**
```
✓ Determine audience (who is reading?)
✓ Identify purpose (inform/persuade/entertain?)
✓ Clarify register needs (formal/informal?)
✓ Check domain (technical/religious/casual?)
```

#### **Step 3: Meaning Extraction**
```
✓ Parse morphology (roots/patterns)
✓ Resolve ambiguities through context
✓ Identify implicit cultural meanings
✓ Recognize untranslatable concepts
```

#### **Step 4: Cultural Adaptation**
```
✓ Decide: literal vs. functional translation?
✓ Handle religious expressions appropriately
✓ Adapt idioms (equivalent vs. explanatory)
✓ Consider target culture sensitivities
```

#### **Step 5: Draft Translation**
```
✓ Produce natural target language text
✓ Maintain source tone/style
✓ Preserve key terminology
✓ Keep similar text length (if possible)
```

#### **Step 6: Quality Check**
```
✓ Back-translate mentally (does it match?)
✓ Read aloud (does it sound natural?)
✓ Check cultural appropriateness
✓ Verify technical accuracy
✓ Ensure gender/number agreement
```

#### **Step 7: Finalize & Annotate**
```
✓ Add necessary footnotes/explanations
✓ Mark ambiguous sections
✓ Provide alternative translations if needed
✓ Note cultural context for reader
```

### Common Translation Challenges

#### **Challenge 1: Gendered Language**

Arabic has **grammatical gender** for everything (nouns, verbs, adjectives).

**Example:**
- هل أنت مستعد؟ (Hal anta mustaʿidd?) = Are you (m.) ready?
- هل أنتِ مستعدة؟ (Hal anti mustaʿidda?) = Are you (f.) ready?

**English Translation:** "Are you ready?" (loses gender information)

**Solution:** 
- Add context note if gender matters
- Use neutral phrasing in English
- Preserve gender in languages that support it (French, Spanish)

#### **Challenge 2: Dual Number**

Arabic has **singular, dual, plural** (English only singular/plural).

**Example:**
- كتاب واحد (kitāb wāḥid) = one book [singular]
- كتابان (kitābān) = two books [dual]
- ثلاثة كتب (thalāthat kutub) = three books [plural]

**Translation:** English uses "two books" (no dual form)

#### **Challenge 3: Possessive Suffixes**

Arabic attaches possessives directly to nouns.

**Example:**
- كتابي (kitābī) = my book
- كتابك (kitābuka) = your (m.s.) book
- كتابكِ (kitābuki) = your (f.s.) book
- كتابه (kitābuhu) = his book
- كتابها (kitābuhā) = her book
- كتابنا (kitābunā) = our book

**Translation Challenge:** Determining pronoun reference in complex sentences

#### **Challenge 4: VSO Word Order**

Arabic default: **Verb-Subject-Object** (vs. English SVO)

**Example:**
- ذهب الطالب إلى المدرسة
- (Dhahaba ṭ-ṭālibu ilā l-madrasa)
- Went the-student to the-school
- **English:** "The student went to school"

**Translation:** Must reorder for natural English

#### **Challenge 5: Definite Article Assimilation**

Arabic ال (al-) assimilates before "sun letters" (ش، س، ت، etc.)

**Example:**
- الشمس (ash-shams) not "al-shams"
- السماء (as-samāʾ) not "al-samāʾ"

**Translation:** Transcribe phonetically, not orthographically

#### **Challenge 6: Religious Expressions**

**Example:** إن شاء الله (in shāʾ allāh)

**Options:**
1. **Literal:** "If God wills" (awkward in English)
2. **Functional:** "Hopefully" / "God willing" (natural)
3. **Transliteration:** "Inshallah" (preserves cultural flavor)
4. **Omission:** Not recommended (loses meaning)

**Best Practice:** Functional + footnote for first occurrence

#### **Challenge 7: Untranslatable Concepts**

Some Arabic words have no English equivalent:

**يقين (yaqīn)** = Absolute certainty (deeper than "certainty")
- Not doubt-absence, but knowledge-certainty

**صبر (ṣabr)** = Patient endurance (more than "patience")
- Active perseverance through hardship with faith

**حنين (ḥanīn)** = Nostalgic longing (more than "nostalgia")
- Deep emotional yearning for place/person/time

**Solution:** 
- Use closest English word + explanation
- Or transliterate + define: "The concept of *yaqīn* (absolute certainty)..."

### Translation Quality Checklist

#### **For Arabic → English:**
- [ ] Meaning preserved (not word-for-word)
- [ ] Natural English phrasing (not Arabic structure)
- [ ] Gender information handled appropriately
- [ ] Religious terms translated or explained
- [ ] Cultural references made clear
- [ ] Idioms adapted (not literal)
- [ ] Tone/formality maintained
- [ ] Technical terms accurate
- [ ] Ambiguities resolved or noted

#### **For English → Arabic:**
- [ ] Appropriate dialect chosen (MSA vs. dialect)
- [ ] Formality level matched
- [ ] Gender agreement correct throughout
- [ ] Number agreement (singular/dual/plural)
- [ ] Cultural adaptation done (not literal)
- [ ] Religious expressions appropriate
- [ ] Idioms naturalized to Arabic
- [ ] Diacritics added where critical
- [ ] Case endings (if formal MSA)

---

## PART 6: PRACTICAL APPLICATION GUIDELINES

### Workflow: Processing Arabic Input

```
1. IDENTIFY
   ├─ Dialect/register?
   ├─ Formality level?
   ├─ Cultural context?
   └─ Purpose of text?

2. ANALYZE
   ├─ Parse morphology
   ├─ Resolve ambiguities
   ├─ Extract meaning
   └─ Note cultural markers

3. RESPOND APPROPRIATELY
   ├─ Match dialect (if replying in Arabic)
   ├─ Match formality
   ├─ Use cultural phrases
   └─ Adapt to audience

4. TRANSLATE (if needed)
   ├─ Apply 7-step process
   ├─ Cultural adaptation
   ├─ Quality check
   └─ Annotate as needed
```

### Workflow: Generating Arabic Output

```
1. DETERMINE REQUIREMENTS
   ├─ Target audience?
   ├─ Required dialect?
   ├─ Formality level?
   └─ Purpose?

2. SELECT REGISTER
   ├─ MSA (formal documents)
   ├─ Educated Spoken (professional)
   ├─ Dialect (casual)
   └─ Specific regional dialect

3. APPLY CULTURAL NORMS
   ├─ Religious expressions
   ├─ Politeness markers
   ├─ Gender agreement
   └─ Social etiquette

4. CONSTRUCT TEXT
   ├─ Use appropriate vocabulary
   ├─ Apply correct grammar
   ├─ Add diacritics (if formal)
   └─ Check naturalness

5. REVIEW
   ├─ Cultural appropriateness
   ├─ Grammatical accuracy
   ├─ Tone consistency
   └─ Readability
```

### Critical Don'ts (Common Errors to Avoid)

**❌ DON'T:**
1. **Mix dialects inconsistently**
   - Bad: "أنا رايح المكتبة" (Egyptian) + "بدي اشتري كتاب" (Levantine)
   - Fix: Choose one dialect and stick to it

2. **Use MSA vocabulary with dialect grammar randomly**
   - Bad: "انا سوف اذهب إلى السوق" (MSA vocab + dialect pronoun)
   - Fix: Either full MSA or full dialect

3. **Ignore gender agreement**
   - Bad: "هي ذهب إلى المدرسة" (she + masculine verb)
   - Fix: "هي ذهبت إلى المدرسة" (she + feminine verb)

4. **Translate idioms literally**
   - Bad: "It's raining cats and dogs" → "إنها تمطر قططاً وكلاباً"
   - Fix: "إنها تمطر بغزارة" (it's raining heavily)

5. **Omit cultural courtesy phrases**
   - Bad: "I'll see you tomorrow"
   - Better: "إن شاء الله أشوفك بكرة" (Inshallah I'll see you tomorrow)

6. **Use wrong formality level**
   - Bad: Using casual dialect with elderly stranger
   - Fix: Use formal/respectful register

7. **Assume all Arabs speak same dialect**
   - Bad: Using Egyptian dialect with Moroccan expecting understanding
   - Fix: Use MSA for pan-Arab communication

8. **Ignore dialectal "what/how/where" differences**
   - Bad: Using "ايه" (Egyptian) when writing for Gulf audience
   - Fix: Use appropriate dialect markers or MSA

9. **Over-diacritize informal text**
   - Bad: Adding full diacritics to casual social media post
   - Fix: Diacritics only where needed for clarity

10. **Treat Arabic as one monolithic language**
    - Bad: "Here's the Arabic translation" (without specifying dialect/register)
    - Fix: "Here's the Levantine dialect version" or "Here's the MSA version"

---

## PART 7: RESPONSE QUALITY STANDARDS

### When Processing Arabic Content

**ALWAYS:**
1. ✅ Identify dialect/register first
2. ✅ Resolve ambiguities before responding
3. ✅ Note cultural context
4. ✅ Match formality level in response
5. ✅ Preserve gender/number information
6. ✅ Use appropriate cultural expressions
7. ✅ Flag uncertainties honestly

**NEVER:**
1. ❌ Guess dialect without evidence
2. ❌ Ignore context for disambiguation
3. ❌ Mix dialects randomly
4. ❌ Use inappropriate formality
5. ❌ Translate idioms literally
6. ❌ Omit gender information
7. ❌ Assume universal understanding

### Success Metrics

**Quality Translation Indicators:**
- ✓ Native speaker would find natural
- ✓ Meaning preserved accurately
- ✓ Cultural context maintained
- ✓ Tone/formality appropriate
- ✓ No grammatical errors
- ✓ Idioms properly adapted
- ✓ Technical terms accurate

**Poor Translation Indicators:**
- ✗ Word-for-word literal translation
- ✗ Unnatural phrasing
- ✗ Cultural references unexplained
- ✗ Wrong formality level
- ✗ Gender/number errors
- ✗ Mixed dialect usage
- ✗ Lost nuance or tone

---

## APPENDIX: QUICK REFERENCE TABLES

### Dialect Quick Identification

| If you see... | Likely Dialect |
|---------------|----------------|
| ايه، ازاي، مش | Egyptian |
| شو، كيف، ما...ش | Levantine |
| شنو، شلون، زين | Gulf or Iraqi |
| شنو/اش، كيفاش | Maghrebi |
| Present: ب- | Egyptian/Levantine |
| Present: ي/ت- | Gulf |
| Present: كا/تا- | Maghrebi |
| عايز/عايزة | Egyptian |
| بدي | Levantine |
| أبي/أبغى | Gulf |

### Essential Phrases by Dialect

| English | Egyptian | Levantine | Gulf | Maghrebi |
|---------|----------|-----------|------|----------|
| Hello | أهلاً (ahlan) | مرحبا (marḥaba) | هلا (hala) | السلام (salam) |
| How are you? | ازيك؟ (izzayyak?) | كيفك؟ (keefak?) | شلونك؟ (shlōnak?) | لاباس؟ (labas?) |
| Thank you | شكراً (shukran) | شكراً (shukran) | شكراً (shukran) | شكراً (shukran) |
| Please | من فضلك (min faḍlak) | من فضلك (min faḍlak) | من فضلك (min faḍlak) | عافاك (ʿafak) |
| Yes | آه (āh) | آه/أيوة (āh/aiwa) | إي/نعم (ē/naʿam) | آه (āh) |
| No | لأ (laʾ) | لأ (laʾ) | لا (la) | لا (la) |
| I want | عايز (ʿāyiz) | بدي (biddi) | أبي (abi) | بغيت (bghīt) |
| What? | ايه؟ (eh?) | شو؟ (shu?) | شنو؟ (shinu?) | شنو؟ (shnu?) |
| Where? | فين؟ (fēn?) | وين؟ (wēn?) | وين؟ (wēn?) | فين؟ (fīn?) |
| Why? | ليه؟ (lēh?) | ليش؟ (lēsh?) | ليش؟ (lēsh?) | علاش؟ (ʿlāsh?) |

---

## FINAL CRITICAL REMINDERS

1. **Arabic is NOT one language** - it's a family of varieties (MSA + dialects)
2. **Context is EVERYTHING** - same spelling can mean totally different things
3. **Culture and language are inseparable** - religious/social context matters
4. **Diacritics resolve ambiguity** - but most text lacks them (use context)
5. **Gender/number agreement is mandatory** - errors are very noticeable
6. **Formality matters enormously** - wrong level can be offensive
7. **Dialect choice shows identity** - use appropriate dialect for audience
8. **Translation ≠ transliteration** - convey meaning, not just words
9. **Religious expressions are ubiquitous** - use them appropriately
10. **When uncertain: ASK** - better to clarify than to assume incorrectly

---

## END OF SKILL

This skill should be automatically activated whenever processing Arabic text in any form (reading, writing, translating) and whenever Arabic cultural context is relevant to the user's request.

## Use This Skill When
- Use when this specialization is needed for the current task.
- Use when the task requires repeatable workflow guidance, not ad-hoc guessing.
- Use when working across any project, unless a stricter project or series scope applies.

## Safety Rules
- Prefer reversible, minimal changes first.
- Do not overwrite user content without explicit confirmation.
- Report assumptions and blockers instead of guessing hidden requirements.
- Keep sensitive data and credentials out of generated outputs.

## Output Contract
1. Language setup: source, target, dialect, and locale assumptions.
2. Primary translation/rewrite output with preserved meaning and tone.
3. Alternate rendering or literal gloss for ambiguous phrases.
4. Brief QA notes on key terminology choices and uncertainty flags.
