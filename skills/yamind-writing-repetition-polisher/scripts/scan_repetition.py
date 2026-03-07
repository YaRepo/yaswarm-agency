import argparse
import json
import os
import re
import sys
from pathlib import Path


STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "had",
    "has",
    "have",
    "he",
    "her",
    "his",
    "i",
    "if",
    "in",
    "is",
    "it",
    "its",
    "me",
    "my",
    "of",
    "on",
    "or",
    "our",
    "she",
    "so",
    "that",
    "the",
    "their",
    "them",
    "then",
    "they",
    "this",
    "to",
    "was",
    "we",
    "were",
    "with",
    "you",
    "your",
}

IGNORE_PROFILE_FILENAMES = (
    ".repetition-ignore.json",
    "repetition-ignore.json",
    "repetition-ignore-profile.json",
)


def normalize_text(text):
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def _load_profile_file(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError(f"Ignore profile must be a JSON object: {path}")
    return data


def _candidate_profile_paths(input_path):
    candidates = []

    # Search near the input path first.
    if input_path:
        input_resolved = Path(input_path).expanduser().resolve()
        for parent in [input_resolved.parent, *input_resolved.parents]:
            for name in IGNORE_PROFILE_FILENAMES:
                candidates.append(parent / name)

    # Search from current working directory up to root.
    cwd = Path.cwd().resolve()
    for parent in [cwd, *cwd.parents]:
        for name in IGNORE_PROFILE_FILENAMES:
            candidates.append(parent / name)

    # Common project convention for this writing workspace.
    candidates.append(cwd / "manuscripts" / "shapeshifter" / "03-PUBLISHING" / "repetition-ignore-profile.json")

    # De-duplicate while preserving order.
    deduped = []
    seen = set()
    for cand in candidates:
        key = str(cand)
        if key not in seen:
            deduped.append(cand)
            seen.add(key)
    return deduped


def load_ignore_profile(explicit_path=None, input_path=None, auto_discover=True):
    if explicit_path:
        explicit = Path(explicit_path).expanduser()
        if not explicit.is_file():
            raise FileNotFoundError(f"Ignore profile not found: {explicit}")
        return _load_profile_file(explicit), str(explicit.resolve())

    env_path = os.environ.get("REPETITION_IGNORE_PROFILE")
    if env_path:
        env_profile = Path(env_path).expanduser()
        if env_profile.is_file():
            return _load_profile_file(env_profile), str(env_profile.resolve())
        raise FileNotFoundError(f"Ignore profile from REPETITION_IGNORE_PROFILE not found: {env_profile}")

    if auto_discover:
        for cand in _candidate_profile_paths(input_path):
            if cand.is_file():
                return _load_profile_file(cand), str(cand.resolve())

    return {}, None


def build_ignore_sets(profile):
    # Supports two equivalent schemas:
    # 1) { "phrase_repeat": [...], "sentence_opening_repeat": [...], "near_repeat": [...] }
    # 2) { "exclude": { ...same keys... } }
    exclude = profile.get("exclude", {}) if isinstance(profile.get("exclude"), dict) else {}
    phrase_values = (profile.get("phrase_repeat") or []) + (exclude.get("phrase_repeat") or [])
    opening_values = (profile.get("sentence_opening_repeat") or []) + (
        exclude.get("sentence_opening_repeat") or []
    )
    near_values = (profile.get("near_repeat") or []) + (exclude.get("near_repeat") or []) + (
        exclude.get("near_repeat_words") or []
    )
    return {
        "phrase_repeat": {normalize_text(v) for v in phrase_values if normalize_text(v)},
        "sentence_opening_repeat": {normalize_text(v) for v in opening_values if normalize_text(v)},
        "near_repeat": {normalize_text(v) for v in near_values if normalize_text(v)},
    }


def should_ignore_violation(v, ignore_sets):
    vtype = v.get("type")
    if vtype == "phrase_repeat":
        return normalize_text(v.get("phrase")) in ignore_sets["phrase_repeat"]
    if vtype == "sentence_opening_repeat":
        return normalize_text(v.get("opening")) in ignore_sets["sentence_opening_repeat"]
    if vtype == "near_repeat":
        return normalize_text(v.get("word")) in ignore_sets["near_repeat"]
    return False


def tokenize_lines(lines):
    tokens = []
    for line_num, line in enumerate(lines, 1):
        for match in re.finditer(r"[A-Za-z0-9']+", line):
            word = match.group(0)
            tokens.append(
                {
                    "word": word,
                    "word_lc": word.lower(),
                    "line": line_num,
                }
            )
    return tokens


def scan_near_repeats(tokens, window, min_len):
    violations = []
    last_pos = {}
    for idx, tok in enumerate(tokens):
        word = tok["word_lc"]
        if len(word) < min_len or word in STOPWORDS:
            continue
        prev = last_pos.get(word)
        if prev is not None and idx - prev["idx"] <= window:
            violations.append(
                {
                    "type": "near_repeat",
                    "word": tok["word"],
                    "line": tok["line"],
                    "prev_line": prev["line"],
                    "distance_tokens": idx - prev["idx"],
                    "severity": "MEDIUM",
                }
            )
        last_pos[word] = {"idx": idx, "line": tok["line"]}
    return violations


def split_paragraphs(lines):
    paragraphs = []
    current = []
    start_line = 1
    for i, line in enumerate(lines, 1):
        if line.strip() == "":
            if current:
                paragraphs.append((start_line, current))
                current = []
            start_line = i + 1
        else:
            current.append(line)
    if current:
        paragraphs.append((start_line, current))
    return paragraphs


def scan_phrase_repeats(lines, min_len=2, max_len=4):
    violations = []
    paragraphs = split_paragraphs(lines)
    for start_line, para_lines in paragraphs:
        para_text = " ".join(para_lines)
        words = re.findall(r"[A-Za-z0-9']+", para_text.lower())
        if len(words) < max_len + 1:
            continue
        for n in range(min_len, max_len + 1):
            counts = {}
            for i in range(len(words) - n + 1):
                phrase = " ".join(words[i : i + n])
                if all(w in STOPWORDS for w in phrase.split()):
                    continue
                counts.setdefault(phrase, 0)
                counts[phrase] += 1
            for phrase, count in counts.items():
                if count > 1:
                    violations.append(
                        {
                            "type": "phrase_repeat",
                            "phrase": phrase,
                            "count": count,
                            "paragraph_start_line": start_line,
                            "severity": "HIGH",
                        }
                    )
    return violations


def scan_sentence_openings(content):
    violations = []
    sentences = re.split(r"(?<=[.!?])\s+", content.strip())
    prev_open = None
    for idx, sentence in enumerate(sentences, 1):
        words = re.findall(r"[A-Za-z0-9']+", sentence.lower())
        open_words = [w for w in words if w not in STOPWORDS][:2]
        opening = " ".join(open_words)
        if opening and prev_open and opening == prev_open:
            violations.append(
                {
                    "type": "sentence_opening_repeat",
                    "opening": opening,
                    "sentence_index": idx,
                    "severity": "MEDIUM",
                }
            )
        if opening:
            prev_open = opening
    return violations


def main():
    parser = argparse.ArgumentParser(description="Scan text for repetition.")
    parser.add_argument("path", nargs="?", help="Path to text file (defaults to stdin).")
    parser.add_argument("--window", type=int, default=60, help="Token window for near repeats.")
    parser.add_argument("--min-len", type=int, default=3, help="Min word length for repeat scan.")
    parser.add_argument(
        "--ignore-profile",
        help="Path to JSON ignore profile for intentional repeats.",
    )
    parser.add_argument(
        "--no-auto-ignore",
        action="store_true",
        help="Disable automatic discovery of ignore profile files.",
    )
    parser.add_argument(
        "--print-ignore-path",
        action="store_true",
        help="Print active ignore profile path to stderr.",
    )
    args = parser.parse_args()

    if args.path:
        with open(args.path, "r", encoding="utf-8") as f:
            content = f.read()
    else:
        content = sys.stdin.read()

    lines = content.split("\n")
    tokens = tokenize_lines(lines)

    violations = []
    violations.extend(scan_near_repeats(tokens, args.window, args.min_len))
    violations.extend(scan_phrase_repeats(lines))
    violations.extend(scan_sentence_openings(content))

    ignore_profile, ignore_path = load_ignore_profile(
        explicit_path=args.ignore_profile,
        input_path=args.path,
        auto_discover=not args.no_auto_ignore,
    )
    ignore_sets = build_ignore_sets(ignore_profile)
    if ignore_path and args.print_ignore_path:
        print(ignore_path, file=sys.stderr)
    if any(ignore_sets.values()):
        violations = [v for v in violations if not should_ignore_violation(v, ignore_sets)]

    print(json.dumps(violations, indent=2))


if __name__ == "__main__":
    main()
