#!/usr/bin/env python3
"""Rebuild the auto-index in PROMPTS.md from prompts/*.jsonl.

Preserves candidate **Did with it:** lines that are not tagged _(auto)_.
Fail-open: callers should ignore a non-zero exit.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

START = "<!-- auto:prompts-index:start -->"
END = "<!-- auto:prompts-index:end -->"
SOURCE_RE = re.compile(
    r"<!-- source: (prompts/\S+) -->\s*\n"
    r"## \[.*?\] tool: .*?\n"
    r"\*\*Asked:\*\* (?P<asked>.*?)\n"
    r"\*\*Got:\*\* (?P<got>.*?)\n"
    r"\*\*Did with it:\*\* (?P<did>.*?)(?=\n<!-- source: |\n<!-- auto:prompts-index:end -->|\Z)",
    re.DOTALL,
)


def flatten_text(node) -> str:
    if node is None:
        return ""
    if isinstance(node, str):
        return node
    if isinstance(node, list):
        return "\n".join(flatten_text(x) for x in node)
    if isinstance(node, dict):
        if node.get("type") == "text":
            return str(node.get("text") or "")
        if "text" in node:
            return str(node["text"])
        if "content" in node:
            return flatten_text(node["content"])
        if "message" in node:
            return flatten_text(node["message"])
    return ""


def strip_user_payload(text: str) -> str:
    text = re.sub(r"<timestamp>.*?</timestamp>\s*", "", text, flags=re.DOTALL)
    text = re.sub(r"<cursor_commands>.*?</cursor_commands>\s*", "", text, flags=re.DOTALL)
    m = re.search(r"<user_query>\s*(.*?)\s*</user_query>", text, re.DOTALL)
    if m:
        return m.group(1).strip()
    return text.strip()


def one_line(text: str, limit: int) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def parse_session(path: Path) -> dict | None:
    users: list[str] = []
    assistants: list[str] = []
    timestamp = ""
    writes = 0
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        if obj.get("type") == "turn_ended":
            continue
        role = obj.get("role") or obj.get("type") or ""
        body = flatten_text(obj.get("message") or obj)
        if role in ("user", "human"):
            ts = re.search(r"<timestamp>(.*?)</timestamp>", body)
            if ts and not timestamp:
                timestamp = ts.group(1).strip()
            q = strip_user_payload(body)
            if q:
                users.append(q)
        elif role in ("assistant", "ai"):
            if body.strip():
                assistants.append(body.strip())
            inner = obj.get("message") or obj
            content = inner.get("content") if isinstance(inner, dict) else None
            if isinstance(content, list):
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "tool_use":
                        name = part.get("name") or ""
                        if name in ("Write", "StrReplace", "Delete"):
                            writes += 1
    if not users and not assistants:
        return None
    asked = users[0] if users else "(no user text in transcript)"
    last_ask = users[-1] if users else asked
    got = assistants[-1] if assistants else "(no assistant text yet)"
    did = (
        f"_(auto)_ {len(users)} user turn(s), {writes} file-edit tool call(s). "
        "Replace this line with: took it / rejected it because … / redirected it by …"
    )
    if last_ask != asked:
        asked = f"{asked}\n_Latest ask:_ {last_ask}"
    return {
        "file": f"prompts/{path.name}",
        "time": timestamp or path.stat().st_mtime,
        "asked": asked,
        "got": got,
        "did": did,
        "mtime": path.stat().st_mtime,
    }


def load_manual_did(existing: str) -> dict[str, str]:
    kept = {}
    for m in SOURCE_RE.finditer(existing):
        did = m.group("did").strip()
        if did and not did.startswith("_(auto)_"):
            kept[m.group(1)] = did
    return kept


def render_entry(item: dict, did: str) -> str:
    asked = one_line(item["asked"], 500).replace("\n", " ")
    latest = ""
    if "_Latest ask:_ " in item["asked"]:
        _, latest_raw = item["asked"].split("_Latest ask:_ ", 1)
        latest = f"\n_Latest ask:_ {one_line(latest_raw, 280)}"
        asked = one_line(item["asked"].split("\n_Latest ask:_")[0], 400)
    got = one_line(item["got"], 280)
    time = item["time"] if isinstance(item["time"], str) else ""
    heading = f"## [{time or 'session'}] tool: cursor"
    return (
        f"<!-- source: {item['file']} -->\n"
        f"{heading}\n"
        f"**Asked:** {asked}{latest}\n"
        f"**Got:** {got}\n"
        f"**Did with it:** {did}\n"
    )


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    prompts_md = root / "PROMPTS.md"
    prompts_dir = root / "prompts"
    if not prompts_md.is_file():
        return 0

    text = prompts_md.read_text(encoding="utf-8")
    manual = load_manual_did(text)

    items = []
    for path in sorted(prompts_dir.glob("*.jsonl")):
        parsed = parse_session(path)
        if parsed:
            items.append(parsed)
    items.sort(key=lambda x: x["mtime"])

    blocks = []
    for item in items:
        did = manual.get(item["file"], item["did"])
        blocks.append(render_entry(item, did))
    index = "\n".join(blocks).rstrip() + ("\n" if blocks else "")

    if START in text and END in text:
        pre, rest = text.split(START, 1)
        _, post = rest.split(END, 1)
        new = pre + START + "\n" + index + END + post
    else:
        new = text.rstrip() + "\n\n" + START + "\n" + index + END + "\n"

    if new != text:
        prompts_md.write_text(new, encoding="utf-8")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        sys.exit(0)
