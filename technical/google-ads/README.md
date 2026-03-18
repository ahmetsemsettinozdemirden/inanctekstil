# Google Ads API + Claude Code MCP Setup

## Account Details

| | |
|---|---|
| MCC (Manager) Account ID | `129-569-2511` |
| MCC Account Name | İnanç Tekstil Manager Account |
| Contact Email | info@inanctekstil.store |
| Developer Token | `<GOOGLE_ADS_DEVELOPER_TOKEN>` |
| Access Level | **Test Hesabı** → Basic Access başvurusu gönderildi (17 Mar 2026, onay bekleniyor) |
| Google Cloud Project | `inanc-tekstil-ads` |
| OAuth Client ID | `<GOOGLE_ADS_CLIENT_ID>` |

## File Locations

| File | Path | Purpose |
|------|------|---------|
| `google-ads.yaml` | `~/google-ads.yaml` | API credentials (stays in home dir) |
| `client_secret_*.json` | `technical/google-ads/` | OAuth app credentials |
| `get_refresh_token.py` | `technical/google-ads/` | Script to regenerate refresh token |
| `create_design_doc.py` | `technical/google-ads/` | Script that generated the Basic Access application PDF |
| `tool-design-document.pdf` | `technical/google-ads/` | Design doc submitted with Basic Access application |
| `launchd plist` | `~/Library/LaunchAgents/com.inanctekstil.google-ads-mcp.plist` | Auto-start service |

## ~/google-ads.yaml Structure

```yaml
developer_token: <GOOGLE_ADS_DEVELOPER_TOKEN>
client_id: <GOOGLE_ADS_CLIENT_ID>
client_secret: <GOOGLE_ADS_CLIENT_SECRET>
refresh_token: <GOOGLE_ADS_REFRESH_TOKEN>
login_customer_id: 1295692511
use_proto_plus: True
```

## MCP Server

- **Source:** https://github.com/google-marketing-solutions/google_ads_mcp
- **Transport:** HTTP on `http://127.0.0.1:8000/mcp`
- **Runtime:** `uv tool run`
- **Claude Code config:** `~/.claude.json` (local scope, project: inanc-tekstil)

The MCP server is registered in Claude Code as:
```
google-ads: http://127.0.0.1:8000/mcp (HTTP)
```

## Auto-Start (launchd)

The server starts automatically on login via launchd. To manage it:

```bash
# Check if running
launchctl list | grep google-ads-mcp

# Start manually
launchctl start com.inanctekstil.google-ads-mcp

# Stop
launchctl stop com.inanctekstil.google-ads-mcp

# View logs
cat /tmp/google-ads-mcp.log

# If plist changes, reload it
launchctl unload ~/Library/LaunchAgents/com.inanctekstil.google-ads-mcp.plist
launchctl load ~/Library/LaunchAgents/com.inanctekstil.google-ads-mcp.plist
```

## Starting the Server Manually (if not auto-started)

```bash
GOOGLE_ADS_CREDENTIALS=~/google-ads.yaml uv tool run \
  --from "git+https://github.com/google-marketing-solutions/google_ads_mcp.git" \
  run-mcp-server > /tmp/google-ads-mcp.log 2>&1 &
```

## Regenerating the Refresh Token

If the refresh token expires, run:

```bash
cd technical/google-ads
python3 get_refresh_token.py
```

A browser window will open for Google OAuth. After approval, update `~/google-ads.yaml` with the new `refresh_token`.

## Access Level Status

### Basic Access Application

- **Submitted:** 17 March 2026
- **Form:** Google Ads API Token Application (support.google.com/adspolicy/contact/new_token_application)
- **Confirmation:** "The Google Ads API Compliance team has received your ticket."
- **Expected response:** 3 business days to `info@inanctekstil.store`
- **Design doc submitted:** `tool-design-document.pdf` (regenerate with `create_design_doc.py` if needed)

Until approved, the MCP server connects fine but GAQL queries against real accounts return:
```
DEVELOPER_TOKEN_NOT_APPROVED: The developer token is only approved for use with test accounts.
```

Once approved, update the README access level and test with:
```bash
# Should return campaign list after approval
curl -s -X POST http://127.0.0.1:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: <SESSION_ID>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_accessible_accounts","arguments":{}}}'
```

## Verified Working (Test Mode)

Tested 17 March 2026:

| Test | Result |
|------|--------|
| MCP server starts | ✅ |
| Claude Code connection | ✅ Connected at `http://127.0.0.1:8000/mcp` |
| `list_accessible_accounts` | ✅ Returns `9204308737`, `5255869168`, `1295692511` |
| GAQL query on real account | ⚠️ Blocked until Basic Access approved |
