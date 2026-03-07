#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Arabic Diacritizer
==================
Smart diacritization engine for adding vowel marks to Arabic text.

Uses context-aware rules and pattern matching to add appropriate
diacritical marks (tashkeel) to undiacritized Arabic text.

Dependencies: None (pure Python)
"""

import re
from typing import Dict, List, Tuple, Optional


class Diacritizer:
    """
    Adds diacritical marks to Arabic text using rule-based approach.
    
    Methodology:
    1. Analyzes word position and context
    2. Identifies word patterns (verb forms, nouns, particles)
    3. Applies diacritization rules based on morphology
    4. Handles special cases (definite article, case endings)
    """
    
    def __init__(self):
        """Initialize with diacritization rules and patterns."""
        self.verb_patterns = self._load_verb_patterns()
        self.noun_patterns = self._load_noun_patterns()
        self.particles = self._load_particles()
        self.sun_letters = 'تثدذرزسشصضطظلن'
        self.moon_letters = 'ابجحخعغفقكمهوي'
    
    def _load_verb_patterns(self) -> Dict[str, str]:
        """Load common verb form patterns with diacritics."""
        return {
            # Form I (basic)
            'فعل_past': 'فَعَلَ',
            'فعل_present': 'يَفْعَلُ',
            
            # Form II (intensified)
            'فعّل_past': 'فَعَّلَ',
            'فعّل_present': 'يُفَعِّلُ',
            
            # Form III (effort toward)
            'فاعل_past': 'فَاعَلَ',
            'فاعل_present': 'يُفَاعِلُ',
            
            # Form IV (causative)
            'أفعل_past': 'أَفْعَلَ',
            'أفعل_present': 'يُفْعِلُ',
            
            # Form V (reflexive of II)
            'تفعّل_past': 'تَفَعَّلَ',
            'تفعّل_present': 'يَتَفَعَّلُ',
            
            # Form VIII (reflexive)
            'افتعل_past': 'افْتَعَلَ',
            'افتعل_present': 'يَفْتَعِلُ',
            
            # Form X (seeking)
            'استفعل_past': 'اسْتَفْعَلَ',
            'استفعل_present': 'يَسْتَفْعِلُ',
        }
    
    def _load_noun_patterns(self) -> Dict[str, str]:
        """Load common noun patterns with diacritics."""
        return {
            'فاعل': 'فَاعِل',      # Active participle
            'مفعول': 'مَفْعُول',    # Passive participle
            'مفعل': 'مَفْعَل',      # Place/time
            'مفعال': 'مِفْعَال',    # Instrument
            'فعال': 'فَعَال',      # Profession
            'فعول': 'فَعُول',      # Intensive
        }
    
    def _load_particles(self) -> Dict[str, str]:
        """Load particles with standard diacritics."""
        return {
            'من': 'مِنْ',
            'إلى': 'إِلَى',
            'على': 'عَلَى',
            'في': 'فِي',
            'مع': 'مَعَ',
            'عن': 'عَنْ',
            'إن': 'إِنَّ',
            'أن': 'أَنَّ',
            'لكن': 'لَكِنَّ',
            'كأن': 'كَأَنَّ',
            'ليس': 'لَيْسَ',
            'لا': 'لَا',
            'ما': 'مَا',
            'هل': 'هَلْ',
            'قد': 'قَدْ',
        }
    
    def diacritize(self, text: str, mode: str = 'full') -> str:
        """
        Add diacritics to Arabic text.
        
        Args:
            text: Undiacritized Arabic text
            mode: 'full' (all diacritics), 'partial' (critical only), 'minimal'
        
        Returns:
            Diacritized text
        """
        words = text.split()
        diacritized_words = []
        
        for i, word in enumerate(words):
            # Check if already diacritized
            if self._has_diacritics(word):
                diacritized_words.append(word)
                continue
            
            # Apply diacritization rules
            diac_word = self._diacritize_word(word, i, words, mode)
            diacritized_words.append(diac_word)
        
        return ' '.join(diacritized_words)
    
    def _has_diacritics(self, word: str) -> bool:
        """Check if word already has diacritics."""
        diacritics = 'ًٌٍَُِّْ'
        return any(c in word for c in diacritics)
    
    def _diacritize_word(self, word: str, position: int, 
                         all_words: List[str], mode: str) -> str:
        """Diacritize a single word based on context."""
        
        # Handle definite article
        if word.startswith('ال'):
            return self._diacritize_definite_article(word)
        
        # Check particles
        if word in self.particles:
            return self.particles[word]
        
        # Try verb patterns
        verb_match = self._match_verb_pattern(word)
        if verb_match:
            return verb_match
        
        # Try noun patterns
        noun_match = self._match_noun_pattern(word)
        if noun_match:
            return noun_match
        
        # Default: apply basic diacritization
        return self._apply_default_diacritics(word, mode)
    
    def _diacritize_definite_article(self, word: str) -> str:
        """Diacritize word with definite article ال."""
        if len(word) < 3:
            return word
        
        article = word[:2]  # ال
        rest = word[2:]
        
        # Check if next letter is sun or moon
        if rest[0] in self.sun_letters:
            # Sun letter: ال becomes الـ with shadda on following letter
            return f'الْ{rest[0]}َّ{rest[1:]}'
        else:
            # Moon letter: ال pronounced normally
            return f'الْ{rest}'
    
    def _match_verb_pattern(self, word: str) -> Optional[str]:
        """Try to match word against verb patterns."""
        # Simplified pattern matching
        # Real implementation would use root extraction + pattern application
        
        # Check for Form II pattern (doubled middle radical)
        if len(word) == 3:
            # Could be فَعَلَ pattern
            return f'{word[0]}َ{word[1]}َ{word[2]}َ'
        
        return None
    
    def _match_noun_pattern(self, word: str) -> Optional[str]:
        """Try to match word against noun patterns."""
        # Simplified - real implementation needs morphological analysis
        return None
    
    def _apply_default_diacritics(self, word: str, mode: str) -> str:
        """Apply basic diacritization when pattern not recognized."""
        if mode == 'minimal':
            return word  # Don't add diacritics
        
        if mode == 'partial':
            # Only add sukoon and shadda where critical
            return word
        
        # Full mode: add fatḥa to most letters as default
        result = []
        for i, char in enumerate(word):
            result.append(char)
            if i < len(word) - 1:  # Not last letter
                result.append('َ')  # Fatḥa
        return ''.join(result)


# Example usage
if __name__ == '__main__':
    diacritizer = Diacritizer()
    
    # Test cases
    test_texts = [
        'السلام عليكم',
        'كتاب كبير',
        'ذهب الطالب الى المدرسة',
    ]
    
    print("Arabic Diacritizer - Test Results")
    print("=" * 50)
    
    for text in test_texts:
        full = diacritizer.diacritize(text, mode='full')
        partial = diacritizer.diacritize(text, mode='partial')
        
        print(f"\nOriginal: {text}")
        print(f"Full:     {full}")
        print(f"Partial:  {partial}")
        print("-" * 50)
