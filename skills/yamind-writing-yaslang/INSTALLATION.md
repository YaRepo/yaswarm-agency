# YaSlang_SKILL - Installation & Setup Guide

**Version**: 1.0.0  
**Last Updated**: January 13, 2026  
**Difficulty**: Beginner-friendly  
**Time Required**: 5 minutes

---

## 🚀 Quick Installation (Zero Dependencies!)

YaSlang_SKILL requires **ZERO external dependencies** - just Python 3.6+!

### Step 1: Verify Python Installation

```bash
python --version
# Should show Python 3.6 or higher
```

### Step 2: Navigate to Project Directory

```bash
cd H:\YaMind\YaMind\YaScene-SKILLs\YaSlang_SKILL
```

### Step 3: Test Installation (Optional but Recommended)

```bash
# Run the test suite
python examples/test_suite.py

# Run example workflows
python examples/translation_workflow.py

# Test individual components
python dialect_detector.py
python root_extractor.py
python diacritizer.py
```

**That's it! No pip install, no virtual environment, no configuration files needed.**

---

## 💻 Usage in Your Code

### Basic Import

```python
from dialect_detector import DialectDetector
from root_extractor import RootExtractor
from diacritizer import Diacritizer

# Initialize components
detector = DialectDetector()
extractor = RootExtractor()
diacritizer = Diacritizer()
```

### Complete Example

```python
# Analyze Arabic text
text = "شو بدك تعمل اليوم؟"

# 1. Detect dialect
dialect, confidence, all_scores = detector.detect(text)
print(f"Dialect: {dialect} ({confidence:.0%})")
# Output: Dialect: levantine (95%)

# 2. Extract roots from words
words = text.split()
for word in words:
    root, conf, details = extractor.extract(word)
    if root != "?":
        print(f"{word} → {root} ({details['root_type']})")
# Output: تعمل → عمل (trilateral_sound)

# 3. Add diacritics
diacritized = diacritizer.diacritize(text, mode='full')
print(f"Diacritized: {diacritized}")
# Output: شُو بِدَّك تَعْمَل اليَوْم؟
```

---

## 📁 Project Structure Overview

```
YaSlang_SKILL/
├── Core Python Scripts (Import these!)
│   ├── dialect_detector.py     ← Dialect detection
│   ├── root_extractor.py       ← Root extraction
│   └── diacritizer.py          ← Diacritization
│
├── Data Files (Auto-loaded by scripts)
│   ├── dialects/*.json         ← 5 dialect databases
│   └── references/*.json       ← Root & cultural data
│
├── Documentation (Start here!)
│   ├── README.md               ← User guide
│   ├── QUICK_REFERENCE.md      ← Cheat sheet
│   └── SKILL.md                ← Complete spec
│
└── Examples (Learn from these!)
    ├── translation_workflow.py ← 4 workflows
    └── test_suite.py           ← 40+ tests
```

---

## 🎯 Common Use Cases

### Use Case 1: Dialect Detection for Translation

```python
from dialect_detector import DialectDetector

detector = DialectDetector()
text = "انت عايز ايه؟"

dialect, confidence, _ = detector.detect(text)

if dialect == "egyptian":
    # Use Egyptian-specific translation rules
    translated = translate_egyptian(text)
elif dialect == "levantine":
    # Use Levantine-specific translation rules
    translated = translate_levantine(text)
```

### Use Case 2: Educational Diacritization

```python
from diacritizer import Diacritizer

diacritizer = Diacritizer()

# Remove existing diacritics
import re
text_clean = re.sub(r'[\u064B-\u065F]', '', "كَتَبَ")

# Add them back for learning
text_diacritized = diacritizer.diacritize(text_clean, mode='full')
print(f"Learn: {text_diacritized}")  # كَتَبَ
```

### Use Case 3: Root-Based Vocabulary Building

```python
from root_extractor import RootExtractor

extractor = RootExtractor()

# Find roots for related words
words = ["كتاب", "كاتب", "مكتوب", "كتابة", "مكتبة"]
roots = {}

for word in words:
    root, _, _ = extractor.extract(word)
    if root not in roots:
        roots[root] = []
    roots[root].append(word)

# Now you have words grouped by semantic root
for root, word_list in roots.items():
    print(f"Root {root}: {', '.join(word_list)}")
```

### Use Case 4: LLM Context Enhancement

```python
from dialect_detector import DialectDetector
from root_extractor import RootExtractor
import json

# Load cultural references
with open('references/cultural.json', 'r', encoding='utf-8') as f:
    cultural_data = json.load(f)

def enhance_context(text):
    """Add linguistic context for LLM prompt"""
    detector = DialectDetector()
    dialect, conf, _ = detector.detect(text)
    
    context = {
        "text": text,
        "dialect": dialect,
        "confidence": conf,
        "translation_notes": []
    }
    
    if dialect != "unknown":
        context["translation_notes"].append(
            f"Text is in {dialect} dialect - adjust translation accordingly"
        )
    
    # Check for cultural phrases
    islamic_phrases = cultural_data["cultural_references"]["islamic_phrases"]["essential_expressions"]
    for phrase_obj in islamic_phrases:
        if phrase_obj["arabic"] in text:
            context["translation_notes"].append(
                f"Contains '{phrase_obj['arabic']}' - preserve cultural meaning"
            )
    
    return context

# Use in LLM prompt
text = "إن شاء الله نلتقي غداً"
context = enhance_context(text)
print(json.dumps(context, ensure_ascii=False, indent=2))
```

---

## 🔧 Configuration (Optional)

### Default Configuration

YaSlang_SKILL works out-of-the-box with sensible defaults:
- Dialect detection: All 5 dialects enabled
- Root extraction: All affix patterns active
- Diacritization: Comprehensive rule set

### Custom Configuration

You can modify behavior by editing the JSON files:

**1. Add Custom Vocabulary to Dialect**
```json
// In dialects/egyptian.json
{
  "vocabulary": {
    "custom_words": [
      {
        "word": "your_word",
        "transliteration": "your_transliteration",
        "meaning": "meaning"
      }
    ]
  }
}
```

**2. Add Custom Roots**
```json
// In references/roots.json
{
  "root_dictionary": {
    "roots": [
      {
        "root": "ك-ت-ب",
        "transliteration": "k-t-b",
        "core_meaning": "writing",
        "type": "trilateral_sound"
      }
    ]
  }
}
```

**3. Add Custom Diacritization Patterns**

Edit `diacritizer.py` and add to the `particles` dictionary:
```python
self.particles = {
    'في': 'فِي',
    'من': 'مِن',
    'your_particle': 'your_diacritized_form'
}
```

---

## 🧪 Verification & Testing

### Quick Verification

Run this in Python to verify everything works:

```python
# Test imports
from dialect_detector import DialectDetector
from root_extractor import RootExtractor
from diacritizer import Diacritizer

# Test functionality
detector = DialectDetector()
extractor = RootExtractor()
diacritizer = Diacritizer()

# Quick test
print("Testing dialect detection...")
dialect, conf, _ = detector.detect("شو بدك؟")
assert dialect == "levantine", "Dialect detection failed"
print(f"✅ Dialect: {dialect} ({conf:.0%})")

print("\nTesting root extraction...")
root, conf, _ = extractor.extract("كتاب")
assert root == "كتب", "Root extraction failed"
print(f"✅ Root: {root} ({conf:.0%})")

print("\nTesting diacritization...")
text = diacritizer.diacritize("في", mode='full')
assert '\u0650' in text, "Diacritization failed"  # Check for kasra
print(f"✅ Diacritized: {text}")

print("\n🎉 All components working correctly!")
```

### Full Test Suite

```bash
# Run comprehensive test suite
cd H:\YaMind\YaMind\YaScene-SKILLs\YaSlang_SKILL
python examples/test_suite.py
```

Expected output:
```
============================================================
TEST SUITE SUMMARY
============================================================
Tests run: 40+
Successes: 40+
Failures: 0
Errors: 0

✅ ALL TESTS PASSED!
```

---

## 📚 Learning Resources

### For Beginners
1. Start with `README.md` for overview
2. Read `QUICK_REFERENCE.md` for common tasks
3. Run `translation_workflow.py` to see examples

### For Developers
1. Study `SKILL.md` for linguistic details
2. Examine `test_suite.py` for usage patterns
3. Read inline documentation in Python scripts

### For Integration
1. Check API reference in `README.md`
2. Review integration section in `PROJECT_STATUS.md`
3. Adapt examples in `translation_workflow.py`

---

## 🐛 Troubleshooting

### Issue: Import errors

**Problem**: `ModuleNotFoundError: No module named 'dialect_detector'`

**Solution**: Make sure you're in the correct directory:
```bash
cd H:\YaMind\YaMind\YaScene-SKILLs\YaSlang_SKILL
python your_script.py
```

### Issue: JSON file not found

**Problem**: `FileNotFoundError: dialects/egyptian.json`

**Solution**: Run from project root directory or use absolute paths:
```python
import os
script_dir = os.path.dirname(__file__)
json_path = os.path.join(script_dir, 'dialects', 'egyptian.json')
```

### Issue: Unicode encoding errors

**Problem**: `UnicodeDecodeError` when reading Arabic text

**Solution**: Always use UTF-8 encoding:
```python
with open('file.txt', 'r', encoding='utf-8') as f:
    text = f.read()
```

### Issue: Low confidence scores

**Problem**: Dialect detection returns low confidence

**Solution**: 
- Text may be Modern Standard Arabic (MSA) - no dialect
- Text may be too short - need more words for accurate detection
- Text may be mixed dialects - check secondary scores

---

## 💡 Best Practices

### 1. Always Handle Confidence Scores

```python
dialect, confidence, _ = detector.detect(text)

if confidence > 0.8:
    # High confidence - trust the result
    process_with_dialect(dialect, text)
elif confidence > 0.5:
    # Moderate - may need verification
    process_with_caution(dialect, text)
else:
    # Low confidence - might be MSA or mixed
    process_as_msa(text)
```

### 2. Use Batch Processing for Efficiency

```python
# Instead of:
for word in words:
    root, _, _ = extractor.extract(word)

# Use batch method:
results = extractor.batch_extract(words)
```

### 3. Cache Results for Repeated Text

```python
# Simple caching
cache = {}

def detect_with_cache(text):
    if text not in cache:
        cache[text] = detector.detect(text)
    return cache[text]
```

### 4. Validate Input Text

```python
import re

def is_arabic_text(text):
    """Check if text contains Arabic characters"""
    arabic_pattern = r'[\u0600-\u06FF]'
    return bool(re.search(arabic_pattern, text))

if is_arabic_text(user_input):
    dialect, _, _ = detector.detect(user_input)
else:
    print("Not Arabic text!")
```

---

## 🚀 Next Steps

### After Installation:

1. **Run Examples**: `python examples/translation_workflow.py`
2. **Read Documentation**: Start with `README.md`
3. **Try Integration**: Add to your project
4. **Run Tests**: Verify with `test_suite.py`

### For Development:

1. **Explore Code**: Read Python scripts with inline docs
2. **Understand Data**: Review JSON files structure
3. **Customize**: Add your own patterns/vocabulary
4. **Test**: Add your own test cases

### For Production:

1. **Performance**: Profile with your data
2. **Validation**: Test with real-world corpus
3. **Monitoring**: Track confidence scores
4. **Iteration**: Refine based on feedback

---

## 📞 Support

**Documentation**: See `README.md`, `QUICK_REFERENCE.md`, and `SKILL.md`  
**Examples**: Check `examples/translation_workflow.py`  
**Testing**: Run `examples/test_suite.py`  
**Project Info**: Read `PROJECT_STATUS.md`

---

## ✅ Installation Complete!

You're now ready to use YaSlang_SKILL for:
- Dialect detection across 5 major dialects
- Morphological analysis and root extraction
- Diacritization for educational purposes
- Cultural context enhancement
- LLM prompt augmentation
- Translation preprocessing

**Happy coding! 🎉**

---

*Installation Guide v1.0.0 - January 13, 2026*
