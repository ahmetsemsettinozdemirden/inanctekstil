# Instagram Actor ID — Fix Guide

**Last updated:** 2026-03-19

---

## What This Is

When creating Meta ad creatives, the `instagram_actor_id` field tells the API which Instagram account the ad should appear to come from. Without it, ads serve from the Facebook Page identity instead of the Instagram handle — which results in slightly higher CPMs on Instagram placements and no Instagram username shown on the ad.

**Correct actor ID:** `17841417335745587` (`@inanc_tekstil`)

---

## Current Status

The Instagram account `@inanc_tekstil` **is correctly connected** in Business Manager:
- Connected to: Facebook Page `İnanç Tekstil` (`1064624423394553`)
- Connected to: Ad Account `İnanç Tekstil` (`act_1460297365542314`)

However, the MCP access token was generated without `instagram_basic` scope. The Graph API rejects `instagram_actor_id` at the creative level even when Business Manager shows the connection. All current v3 creatives were created without it as a workaround.

---

## Fix: Regenerate the System User Token

**Time required:** ~5 minutes
**Where:** Business Manager → Settings → Users → System Users

### Steps

1. Go to **Business Manager → Settings → Users → System Users**
2. Select the system user used for the MCP integration
3. Click **Generate New Token**
4. Select your app
5. Ensure these permission scopes are checked:
   - `ads_management`
   - `ads_read`
   - `business_management`
   - `instagram_basic`
   - `pages_read_engagement`
6. Copy the new token
7. Update `META_ACCESS_TOKEN` in the MCP config (Claude Code settings or `.env`)
8. Run `/mcp` in Claude Code to reconnect

### Verify the fix

After updating the token, run `get_instagram_actor_id` with `facebook_page_id: 1064624423394553`. It should return `17841417335745587`.

---

## After the Fix: Rebuild Creatives with Instagram Identity

Once the token is updated, delete and recreate the 3 current ads with `instagram_actor_id: 17841417335745587` added to each creative. Meta does not allow editing creatives after creation — new creatives are required.

Current ads to rebuild (all PAUSED):

| Ad | ID | Creative |
|----|-----|---------|
| Blackout — Sonil v3 | `6934742309656` | `1296288845682717` |
| Saten Perde v3 | `6934742342856` | `1288234709868688` |
| Reels — MVP v3 | `6934742353056` | `25906779639024635` |

---

## Why This Matters

Ads served from the Instagram handle (`@inanc_tekstil`) vs. the Facebook Page:
- Show the Instagram username and profile photo on the ad unit
- Tend to have lower CPMs on Instagram placements
- Build Instagram follower count as a side effect of ad exposure
- Are required for **Partnership Ads** (whitelisting) when you have creator relationships
