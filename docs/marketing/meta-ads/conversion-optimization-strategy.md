# Meta Ads Conversion Optimization Strategy

**Account:** İnanç Tekstil — `act_1460297365542314`
**Last updated:** 2026-03-19

---

## Where We Are Now

The pixel has 1 confirmed Purchase event. Meta's conversion algorithm needs **~50 purchases per week per ad set** to exit the learning phase and deliver efficiently. We're far from that threshold.

Running `OFFSITE_CONVERSIONS → Purchase` today would permanently strand the ad set in "learning limited" — poor delivery, high costs, wasted budget.

---

## The Signal Accumulation Ladder

Move to the next optimization goal only when the current one is generating enough weekly volume.

| Phase | Weekly volume trigger | Optimization goal | Campaign objective |
|-------|-----------------------|-------------------|--------------------|
| **Now** | 0–10 purchases/week | `LANDING_PAGE_VIEWS` | `OUTCOME_SALES` |
| **Next** | 10–50 purchases/week | `OFFSITE_CONVERSIONS` → `ADD_TO_CART` | `OUTCOME_SALES` |
| **Scale** | 50+ purchases/week | `OFFSITE_CONVERSIONS` → `PURCHASE` | `OUTCOME_SALES` |
| **Optimize value** | 100+ purchases/week | `VALUE` (purchase value optimization) | `OUTCOME_SALES` |

Check progress weekly in Events Manager → pixel `1446692113800169` → AddToCart and Purchase event counts.

---

## Does Ad Creative Affect Signal Gathering?

Yes — significantly. **The creative is one of the fastest levers you have for accelerating pixel learning.**

### Volume: more signal per ₺

A higher-performing creative generates more impressions at lower CPM, more clicks per impression, and more pixel events per ₺ spent. Two campaigns with identical budgets and targeting can accumulate pixel data at very different speeds depending on creative quality.

Reels video in particular tends to have **lower CPM than Feed static images** in Turkey — meaning more impressions, more clicks, and faster signal accumulation for the same daily budget.

### Quality: better signal = better lookalikes later

Different creatives attract different visitors. A video showing a room transformation filters for people with genuine purchase intent — they self-select by watching. A generic static image attracts more passive browsers. The pixel events from a well-targeted video creative are higher quality, producing better lookalike audiences down the line.

### The creative IS the targeting

In a small geographic audience (İskenderun +30km, ~200k people), interest targeting only gets you so far. The creative does the final filtering. A 20-second room reveal video will self-select buyers more effectively than any interest combination. This matters especially in the early phases when the algorithm has no purchase history to work with.

### Format comparison for our account

| Format | CPM (est. TR) | Engagement | Signal speed | Verdict |
|--------|--------------|------------|--------------|---------|
| Instagram Reels video | Low | High (video completion) | Fast | ✅ Best for awareness + signal |
| Instagram/Facebook Feed static | Medium | Medium | Medium | ✅ Good for retargeting |
| Facebook Story static | Low | Low | Slow | ⚠️ Low engagement in TR |
| Carousel | Medium | High (swipe) | Medium | ✅ Good for multi-product |

**Current setup is correct:** Reels video for awareness/top-of-funnel signal gathering, static images for the Sales campaign driving landing page views.

### What this means practically

- Invest in creative quality early — it directly affects how fast you move up the optimization ladder
- Test at least 2–3 creative variants per ad set once budget allows (₺300+/day)
- Video showing actual product in a real room (room reveal, before/after, fabric close-up) will outperform lifestyle stock imagery

---

## WhatsApp Consideration

Turkey is a WhatsApp-first market. Many customers — especially for custom/made-to-measure products like curtains — want to ask questions before committing to a purchase: sizing, fabric options, installation, delivery time.

A "Click to WhatsApp" campaign can work alongside the landing page campaign:

| | Landing page campaign | WhatsApp campaign |
|---|---|---|
| **Objective** | `OUTCOME_SALES` | `OUTCOME_ENGAGEMENT` or `OUTCOME_LEADS` |
| **Optimization** | `LANDING_PAGE_VIEWS` | `CONVERSATIONS` |
| **Audience** | Cold (interests) | Warm (website visitors, past engagers) |
| **Creative** | Product showcase | Direct question hook ("Perde ölçülerinizi sorun") |
| **When to add** | Running now | After main campaign has 2–4 weeks of data |

The WhatsApp route has a lower purchase barrier (customer just asks a question), which can generate faster conversion signal — especially for the ₺750/m Blackout product where customers naturally want reassurance before ordering.

---

## Practical Roadmap

```
Week 1–4   Run current setup (LANDING_PAGE_VIEWS, ₺150/day Sales + ₺45/day Awareness)
           → Target: 10+ AddToCart/week, improve purchase count
           → Action: monitor pixel events weekly

Week 4–8   If AddToCart ≥ 10/week:
           → Add a second Sales ad set optimized for ADD_TO_CART
           → Keep LANDING_PAGE_VIEWS ad set running in parallel

Month 3+   If Purchase ≥ 50/week:
           → Switch primary Sales ad set to PURCHASE optimization
           → Add WhatsApp campaign targeting website visitors

Ongoing    Refresh creatives every 4–6 weeks (ad fatigue in small audience)
           → New room reveals, seasonal content, customer testimonials
```

---

## Key Numbers to Watch

Check weekly in Events Manager and Ads Manager:

- **AddToCart** events/week (target: 10 → 50)
- **Purchase** events/week (target: 1 → 10 → 50)
- **Landing page view rate** (clicks that actually load page — should be >60%)
- **Frequency** on Awareness campaign (max ~3 before refreshing creative)
- **CPM** — rising CPM = audience saturation, time to expand radius or refresh creative
