#!/usr/bin/env python3
import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


FOLDER_MAP = {
    "inbox": "YaMac - Inbox",
    "projects": "YaMac - Projects",
    "tasks": "YaMac - Tasks",
    "ideas": "YaMac - Ideas",
    "knowledge": "YaMac - Knowledge",
    "journal": "YaMac - Journal",
    "finance": "YaMac - Finance",
    "health": "YaMac - Health",
    "personal": "YaMac - Personal",
}


def normalize_title(s: str) -> str:
    s = s.strip()
    s = re.sub(r"^#+\s*", "", s)
    s = s.lower()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"[^0-9a-z\u0600-\u06ff ]+", "", s)
    return s.strip()


def load_classification(path: Path):
    title_to_cats = defaultdict(list)
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if not line.strip():
            continue
        rec = json.loads(line)
        title = normalize_title(rec.get("title", ""))
        cat = rec.get("category", "inbox")
        if title:
            title_to_cats[title].append(cat)
    return title_to_cats


def choose_category(cats):
    c = Counter(cats)
    if not c:
        return None, "no-match"
    if len(c) == 1:
        return c.most_common(1)[0][0], "exact"
    top = c.most_common(2)
    top_cat, top_n = top[0]
    second_n = top[1][1]
    total = sum(c.values())
    if top_n >= 2 * second_n or (top_n / total) >= 0.6:
        return top_cat, "majority"
    return None, "ambiguous"


def parse_live_notes(path: Path):
    notes = []
    for raw in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        parts = raw.split("\t")
        if len(parts) < 4:
            continue
        note_id, name, folder, account = parts[0], parts[1], parts[2], parts[3]
        notes.append(
            {
                "id": note_id,
                "name": name,
                "folder": folder,
                "account": account,
                "norm_name": normalize_title(name),
            }
        )
    return notes


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--classification", required=True)
    p.add_argument("--live-tsv", required=True)
    p.add_argument("--plan-json", required=True)
    p.add_argument("--actions-tsv", required=True)
    args = p.parse_args()

    title_to_cats = load_classification(Path(args.classification))
    live_notes = parse_live_notes(Path(args.live_tsv))

    actions = []
    skipped = []
    reason_counts = Counter()

    for n in live_notes:
        cats = title_to_cats.get(n["norm_name"], [])
        chosen, mode = choose_category(cats)
        if not chosen:
            reason_counts[mode] += 1
            skipped.append({"note": n, "reason": mode})
            continue
        target_folder = FOLDER_MAP.get(chosen, "YaMac - Inbox")
        if n["folder"] == target_folder:
            reason_counts["already-in-target"] += 1
            skipped.append({"note": n, "reason": "already-in-target"})
            continue
        actions.append(
            {
                "id": n["id"],
                "name": n["name"],
                "from_folder": n["folder"],
                "to_folder": target_folder,
                "account": n["account"],
                "category": chosen,
                "match_mode": mode,
            }
        )

    payload = {
        "summary": {
            "live_notes": len(live_notes),
            "planned_moves": len(actions),
            "skipped": len(skipped),
            "skip_reasons": dict(reason_counts),
        },
        "actions": actions,
        "skipped": skipped,
    }

    Path(args.plan_json).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    lines = []
    for a in actions:
        lines.append(
            "\t".join([a["id"], a["to_folder"], a["account"], a["name"], a["from_folder"]])
        )
    Path(args.actions_tsv).write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
    print(args.plan_json)


if __name__ == "__main__":
    main()
