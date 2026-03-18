# Meta Ads API + Claude Code MCP Setup

Goal: Manage Instagram Reels ads for İnanç Tekstil via Claude Code.

## Status

- [x] Meta Developer app created (`inanc-tekstil-ads`, App ID: `1475535244215512`)
- [x] Marketing API use case enabled
- [x] OAuth access token generated via armavita login flow
- [x] MCP server connected to Claude Code (`meta-ads: ✓ Connected`)
- [ ] Meta Business account verified (optional — needed for advanced permissions)

---

## Account Details

| | |
|---|---|
| App Name | `inanc-tekstil-ads` |
| App ID | `1475535244215512` |
| App Secret | stored in `~/.claude.json` env vars |
| Business Portfolio | İnanç Tekstil (unverified) |
| Contact Email | info@inanctekstil.store |
| Meta Developer Console | https://developers.facebook.com/apps/1475535244215512 |

---

## MCP Server

- **Package:** armavita-meta-ads-mcp (github.com/EfrainTorres/armavita-meta-ads-mcp)
- **Transport:** stdio (local — data never leaves your machine)
- **Runtime:** `uv tool install` from GitHub
- **Meta API version:** v25.0
- **Claude Code config:** `~/.claude.json` (local scope, project: inanc-tekstil)

### Registered in Claude Code as:
```
meta-ads: armavita-meta-ads-mcp — ✓ Connected
```

---

## Credentials

Token is cached locally by armavita after OAuth login. Env vars in `~/.claude.json`:

```
META_APP_ID=1475535244215512
META_APP_SECRET=<stored in ~/.claude.json>
```

---

## Re-authenticating (if token expires)

```bash
META_APP_ID=1475535244215512 META_APP_SECRET=<secret> armavita-meta-ads-mcp --login
```

A browser window opens → log in with Facebook → token is cached automatically.

---

## Available Tools

Full CRUD for campaigns, ad sets, ads and creatives:

| Category | Operations |
|----------|-----------|
| Ad Accounts | list, get details |
| Campaigns | list, get, **create**, **update** |
| Ad Sets | list, get, batch get, **create**, **update** |
| Ads | list, get, **create**, **update** (pause/enable) |
| Creatives | list, get, **create**, **update**, upload image |
| Insights | account / campaign / ad set / ad level |
| Targeting | search interests, behaviors, demographics, geo |
| Misc | clone campaign, create report, Ads Library search |

---

## Instagram Reels Placement

When creating ad sets for Reels, use:
```
placement: INSTAGRAM_REELS
objective: OUTCOME_AWARENESS | OUTCOME_TRAFFIC | OUTCOME_SALES
format: video (9:16, 15–90 seconds)
```

Example Claude Code prompt:
> "Show all active Instagram campaigns and their performance this week"
> "Create a new Reels campaign targeting women 25-45 in Turkey interested in home decor, budget 200 TL/day"
> "Pause all ad sets with CPC above 5 TL"
