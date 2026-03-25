#!/usr/bin/env python3
"""Sync orchestration rules from Cursor format to Claude Code format.

Reads .cursor/rules/adloop.mdc (canonical source), strips Cursor-specific
frontmatter, prepends Claude Code frontmatter, and writes to
.claude/rules/adloop.md.

Run this after editing adloop.mdc to keep both files in sync.
"""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CURSOR_RULES = REPO_ROOT / ".cursor" / "rules" / "adloop.mdc"
CLAUDE_RULES = REPO_ROOT / ".claude" / "rules" / "adloop.md"

CLAUDE_FRONTMATTER = """\
---
description: AdLoop MCP orchestration — Google Ads + GA4 + codebase intelligence
---
"""


def extract_body(content: str) -> str:
    """Strip YAML frontmatter (--- ... ---) and return the body."""
    if not content.startswith("---"):
        return content
    end = content.index("---", 3)
    return content[end + 3:].lstrip("\n")


def main() -> None:
    if not CURSOR_RULES.exists():
        raise FileNotFoundError(f"Canonical rules not found: {CURSOR_RULES}")

    body = extract_body(CURSOR_RULES.read_text())

    CLAUDE_RULES.parent.mkdir(parents=True, exist_ok=True)
    CLAUDE_RULES.write_text(CLAUDE_FRONTMATTER + "\n" + body)

    print(f"Synced: {CURSOR_RULES.relative_to(REPO_ROOT)}")
    print(f"     -> {CLAUDE_RULES.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
