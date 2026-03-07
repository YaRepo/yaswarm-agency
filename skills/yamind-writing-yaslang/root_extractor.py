#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Arabic Root Extractor
=====================
Morphological analysis tool for extracting trilateral/quadrilateral roots.

Analyzes Arabic words to identify their consonantal roots by:
1. Removing prefixes, suffixes, and infixes
2. Normalizing characters
3. Extracting core consonants
4. Validating against known patterns

Dependencies: None (pure Python)
"""

import re
from typing import Tuple, Optional, List, Dict


class RootExtractor:
    """
    Extracts Arabic roots from words using morphological analysis.
    
    Methodology:
    1. Normalize input (remove diacritics, normalize letters)
    2. Strip known affixes (prefixes, suffixes, infixes)
    3. Extract consonantal skeleton
    4. Validate against trilateral/quadrilateral patterns
    5. Return root with confidence score
    """
    
    def __init__(self):
        """Initialize extractor with affix patterns."""
        self.prefixes = self._get_prefixes()
        self.suffixes = self._get_suffixes()
        self.infixes = self._get_infixes()
        self.weak_letters = ['ا', 'و', 'ي', 'ى', 'أ', 'إ', 'آ']
        
    def _get_prefixes(self) -> List[str]:
        """Common Arabic prefixes."""
        return [
            'ال',      # Definite article
            'و',       # And
            'ف',       # So/then
            'ب',       # With/in
            'ل',       # To/for
            'ك',       # Like
            'س',       # Future marker
            'أ',       # Question marker
            'ي',       # Present tense (3rd m.)
            'ت',       # Present tense (2nd/3rd f.)
            'ن',       # Present tense (1st pl.)
            'م',       # Passive/place/time
            'است',     # Form X prefix
            'ان',      # Reflexive
        ]
    
    def _get_suffixes(self) -> List[str]:
        """Common Arabic suffixes."""
        return [
            'ها', 'هم', 'هن', 'ه',     # Possessive pronouns
            'ك', 'كم', 'كن',            # Possessive (you)
            'نا', 'ي',                  # Possessive (we/me)
            'ون', 'ين', 'ان', 'ات',    # Plural/dual markers
            'ة', 'ت',                   # Feminine markers
        ]
    
    def _get_infixes(self) -> List[str]:
        """Internal letters that may be removed (Form patterns)."""
        return [
            'ا', 'ت', 'است', 'ان'
        ]
    
    def extract(self, word: str) -> Tuple[str, float, Dict]:
        """
        Extract root from Arabic word.
        
        Args:
            word: Arabic word to analyze
        
        Returns:
            Tuple of (root, confidence_score, analysis_details)
        """
        # Step 1: Normalize
        normalized = self._normalize(word)
        
        # Step 2: Remove affixes
        stripped = self._strip_affixes(normalized)
        
        # Step 3: Extract consonants
        consonants = self._extract_consonants(stripped)
        
        # Step 4: Validate and determine root
        root, confidence = self._validate_root(consonants)
        
        details = {
            'original': word,
            'normalized': normalized,
            'stripped': stripped,
            'consonants': consonants,
            'root': root,
            'root_type': self._determine_root_type(root)
        }
        
        return (root, confidence, details)
    
    def _normalize(self, word: str) -> str:
        """Normalize Arabic text."""
        # Remove diacritics
        word = re.sub(r'[\u064B-\u065F\u0670]', '', word)
        # Normalize alef
        word = re.sub(r'[إأآ]', 'ا', word)
        # Normalize yaa/alef maqsura
        word = re.sub(r'ى', 'ي', word)
        # Normalize taa marbouta
        word = re.sub(r'ة', 'ه', word)
        return word.strip()
    
    def _strip_affixes(self, word: str) -> str:
        """Remove known prefixes and suffixes."""
        # Remove definite article first
        if word.startswith('ال'):
            word = word[2:]
        
        # Remove other prefixes
        for prefix in sorted(self.prefixes, key=len, reverse=True):
            if word.startswith(prefix) and len(word) > len(prefix) + 2:
                word = word[len(prefix):]
                break
        
        # Remove suffixes
        for suffix in sorted(self.suffixes, key=len, reverse=True):
            if word.endswith(suffix) and len(word) > len(suffix) + 2:
                word = word[:-len(suffix)]
                break
        
        return word
    
    def _extract_consonants(self, word: str) -> str:
        """Extract consonantal skeleton."""
        # Remove doubled consonants (shadda effect)
        cleaned = re.sub(r'(.)\1+', r'\1', word)
        
        # For Form patterns, try removing internal augments
        # This is simplified - real implementation needs pattern matching
        return cleaned
    
    def _validate_root(self, consonants: str) -> Tuple[str, float]:
        """Validate extracted root and assign confidence."""
        length = len(consonants)
        
        # Trilateral root (most common)
        if length == 3:
            return (consonants, 0.9)
        
        # Quadrilateral root
        elif length == 4:
            return (consonants, 0.85)
        
        # Too short - likely error
        elif length < 3:
            return (consonants, 0.3)
        
        # Too long - might need more stripping
        elif length > 4:
            # Try to reduce to 3-4 letters
            reduced = self._reduce_to_root(consonants)
            return (reduced, 0.6)
        
        return (consonants, 0.5)
    
    def _reduce_to_root(self, word: str) -> str:
        """Attempt to reduce over-long word to root."""
        # Remove common internal augments
        for infix in ['است', 'ان', 'ت', 'ا']:
            word = word.replace(infix, '', 1)
            if len(word) in [3, 4]:
                return word
        
        # If still too long, take first 3 strong consonants
        strong_consonants = [c for c in word if c not in self.weak_letters]
        if len(strong_consonants) >= 3:
            return ''.join(strong_consonants[:3])
        
        return word[:3] if len(word) >= 3 else word
    
    def _determine_root_type(self, root: str) -> str:
        """Classify root type."""
        if not root:
            return 'unknown'
        
        length = len(root)
        has_weak = any(c in self.weak_letters for c in root)
        
        if length == 3:
            if not has_weak:
                return 'trilateral_sound'
            else:
                if root[0] in self.weak_letters:
                    return 'trilateral_assimilated'
                elif root[1] in self.weak_letters:
                    return 'trilateral_hollow'
                elif root[2] in self.weak_letters:
                    return 'trilateral_defective'
        elif length == 4:
            return 'quadrilateral'
        
        return 'irregular'
    
    def batch_extract(self, words: List[str]) -> List[Dict]:
        """Extract roots from multiple words."""
        results = []
        for word in words:
            root, confidence, details = self.extract(word)
            results.append({
                'word': word,
                'root': root,
                'confidence': confidence,
                'details': details
            })
        return results


# Example usage
if __name__ == '__main__':
    extractor = RootExtractor()
    
    # Test cases
    test_words = [
        'كتاب',      # k-t-b
        'مكتوب',     # k-t-b (passive participle)
        'استكتب',    # k-t-b (Form X)
        'المدرسة',   # d-r-s
        'يذهبون',    # dh-h-b
    ]
    
    print("Arabic Root Extractor - Test Results")
    print("=" * 50)
    
    for word in test_words:
        root, confidence, details = extractor.extract(word)
        print(f"\nWord: {word}")
        print(f"Root: {root}")
        print(f"Confidence: {confidence:.0%}")
        print(f"Root Type: {details['root_type']}")
        print(f"Processing: {details['original']} → {details['normalized']} → {details['stripped']}")
        print("-" * 50)
