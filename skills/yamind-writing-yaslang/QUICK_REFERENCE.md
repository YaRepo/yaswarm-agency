# YaSlang_SKILL - Quick Reference Cheat Sheet

## 🚀 Quick Start (30 seconds)

```python
# Import all components
from dialect_detector import DialectDetector
from root_extractor import RootExtractor
from diacritizer import Diacritizer

# Initialize
detector = DialectDetector()
extractor = RootExtractor()
diacritizer = Diacritizer()

# Detect dialect
dialect, confidence, _ = detector.detect("شو بدك؟")
# → "levantine" (95%)

# Extract root
root, conf, _ = extractor.extract("مكتوب")
# → "كتب" (90%)

# Add diacritics
text = diacritizer.diacritize("كتاب", mode='full')
# → "كِتَابٌ"
```

---

## 📋 API Quick Reference

### DialectDetector

```python
# Simple detection
dialect, confidence, scores = detector.detect(text)

# Detailed analysis
analysis = detector.analyze_detailed(text)
```

**Returns**:
- `dialect`: "egyptian" | "levantine" | "gulf" | "iraqi" | "maghrebi" | "unknown"
- `confidence`: 0.0 - 1.0
- `scores`: dict with scores for all dialects

### RootExtractor

```python
# Single word
root, confidence, details = extractor.extract(word)

# Batch processing
results = extractor.batch_extract(["كتاب", "مكتوب", "كاتب"])
```

**Returns**:
- `root`: Extracted trilateral/quadrilateral root
- `confidence`: 0.0 - 1.0
- `details`: dict with root_type, affixes_removed

### Diacritizer

```python
# Full diacritization
text = diacritizer.diacritize(text, mode='full')

# Partial (critical marks only)
text = diacritizer.diacritize(text, mode='partial')

# Minimal (no marks)
text = diacritizer.diacritize(text, mode='minimal')
```

---

## 🎯 Common Patterns

### Pattern 1: Dialect-Aware Response
```python
text = "شو بدك تعمل؟"
dialect, conf, _ = detector.detect(text)

if dialect == "levantine":
    response = "بدي ساعدك"  # Levantine reply
elif dialect == "egyptian":
    response = "انا هساعدك"  # Egyptian reply
```

### Pattern 2: Root-Based Dictionary Lookup
```python
word = "مكتبة"
root, _, _ = extractor.extract(word)
# root = "كتب"

# Find all words from same root
related_words = find_words_by_root(root)
# → ["كتاب", "كاتب", "مكتوب", "كتابة"]
```

### Pattern 3: Educational Diacritization
```python
# Remove then restore diacritics (for learning)
import re
original = "كَتَبَ الطَّالِبُ"
clean = re.sub(r'[\u064B-\u065F]', '', original)
restored = diacritizer.diacritize(clean, mode='full')
```

### Pattern 4: Full Analysis Pipeline
```python
text = "السلام عليكم"

# 1. Detect dialect
dialect, _, _ = detector.detect(text)

# 2. Extract roots
words = text.split()
roots = [extractor.extract(w)[0] for w in words]

# 3. Diacritize
diacritized = diacritizer.diacritize(text, mode='full')

# 4. Check cultural phrases
# (Load cultural.json and check for matches)
```

---

## 📊 Dialect Markers Cheat Sheet

| Dialect | Question "What?" | "I want" | Negation |
|---------|------------------|----------|----------|
| Egyptian | ايه (ēh) | عايز (ʿāyiz) | مش (mish) |
| Levantine | شو (shū) | بدّي (baddī) | ما/مو (mā/mū) |
| Gulf | شنو/وش (shnū/wēsh) | أبي/أبغى (abī/abgha) | ما/مو (mā/mū) |
| Iraqi | شنو (shnū) | اريد (arīd) | ما/ماكو (mā/māku) |
| Maghrebi | اش/شنو (āsh/shnū) | بغيت (bghīt) | ما...ش (mā...sh) |

---

## 🔧 File Locations Reference

```
YaSlang_SKILL/
├── dialect_detector.py      ← Dialect detection engine
├── root_extractor.py        ← Root extraction
├── diacritizer.py           ← Diacritization
├── dialects/                ← 5 dialect JSON files
├── references/
│   ├── roots.json           ← Root dictionary
│   └── cultural.json        ← Cultural contexts
└── examples/
    ├── translation_workflow.py  ← Usage examples
    └── test_suite.py            ← Comprehensive tests
```

---

## 🧪 Testing Commands

```bash
# Test individual components
python dialect_detector.py
python root_extractor.py
python diacritizer.py

# Run full test suite
python examples/test_suite.py

# Run translation examples
python examples/translation_workflow.py
```

---

## 💡 Pro Tips

### Tip 1: Confidence Thresholds
```python
dialect, conf, _ = detector.detect(text)

if conf > 0.8:
    # High confidence - trust the detection
    pass
elif conf > 0.5:
    # Moderate - may need human verification
    pass
else:
    # Low confidence - text may be MSA or mixed
    pass
```

### Tip 2: Handling Mixed Dialects
```python
# Get all scores to see secondary dialects
dialect, conf, all_scores = detector.detect(text)

# Check if multiple dialects score high
high_scores = {d: s for d, s in all_scores.items() if s > 0.3}
if len(high_scores) > 1:
    print("Mixed dialect text detected")
```

### Tip 3: Root Validation
```python
root, conf, details = extractor.extract(word)

if conf < 0.5:
    print(f"Low confidence root extraction for: {word}")
    print(f"Suggested root: {root} (verify manually)")
```

### Tip 4: Efficient Batch Processing
```python
# Instead of:
for word in words:
    root, _, _ = extractor.extract(word)

# Use batch method:
results = extractor.batch_extract(words)
```

---

## 🌍 Unicode Reference

```python
# Arabic Unicode ranges
ARABIC_LETTERS = '\u0600-\u06FF'
DIACRITICS = '\u064B-\u065F'

# Common diacritics
FATHA = '\u064E'      # َ (a)
DAMMA = '\u064F'      # ُ (u)
KASRA = '\u0650'      # ِ (i)
SUKOON = '\u0652'     # ْ (no vowel)
SHADDA = '\u0651'     # ّ (doubling)
TANWEEN_FATH = '\u064B'  # ً (-an)
```

---

## 📖 JSON Structure Quick Reference

### Dialect JSON Structure
```json
{
  "dialect_name": "string",
  "speakers": "string",
  "regions": ["array"],
  "phonological_features": {},
  "grammatical_markers": {
    "negation": {},
    "present_tense": {},
    "future_tense": {}
  },
  "vocabulary": {
    "question_words": [],
    "verbs": [],
    "particles": [],
    "pronouns": []
  }
}
```

### Root JSON Structure
```json
{
  "root": "string",
  "transliteration": "string",
  "core_meaning": "string",
  "type": "trilateral_sound|hollow|defective|...",
  "derivatives": [
    {
      "word": "string",
      "pattern": "string",
      "meaning": "string"
    }
  ]
}
```

---

## 🎓 Learning Resources

### Dialect Detection
- Higher weights = stronger dialect markers
- Question words: weight 5.0 (strongest)
- Verbs: weight 2.5
- Unique expressions: weight 4.0

### Root Types
- **Sound**: All three consonants are strong (ك-ت-ب)
- **Hollow**: Middle is weak w/y (ق-و-ل)
- **Defective**: Final is weak w/y (م-ش-ي)
- **Assimilated**: Initial is weak (و-ص-ل)
- **Quadrilateral**: Four consonants (ت-ر-ج-م)

### Verb Forms (I-X)
```
Form I:   فَعَلَ    (basic)
Form II:  فَعَّلَ   (intensive)
Form III: فَاعَلَ   (reciprocal)
Form IV:  أَفْعَلَ  (causative)
Form V:   تَفَعَّلَ  (reflexive II)
Form VI:  تَفَاعَلَ  (mutual)
Form VII: انْفَعَلَ  (passive)
Form VIII: افْتَعَلَ (reflexive)
Form IX:  افْعَلَّ   (colors/defects)
Form X:   اسْتَفْعَلَ (seeking)
```

---

**Quick help**: See README.md for detailed documentation  
**Full tests**: Run `python examples/test_suite.py`  
**Examples**: See `examples/translation_workflow.py`
