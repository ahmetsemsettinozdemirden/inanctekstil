# İnanç Tekstil E-Commerce Design Spec

## Overview

İnanç Tekstil is a physical home textiles store in İskenderun, Hatay, Turkey. This spec covers setting up their first e-commerce channel to sell custom-made curtains online, starting with the local İskenderun/Hatay region.

**Business Model:** Customer selects a fabric, enters window dimensions (width × height), and the site calculates the price automatically. İnanç Tekstil produces the curtain and delivers it.

**Product Scope:** Custom-made curtains only. Under 20 fabric options.

## Architecture

### Infrastructure

- **Server:** Hetzner Cloud CX23 (2 vCPU, 4GB RAM, 40GB SSD) — ~€3.62/month
- **OS:** Ubuntu 24.04
- **Stack:** Docker + Docker Compose (WordPress, MariaDB, Redis, Traefik containers)
- **Reverse Proxy:** Traefik v3 (auto Let's Encrypt SSL, routing)
- **SSL:** Let's Encrypt (auto-configured via Traefik)
- **Domain:** inanctekstil.store (already purchased)

### Application Stack

- **CMS:** WordPress (latest)
- **E-Commerce:** WooCommerce (free)
- **Payments:** PayTR via official WooCommerce plugin
- **Caching:** Redis object cache (via Redis container + WP Redis plugin)
- **Theme:** Astra (free, lightweight, WooCommerce-optimized, RTL-ready)
- **Analytics:** Google Analytics 4 + Google Ads conversion tracking
- **Image Optimization:** ShortPixel or Smush (free tier) for fabric photos

### Email

| Service | Purpose | Cost |
|---|---|---|
| Google Workspace Starter | Business inbox — info@inanctekstil.store | ~$7/month |
| Resend | Transactional emails (order confirmations, shipping updates) | Free (3,000 emails/month) |

**DNS Records Required:**
- MX records → Google Workspace
- SPF, DKIM, DMARC → configured for both Google Workspace and Resend
- A record → Hetzner server IP

## Product Configuration & Pricing

### Product Structure

Each fabric is a WooCommerce product with:
- Fabric name
- Photo (high-quality swatch + room mockup if available)
- Description (material, texture, weight, care instructions)
- Price per m²

### Order Form (on product page)

Customer inputs:
1. **Width** (cm) — number input with min/max validation
2. **Height** (cm) — number input with min/max validation

### Dynamic Pricing Formula

```
Total = (width × height) / 10000 × fabric_price_per_m²
```

- Price updates live as the customer changes width/height — no page reload
- No paid plugin needed — a lightweight custom code approach

**Technical Implementation:**
- Code lives in a custom WordPress plugin (`inanc-curtain-calculator/`)
- Frontend: JavaScript calculates and displays price in real-time on product page
- Backend: PHP WooCommerce hook validates dimensions and sets correct price at add-to-cart and checkout (never trust client-side price)
- Dimensions stored as order item meta (visible in WooCommerce dashboard and order emails)
- Validation: min 30cm, max 600cm for both width and height
- The fabric's per-m² price is stored as a custom field on each WooCommerce product

### Order Flow

1. Customer browses fabric catalog
2. Selects a fabric → product page
3. Enters width and height → sees calculated price instantly
4. Adds to cart → checkout
5. Pays via PayTR
6. İnanç Tekstil receives order notification (email + WooCommerce dashboard)
7. Produces curtain → ships/delivers to customer

## PayTR Integration

- PayTR provides an official WooCommerce plugin
- Requires: merchant ID, merchant key, merchant salt (from PayTR dashboard)
- Supports credit/debit card + installment payments (taksit) — important for Turkish market
- Test mode available — use PayTR sandbox for development, switch to production before launch
- PayTR fees: typically 2.49% + 0.29 TL per transaction (verify with your subscription plan)
- PayTR approval process may take 3-5 business days — start this early

## Shipping & Delivery

- **Delivery zone:** İskenderun and Hatay region only (initially)
- **Method:** Flat-rate shipping or free delivery (since it's local, consider hand-delivery for nearby orders)
- **WooCommerce config:** Set up shipping zones — Hatay province = enabled, everywhere else = disabled with "Bölgenize teslimat henüz mevcut değil" message
- **Production time:** Communicate clearly on product page (e.g., "5-7 iş günü içinde teslim")

## Essential Pages

| Page | Content |
|---|---|
| Ana Sayfa | Fabric gallery, value proposition, CTA |
| Ürünler | Fabric catalog with filtering |
| Hakkımızda | Store story, physical location, trust signals |
| İletişim | Address, phone, WhatsApp link, Google Maps embed |
| Kargo ve Teslimat | Delivery areas (İskenderun/Hatay initially), timeline, costs |
| İade Politikası | Return/exchange policy for custom products |
| KVKK / Gizlilik Politikası | Turkish data protection compliance |
| Mesafeli Satış Sözleşmesi | Required by Turkish e-commerce law |

## Performance Marketing

### Account Structure (Critical for Scaling)

Proper account setup from day one prevents spending limits, bans, and access issues when scaling.

**Google:**
1. **Google Business Profile** — verify physical store address first (takes 1-2 weeks via postcard or phone)
2. **Google Ads Manager Account (MCC)** — create a Manager Account first, then create the ad account under it. Enables multi-account management and centralized billing later.
3. **GA4 Property** → linked to Google Ads for conversion data
4. **Google Merchant Center** — not needed now (no standard products), useful later if adding ready-made items

**Meta:**
1. **Meta Business Manager** (business.facebook.com) — create this FIRST, everything lives under it
2. **Facebook Business Page** (İnanç Tekstil) — created inside Business Manager
3. **Instagram Business Account** — linked to Facebook Page via Business Manager
4. **Meta Ad Account** — created inside Business Manager (not from personal Facebook)
5. **Meta Pixel** — installed on website, configured inside Business Manager
6. **Business verification** — submit Turkish business documents (vergi levhası, etc.) early. Unlocks higher spending limits and prevents restrictions.

**TikTok (for future use):**
1. **TikTok Business Center** → TikTok Ad Account → TikTok Pixel on website
2. Set up when ready to launch TikTok ads (Month 3+)

### Channel Strategy

**Phase 1 — Google Ads (Launch immediately)**
- **Why first:** High-intent traffic. People searching "iskenderun perde" already want curtains.
- **Campaign type:** Search campaigns (not Smart Campaigns — less control over optimization)
- **Keywords:**
  - Brand: "inanç tekstil"
  - Local + product: "iskenderun perde", "hatay perde", "iskenderun perde siparişi"
  - Intent: "online perde yaptırma", "perde fiyatları iskenderun", "özel dikim perde"
  - Fabric: "tül perde", "fon perde", "stor perde" (if applicable)
- **Negative keywords:** "perde yıkama", "perde tamiri", "ikinci el perde" (filter out irrelevant searches)
- **Geo-targeting:** İskenderun + 30km radius, expand to full Hatay after 2 weeks if results are good
- **Budget:** 2,500 TL/month
- **Bidding:** Start with Maximize Clicks, switch to Target CPA after 30+ conversions

**Phase 2 — Meta/Instagram Ads (Launch week 2)**
- **Why second:** Needs visual content ready + pixel data collecting from website visitors first
- **Campaign structure:**
  - **Campaign 1 — Awareness/Traffic:** Fabric photos and finished curtain reels to cold audience
  - **Campaign 2 — Retargeting:** Ads to people who visited the site but didn't order (needs pixel + 500+ visitors first)
- **Targeting:**
  - Location: İskenderun/Hatay
  - Age: 25-55, skew female
  - Interests: home decoration, interior design, ev dekorasyonu, perde
  - Lookalike audiences: available after 100+ website visitors (pixel-based)
- **Ad formats:** Reels (15-30 sec fabric showcase, before/after), Stories, Carousel (multiple fabrics)
- **Budget:** 1,500 TL/month
- **Bidding:** Start with Traffic objective, move to Conversions once pixel has 50+ events

**Phase 3 — TikTok Ads (Future — Month 3+)**
- **Potential:** TikTok's Turkish audience skews younger (18-35) but home decoration content performs well. #evdekorasyonu has billions of views.
- **Why wait:**
  - Needs consistent video content pipeline (2-3 videos/week minimum)
  - Smallest ad market of the three for local Turkish businesses
  - Google + Meta should be optimized first before splitting budget
- **When to launch:** Once you have 10+ video clips from Phase 1-2 content creation and Google/Meta are delivering positive ROI
- **Budget when ready:** 1,000-1,500 TL/month
- **Content style:** Raw, authentic — curtain-making process, fabric textures up close, transformation reveals. TikTok rewards real over polished.

### Content Plan

All shot on phone. Authentic, in-store content outperforms polished stock for local businesses.

| Content Type | Platform | Frequency |
|---|---|---|
| Fabric close-up photos | Meta Ads, Instagram organic | 2-3/week |
| Before/after room reveals | Instagram Reels, TikTok (later) | 1-2/week |
| Curtain-making process (short video) | Reels, TikTok (later) | 1/week |
| Customer testimonials (with permission) | All platforms | As available |
| Seasonal/promotional posts | Instagram, Facebook | As needed |

### Budget Allocation

**Month 1 (testing):**

| Channel | Budget | Purpose |
|---|---|---|
| Google Ads | 2,500 TL | High-intent search traffic |
| Meta Ads | 1,500 TL | Awareness + pixel data collection |
| **Total ad spend** | **4,000 TL** | |

**Month 2-3 (optimize):**
- Double down on whichever channel has lower cost-per-order
- Kill underperforming keywords/audiences
- Launch retargeting on Meta once pixel has data

**Month 4+ (scale or pivot):**
- If profitable: increase budget 50% on winning channel, consider adding TikTok
- If break-even: optimize further, test new audiences/creatives
- If losing money: pause ads, reassess offer/pricing/targeting

### Measuring Success

**Break-even formula:**
```
Max cost per acquisition = Average order value × Profit margin %
```
Example: If average order is 2,000 TL and margin is 30%, you can spend up to 600 TL per order on ads.

**Key metrics to track weekly:**

| Metric | Google Ads Target | Meta Ads Target |
|---|---|---|
| CPC (cost per click) | 2-5 TL | 1-3 TL |
| CTR (click-through rate) | >3% | >1% |
| Conversion rate | >1% | >1% |
| ROAS (return on ad spend) | >3x | >3x |

**Cost per order** must stay below your break-even number. Track per channel and kill what doesn't work.

### Free / Organic Channels

- **Google Business Profile** — verify physical store, free local SEO boost
- **Instagram organic** — regular posts showcasing work, builds trust for paid campaigns
- **WhatsApp Business** — link on website for customer questions, high conversion for Turkish market

## Security

- **Firewall:** Hetzner Cloud firewall — allow only ports 80, 443, 22 (SSH) + UFW on server
- **Docker:** Container network isolation, non-root containers where possible
- **WordPress:** Disable file editing via wp-config (`DISALLOW_FILE_EDIT`), disable XML-RPC, strong admin password, limit login attempts plugin
- **Updates:** Enable auto-updates for WordPress core and plugins, review monthly
- **PCI:** PayTR handles card data — the site never touches card numbers directly (iframe/redirect flow)

## Backup & Recovery

- **Hetzner Snapshots:** Weekly automated server snapshot (~€0.01/GB/month, negligible cost)
- **Database:** Daily automated MySQL dump via cron → stored on server + synced to external storage (Hetzner Object Storage or Google Drive)
- **Recovery:** Full server restore from snapshot takes minutes. Database restore from dump for granular recovery.

## Analytics & Tracking

- **Google Analytics 4:** Installed via Site Kit plugin (free, official Google plugin)
- **WooCommerce GA4 Integration:** Track add-to-cart, checkout, and purchase events
- **Google Ads Conversion Tracking:** Link GA4 to Google Ads for cost-per-order reporting
- **Meta Pixel:** Install on site for Meta Ads conversion tracking and retargeting
- **Cookie Consent:** Cookie banner required — use a free plugin (e.g., Complianz) for KVKK/GDPR compliance

## Launch Timeline

### Phase 1 — Infrastructure & Accounts (Day 1-3)
- Provision Hetzner CX23 server via Terraform
- Install Docker + Docker Compose on Ubuntu 24.04
- Deploy Traefik + WordPress + MariaDB + Redis stack
- Configure domain DNS (A record → server, MX → Google)
- Set up Google Workspace + email (info@inanctekstil.store)
- Configure Resend account + DNS records (SPF, DKIM, DMARC)
- SSL certificate via Let's Encrypt (auto via Traefik)
- Hetzner Cloud firewall + UFW setup, WordPress security hardening
- Submit PayTR production approval (can take 3-5 days — start early)
- Set up Hetzner automated snapshots
- Create Google Ads Manager Account (MCC) + ad account under it
- Create Meta Business Manager + Facebook Page + Instagram Business Account
- Submit Meta Business verification (vergi levhası)
- Start Google Business Profile verification (postcard/phone — takes 1-2 weeks)

### Phase 2 — Store Build (Day 4-12)
- Astra theme installation and customization
- WooCommerce configuration: TL currency, Turkish locale, tax settings
- PayTR plugin installation and test payment flow (sandbox mode)
- Build custom pricing calculator plugin (JS frontend + PHP backend)
- Photograph all fabrics, write product descriptions, set per-m² prices
- Create all essential pages (Hakkımızda, İletişim, KVKK, etc.)
- Cookie consent banner (Complianz plugin)
- Configure shipping zones (Hatay only)
- Configure Redis object cache + image optimization
- Configure Resend as WooCommerce SMTP (via WP Mail SMTP plugin)
- Set up daily database backup cron

### Phase 3 — Analytics & Marketing Setup (Day 13-16)
- GA4 setup via Site Kit plugin
- Meta Pixel installation
- Google Ads conversion tracking (linked to GA4)
- Verify Google Business Profile (if postcard arrived)
- Set up first Google Ads search campaign (high-intent keywords)
- Set up first Meta Ads traffic campaign
- Add WhatsApp Business chat widget to site
- Start content creation: photograph fabrics, shoot first before/after reel

### Phase 4 — Test & Launch (Day 17-21)
- Switch PayTR from sandbox to production (once approved)
- End-to-end order flow testing (browse → select → dimensions → pay → order received)
- Mobile testing (majority of Turkish traffic is mobile)
- Test PayTR payment flow with real transaction
- Test transactional emails (order confirmation arrives in inbox, not spam)
- Test backup restore procedure
- Soft launch — enable ads at low budget for 2 weeks, monitor results

## Success Metrics (after 4-6 weeks)

- **Cost per order** from each ad channel
- **Conversion rate** (visitors → completed orders)
- **Average order value**
- **Customer acquisition cost vs. profit margin**
- **Decision point:** scale up ads, adjust targeting, or pause

## Monthly Cost Summary

**Month 1-3 (Google + Meta only):**

| Item | Cost |
|---|---|
| Hetzner CX23 | ~€3.62 (~130 TL) |
| Google Workspace Starter | ~$7 (~250 TL) |
| Resend | Free |
| WooCommerce + plugins | Free |
| **Platform total** | **~400 TL/month** |
| Google Ads | 2,500 TL |
| Meta Ads | 1,500 TL |
| **Ad spend total** | **4,000 TL** |
| **Grand total** | **~4,400 TL/month** |

**Month 4+ (if adding TikTok):**

| Item | Cost |
|---|---|
| Platform total | ~400 TL/month |
| Google Ads | 2,500+ TL (scale if profitable) |
| Meta Ads | 1,500+ TL (scale if profitable) |
| TikTok Ads | 1,000-1,500 TL |
| **Grand total** | **~5,400-5,900+ TL/month** |

## Decisions & Trade-offs

- **WooCommerce over Shopify:** ~400 TL/month vs ~2,000+ TL/month. More setup work but owner is a software engineer.
- **Custom pricing code over paid plugin:** Free, full control, simple formula doesn't warrant a paid solution.
- **Resend over default PHP mail:** Ensures transactional emails reach inbox. Free tier is sufficient for launch.
- **Local geo-targeting:** Keeps ad spend focused and testable. Expand nationwide only after validating local demand.
- **Docker + Traefik over managed panels:** Full control, reproducible stack via Docker Compose, easy to maintain for a senior engineer.
