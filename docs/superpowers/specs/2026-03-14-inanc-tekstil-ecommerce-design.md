# İnanç Tekstil E-Commerce Design Spec

## Overview

İnanç Tekstil is a 30-year-old home textiles store in İskenderun, Hatay, Turkey, owned by Hatice & Hüseyin Özdemirden. Built on trust, expert craftsmanship, and word-of-mouth marketing, İnanç Tekstil specializes in custom-made curtains. This spec covers setting up their first e-commerce channel to sell custom-made curtains online, starting with the local İskenderun/Hatay region.

**Business Model:** Customer selects fabric from kartela (fabric sample catalog), enters window measurements, and the site calculates the price automatically based on curtain type (Tül, Saten, Fon). İnanç Tekstil produces the curtain and delivers/installs it.

**Product Scope:** Custom-made curtains in three categories: Tül (sheer), Saten (lining), Fon (decorative side panels). Also ready-made fons available.

**Competitive Advantage:** Unlike TAÇ (fixed-size ready-made curtains 1,300-3,300 TL) or Trendyol marketplace sellers (fixed sizes only), İnanç Tekstil offers custom measurements, expert consultation, local delivery + installation, and 30 years of trust.

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

## Product Types & Business Model

### 3 Main Curtain Categories

**1. Tül (Sheer/Tulle Curtain)**
- **Purpose:** Daytime privacy, lets light through
- **Standard window size:** 300×260 cm
- **Pleating:** Can be pleated at 1:2, 1:2.5, or 1:3 ratio
  - Pleat ratio = fabric length needed ÷ window width
  - Example: 300cm window × 1:3 pleat = 900cm (9 meters) fabric needed
- **Fabric pricing:** 60-350 TL/meter (wholesale), 150-700 TL/meter (retail)
- **Sewing cost:** 25 TL/meter

**2. Saten (Satin Lining)**
- **Purpose:** Nighttime privacy, blocks view from outside
- **Standard window size:** 325×260 cm
- **Construction:** Cut flat (no pleats)
- **Colors:** Cream and white
- **Fixed price:** 150 TL
- **Alternative:** Blackout fabric can replace saten

**3. Fon (Decorative Side Panels)**
- **Purpose:** Decorative panels that hang on the sides of windows
- **Sizes:** Typically 100×260 cm or 80×260 cm, but accepts 50-150 cm panel width
- **Always sold in pairs** (double panel)
- **Pleating:** Customer selects ratio (1:2, 1:2.5, or 1:3). Defaults:
  - 100×260 → 1:3 pleat ratio (default)
  - 80×260 → 1:2.5 pleat ratio (default)
- **Fabric pricing:** 150-750 TL/meter (wholesale), 400-1500 TL/meter (retail)
- **Sewing cost:** 500 TL per pair (fixed)
- **Sub-type:** Blackout fon (typically 300×260 cm, accepts variable widths via fon calculation, fabric 160-400 TL/meter)
- **Also available:** Ready-made fons at lower prices

### Kartela System (Fabric Catalog)

- **Kartela** = fabric sample catalog containing fabric codes and swatches
- Contains latest seasonal fabrics and new arrivals
- Each fabric has a unique kartela code
- Customers browse kartela online to select fabrics
- **"Havuz" (pool) system:** Discontinued/leftover fabrics sold at very low prices, NOT listed in kartela (in-store or special section)

### Measurement & Order Process

1. **Measurement:** Customer takes their own measurements OR İnanç Tekstil measures if customer commits to buying
2. **Fabric selection:** Customer selects fabric from kartela (or havuz for budget options)
3. **Cart:** Items added to cart with measurements and selected curtain type
4. **Payment:** Upfront payment, supports installments (taksit), bank transfer (IBAN) also accepted
5. **Fabric sourcing:** Fabric ordered from supplier OR cut from in-house stock rolls
6. **Manufacturing:** Sewing/production done in-house by İnanç Tekstil
7. **Delivery:** Home delivery or pickup from store
8. **Installation:** Curtains hung on customer's windows

### Customer Support (CRITICAL)

- **Measurement changes:** Customers may need to change measurements after ordering
- **Alterations:** May be needed after hanging curtains
- **Return policy:** Similar to TAÇ (custom products = limited returns)
- **Strong CRM needed:** Long-term relationship management is essential

## Product Configuration & Pricing

### Product Structure

Each fabric is a WooCommerce product with:
- Fabric name and kartela code
- Photo (high-quality swatch + room mockup if available)
- Description (material, texture, weight, care instructions)
- Price per meter (varies by fabric)
- Available for: Tül, Fon, or both (some fabrics only work for certain types)

### Order Form (on product page)

Customer selects:
1. **Curtain type:** Tül, Saten, or Fon
2. **Window dimensions:**
   - Width (cm) — number input with validation
   - Height (cm) — number input with validation
3. **Pleat ratio** (if Tül or Fon):
   - Tül: 1:2, 1:2.5, or 1:3
   - Fon: Auto-determined (1:3 for 100cm, 1:2.5 for 80cm)
4. **Pair quantity** (if Fon): Single pair or multiple pairs

### Dynamic Pricing Formulas

**For Tül:**
```
fabric_meters = (window_width_cm / 100) × pleat_ratio
sewing_meters = fabric_meters
total = (fabric_meters × fabric_price_per_meter) + (sewing_meters × 25)
```

Example: 300cm window, 1:3 pleat, 150 TL/m fabric
- Fabric needed: (300/100) × 3 = 9 meters
- Fabric cost: 9 × 150 = 1,350 TL
- Sewing cost: 9 × 25 = 225 TL
- **Total: 1,575 TL**

**For Saten:**
```
total = 150 TL (fixed price)
```

**For Fon (per pair):**
```
fabric_meters_per_panel = (panel_width_cm / 100) × pleat_ratio
fabric_meters_total = fabric_meters_per_panel × 2 (pair)
total = (fabric_meters_total × fabric_price_per_meter) + 500
```

Example: 100cm panels, 1:3 pleat, 400 TL/m fabric
- Fabric per panel: (100/100) × 3 = 3 meters
- Fabric total: 3 × 2 = 6 meters
- Fabric cost: 6 × 400 = 2,400 TL
- Sewing cost: 500 TL (fixed per pair)
- **Total: 2,900 TL**

**Technical Implementation:**
- Code lives in a custom WordPress plugin (`inanc-curtain-calculator/`)
- Frontend: JavaScript calculates and displays price in real-time on product page based on curtain type selection
- Backend: PHP WooCommerce hooks validate dimensions and calculate correct price at add-to-cart and checkout (never trust client-side price)
- Dimensions, curtain type, pleat ratio stored as order item meta (visible in WooCommerce dashboard and order emails)
- Validation rules:
  - Tül: min 100cm, max 600cm (width), min 100cm, max 300cm (height)
  - Saten: fixed size (no input needed) or custom input if needed
  - Fon: panel width min 50cm, max 150cm (typical: 80cm or 100cm), height min 200cm, max 300cm
- The fabric's per-meter price is stored as a custom field on each WooCommerce product
- Curtain type availability stored as product attribute (e.g., "suitable_for" = "tul,fon")

### Order Flow

1. Customer browses fabric catalog (kartela)
2. Selects a fabric → product page
3. Selects curtain type (Tül/Saten/Fon)
4. Enters window dimensions and chooses pleat ratio → sees calculated price instantly
5. Adds to cart → checkout
6. Pays via PayTR (or bank transfer)
7. İnanç Tekstil receives order notification (email + WooCommerce dashboard with full measurements and curtain specs)
8. Sources fabric and produces curtain
9. Delivers and installs at customer's location

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
- **Installation included:** İnanç Tekstil hangs curtains at customer's location (key differentiator)
- **WooCommerce config:** Set up shipping zones — Hatay province = enabled, everywhere else = disabled with "Bölgenize teslimat henüz mevcut değil" message
- **Production time:** Communicate clearly on product page (e.g., "5-10 iş günü içinde teslim")
- **Alterations:** Post-installation adjustments available if needed

## Essential Pages

| Page | Content |
|---|---|---|
| Ana Sayfa | Fabric gallery, value proposition (30 years trust, custom-made, local installation), CTA |
| Ürünler (Kartela) | Fabric catalog with filtering by type (Tül/Fon), price range, color |
| Hakkımızda | 30-year history, Hatice & Hüseyin Özdemirden story, physical location, craftsmanship, trust signals |
| Nasıl Sipariş Verilir | Step-by-step: measure window → select fabric → enter dimensions → receive & install |
| Ölçü Alma Rehberi | How to measure windows correctly for Tül, Saten, Fon |
| İletişim | Address, phone, WhatsApp link, Google Maps embed |
| Kargo ve Teslimat | Delivery areas (İskenderun/Hatay initially), timeline, installation service |
| İade Politikası | Return/exchange policy for custom products (limited, similar to TAÇ) |
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
  - Brand: "inanç tekstil iskenderun"
  - Local + product: "iskenderun perde", "hatay perde", "iskenderun perde siparişi"
  - Intent: "online perde yaptırma", "özel dikim perde", "perde fiyatları iskenderun"
  - Product types: "tül perde", "fon perde", "saten perde"
  - Custom: "özel ölçü perde", "perde ölçü al", "perde kurulum"
- **Negative keywords:** "perde yıkama", "perde tamiri", "ikinci el perde", "hazır perde" (filter out irrelevant searches)
- **Geo-targeting:** İskenderun + 30km radius, expand to full Hatay after 2 weeks if results are good
- **Budget:** 2,500 TL/month
- **Bidding:** Start with Maximize Clicks, switch to Target CPA after 30+ conversions

**Phase 2 — Meta/Instagram Ads (Launch week 2)**
- **Why second:** Needs visual content ready + pixel data collecting from website visitors first
- **Campaign structure:**
  - **Campaign 1 — Awareness/Traffic:** Fabric photos, curtain-making process, finished installations to cold audience
  - **Campaign 2 — Retargeting:** Ads to people who visited the site but didn't order (needs pixel + 500+ visitors first)
- **Targeting:**
  - Location: İskenderun/Hatay
  - Age: 25-55, skew female
  - Interests: home decoration, interior design, ev dekorasyonu, perde
  - Lookalike audiences: available after 100+ website visitors (pixel-based)
- **Ad formats:** Reels (15-30 sec fabric showcase, before/after installations), Stories, Carousel (multiple fabrics from kartela)
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
| Fabric close-up photos (kartela showcase) | Meta Ads, Instagram organic | 2-3/week |
| Before/after room reveals | Instagram Reels, TikTok (later) | 1-2/week |
| Curtain-making process (sewing, pleating) | Reels, TikTok (later) | 1/week |
| Installation videos | All platforms | 1-2/week |
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
Example: If average order is 2,500 TL and margin is 40%, you can spend up to 1,000 TL per order on ads.

**Key metrics to track weekly:**

| Metric | Google Ads Target | Meta Ads Target |
|---|---|---|
| CPC (cost per click) | 2-5 TL | 1-3 TL |
| CTR (click-through rate) | >3% | >1% |
| Conversion rate | >1% | >1% |
| ROAS (return on ad spend) | >3x | >3x |

**Cost per order** must stay below your break-even number. Track per channel and kill what doesn't work.

### Free / Organic Channels

- **Google Business Profile** — verify physical store, free local SEO boost, showcase 30-year reputation
- **Instagram organic** — regular posts showcasing work, builds trust for paid campaigns
- **WhatsApp Business** — link on website for customer questions, measurement help, high conversion for Turkish market

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
- **WooCommerce GA4 Integration:** Track add-to-cart, checkout, and purchase events by curtain type
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
- Build custom pricing calculator plugin with support for 3 curtain types (Tül, Saten, Fon)
  - Implement per-meter pricing with pleat ratio multipliers
  - Support different formulas for each curtain type
  - Store curtain type, dimensions, pleat ratio in order meta
- Photograph all kartela fabrics, write product descriptions, set per-meter prices
- Create product categories: Tül Fabrics, Fon Fabrics, Saten
- Mark which fabrics are suitable for which curtain types
- Create all essential pages (Hakkımızda, Nasıl Sipariş Verilir, Ölçü Alma Rehberi, İletişim, KVKK, etc.)
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
- Set up first Google Ads search campaign (high-intent keywords + "özel ölçü perde")
- Set up first Meta Ads traffic campaign (showcase kartela fabrics, installation service)
- Add WhatsApp Business chat widget to site (for measurement questions)
- Start content creation: photograph fabrics, shoot first curtain-making/installation reel

### Phase 4 — Test & Launch (Day 17-21)
- Switch PayTR from sandbox to production (once approved)
- End-to-end order flow testing for all 3 curtain types:
  - Tül: select fabric → enter dimensions → choose pleat → verify price calculation
  - Saten: add to cart → verify fixed price
  - Fon: select fabric → choose panel size → verify pair pricing
- Mobile testing (majority of Turkish traffic is mobile)
- Test PayTR payment flow with real transaction
- Test transactional emails (order confirmation includes curtain type, dimensions, pleat ratio)
- Test backup restore procedure
- Soft launch — enable ads at low budget for 2 weeks, monitor results

## Success Metrics (after 4-6 weeks)

- **Cost per order** from each ad channel
- **Conversion rate** (visitors → completed orders)
- **Average order value by curtain type** (Tül vs Fon — Fon will be higher)
- **Customer acquisition cost vs. profit margin**
- **Repeat customers** (measure alterations, second room orders)
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

### Infrastructure & Platform
- **WooCommerce over Shopify:** ~400 TL/month vs ~2,000+ TL/month. More setup work but owner is a software engineer.
- **Docker + Traefik over managed panels:** Full control, reproducible stack via Docker Compose, easy to maintain for a senior engineer.
- **Resend over default PHP mail:** Ensures transactional emails reach inbox. Free tier is sufficient for launch.

### Product & Pricing Model
- **Per-meter pricing with pleat multipliers over per-m² pricing:** Reflects actual business model. Tül/Fon use more fabric due to pleating. Saten is flat-rate.
- **3 distinct curtain types over generic "curtain":** Matches how customers think and shop. Different use cases, different pricing logic.
- **Custom pricing calculator over paid plugin:** Free, full control, handles complex per-meter + pleat ratio logic that no existing plugin supports.
- **Kartela system online:** Brings the in-store fabric catalog experience to e-commerce. Customers can browse by kartela code.

### Customer Experience
- **Measurement flexibility:** Customers can measure themselves (DIY) or request İnanç Tekstil to measure (commitment required). Reduces friction while maintaining quality.
- **Installation included:** Key differentiator vs TAÇ/Trendyol (delivery only). Builds trust and ensures customer satisfaction.
- **Alterations support:** Post-installation adjustments available. Critical for custom products where measurements may need tweaking.

### Marketing & Growth
- **Local geo-targeting first:** Keeps ad spend focused and testable. Validates demand in home market (İskenderun/Hatay) before expanding nationwide.
- **Google Ads first, Meta second, TikTok third:** Prioritizes high-intent search traffic, then awareness/retargeting, then experimental channel only after first two are profitable.
- **30-year trust emphasis:** Core brand differentiator. Hatice & Hüseyin Özdemirden's reputation is the moat vs online-only competitors.
