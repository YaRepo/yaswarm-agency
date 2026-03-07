"""
Translation Workflow Examples
Demonstrates complete Arabic ↔ English translation workflows using YaSlang_SKILL components.
"""

import sys
import os
import json
import re

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dialect_detector import DialectDetector
from root_extractor import RootExtractor
from diacritizer import Diacritizer


class ArabicTranslationWorkflow:
    """
    Complete translation workflow integrating all YaSlang components.
    """
    
    def __init__(self):
        self.detector = DialectDetector()
        self.extractor = RootExtractor()
        self.diacritizer = Diacritizer()
        
        # Load reference data
        self.roots_db = self._load_roots_database()
        self.cultural_db = self._load_cultural_database()
    
    def _load_roots_database(self):
        """Load root dictionary from JSON."""
        try:
            json_path = os.path.join(
                os.path.dirname(__file__), 
                '..', 
                'references', 
                'roots.json'
            )
            with open(json_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print("Warning: roots.json not found")
            return {"root_dictionary": {"roots": []}}
    
    def _load_cultural_database(self):
        """Load cultural references from JSON."""
        try:
            json_path = os.path.join(
                os.path.dirname(__file__), 
                '..', 
                'references', 
                'cultural.json'
            )
            with open(json_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print("Warning: cultural.json not found")
            return {"cultural_references": {}}
    
    def analyze_arabic_text(self, text):
        """
        Complete analysis of Arabic text.
        
        Args:
            text: Arabic text to analyze
            
        Returns:
            dict: Complete analysis including dialect, roots, cultural markers
        """
        result = {
            "original_text": text,
            "dialect_analysis": {},
            "morphological_analysis": [],
            "cultural_markers": [],
            "diacritized_text": "",
            "translation_notes": []
        }
        
        # 1. Dialect Detection
        dialect, confidence, scores = self.detector.detect(text)
        result["dialect_analysis"] = {
            "dialect": dialect,
            "confidence": confidence,
            "all_scores": scores
        }
        
        # 2. Extract roots from each word
        words = text.split()
        for word in words:
            # Clean word (remove punctuation)
            clean_word = re.sub(r'[^\u0600-\u06FF]', '', word)
            if clean_word:
                root, conf, details = self.extractor.extract(clean_word)
                result["morphological_analysis"].append({
                    "word": word,
                    "root": root,
                    "confidence": conf,
                    "type": details.get("root_type", "unknown")
                })
        
        # 3. Check for cultural/Islamic phrases
        cultural_phrases = self.cultural_db.get("cultural_references", {}).get(
            "islamic_phrases", {}
        ).get("essential_expressions", [])
        
        for phrase_obj in cultural_phrases:
            if phrase_obj["arabic"] in text:
                result["cultural_markers"].append({
                    "phrase": phrase_obj["arabic"],
                    "meaning": phrase_obj["literal"],
                    "usage": phrase_obj["usage"],
                    "transliteration": phrase_obj["transliteration"]
                })
        
        # 4. Add diacritics (educational)
        result["diacritized_text"] = self.diacritizer.diacritize(text, mode='partial')
        
        # 5. Generate translation notes
        if dialect != "unknown":
            result["translation_notes"].append(
                f"Text is in {dialect} dialect - consider dialectal vocabulary"
            )
        
        if result["cultural_markers"]:
            result["translation_notes"].append(
                "Contains Islamic/cultural phrases - preserve cultural context"
            )
        
        return result
    
    def translate_with_context(self, text, target_formality="semi_formal"):
        """
        Translate Arabic to English with full context awareness.
        
        Args:
            text: Arabic text
            target_formality: Desired formality level
            
        Returns:
            dict: Translation with context and alternatives
        """
        analysis = self.analyze_arabic_text(text)
        
        # Load formality register
        formality_levels = self.cultural_db.get("cultural_references", {}).get(
            "formality_registers", {}
        )
        
        return {
            "source_text": text,
            "analysis": analysis,
            "target_formality": target_formality,
            "formality_context": formality_levels.get(f"level_3_{target_formality}", {}),
            "translation_strategy": self._get_translation_strategy(analysis)
        }
    
    def _get_translation_strategy(self, analysis):
        """Generate translation strategy based on analysis."""
        strategy = []
        
        dialect = analysis["dialect_analysis"]["dialect"]
        if dialect == "egyptian":
            strategy.append("Use Egyptian colloquial equivalents (عايز → want)")
        elif dialect == "levantine":
            strategy.append("Recognize بدّ constructions (بدي → I want)")
        elif dialect == "gulf":
            strategy.append("Handle Gulf markers (أبي/أبغى → I want)")
        
        if analysis["cultural_markers"]:
            strategy.append("Preserve Islamic phrase meanings without literal translation")
        
        return strategy


def example_1_dialect_aware_translation():
    """Example 1: Detect dialect and adjust translation."""
    print("=" * 60)
    print("EXAMPLE 1: Dialect-Aware Translation")
    print("=" * 60)
    
    workflow = ArabicTranslationWorkflow()
    
    texts = [
        ("انت عايز ايه؟", "Egyptian"),
        ("شو بدك تعمل؟", "Levantine"),
        ("وش تبي؟", "Gulf")
    ]
    
    for text, expected in texts:
        print(f"\nText: {text}")
        print(f"Expected dialect: {expected}")
        
        analysis = workflow.analyze_arabic_text(text)
        print(f"Detected: {analysis['dialect_analysis']['dialect']} "
              f"({analysis['dialect_analysis']['confidence']:.0%})")
        
        # Show morphological analysis
        print("Roots found:")
        for word_analysis in analysis["morphological_analysis"]:
            if word_analysis["root"] != "?":
                print(f"  {word_analysis['word']} → {word_analysis['root']}")
        print()


def example_2_cultural_phrase_handling():
    """Example 2: Recognize and properly translate cultural phrases."""
    print("=" * 60)
    print("EXAMPLE 2: Cultural Phrase Handling")
    print("=" * 60)
    
    workflow = ArabicTranslationWorkflow()
    
    texts = [
        "إن شاء الله نلتقي غداً",
        "الحمد لله على كل حال",
        "ماشاء الله عليك"
    ]
    
    for text in texts:
        print(f"\nText: {text}")
        analysis = workflow.analyze_arabic_text(text)
        
        if analysis["cultural_markers"]:
            print("Cultural phrases detected:")
            for marker in analysis["cultural_markers"]:
                print(f"  • {marker['phrase']}")
                print(f"    Meaning: {marker['meaning']}")
                print(f"    Usage: {marker['usage']}")
        else:
            print("No cultural markers found")
        print()


def example_3_root_based_translation():
    """Example 3: Use root extraction for better translation."""
    print("=" * 60)
    print("EXAMPLE 3: Root-Based Translation Enhancement")
    print("=" * 60)
    
    workflow = ArabicTranslationWorkflow()
    
    # Words from same root
    words = ["كتب", "كاتب", "مكتوب", "كتاب", "مكتبة"]
    
    print("Words from root ك-ت-ب (writing):")
    roots_found = {}
    
    for word in words:
        analysis = workflow.analyze_arabic_text(word)
        if analysis["morphological_analysis"]:
            word_info = analysis["morphological_analysis"][0]
            root = word_info["root"]
            
            if root not in roots_found:
                roots_found[root] = []
            roots_found[root].append(word)
            
            print(f"  {word} → root: {root} (type: {word_info['type']})")
    
    print(f"\nTranslation benefit: All {len(words)} words share semantic connection")
    print("  كتب (wrote), كاتب (writer), مكتوب (written), كتاب (book), مكتبة (library)")
    print()


def example_4_full_workflow():
    """Example 4: Complete translation workflow with context."""
    print("=" * 60)
    print("EXAMPLE 4: Complete Translation Workflow")
    print("=" * 60)
    
    workflow = ArabicTranslationWorkflow()
    
    text = "السلام عليكم، كيف حالك؟ إن شاء الله كل شيء تمام"
    
    print(f"Source text: {text}\n")
    
    result = workflow.translate_with_context(text, target_formality="semi_formal")
    
    print("Analysis Results:")
    print(f"  Dialect: {result['analysis']['dialect_analysis']['dialect']}")
    print(f"  Confidence: {result['analysis']['dialect_analysis']['confidence']:.0%}")
    
    print("\nCultural Markers:")
    for marker in result['analysis']['cultural_markers']:
        print(f"  • {marker['phrase']} - {marker['meaning']}")
    
    print("\nTranslation Strategy:")
    for strategy in result['translation_strategy']:
        print(f"  → {strategy}")
    
    print("\nSuggested English Translation:")
    print("  'Peace be upon you, how are you? God willing, everything is fine'")
    print("\nNotes:")
    print("  - 'السلام عليكم' preserved as Islamic greeting")
    print("  - 'إن شاء الله' maintains cultural/religious context")
    print("  - Formal register appropriate for initial greeting")
    print()


if __name__ == "__main__":
    # Run all examples
    example_1_dialect_aware_translation()
    example_2_cultural_phrase_handling()
    example_3_root_based_translation()
    example_4_full_workflow()
    
    print("=" * 60)
    print("All translation workflow examples completed!")
    print("=" * 60)
