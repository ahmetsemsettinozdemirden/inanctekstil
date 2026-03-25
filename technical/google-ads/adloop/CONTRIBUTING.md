# Contributing to AdLoop

Thanks for your interest in contributing. AdLoop is early-stage and contributions are welcome.

## Getting Started

```bash
git clone https://github.com/kLOsk/adloop.git
cd adloop
uv sync --all-extras
```

This installs both runtime and dev dependencies (`pytest`, `pytest-asyncio`).

## Running Tests

```bash
uv run pytest
```

Tests in `tests/` cover config loading and safety guards. Integration tests against live Google APIs require credentials and are not run in CI.

## Making Changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `uv run pytest` to make sure nothing breaks
4. Open a pull request with a clear description of what changed and why

## What to Work On

Check [open issues](https://github.com/kLOsk/adloop/issues) for things that need help. If you want to work on something not listed, open an issue first to discuss the approach.

Areas where contributions are especially useful:

- **Bug reports** — if something doesn't work with your Google Ads/GA4 setup, file an issue with as much context as possible (error messages, account type, API access level)
- **Documentation** — setup guides, usage examples, troubleshooting tips
- **New read tools** — additional analytics or ads queries that would be useful
- **Testing** — expanding test coverage for safety guards and config edge cases

## Write Tool Changes

Changes to write tools (anything that mutates Google Ads accounts) require extra scrutiny. If you're modifying the safety layer, explain your reasoning in detail in the PR description.

## Code Style

- Python 3.11+ with type hints
- Use `from __future__ import annotations` in all modules
- Keep imports lazy in tool functions (import inside the function body) — this is intentional for MCP server startup speed

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
