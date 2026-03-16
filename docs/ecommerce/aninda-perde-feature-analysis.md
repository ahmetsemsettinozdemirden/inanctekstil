# "Aninda Perde" (Instant Curtain) Feature Analysis

Competitor analysis of TAC.com.tr's custom curtain builder feature and recommendations for implementing a similar feature on inanctekstil.store (Shopify).

**Date:** 2026-03-16
**Source:** https://www.tac.com.tr/aninda-perde
**Target:** https://inanctekstil.store (Shopify)

---

## 1. Executive Summary

TAC.com.tr offers an "Aninda Perde" (Instant Curtain) feature that lets customers design custom curtains through a guided multi-step configurator directly on the product detail page. The feature covers four curtain categories (Tul, Fon, Guneslik, Karartma), includes educational measurement guide videos, and uses a slide-out panel UX for each configuration step.

Our existing curtain calculator (Shopify icin gelistiriliyor) already handles price calculation for Tul, Fon, Blackout, and Saten curtains. This document identifies the UX gaps between our implementation and TAC's, and proposes enhancements.

---

## 2. TAC.com.tr Feature Breakdown

### 2.1 Landing Page (`/aninda-perde`)

The dedicated landing page serves as the entry point for custom curtain shopping. It is NOT a product listing -- it's a marketing/educational hub.

**Sections (top to bottom):**

1. **Hero Banner Carousel** -- Full-width lifestyle imagery with descriptive text: "Pile secimi, olculer ve astar tipi gibi detaylari kisisellestirerek, mekaniniza uygun sik ve fonksiyonel perdeler olusturabilirsiniz." Category buttons: `Tul Perde`, `Fon Perde`, `Guneslik`

2. **"Tul ve Fon Perdeler" Section** -- Lifestyle photo + description + two CTA buttons linking to subcategory listings (`Tul Perde`, `Fon Perde`)

3. **"Perde Olcusu Nasil Alinir?" (How to Measure)** -- Three embedded YouTube tutorial videos:
   - *Kalorifer Ustu Perde Olcusu Nasil Alinir?* -- Measuring for curtains above radiators
   - *Cam Hizasinda Perde Olcusu Nasil Alinir?* -- Measuring for window-level curtains
   - *Yere Kadar Uzanan Perde Olcusu Nasil Alinir?* -- Measuring for floor-length curtains
   - Each video has a title and brief description below it

4. **"Sizin Icin Sectiklerimiz" (Picked for You)** -- Product recommendation carousel

5. **"Guneslik ve Karartmalar" Section** -- Lifestyle photo + two CTA buttons (`Guneslik`, `Karartma`)

6. **Second "Sizin Icin Sectiklerimiz"** -- Another product recommendation carousel

7. **"Sikca Sorulan Sorular" (FAQ)** -- Accordion with 4 questions:
   - Iptal ve iade kosullari nelerdir?
   - Urun iadelerinde kargo ucretli midir?
   - Siparisim kac gun icerisinde elime ulasir?
   - Yikama talimatlarini nereden ogrenebilirim?

### 2.2 Category Listing Pages

Example: `/perde-aninda-perde-aninda-perde-fon-perdeler` (60 Fon Perde products)

**Features:**
- **"Aninda Perde" badge** on every product card (red text, top-left corner)
- **Filter bar:** Urun Tipi, Kalite, Renk, Marka, Fiyat
- **Sort dropdown** (Sirala)
- **Product count** displayed (e.g., "Aninda Perde - Fon Perdeler (60)")
- **Product cards show:** Product image, "Pesin Fiyatina 3 Taksit" badge, product name with max height in title, base price per meter
- **Breadcrumb navigation:** Anasayfa > Perde > Aninda Perde > Aninda Perde - Fon Perdeler

**Categories available:**
- Tul Perdeler (Sheer curtains)
- Fon Perdeler (Decorative curtains)
- Guneslik (Sunscreen/roller blinds)
- Karartma (Blackout)

### 2.3 Product Detail Page (PDP) -- Curtain Configurator

This is the core of the feature. The PDP replaces the standard "add to cart" with a **multi-step configurator**.

#### Common Elements (all curtain types):

- **"Aninda Perde" label** -- Red text badge next to product thumbnails
- **Product images** -- 9+ images per product including lifestyle, detail, and texture shots
- **Color selector** -- Thumbnail swatches (e.g., 2 colors for Tul, 4 for Fon)
- **Intro text:** "Stilini yansitan perdeyi sadece 5 adimda tasarlayabilirsin." (Design your curtain in just 5 steps)
- **Color disclaimer:** "Urun gorselleri, cihaz ekran ayarlari ve ortam isigina bagli olarak kumas renginde ton farki gosterebilir."
- **"Kullanim Kilavuzu" link** (Usage Guide)
- **Warning box:** "Unutma! Bu perde sana ozel dikilecegi ve iadesi mumkun olmayacagi icin olculeri kontrol etmen cok onemli."
- **Terms checkbox** (required before add-to-cart): "Verdigim olcuye ve sectigim detaylara gore dikilecek olan urunlerin iptali veya iadesi icin gecerli olan tum sart ve kosullari okudum, kabul ediyorum."
- **"Sepete Ekle" (Add to Cart)** button -- Full-width, dark red/maroon
- **Wishlist button** next to add-to-cart
- **Below-fold sections:** Urun Detaylari, Taksit Secenekleri, Teslimat ve Iade (accordions)

#### Step-by-Step Configurator UX

Each step opens as a **right-side slide-out panel** (drawer) that overlays the page. The panel has:
- Step title at the top
- Close (X) button
- Content area
- "Devam Et" (Continue) button fixed at the bottom

After completing a step, the selection summary appears inline (e.g., "Olcu Secimi: 200 x 250"). Completed steps show a filled circle with the step number.

---

#### STEP 1: Olcu Secimi (Size Selection)

**Inputs:**
- `En (cm)` -- Width input (spinbutton), minimum 50 cm
- `Boy (cm)` -- Height input (spinbutton), maximum varies by product (e.g., 270 cm for Tul, 300 cm for Fon)

**Visual aids:**
- **Measurement diagram** -- Simple line drawing showing a window/curtain with "en" (width) and "boy" (height) labeled
- **Measurement guide links** -- Three clickable links that open tutorial content:
  - "Cam hizasinda perde olcusunun nasil alindigi..." (window-level)
  - "Yere kadar uzanan perde olcusunun nasil alindigi..." (floor-length)
  - "Kalorifer ustu perde olcusunun nasil alindigi..." (above radiator)

**Summary after completion:** "Olcu Secimi: 200 x 250"

---

#### STEP 2: Pile Stili Secimi (Pleat Style Selection)

**Options (for Tul Perde -- 6 styles):**

| Pleat Style | Turkish Name |
|---|---|
| Kanun Pile (tul) | Standard/French pleat |
| Boru Pile (tul) | Tube/cylindrical pleat |
| Su Dalgasi (tul) | Wave/ripple pleat |
| Yatik Pile (tul) | Inverted/tilted pleat |
| Amerikan Pile (tul) | American/pinch pleat |
| Ekstraforlu Duz Dikis (tul) | Flat stitch with reinforcement tape |

**Each option shows:**
- A **photo of the actual pleat style** (close-up curtain photo)
- Name text below the photo

**Selection UX:** Click on a pleat photo to select, then click "Devam Et"

**Summary after completion:** "Pile Stili Secimi: Kanun Pile (tul)"

> **Note:** Fon Perde likely has its own set of pleat styles (labeled "(fon)" instead of "(tul)").

---

#### STEP 3: Kanat Secimi (Panel Selection)

**Options (2 choices with radio buttons):**

1. **Tek Kanat (Single Panel)**
   - Illustration: Single curtain panel drawing
   - Description: "En ve yukseklik alanina girilen olculer icin tek kanat (1 adet) perde siparis verdiginiz anlamina gelir."

2. **Cift Kanat (Double Panel)**
   - Illustration: Two curtain panels drawing
   - Description: "En ve yukseklik alanina girilen olculer icin cift kanat (2 adet) ayni olcude perde siparis verdiginiz anlamina gelir."

**Summary after completion:** "Kanat Secimi: Tek Kanat" or "Kanat Secimi: Cift Kanat"

---

#### STEP 4: Astar Secimi (Lining Selection) -- FON PERDE ONLY

This step appears **only for Fon Perde** products (not Tul). Provides lining/backing options that affect light blocking, insulation, and price.

> **Note:** We could not explore the specific lining options in this investigation, but typical options include: Astarsiz (no lining), Astarli (with lining), Blackout Astar (blackout lining).

---

#### STEP 5: Confirmation

The "5th step" referenced in the UI text is the **terms acceptance checkbox** and final review before adding to cart. All previous selections are visible in the step summary on the main page.

---

### 2.4 Pricing Model

- **Base price shown** is per-meter (e.g., 339 TL for Tul, 589 TL for Fon, 749 TL for Guneslik, 1,119 TL for Karartma)
- Final price is calculated based on dimensions + pleat style + panel count + lining
- "Pesin Fiyatina 3 Taksit" (3 installments at cash price) prominently displayed
- Price range observed: 339 TL (basic Tul) to 2,449 TL (premium Brode Tul)

---

## 3. Comparison: TAC vs. Inanc Tekstil (Current State)

| Feature | TAC.com.tr | inanctekstil.store (Current) |
|---|---|---|
| **Dedicated landing page** | Yes -- educational hub with videos, categories, FAQ | No -- products in standard Shopify listing |
| **Measurement guides** | 3 YouTube videos + inline diagram | None |
| **Product categories** | Tul, Fon, Guneslik, Karartma | Tul, Fon, Blackout, Saten |
| **Configurator UX** | Slide-out panel, step-by-step wizard | Inline form on product page |
| **Pleat style selection** | Visual picker with 6 photos | Dropdown with ratio options (1:2, 1:2.5, 1:3) |
| **Panel selection** | Tek/Cift Kanat with illustrations | Not offered separately (Fon is always 2 panels) |
| **Lining selection** | Yes (Fon Perde only) | Not offered (Saten is a separate product) |
| **Color selection** | Thumbnail swatches on PDP | Part of product variant |
| **Terms acceptance** | Required checkbox with custom curtain disclaimer | Not present |
| **Price display** | Base price + dynamic calculation | Dynamic calculation on form |
| **Product images** | 9+ images including lifestyle shots | Standard Shopify product images |
| **Room name input** | Not present | Yes (optional field) |
| **FAQ section** | Yes, on landing page | No |
| **"Aninda Perde" branding** | Red badge on all listings and PDPs | No equivalent branding |
| **Installment info** | "Pesin Fiyatina 3 Taksit" badge | PayTR installment options |

---

## 4. Key UX Insights from TAC

### 4.1 What TAC Does Well

1. **Education-first approach** -- The landing page teaches customers HOW to measure before they shop. This reduces measurement errors and returns.

2. **Visual pleat selection** -- Instead of abstract ratios (1:2, 1:3), customers see actual photos of how each pleat style looks. This is significantly more intuitive.

3. **Step-by-step wizard** -- Breaking the configuration into sequential steps prevents overwhelm. Each step has one clear decision.

4. **Custom curtain disclaimer** -- Making customers explicitly accept that custom-sewn products cannot be returned reduces disputes.

5. **Measurement diagram** -- The simple "en/boy" diagram in the size selection step removes ambiguity about what width and height mean.

6. **Consistent branding** -- "Aninda Perde" appears everywhere (nav menu, product badges, breadcrumbs) creating a distinct sub-brand for the custom curtain experience.

### 4.2 What TAC Could Improve

1. **No live price update** -- The price doesn't visibly change as you configure. Our calculator already shows live price updates, which is better.

2. **No preview/visualization** -- No visual preview of how the configured curtain would look.

3. **No room type suggestions** -- No guidance on which curtain types/sizes work for common room types.

4. **Limited product details** -- Material composition is sparse. Our product catalog documentation is more thorough.

---

## 5. Recommended Features for inanctekstil.store

### 5.1 Priority 1: Landing Page (New)

Create a dedicated "Aninda Perde" or "Perdeyi Tasarla" landing page on Shopify:

- **Hero section** with lifestyle imagery and category buttons (Tul, Fon, Blackout)
- **"Perde Olcusu Nasil Alinir?" section** with measurement guide content (videos or illustrated guides)
  - Kalorifer ustu olcu alma
  - Cam hizasinda olcu alma
  - Yere kadar uzanan perde olcu alma
- **Category sections** with CTAs to filtered product listings
- **FAQ accordion** with custom curtain-specific questions (returns policy for custom products, delivery time, washing instructions)
- **Product recommendations** carousel

### 5.2 Priority 2: Enhanced Product Configurator

Upgrade the existing `inanc-curtain-calculator` plugin UX:

#### A. Visual Pleat Selection
Replace the dropdown pleat ratio selector with a **visual grid of pleat style photos**:
- Each option shows an actual photo of the pleat
- Name and brief description below
- Map existing ratios to named styles (e.g., 1:2 = "Duz Dikis", 1:2.5 = "Kanun Pile", 1:3 = "Boru Pile")

#### B. Step-by-Step Wizard UX
Convert the single inline form into a sequential wizard:
1. **Olcu Secimi** -- Width + height inputs with measurement diagram and guide links
2. **Pile Stili Secimi** -- Visual pleat picker
3. **Kanat Secimi** (Fon only) -- Tek/Cift Kanat with illustrations
4. **Astar Secimi** (Fon only) -- Lining options (Astarsiz, Saten Astar)
5. **Confirmation** -- Summary + terms checkbox + add to cart

Each step should show as a collapsible/expandable section (not necessarily a slide-out drawer -- adapt to Shopify theme capabilities).

#### C. Measurement Guide Integration
- Add a simple measurement diagram (SVG or image) in the size input step
- Link to measurement guide content (page or popup)
- Show min/max constraints clearly (like TAC's "min 50 cm" / "max 270 cm" labels)

#### D. Custom Product Disclaimer
Add a **required checkbox** before add-to-cart:
> "Bu perde ozel olarak dikilecegi icin iade edilemez. Olculerinizi kontrol ettiginizi onayliyorum."

### 5.3 Priority 3: Branding & Navigation

- Add "ANINDA PERDE" or "PERDE TASARLA" to the main navigation menu
- Add a badge/label to custom curtain product cards in listings
- Create a distinct visual identity for the custom curtain experience (icon, color accent)

### 5.4 Priority 4: Content & Education

- Create measurement guide content (video or illustrated step-by-step)
- Add curtain-specific FAQ page or section
- Include product care/washing instructions on PDPs
- Add "Kullanim Kilavuzu" (Usage Guide) link on each product

---

## 6. Technical Considerations for Shopify

### Landing Page
- Can be built as a **Shopify page with custom sections** using the Horizon theme editor
- YouTube embeds for measurement videos
- Product recommendation section using Shopify's built-in product grid

### Configurator
- The curtain calculator is being **built for Shopify** as a theme extension/app
- Shopify options: Custom product template with Liquid + JavaScript, or a Shopify app
- Key challenge: Shopify doesn't natively support dynamic pricing based on custom inputs -- requires either:
  - Line item properties + cart transforms (Shopify Functions)
  - Draft orders API
  - A custom app with cart modifications

### Product Data
- Pleat style images need to be created/sourced for each style we offer
- Measurement diagram (SVG) needs to be designed
- FAQ content needs to be written in Turkish

---

## 7. What NOT to Copy from TAC

1. **Spin-the-wheel popup** -- Intrusive marketing popup that appeared on page load
2. **No live price calculation** -- Our existing live calculation is a competitive advantage
3. **Sparse product details** -- Our documentation approach is better
4. **Complex URL structure** -- TAC's category URLs are overly long (`/perde-aninda-perde-aninda-perde-tul-perdeler`)

---

## 8. Screenshots Reference

The following screenshots were captured during this investigation and are saved in `/tmp/`:

| File | Description |
|---|---|
| `tac-aninda-perde-landing.png` | Full landing page |
| `tac-pdp-configurator.png` | Tul Perde PDP with 3-step configurator |
| `tac-step1-clean.png` | Step 1: Olcu Secimi (Size Selection) panel |
| `tac-step2-pile-secimi.png` | Step 2: Pile Stili Secimi with 6 visual options |
| `tac-step3-kanat-secimi.png` | Step 3: Kanat Secimi (Panel Selection) |
| `tac-fon-perde-listing.png` | Fon Perde category listing page |
| `tac-fon-perde-pdp.png` | Fon Perde PDP with 4-step configurator (includes Astar Secimi) |
