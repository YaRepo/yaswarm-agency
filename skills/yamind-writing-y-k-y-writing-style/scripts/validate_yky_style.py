import json
import re
import sys


class BritishEnglishRule:
    """Validates British English spelling compliance."""

    american_to_british = {
        "realize": "realise",
        "emphasize": "emphasise",
        "color": "colour",
        "behavior": "behaviour",
        "center": "centre",
        "theater": "theatre",
        "organize": "organise",
        "recognize": "recognise",
        "analyze": "analyse",
        "defense": "defence",
        "offense": "offence",
        "license": "licence",
        "practice": "practise",
        "program": "programme",
        "dialog": "dialogue",
        "analog": "analogue",
        "gray": "grey",
        "sulfur": "sulphur",
        "plow": "plough",
        "mold": "mould",
    }

    def validate(self, content):
        violations = []
        lines = content.split("\n")

        for line_num, line in enumerate(lines, 1):
            for american, british in self.american_to_british.items():
                pattern = rf"\b{american}\b"
                matches = re.findall(pattern, line, re.IGNORECASE)
                if matches:
                    for match in matches:
                        violations.append(
                            {
                                "line": line_num,
                                "type": "spelling",
                                "american": match,
                                "correct": british,
                                "severity": "CRITICAL",
                            }
                        )

        return violations


class DialogueTagRule:
    """Validates dialogue tag compliance and preference for action beats."""

    permitted_tags = ["said", "asked", "answered", "replied"]
    forbidden_tags = [
        "shouted",
        "whispered",
        "growled",
        "hissed",
        "exclaimed",
        "screamed",
        "sighed",
        "laughed",
        "cried",
        "moaned",
        "whined",
        "retorted",
        "demanded",
        "inquired",
        "grumbled",
        "muttered",
        "bellowed",
        "cooed",
        "murmured",
        "purred",
        "rasped",
    ]

    def validate(self, content):
        violations = []
        lines = content.split("\n")

        for line_num, line in enumerate(lines, 1):
            # Forbidden dialogue tags
            for tag in self.forbidden_tags:
                pattern = rf'["\u201c\'].*["\u201d\']?\s+(he|she|they|i|\w+)\s+{tag}\b'
                if re.search(pattern, line, re.IGNORECASE):
                    violations.append(
                        {
                            "line": line_num,
                            "type": "dialogue_tag",
                            "forbidden": tag,
                            "suggestion": 'Use "said" or replace with an action beat',
                            "severity": "CRITICAL",
                        }
                    )

            # Permitted tags (discourage in favor of action beats)
            for tag in self.permitted_tags:
                pattern = rf'["\u201c\'].*["\u201d\']?\s+(he|she|they|i|\w+)\s+{tag}\b'
                if re.search(pattern, line, re.IGNORECASE):
                    violations.append(
                        {
                            "line": line_num,
                            "type": "dialogue_tag_preference",
                            "found": tag,
                            "suggestion": "Prefer an action beat; keep tag only if clarity requires it",
                            "severity": "MEDIUM",
                        }
                    )

            # Adverb usage with dialogue tags
            adverb_pattern = r'["\u201c\'].*["\u201d\']?\s+\w+\s+said\s+(\w+ly)\b'
            matches = re.findall(adverb_pattern, line, re.IGNORECASE)
            if matches:
                for match in matches:
                    violations.append(
                        {
                            "line": line_num,
                            "type": "adverb_dialogue",
                            "found": f"said {match}",
                            "suggestion": "Remove adverb or use an action beat",
                            "severity": "HIGH",
                        }
                    )

        return violations


class NumberFormattingRule:
    """Validates number formatting compliance."""

    number_words = [
        "zero",
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
        "nine",
    ]

    def validate(self, content):
        violations = []
        lines = content.split("\n")

        for line_num, line in enumerate(lines, 1):
            # Numerals 0-9 (should be words)
            for i in range(10):
                pattern = rf"\b{i}\b"
                if re.search(pattern, line):
                    if not re.search(rf"\b{i}\d", line):
                        violations.append(
                            {
                                "line": line_num,
                                "type": "number_format",
                                "found": str(i),
                                "correct": self.number_words[i],
                                "severity": "HIGH",
                            }
                        )

            # Sentence-start numerals
            if re.search(r"^[0-9]+", line.strip()):
                violations.append(
                    {
                        "line": line_num,
                        "type": "number_sentence_start",
                        "suggestion": "Rewrite sentence to start with a word",
                        "severity": "HIGH",
                    }
                )

            # am/pm (discouraged unless diegetic)
            am_pm_pattern = r"\d{1,2}:\d{2}\s*(am|pm)"
            if re.search(am_pm_pattern, line, re.IGNORECASE):
                violations.append(
                    {
                        "line": line_num,
                        "type": "time_format",
                        "suggestion": 'Use 24-hour format or prose (e.g., "just after midnight")',
                        "severity": "MEDIUM",
                    }
                )

        return violations


class EmDashRule:
    """Validates em dash usage compliance."""

    MAX_EM_DASHES_PER_2000_WORDS = 2

    def validate(self, content):
        violations = []
        lines = content.split("\n")
        word_count = len(content.split())

        em_dash = "\u2014"
        em_dash_count = content.count(em_dash)
        max_em_dashes = (word_count // 2000) * self.MAX_EM_DASHES_PER_2000_WORDS
        if word_count > 0:
            max_em_dashes = max(self.MAX_EM_DASHES_PER_2000_WORDS, max_em_dashes)

        if em_dash_count > max_em_dashes:
            violations.append(
                {
                    "line": "N/A",
                    "type": "em_dash_overuse",
                    "count": em_dash_count,
                    "max_allowed": max_em_dashes,
                    "ratio": f"{em_dash_count}/{word_count} words",
                    "severity": "HIGH",
                    "suggestion": "Replace with commas, periods, colons, or parentheses",
                }
            )

        for line_num, line in enumerate(lines, 1):
            if em_dash in line:
                violations.append(
                    {
                        "line": line_num,
                        "type": "em_dash_location",
                        "content": line.strip(),
                        "severity": "INFO",
                    }
                )

        return violations


def read_content(path):
    if path:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return sys.stdin.read()


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else None
    content = read_content(path)

    rules = [
        BritishEnglishRule(),
        DialogueTagRule(),
        NumberFormattingRule(),
        EmDashRule(),
    ]

    violations = []
    for rule in rules:
        violations.extend(rule.validate(content))

    print(json.dumps(violations, indent=2))


if __name__ == "__main__":
    main()
