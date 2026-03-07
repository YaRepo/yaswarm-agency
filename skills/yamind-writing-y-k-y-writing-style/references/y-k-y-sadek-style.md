# Y.K.Y. Sadek Pen Style (Cyber-Duat)

Use this guide as the reference for the Y.K.Y. Sadek voice. It blends dystopian techno-thriller with urban fantasy, filtered through British dark satire and ancient Egyptian mythology.

## I. Core Atmospheric Elements

### The Setting (Techno-Dystopia)
- The world is crumbling under late-stage capitalism and authoritarian surveillance.
- Describe technology as invasive, biological, and oppressive.
- Systems feel alive and predatory (screens watch back, algorithms taste fear).

### The Secret (Hidden Heritage)
- Ancient Egyptian mythology is real but camouflaged.
- It is heavy, ritualistic, and terrifying, not sparkly or whimsical.
- Mythic power requires sacrifice, blood, or corrupt data.
- Corporate power mirrors priestly hierarchy.

### The Tone (Psychological and Claustrophobic)
- Focus on the protagonist's internal mental state.
- Paranoia is rational.
- The boundary between software glitch and reality fracture is blurred.

## II. Voice and Satire (British Filter)

- Use dry, dark British wit.
- Undercut horror with mundane complaints or bureaucracy.
- Use supernatural elements to critique class divide, police brutality, and corporate greed.
- Understatement wins; never scream.

## III. Writing Rules and Constraints

1. Blend the mechanical with the mystical in sensory details.
2. Avoid high-fantasy tropes (no wands, no sparkles).
3. Mix cyberpunk jargon with archaic mythic terms.
4. Characters are exhausted but resilient, driven by survival and truth.
5. Preserve original meaning unless asked to replot or expand.

## IV. Vocabulary Guidance

Use a mix of:
- Tech: biometrics, firewall, sub-routine, neural, surveillance, firmware, telemetry.
- Mythic: sarcophagus, ka, desert wind, dynastic, scarab, priest, Duat.

Avoid:
- Glittery magic language or heroic high-fantasy diction.
- Overwrought melodrama or shouted emotion.

## V. Example Interpretation

Input: "The bad guy entered the room."

Output: "He did not walk in so much as render himself, a glitch in the room's feed. His suit could have funded a borough, and the scarab on his lapel caught the light with a patience that belonged to dynasties. The air conditioning coughed, then gave up."

## VI. Specific Rule Implementations

### 4.3.1 British English Rule

```python
class BritishEnglishRule:
    """Validates British English spelling compliance."""

    # American to British spelling mappings
    american_to_british = {
        'realize': 'realise',
        'emphasize': 'emphasise',
        'color': 'colour',
        'behavior': 'behaviour',
        'center': 'centre',
        'theater': 'theatre',
        'organize': 'organise',
        'recognize': 'recognise',
        'analyze': 'analyse',
        'defense': 'defence',
        'offense': 'offence',
        'license': 'licence',
        'practice': 'practise',
        'program': 'programme',
        'dialog': 'dialogue',
        'analog': 'analogue',
        'gray': 'grey',
        'sulfur': 'sulphur',
        'plow': 'plough',
        'mold': 'mould'
    }

    def validate(self, content):
        violations = []
        lines = content.split('\n')

        for line_num, line in enumerate(lines, 1):
            for american, british in self.american_to_british.items():
                pattern = rf'\b{american}\b'
                matches = re.findall(pattern, line, re.IGNORECASE)
                if matches:
                    for match in matches:
                        violations.append({
                            'line': line_num,
                            'type': 'spelling',
                            'american': match,
                            'correct': british,
                            'severity': 'CRITICAL'
                        })

        return violations
```

### 4.3.2 Dialogue Tag Rule

Prefer action beats over dialogue tags. Only use tags when clarity demands it.

Examples:
- "I don't care." She crushed the badge between thumb and forefinger.
- "You will." He checked the door latch, twice.

```python
class DialogueTagRule:
    """Validates dialogue tag compliance."""

    permitted_tags = ['said', 'asked', 'answered', 'replied']
    forbidden_tags = [
        'shouted', 'whispered', 'growled', 'hissed', 'exclaimed',
        'screamed', 'sighed', 'laughed', 'cried', 'moaned', 'whined',
        'retorted', 'demanded', 'inquired', 'grumbled', 'muttered',
        'bellowed', 'cooed', 'murmured', 'purred', 'rasped'
    ]

    def validate(self, content):
        violations = []
        lines = content.split('\n')

        for line_num, line in enumerate(lines, 1):
            # Check for forbidden dialogue tags
            for tag in self.forbidden_tags:
                pattern = rf'["\'].*["\']?\s+(he|she|they|I|\w+)\s+{tag}\b'
                if re.search(pattern, line, re.IGNORECASE):
                    violations.append({
                        'line': line_num,
                        'type': 'dialogue_tag',
                        'forbidden': tag,
                        'suggestion': 'Use "said" or replace with an action beat',
                        'severity': 'CRITICAL'
                    })

            # Prefer action beats over permitted tags
            for tag in self.permitted_tags:
                pattern = rf'["\'].*["\']?\s+(he|she|they|I|\w+)\s+{tag}\b'
                if re.search(pattern, line, re.IGNORECASE):
                    violations.append({
                        'line': line_num,
                        'type': 'dialogue_tag_preference',
                        'found': tag,
                        'suggestion': 'Prefer an action beat; keep tag only if clarity requires it',
                        'severity': 'MEDIUM'
                    })
          
            # Check for adverb usage with dialogue tags
            adverb_pattern = rf'["\'].*["\']?\s+\w+\s+said\s+(\w+ly)\b'
            matches = re.findall(adverb_pattern, line)
            if matches:
                for match in matches:
                    violations.append({
                        'line': line_num,
                        'type': 'adverb_dialogue',
                        'found': f"said {match}",
                        'suggestion': 'Remove adverb or use an action beat',
                        'severity': 'HIGH'
                    })

        return violations
```

### 4.3.3 Number Formatting Rule

```python
class NumberFormattingRule:
    """Validates number formatting compliance."""

    number_words = [
        'zero', 'one', 'two', 'three', 'four', 'five',
        'six', 'seven', 'eight', 'nine'
    ]

    def validate(self, content):
        violations = []
        lines = content.split('\n')
        word_count = len(content.split())

        for line_num, line in enumerate(lines, 1):
            # Check for numerals 0-9 (should be words)
            for i in range(10):
                pattern = rf'\b{i}\b'
                if re.search(pattern, line):
                    # Exception: part of larger number (12, 15)
                    if not re.search(rf'\b{i}\d', line):
                        violations.append({
                            'line': line_num,
                            'type': 'number_format',
                            'found': str(i),
                            'correct': self.number_words[i],
                            'severity': 'HIGH'
                        })

            # Check for sentence-start numerals
            if re.search(r'^[0-9]+', line.strip()):
                violations.append({
                    'line': line_num,
                    'type': 'number_sentence_start',
                    'suggestion': 'Rewrite sentence to start with word',
                    'severity': 'HIGH'
                })

            # Check for am/pm (forbidden unless diegetic)
            am_pm_pattern = r'\d{1,2}:\d{2}\s*(am|pm)'
            if re.search(am_pm_pattern, line, re.IGNORECASE):
                violations.append({
                    'line': line_num,
                    'type': 'time_format',
                    'suggestion': 'Use 24-hour format or prose (e.g., "just after midnight")',
                    'severity': 'MEDIUM'
                })

        return violations
```

### 4.3.4 Em-Dash Restriction Rule

```python
class EmDashRule:
    """Validates em-dash usage compliance."""

    MAX_EM_DASHES_PER_2000_WORDS = 2

    def validate(self, content):
        violations = []
        lines = content.split('\n')
        word_count = len(content.split())

        em_dash_count = content.count('—')
        max_em_dashes = (word_count // 2000) * self.MAX_EM_DASH_PER_2000_WORDS

        if em_dash_count > max_em_dashes:
            violations.append({
                'line': 'N/A',
                'type': 'em_dash_overuse',
                'count': em_dash_count,
                'max_allowed': max_em_dashes,
                'ratio': f'{em_dash_count}/{word_count} words',
                'severity': 'HIGH',
                'suggestion': 'Replace with commas, periods, colons, or parentheses'
            })

        # Report each em-dash location
        for line_num, line in enumerate(lines, 1):
            if '—' in line:
                violations.append({
                    'line': line_num,
                    'type': 'em_dash_location',
                    'content': line.strip(),
                    'severity': 'INFO'
                })

        return violations
```
