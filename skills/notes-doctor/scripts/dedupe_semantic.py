#!/usr/bin/env python3
import argparse
import json
import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path


def norm(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"\s+", " ", s)
    return re.sub(r"[^0-9a-z\u0600-\u06ff ]+", "", s)


def token_set(s: str):
    toks = re.findall(r"[0-9a-z\u0600-\u06ff]{3,}", norm(s))
    return set(toks[:500])


@dataclass
class Note:
    path: str
    title: str
    title_n: str
    body_tokens: set


class DSU:
    def __init__(self, n):
        self.p = list(range(n))

    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]
            x = self.p[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.p[rb] = ra


def jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    if inter == 0:
        return 0.0
    return inter / len(a | b)


def sim(a: Note, b: Note) -> float:
    title_ratio = SequenceMatcher(None, a.title_n, b.title_n).ratio()
    body_ratio = jaccard(a.body_tokens, b.body_tokens)
    return 0.55 * title_ratio + 0.45 * body_ratio


def load_notes(root: Path):
    notes = []
    for f in sorted(root.rglob("*")):
        if f.suffix.lower() not in {".md", ".txt", ".rtf"}:
            continue
        try:
            txt = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        lines = txt.splitlines()
        title = lines[0].strip("# ").strip() if lines else f.stem
        body = "\n".join(lines[1:]) if len(lines) > 1 else txt
        notes.append(
            Note(
                path=str(f),
                title=title,
                title_n=norm(title),
                body_tokens=token_set(body),
            )
        )
    return notes


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--threshold", type=float, default=0.72)
    args = p.parse_args()

    notes = load_notes(Path(args.root))
    n = len(notes)
    dsu = DSU(n)
    pair_scores = {}

    for i in range(n):
        for j in range(i + 1, n):
            score = sim(notes[i], notes[j])
            if score >= args.threshold:
                dsu.union(i, j)
                pair_scores[(i, j)] = round(score, 4)

    groups = {}
    for i in range(n):
        r = dsu.find(i)
        groups.setdefault(r, []).append(i)

    out_groups = []
    for idxs in groups.values():
        if len(idxs) < 2:
            continue
        idxs = sorted(idxs)
        pairs = []
        for a in range(len(idxs)):
            for b in range(a + 1, len(idxs)):
                i, j = idxs[a], idxs[b]
                s = pair_scores.get((min(i, j), max(i, j)))
                if s is not None:
                    pairs.append(
                        {
                            "a": notes[i].path,
                            "b": notes[j].path,
                            "score": s,
                        }
                    )
        out_groups.append(
            {
                "size": len(idxs),
                "notes": [notes[i].path for i in idxs],
                "pairs": sorted(pairs, key=lambda x: x["score"], reverse=True)[:20],
            }
        )

    payload = {
        "root": str(args.root),
        "threshold": args.threshold,
        "note_count": n,
        "semantic_duplicate_group_count": len(out_groups),
        "groups": sorted(out_groups, key=lambda g: g["size"], reverse=True),
    }

    Path(args.out).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(args.out)


if __name__ == "__main__":
    main()
