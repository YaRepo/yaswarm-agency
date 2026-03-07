#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Arabic Dialect Detector
========================
Automated identification of Arabic dialect from text samples.

Analyzes linguistic markers to determine which Arabic dialect family
a text belongs to: Egyptian, Levantine, Gulf, Iraqi, or Maghrebi.

Dependencies: None (pure Python)
"""

import re
from typing import Dict, List, Tuple, Optional
from collections import Counter


class DialectDetector:
    """
    Detects Arabic dialect from text by analyzing linguistic markers.
    
    Methodology:
    1. Tokenizes input text
    2. Scores text against dialect-specific markers
    3. Applies weighted scoring for high-confidence markers
    4. Returns dialect with confidence score
    """
    
    def __init__(self):
        """Initialize detector with dialect marker databases."""
        self.dialects = {
            'egyptian': self._egyptian_markers(),
            'levantine': self._levantine_markers(),
            'gulf': self._gulf_markers(),
            'iraqi': self._iraqi_markers(),
            'maghrebi': self._maghrebi_markers()
        }
        
    def _egyptian_markers(self) -> Dict[str, any]:
        """Egyptian Arabic linguistic markers."""
        return {
            'question_words': ['ايه', 'ازاي', 'امتى', 'فين'],
            'negation': ['مش', 'ماش'],
            'verbs': ['عايز', 'عايزة', 'عاوز', 'رايح', 'جاي'],
            'particles': ['ده', 'دي', 'دول', 'اهو', 'اهي'],
            'pronouns': ['احنا', 'انتو', 'هما'],
            'present_marker': 'ب',
            'weight': 1.0
        }
    
    def _levantine_markers(self) -> Dict[str, any]:
        """Levantine Arabic (Syrian/Lebanese/Palestinian/Jordanian) markers."""
        return {
            'question_words': ['شو', 'كيف', 'وين', 'ليش', 'مين'],
            'negation': ['ما', 'مو'],
            'verbs': ['بدي', 'بده', 'بدها', 'بدنا', 'بدكن', 'بدهن'],
            'particles': ['هاد', 'هاي', 'هدول', 'هيك', 'هون', 'هونيك'],
            'pronouns': ['نحنا', 'انتو', 'هنن'],
            'present_marker': 'ب',
            'conjunctions': ['بس', 'لإنو', 'يلي'],
            'weight': 1.0
        }
    
    def _gulf_markers(self) -> Dict[str, any]:
        """Gulf Arabic (Saudi/UAE/Kuwait/Bahrain/Qatar) markers."""
        return {
            'question_words': ['شنو', 'وش', 'شلون', 'كيف', 'وين', 'ليش'],
            'negation': ['ما', 'مو', 'مب'],
            'verbs': ['أبي', 'أبغى', 'ودي', 'أقدر'],
            'particles': ['ذا', 'ذي', 'ذول', 'زين', 'مرة'],
            'pronouns': ['احنا', 'انتو', 'هم'],
            'present_marker': 'ي/ت',
            'unique_words': ['يا هلا', 'ان شاء الله', 'ماشاء الله'],
            'weight': 1.0
        }
    
    def _iraqi_markers(self) -> Dict[str, any]:
        """Iraqi Arabic markers."""
        return {
            'question_words': ['شنو', 'شلون', 'وين', 'ليش', 'منو'],
            'negation': ['ما', 'مو', 'ماكو'],
            'verbs': ['اريد', 'ماكو', 'اكو', 'شايف'],
            'particles': ['هاي', 'هذا', 'هذي', 'هذول'],
            'pronouns': ['احنا', 'انتو', 'هم'],
            'unique_words': ['زين', 'كلش', 'شلونك', 'ماكو مشكلة'],
            'weight': 1.0
        }
    
    def _maghrebi_markers(self) -> Dict[str, any]:
        """Maghrebi Arabic (Moroccan/Algerian/Tunisian) markers."""
        return {
            'question_words': ['شنو', 'اش', 'كيفاش', 'فين', 'علاش', 'شكون'],
            'negation': ['ما...ش', 'ماشي'],
            'verbs': ['بغيت', 'كنبغي', 'نبغي'],
            'particles': ['هاد', 'هادي', 'هادو', 'ديال'],
            'pronouns': ['حنا', 'نتوما', 'هوما'],
            'present_marker': 'كا/تا',
            'unique_words': ['بزاف', 'وخا', 'لاباس', 'عافاك'],
            'weight': 1.0
        }
    
    def detect(self, text: str, min_confidence: float = 0.3) -> Tuple[str, float, Dict]:
        """
        Detect dialect from Arabic text.
        
        Args:
            text: Arabic text to analyze
            min_confidence: Minimum confidence threshold (0-1)
        
        Returns:
            Tuple of (dialect_name, confidence_score, detailed_scores)
        """
        # Normalize text
        text = self._normalize(text)
        
        # Calculate scores for each dialect
        scores = {}
        for dialect_name, markers in self.dialects.items():
            score = self._calculate_score(text, markers)
            scores[dialect_name] = score
        
        # Determine winner
        if not scores or max(scores.values()) == 0:
            return ('unknown', 0.0, scores)
        
        total_score = sum(scores.values())
        best_dialect = max(scores, key=scores.get)
        confidence = scores[best_dialect] / total_score if total_score > 0 else 0.0
        
        if confidence < min_confidence:
            return ('ambiguous', confidence, scores)
        
        return (best_dialect, confidence, scores)
    
    def _normalize(self, text: str) -> str:
        """Normalize Arabic text for analysis."""
        # Remove diacritics
        text = re.sub(r'[\u064B-\u065F\u0670]', '', text)
        # Normalize alef variations
        text = re.sub(r'[إأآا]', 'ا', text)
        # Normalize yaa
        text = re.sub(r'[يى]', 'ي', text)
        return text.strip()
    
    def _calculate_score(self, text: str, markers: Dict) -> float:
        """Calculate dialect score based on marker presence."""
        score = 0.0
        words = text.split()
        
        # Check question words (high weight)
        for qw in markers.get('question_words', []):
            if qw in words:
                score += 3.0
        
        # Check negation patterns
        for neg in markers.get('negation', []):
            if neg in text:
                score += 2.0
        
        # Check verbs
        for verb in markers.get('verbs', []):
            if verb in words:
                score += 2.5
        
        # Check particles
        for particle in markers.get('particles', []):
            if particle in words:
                score += 1.5
        
        # Check pronouns
        for pronoun in markers.get('pronouns', []):
            if pronoun in words:
                score += 1.0
        
        # Check unique dialect words (very high weight)
        for unique in markers.get('unique_words', []):
            if unique in text:
                score += 4.0
        
        # Check conjunctions
        for conj in markers.get('conjunctions', []):
            if conj in words:
                score += 1.5
        
        # Check present tense marker patterns
        present_marker = markers.get('present_marker', '')
        if present_marker:
            if present_marker == 'ب' and re.search(r'\bب[ا-ي]{2,}', text):
                score += 2.0
            elif present_marker == 'ي/ت' and re.search(r'\b[يت][ا-ي]{2,}', text):
                score += 2.0
            elif present_marker == 'كا/تا' and re.search(r'\b[كت]ا[ا-ي]{2,}', text):
                score += 2.0
        
        return score * markers.get('weight', 1.0)
    
    def analyze_detailed(self, text: str) -> Dict:
        """
        Perform detailed dialect analysis with explanations.
        
        Returns:
            Dictionary with detected markers for each dialect
        """
        text = self._normalize(text)
        words = text.split()
        analysis = {}
        
        for dialect_name, markers in self.dialects.items():
            found_markers = {
                'question_words': [],
                'negation': [],
                'verbs': [],
                'particles': [],
                'pronouns': [],
                'unique_words': []
            }
            
            # Collect found markers
            for category in found_markers.keys():
                if category in markers:
                    for marker in markers[category]:
                        if marker in words or marker in text:
                            found_markers[category].append(marker)
            
            analysis[dialect_name] = {
                'found_markers': found_markers,
                'total_markers': sum(len(v) for v in found_markers.values()),
                'score': self._calculate_score(text, markers)
            }
        
        return analysis


# Example usage and testing
if __name__ == '__main__':
    detector = DialectDetector()
    
    # Test cases
    test_texts = [
        ("انت عايز ايه؟", "Egyptian"),
        ("شو بدك تعمل؟", "Levantine"),
        ("وش تبي تسوي؟", "Gulf"),
        ("شنو تريد تسوي؟", "Iraqi"),
        ("شنو بغيتي تديري؟", "Maghrebi"),
    ]
    
    print("Arabic Dialect Detector - Test Results")
    print("=" * 50)
    
    for text, expected in test_texts:
        dialect, confidence, scores = detector.detect(text)
        print(f"\nText: {text}")
        print(f"Expected: {expected}")
        print(f"Detected: {dialect.title()} (confidence: {confidence:.2%})")
        print(f"All scores: {scores}")
        print("-" * 50)
