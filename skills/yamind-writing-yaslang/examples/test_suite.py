"""
Comprehensive Test Suite for YaSlang_SKILL
Tests all components: dialect detection, root extraction, diacritization
"""

import sys
import os
import unittest

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dialect_detector import DialectDetector
from root_extractor import RootExtractor
from diacritizer import Diacritizer


class TestDialectDetector(unittest.TestCase):
    """Test suite for DialectDetector class."""
    
    def setUp(self):
        """Initialize detector for each test."""
        self.detector = DialectDetector()
    
    def test_egyptian_detection(self):
        """Test Egyptian Arabic detection."""
        test_cases = [
            "انت عايز ايه؟",
            "احنا رايحين فين؟",
            "هو قاعد يعمل ايه؟"
        ]
        
        for text in test_cases:
            dialect, confidence, _ = self.detector.detect(text)
            self.assertEqual(dialect, "egyptian", 
                           f"Failed to detect Egyptian: {text}")
            self.assertGreater(confidence, 0.7, 
                             f"Low confidence for Egyptian: {text}")
    
    def test_levantine_detection(self):
        """Test Levantine Arabic detection."""
        test_cases = [
            "شو بدك تعمل؟",
            "كيف بدي روح؟",
            "هاد الشي منيح"
        ]
        
        for text in test_cases:
            dialect, confidence, _ = self.detector.detect(text)
            self.assertEqual(dialect, "levantine", 
                           f"Failed to detect Levantine: {text}")
            self.assertGreater(confidence, 0.7)
    
    def test_gulf_detection(self):
        """Test Gulf Arabic detection."""
        test_cases = [
            "شنو تبي؟",
            "وش تسوي؟",
            "ابي اروح"
        ]
        
        for text in test_cases:
            dialect, confidence, _ = self.detector.detect(text)
            self.assertEqual(dialect, "gulf", 
                           f"Failed to detect Gulf: {text}")
            self.assertGreater(confidence, 0.7)
    
    def test_iraqi_detection(self):
        """Test Iraqi Arabic detection."""
        test_cases = [
            "شنو تريد؟",
            "ماكو مشكلة",
            "كلش زين"
        ]
        
        for text in test_cases:
            dialect, confidence, _ = self.detector.detect(text)
            self.assertEqual(dialect, "iraqi", 
                           f"Failed to detect Iraqi: {text}")
            self.assertGreater(confidence, 0.6)
    
    def test_maghrebi_detection(self):
        """Test Maghrebi Arabic detection."""
        test_cases = [
            "اش بغيتي؟",
            "كيفاش نمشي؟",
            "بزاف مزيان"
        ]
        
        for text in test_cases:
            dialect, confidence, _ = self.detector.detect(text)
            self.assertEqual(dialect, "maghrebi", 
                           f"Failed to detect Maghrebi: {text}")
            self.assertGreater(confidence, 0.6)


class TestRootExtractor(unittest.TestCase):
    """Test suite for RootExtractor class."""
    
    def setUp(self):
        """Initialize extractor for each test."""
        self.extractor = RootExtractor()
    
    def test_trilateral_sound_roots(self):
        """Test extraction of sound trilateral roots."""
        test_cases = [
            ("كتب", "كتب"),
            ("كاتب", "كتب"),
            ("مكتوب", "كتب"),
            ("كتاب", "كتب"),
            ("مكتبة", "كتب"),
        ]
        
        for word, expected_root in test_cases:
            root, confidence, details = self.extractor.extract(word)
            self.assertEqual(root, expected_root, 
                           f"Wrong root for {word}: got {root}, expected {expected_root}")
            self.assertEqual(details["root_type"], "trilateral_sound")
            self.assertGreater(confidence, 0.8)
    
    def test_hollow_roots(self):
        """Test extraction of hollow roots (middle weak letter)."""
        test_cases = [
            ("قال", "قول"),
            ("باع", "بيع"),
            ("نام", "نوم"),
        ]
        
        for word, expected_root in test_cases:
            root, confidence, details = self.extractor.extract(word)
            self.assertEqual(root, expected_root, 
                           f"Wrong hollow root for {word}")
            self.assertIn("hollow", details["root_type"])
            self.assertGreater(confidence, 0.7)
    
    def test_defective_roots(self):
        """Test extraction of defective roots (final weak letter)."""
        test_cases = [
            ("مشى", "مشي"),
            ("رمى", "رمي"),
        ]
        
        for word, expected_root in test_cases:
            root, confidence, details = self.extractor.extract(word)
            self.assertEqual(root, expected_root, 
                           f"Wrong defective root for {word}")
            self.assertIn("defective", details["root_type"])
    
    def test_definite_article_stripping(self):
        """Test proper stripping of definite article."""
        test_cases = [
            ("الكتاب", "كتب"),
            ("المكتبة", "كتب"),
            ("الطالب", "طلب"),
        ]
        
        for word, expected_root in test_cases:
            root, _, _ = self.extractor.extract(word)
            self.assertEqual(root, expected_root, 
                           f"Failed to strip ال from {word}")
    
    def test_batch_extraction(self):
        """Test batch processing of multiple words."""
        words = ["كتب", "درس", "علم", "قرأ"]
        results = self.extractor.batch_extract(words)
        
        self.assertEqual(len(results), len(words))
        for result in results:
            self.assertIn("word", result)
            self.assertIn("root", result)
            self.assertIn("confidence", result)


class TestDiacritizer(unittest.TestCase):
    """Test suite for Diacritizer class."""
    
    def setUp(self):
        """Initialize diacritizer for each test."""
        self.diacritizer = Diacritizer()
    
    def test_particle_diacritization(self):
        """Test diacritization of common particles."""
        test_cases = [
            ("في", "فِي"),
            ("من", "مِن"),
            ("الى", "إِلَى"),
        ]
        
        for word, expected in test_cases:
            result = self.diacritizer.diacritize(word, mode='full')
            self.assertEqual(result, expected, 
                           f"Wrong diacritization for {word}")
    
    def test_definite_article_sun_letters(self):
        """Test definite article with sun letters."""
        # Sun letters should have shadda on following letter
        test_cases = [
            "الشمس",  # ash-shams (not al-shams)
            "الطالب",  # aṭ-ṭālib
        ]
        
        for word in test_cases:
            result = self.diacritizer.diacritize(word, mode='full')
            # Check that shadda (ّ) appears after ال
            self.assertIn('\u0651', result, 
                         f"Missing shadda for sun letter in {word}")
    
    def test_definite_article_moon_letters(self):
        """Test definite article with moon letters."""
        test_cases = [
            "القمر",  # al-qamar
            "الكتاب",  # al-kitāb
        ]
        
        for word in test_cases:
            result = self.diacritizer.diacritize(word, mode='full')
            # Moon letters should NOT have shadda
            # Count shadda marks should be minimal
            shadda_count = result.count('\u0651')
            self.assertLessEqual(shadda_count, 1, 
                               f"Unexpected shadda in moon letter word: {word}")
    
    def test_diacritization_modes(self):
        """Test different diacritization modes."""
        word = "كتاب"
        
        # Full mode
        full = self.diacritizer.diacritize(word, mode='full')
        self.assertGreater(len(full), len(word), 
                          "Full mode should add diacritics")
        
        # Minimal mode
        minimal = self.diacritizer.diacritize(word, mode='minimal')
        self.assertEqual(minimal, word, 
                        "Minimal mode should not add diacritics")
        
        # Partial mode
        partial = self.diacritizer.diacritize(word, mode='partial')
        # Partial should have some but not all diacritics
        self.assertLessEqual(len(partial), len(full))


class TestIntegration(unittest.TestCase):
    """Integration tests combining multiple components."""
    
    def setUp(self):
        """Initialize all components."""
        self.detector = DialectDetector()
        self.extractor = RootExtractor()
        self.diacritizer = Diacritizer()
    
    def test_complete_workflow(self):
        """Test complete analysis workflow."""
        text = "كتاب كبير"
        
        # 1. Detect dialect (should be MSA or unknown for this simple text)
        dialect, confidence, _ = self.detector.detect(text)
        self.assertIsNotNone(dialect)
        
        # 2. Extract roots
        words = text.split()
        roots = []
        for word in words:
            root, _, _ = self.extractor.extract(word)
            roots.append(root)
        
        self.assertEqual(len(roots), 2)
        self.assertEqual(roots[0], "كتب")
        self.assertEqual(roots[1], "كبر")
        
        # 3. Diacritize
        diacritized = self.diacritizer.diacritize(text, mode='full')
        self.assertGreater(len(diacritized), len(text))
    
    def test_dialect_specific_vocabulary(self):
        """Test that dialect vocabulary affects detection."""
        # Egyptian specific
        egyptian_text = "انت عايز ايه؟"
        dialect_eg, conf_eg, _ = self.detector.detect(egyptian_text)
        
        # Levantine specific
        levantine_text = "شو بدك؟"
        dialect_lv, conf_lv, _ = self.detector.detect(levantine_text)
        
        self.assertEqual(dialect_eg, "egyptian")
        self.assertEqual(dialect_lv, "levantine")
        self.assertNotEqual(dialect_eg, dialect_lv)


def run_test_suite():
    """Run complete test suite with detailed output."""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestDialectDetector))
    suite.addTests(loader.loadTestsFromTestCase(TestRootExtractor))
    suite.addTests(loader.loadTestsFromTestCase(TestDiacritizer))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))
    
    # Run with verbose output
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 70)
    print("TEST SUITE SUMMARY")
    print("=" * 70)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("\n✅ ALL TESTS PASSED!")
    else:
        print("\n❌ SOME TESTS FAILED")
    
    print("=" * 70)
    
    return result.wasSuccessful()


if __name__ == "__main__":
    import sys
    success = run_test_suite()
    sys.exit(0 if success else 1)
