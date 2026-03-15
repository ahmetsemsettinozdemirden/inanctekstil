# İnanç Tekstil MVP Launch — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take inanctekstil.store from current state (infrastructure + curtain calculator plugin deployed) to a fully functional, legally compliant, payment-ready e-commerce MVP.

**Architecture:** WordPress + WooCommerce on Hetzner Docker stack (already running). Astra theme for storefront. PayTR for payments. Complianz for KVKK/cookie compliance. Custom curtain calculator plugin (already deployed and tested).

**Tech Stack:** WordPress 6, WooCommerce 10.x, Astra theme, PayTR, PHP 8.2, Docker

**Current State (what's already done):**
- Server: Hetzner CX23, Ubuntu 24.04, Docker (Traefik + WordPress + MariaDB + Redis) — running
- Domain: inanctekstil.store — live with SSL
- Plugin: inanc-curtain-calculator v2.0.0 — deployed and tested (Tul, Fon, Blackout, Saten)
- WooCommerce: installed and activated, currency set to TRY
- Redis Object Cache: installed and activated
- 3 test products created (to be cleaned up)

**What's NOT done (this plan covers):**
1. WordPress & WooCommerce base configuration (language, timezone, permalinks, store address, taxes)
2. Astra theme installation and customization
3. PayTR payment gateway integration
4. WooCommerce shipping zones (Hatay only)
5. Legal pages (KVKK, Mesafeli Satis, Iade, Cerez, On Bilgilendirme)
6. Essential plugins (WP Mail SMTP, Complianz, Site Kit, Wordfence)
7. Real product catalog (kartela fabrics)
8. E-commerce pages (Shop, Cart, Checkout, My Account)
9. Backup cron jobs
10. End-to-end testing

---

## Phase 1: WordPress & WooCommerce Configuration

### Task 1: WordPress Base Settings

**Where:** WP-CLI on server via SSH

- [ ] **Step 1: Set WordPress language to Turkish**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158
docker exec wordpress wp language core install tr_TR --allow-root
docker exec wordpress wp site switch-language tr_TR --allow-root
```

- [ ] **Step 2: Set permalink structure to SEO-friendly**

```bash
docker exec wordpress wp rewrite structure '/%postname%/' --allow-root
docker exec wordpress wp rewrite flush --allow-root
```

- [ ] **Step 3: Set timezone and date format**

```bash
docker exec wordpress wp option update timezone_string 'Europe/Istanbul' --allow-root
docker exec wordpress wp option update date_format 'd/m/Y' --allow-root
docker exec wordpress wp option update time_format 'H:i' --allow-root
```

- [ ] **Step 4: Commit — no file changes, configuration only (note in plan log)**

### Task 2: WooCommerce Store Settings

**Where:** WP-CLI on server via SSH

- [ ] **Step 1: Set store address and country**

```bash
docker exec wordpress wp option update woocommerce_store_address 'Iskenderun' --allow-root
docker exec wordpress wp option update woocommerce_store_city 'Iskenderun' --allow-root
docker exec wordpress wp option update woocommerce_default_country 'TR:31' --allow-root
docker exec wordpress wp option update woocommerce_store_postcode '31200' --allow-root
docker exec wordpress wp option update woocommerce_allowed_countries 'specific' --allow-root
docker exec wordpress wp option update woocommerce_specific_allowed_countries --format=json '["TR"]' --allow-root
docker exec wordpress wp option update woocommerce_ship_to_countries 'specific' --allow-root
docker exec wordpress wp option update woocommerce_specific_ship_to_countries --format=json '["TR"]' --allow-root
```

- [ ] **Step 2: Verify currency settings (already configured)**

```bash
# These should already be set from earlier session:
docker exec wordpress wp option get woocommerce_currency --allow-root          # TRY
docker exec wordpress wp option get woocommerce_currency_pos --allow-root      # right_space
docker exec wordpress wp option get woocommerce_price_thousand_sep --allow-root # .
docker exec wordpress wp option get woocommerce_price_decimal_sep --allow-root  # ,
```

- [ ] **Step 3: Set product and account settings**

```bash
docker exec wordpress wp option update woocommerce_weight_unit 'kg' --allow-root
docker exec wordpress wp option update woocommerce_dimension_unit 'cm' --allow-root
docker exec wordpress wp option update woocommerce_enable_reviews 'yes' --allow-root
docker exec wordpress wp option update woocommerce_review_rating_verification_required 'yes' --allow-root
docker exec wordpress wp option update woocommerce_enable_guest_checkout 'yes' --allow-root
docker exec wordpress wp option update woocommerce_enable_signup_and_login_from_checkout 'yes' --allow-root
docker exec wordpress wp option update woocommerce_enable_myaccount_registration 'yes' --allow-root
```

- [ ] **Step 4: Enable and configure taxes (KDV %20)**

```bash
docker exec wordpress wp option update woocommerce_calc_taxes 'yes' --allow-root
docker exec wordpress wp option update woocommerce_prices_include_tax 'yes' --allow-root
docker exec wordpress wp option update woocommerce_tax_based_on 'base' --allow-root
docker exec wordpress wp option update woocommerce_shipping_tax_class '' --allow-root
docker exec wordpress wp option update woocommerce_tax_display_shop 'incl' --allow-root
docker exec wordpress wp option update woocommerce_tax_display_cart 'incl' --allow-root
docker exec wordpress wp option update woocommerce_price_display_suffix 'KDV dahil' --allow-root
```

Then add the tax rate via WP-CLI or wp-admin:

```bash
# Tax rate must be added via wp-admin or direct DB insert:
docker exec wordpress wp db query "INSERT INTO inct_woocommerce_tax_rates (tax_rate_country, tax_rate_state, tax_rate, tax_rate_name, tax_rate_priority, tax_rate_compound, tax_rate_shipping, tax_rate_order, tax_rate_class) VALUES ('TR', '', '20.0000', 'KDV', 1, 0, 1, 1, '');" --allow-root
```

### Task 3: WooCommerce Shipping Zones (Hatay Only)

**Where:** WP-CLI + wp-admin on server

- [ ] **Step 1: Create Hatay shipping zone with 3 methods**

This is easiest via wp-admin (WooCommerce > Settings > Shipping > Shipping zones):

1. Add zone: "Hatay" — Region: Turkey, Postcode: 31000...31999
2. Add method: Flat Rate — "Kargo ile Teslimat" — 75 TL
3. Add method: Free Shipping — "Ucretsiz Kargo" — Min order 1000 TL
4. Add method: Local Pickup — "Elden Teslim (Iskenderun)" — 0 TL

- [ ] **Step 2: Verify no shipping methods exist for other zones**

The "Locations not covered by your other zones" section should have NO shipping methods, blocking orders from outside Hatay.

---

## Phase 2: Theme & Storefront

### Task 4: Install and Configure Astra Theme

**Where:** WP-CLI on server + wp-admin Customizer

- [ ] **Step 1: Install and activate Astra**

```bash
docker exec wordpress wp theme install astra --activate --allow-root
```

- [ ] **Step 2: Install Starter Templates plugin**

```bash
docker exec wordpress wp plugin install starter-templates --activate --allow-root
```

- [ ] **Step 3: Configure Astra via Customizer**

Navigate to wp-admin > Appearance > Customize:

```
General > Typography:
  Body font: Inter or system-ui
  Heading font: Playfair Display (luxury textile feel)

General > Colors:
  Primary: #1B2A4A (Deep Navy — per brand guide)
  Link color: harmonize with primary

Header Builder:
  Logo: Upload inanctekstil logo (SVG or PNG, max 200px wide)
  Menu items: Ana Sayfa, Urunler (Shop), Hakkimizda, Iletisim

WooCommerce:
  Shop page: Grid view, 3 products per row
  Single product: Gallery + summary + calculator area
```

- [ ] **Step 4: Create essential pages**

```bash
docker exec wordpress wp post create --post_type=page --post_title='Ana Sayfa' --post_status=publish --allow-root
docker exec wordpress wp post create --post_type=page --post_title='Hakkimizda' --post_status=publish --allow-root
docker exec wordpress wp post create --post_type=page --post_title='Iletisim' --post_status=publish --allow-root
```

Set homepage:
```bash
HOMEPAGE_ID=$(docker exec wordpress wp post list --post_type=page --name='ana-sayfa' --field=ID --allow-root)
docker exec wordpress wp option update show_on_front 'page' --allow-root
docker exec wordpress wp option update page_on_front "$HOMEPAGE_ID" --allow-root
```

- [ ] **Step 5: Create navigation menu**

```bash
docker exec wordpress wp menu create "Ana Menu" --allow-root
docker exec wordpress wp menu item add-post "Ana Menu" $HOMEPAGE_ID --title="Ana Sayfa" --allow-root
# Add Shop page (created by WooCommerce)
SHOP_ID=$(docker exec wordpress wp option get woocommerce_shop_page_id --allow-root)
docker exec wordpress wp menu item add-post "Ana Menu" $SHOP_ID --title="Urunler" --allow-root
# Add remaining pages similarly
docker exec wordpress wp menu location assign "Ana Menu" primary --allow-root
```

### Task 5: Create WooCommerce Product Categories

**Where:** WP-CLI on server

- [ ] **Step 1: Create product categories**

```bash
docker exec wordpress wp wc product_cat create --name="Tul Perdeler" --slug="tul-perdeler" --user=1 --allow-root
docker exec wordpress wp wc product_cat create --name="Fon Perdeler" --slug="fon-perdeler" --user=1 --allow-root
docker exec wordpress wp wc product_cat create --name="Blackout Perdeler" --slug="blackout-perdeler" --user=1 --allow-root
docker exec wordpress wp wc product_cat create --name="Saten" --slug="saten" --user=1 --allow-root
```

- [ ] **Step 2: Delete test products from earlier session**

```bash
docker exec wordpress wp post delete 12 13 14 --force --allow-root
```

---

## Phase 3: Payment Integration

### Task 6: PayTR Payment Gateway

**Where:** Server SSH + wp-admin

**Prerequisites:** PayTR merchant account must be approved with Merchant ID, Key, and Salt available. If not yet applied, apply at paytr.com first (3-5 business days approval).

- [ ] **Step 1: Add PayTR credentials to wp-config.php**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158

# Get the WordPress container's wp-config.php location
docker exec wordpress cat /var/www/html/wp-config.php | head -5

# Add PayTR constants before "That's all, stop editing!" line
docker exec wordpress wp config set PAYTR_MERCHANT_ID '<merchant_id>' --raw --allow-root
docker exec wordpress wp config set PAYTR_MERCHANT_KEY '<merchant_key>' --raw --allow-root
docker exec wordpress wp config set PAYTR_MERCHANT_SALT '<merchant_salt>' --raw --allow-root
```

**Note:** Replace `<merchant_id>`, `<merchant_key>`, `<merchant_salt>` with actual values from PayTR panel.

- [ ] **Step 2: Install PayTR WooCommerce plugin**

Download the PayTR WooCommerce plugin ZIP from PayTR panel > Integration > WooCommerce section.

```bash
# Upload to server and install
scp -i ~/.ssh/inanctekstil paytr-woocommerce.zip root@5.75.165.158:/tmp/
docker cp /tmp/paytr-woocommerce.zip wordpress:/tmp/
docker exec wordpress wp plugin install /tmp/paytr-woocommerce.zip --activate --allow-root
```

- [ ] **Step 3: Configure PayTR in WooCommerce**

Navigate to wp-admin > WooCommerce > Settings > Payments > PayTR:

```
Enable: Yes
Title: "Kredi Karti / Banka Karti ile Ode"
Description: "Kredi karti veya banka kartiniz ile guvenli odeme yapin."
Merchant ID: (from wp-config.php or enter directly)
Merchant Key: (from wp-config.php or enter directly)
Merchant Salt: (from wp-config.php or enter directly)
Test Mode: Yes (initially)
Payment Type: iFrame
Language: Turkish
Installments: Yes
```

- [ ] **Step 4: Test with sandbox**

Use PayTR test card:
```
Card: 4355 0843 5508 4358
Expiry: 12/30
CVV: 000
3D Password: a
```

Test checklist:
- [ ] Successful payment — order status becomes "Isleniyor"
- [ ] Failed payment — error message displayed
- [ ] 3D Secure verification screen appears
- [ ] Callback updates order status automatically
- [ ] Order confirmation email sent (requires WP Mail SMTP — Task 7)

- [ ] **Step 5: Switch to live mode after all tests pass**

```
WooCommerce > Settings > Payments > PayTR
  Test Mode: No
```

Do a real 1 TL test transaction and verify in PayTR panel.

---

## Phase 4: Essential Plugins

### Task 7: WP Mail SMTP (Email Delivery)

**Where:** WP-CLI + wp-admin

- [ ] **Step 1: Install WP Mail SMTP**

```bash
docker exec wordpress wp plugin install wp-mail-smtp --activate --allow-root
```

- [ ] **Step 2: Configure SMTP**

Navigate to wp-admin > WP Mail SMTP > Settings:

```
From Email: bildirim@inanctekstil.store
From Name: Inanc Tekstil
Mailer: Other SMTP (or Resend if using Resend API)

If using Resend:
  SMTP Host: smtp.resend.com
  SMTP Port: 587
  Encryption: TLS
  Authentication: On
  Username: resend
  Password: <resend_api_key>

If using Google Workspace:
  SMTP Host: smtp.gmail.com
  SMTP Port: 587
  Encryption: TLS
  Username: info@inanctekstil.store
  Password: <app_password>
```

- [ ] **Step 3: Send test email**

WP Mail SMTP > Tools > Email Test — send to a personal email and verify delivery.

### Task 8: Complianz (KVKK / Cookie Compliance)

**Where:** WP-CLI + wp-admin wizard

- [ ] **Step 1: Install Complianz**

```bash
docker exec wordpress wp plugin install complianz-gdpr --activate --allow-root
```

- [ ] **Step 2: Run Complianz wizard**

Navigate to wp-admin > Complianz > Wizard:

```
Region: Turkey / Europe
Cookie banner: Enabled
Privacy policy page: Auto-create or link to existing
Cookie policy page: Auto-create or link to existing
```

- [ ] **Step 3: Verify cookie banner appears on frontend**

Visit inanctekstil.store in incognito browser and confirm the cookie consent banner shows.

### Task 9: Site Kit by Google (Analytics)

**Where:** WP-CLI + wp-admin

- [ ] **Step 1: Install Site Kit**

```bash
docker exec wordpress wp plugin install google-site-kit --activate --allow-root
```

- [ ] **Step 2: Connect Google services**

Navigate to wp-admin > Site Kit > Setup:
- Connect Google Analytics 4
- Connect Google Search Console
- Enable enhanced e-commerce tracking

### Task 10: Wordfence Security

**Where:** WP-CLI + wp-admin

- [ ] **Step 1: Install Wordfence**

```bash
docker exec wordpress wp plugin install wordfence --activate --allow-root
```

- [ ] **Step 2: Configure Wordfence**

Navigate to wp-admin > Wordfence > All Options:
- Enable brute force protection
- Set lockout after 5 failed login attempts
- Enable rate limiting
- Run initial security scan

---

## Phase 5: Legal Pages

### Task 11: Create Legal Pages in WordPress

**Where:** WP-CLI + wp-admin editor

All legal content templates are in `docs/legal/`. Each needs to be created as a WordPress page.

- [ ] **Step 1: Create legal pages**

```bash
docker exec wordpress wp post create --post_type=page --post_title='Gizlilik Politikasi' --post_status=publish --allow-root
docker exec wordpress wp post create --post_type=page --post_title='Mesafeli Satis Sozlesmesi' --post_status=publish --allow-root
docker exec wordpress wp post create --post_type=page --post_title='Iade Politikasi' --post_status=publish --allow-root
docker exec wordpress wp post create --post_type=page --post_title='Cerez Politikasi' --post_status=publish --allow-root
docker exec wordpress wp post create --post_type=page --post_title='On Bilgilendirme Formu' --post_status=publish --allow-root
```

- [ ] **Step 2: Populate each page with content from docs/legal/**

Copy content from each legal doc into the corresponding WordPress page via wp-admin editor. Replace placeholder values (address, phone, email, IBAN) with actual business details.

Source files:
- `docs/legal/kvkk-gizlilik-politikasi.md` → Gizlilik Politikasi page
- `docs/legal/mesafeli-satis-sozlesmesi.md` → Mesafeli Satis Sozlesmesi page
- `docs/legal/iade-politikasi.md` → Iade Politikasi page
- `docs/legal/cerez-politikasi.md` → Cerez Politikasi page
- `docs/legal/on-bilgilendirme-formu.md` → On Bilgilendirme Formu page

- [ ] **Step 3: Link privacy policy in WooCommerce**

```bash
PRIVACY_ID=$(docker exec wordpress wp post list --post_type=page --name='gizlilik-politikasi' --field=ID --allow-root)
docker exec wordpress wp option update wp_page_for_privacy_policy "$PRIVACY_ID" --allow-root
docker exec wordpress wp option update woocommerce_terms_page_id "$PRIVACY_ID" --allow-root
```

- [ ] **Step 4: Add legal pages to footer menu**

```bash
docker exec wordpress wp menu create "Footer Menu" --allow-root
# Add each legal page to footer menu
docker exec wordpress wp menu item add-post "Footer Menu" $PRIVACY_ID --title="Gizlilik Politikasi" --allow-root
# Repeat for other legal pages
docker exec wordpress wp menu location assign "Footer Menu" footer --allow-root
```

- [ ] **Step 5: Add checkout delivery notice**

Add the delivery notice snippet from `docs/ecommerce/shipping-delivery.md` (lines 91-104) to the theme's functions.php or as a code snippet:

```php
add_action('woocommerce_review_order_before_payment', function () {
    echo '<div class="icc-delivery-notice" style="
        background: #F8F8F8;
        border-left: 4px solid #1B2A4A;
        padding: 12px 16px;
        margin-bottom: 20px;
        font-size: 0.95em;
    ">';
    echo '<strong>Teslimat Bilgisi:</strong> ';
    echo 'Perdeniz, siparis onayindan itibaren <strong>5-7 is gunu</strong> icerisinde ';
    echo 'dikilir ve teslimata hazir hale getirilir. ';
    echo 'Hatay ili icerisine kargo veya elden teslim yapilmaktadir.';
    echo '</div>';
});
```

This can be added via a mu-plugin:

```bash
docker exec wordpress bash -c "mkdir -p /var/www/html/wp-content/mu-plugins"
docker exec wordpress bash -c "cat > /var/www/html/wp-content/mu-plugins/icc-checkout-notice.php << 'PHPEOF'
<?php
add_action('woocommerce_review_order_before_payment', function () {
    echo '<div class=\"icc-delivery-notice\" style=\"background:#F8F8F8;border-left:4px solid #1B2A4A;padding:12px 16px;margin-bottom:20px;font-size:0.95em;\">';
    echo '<strong>Teslimat Bilgisi:</strong> ';
    echo 'Perdeniz, siparis onayindan itibaren <strong>5-7 is gunu</strong> icerisinde ';
    echo 'dikilir ve teslimata hazir hale getirilir. ';
    echo 'Hatay ili icerisine kargo veya elden teslim yapilmaktadir.';
    echo '</div>';
});
PHPEOF"
```

---

## Phase 6: Product Catalog

### Task 12: Add Real Fabric Products

**Where:** wp-admin product editor

**Prerequisites:** Fabric photos taken, kartela codes ready, prices per meter confirmed.

- [ ] **Step 1: Prepare product data**

For each fabric, gather:
- Kartela code (SKU): e.g. `TUL-2024-A15`
- Product name: e.g. "Krem Desenli Tul - A15"
- Category: Tul Perdeler / Fon Perdeler / Blackout Perdeler / Saten
- Price per meter (TL)
- Available pleat ratios (1:2, 1:2.5, 1:3)
- Photos: kartela close-up, hanging/draped, room mockup (minimum 1 photo to start)

- [ ] **Step 2: Add products via wp-admin**

For each fabric product, in WooCommerce > Products > Add New:

```
Product Name: "Krem Desenli Tul - A15"
SKU: TUL-2024-A15
Regular Price: 0 (calculator overrides)
Category: Tul Perdeler

Custom Fields (Perde Hesaplayici section):
  Perde Tipi: Tul
  Kartela Kodu: TUL-2024-A15
  Metre Fiyati: 150
  Pile Oranlari: [x] 1:2  [x] 1:2.5  [x] 1:3

Product Image: Upload kartela photo
Product Gallery: Additional photos

Short Description: 2-3 sentence summary
SEO Title: "Krem Desenli Tul Perde Kumasi - A15 | Inanc Tekstil"
Meta Description: "Zarif krem desenli tul perde kumasi. Olcuye ozel dikim, Iskenderun'dan teslimat."
Image Alt Text: "Krem desenli tul perde kumasi yakin cekim - TUL-2024-A15"
```

- [ ] **Step 3: Add Saten products**

```
Product Name: "Saten Astar - Krem"
SKU: SATEN-KREM
Perde Tipi: Saten
Category: Saten

Product Name: "Saten Astar - Beyaz"
SKU: SATEN-BEYAZ
Perde Tipi: Saten
Category: Saten
```

- [ ] **Step 4: Verify calculator works for each product on the frontend**

Visit each product page, enter test dimensions, verify calculation, add to cart, check cart meta.

---

## Phase 7: Backup & Operations

### Task 13: Set Up Backup Cron Jobs

**Where:** Server SSH

- [ ] **Step 1: Create backup script**

```bash
ssh -i ~/.ssh/inanctekstil root@5.75.165.158

mkdir -p /opt/backups

cat > /opt/backups/daily-backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR=/opt/backups

# MariaDB dump
docker exec mariadb mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" --all-databases > "$BACKUP_DIR/db-$DATE.sql"

# wp-content volume backup
docker run --rm -v inanctekstil_wp-content:/data -v $BACKUP_DIR:/backup alpine tar czf "/backup/wp-content-$DATE.tar.gz" /data

# Traefik acme.json backup
cp /opt/inanctekstil/traefik/acme.json "$BACKUP_DIR/acme-$DATE.json"

# Cleanup: keep last 14 days
find $BACKUP_DIR -name "db-*.sql" -mtime +14 -delete
find $BACKUP_DIR -name "wp-content-*.tar.gz" -mtime +14 -delete
find $BACKUP_DIR -name "acme-*.json" -mtime +14 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/backups/daily-backup.sh
```

- [ ] **Step 2: Add cron job**

```bash
# Source the .env file for MYSQL_ROOT_PASSWORD
(crontab -l 2>/dev/null; echo "0 2 * * * cd /opt/inanctekstil && export \$(grep -v '^#' .env | xargs) && /opt/backups/daily-backup.sh >> /var/log/backup.log 2>&1") | crontab -
```

- [ ] **Step 3: Test backup script manually**

```bash
cd /opt/inanctekstil && export $(grep -v '^#' .env | xargs) && /opt/backups/daily-backup.sh
ls -la /opt/backups/
```

---

## Phase 8: End-to-End Testing

### Task 14: Full E2E Test

**Where:** Browser (Playwright or manual)

- [ ] **Step 1: Homepage and navigation test**

- [ ] Homepage loads correctly with Astra theme
- [ ] Navigation menu: Ana Sayfa, Urunler, Hakkimizda, Iletisim
- [ ] Footer menu: legal page links
- [ ] Cookie consent banner appears

- [ ] **Step 2: Shop page test**

- [ ] Shop page shows all products in grid
- [ ] Products display correct prices with ₺ symbol (e.g. "150,00 ₺ / metre")
- [ ] Category filtering works (Tul, Fon, Blackout, Saten)

- [ ] **Step 3: Product page + calculator test**

- [ ] Tul: calculator form renders, enter 300cm / 1:3 / verify 1.575,00 TL total
- [ ] Fon: calculator form renders, enter 100cm panel / 1:2 / verify 2.100,00 TL total
- [ ] Saten: fixed price 150,00 ₺, no calculator
- [ ] Invalid inputs show error messages

- [ ] **Step 4: Cart test**

- [ ] Add tul product to cart — price and meta (Kartela, Pencere Eni, Pile Orani) display correctly
- [ ] Add saten to cart — fixed price 150 ₺
- [ ] Cart totals are correct
- [ ] Quantity changes work

- [ ] **Step 5: Checkout test**

- [ ] Checkout page loads with shipping options (Hatay addresses only)
- [ ] Delivery notice ("5-7 is gunu") appears
- [ ] Mesafeli Satis Sozlesmesi checkbox present
- [ ] PayTR payment form loads (iFrame)
- [ ] Test payment succeeds with sandbox card
- [ ] Order confirmation page shows
- [ ] Order confirmation email received
- [ ] Admin order shows all curtain meta (measurements, calculations, kartela)

- [ ] **Step 6: Blocked shipping test**

- [ ] Enter a non-Hatay address (e.g. Istanbul)
- [ ] Verify "Bu bolgeye gonderim yapilmiyor" message appears
- [ ] Cannot proceed to payment

- [ ] **Step 7: Mobile responsiveness**

- [ ] Product pages render correctly on mobile
- [ ] Calculator form is usable on mobile
- [ ] Checkout flow works on mobile

---

## Phase 9: Launch Checklist

### Task 15: Pre-Launch Final Checks

- [ ] All test products deleted, only real products remain
- [ ] PayTR switched from sandbox to live mode
- [ ] WP_DEBUG set to false (or log-only)
- [ ] Admin password is strong
- [ ] Wordfence initial scan clean
- [ ] SSL certificate valid (Let's Encrypt auto-renew)
- [ ] Backup cron job running and tested
- [ ] All legal pages populated with real content (not templates)
- [ ] Google Analytics tracking working
- [ ] WP Mail SMTP sending emails successfully
- [ ] Contact info correct (phone, email, address)

---

## Dependency Graph

```
Phase 1 (WP Config)     ─── no dependencies
Phase 2 (Theme)          ─── no dependencies
Phase 3 (PayTR)          ─── depends on PayTR merchant approval (external)
Phase 4 (Plugins)        ─── depends on email service setup (Resend or Google Workspace)
Phase 5 (Legal)          ─── depends on Phase 2 (theme for footer menu)
Phase 6 (Products)       ─── depends on Phase 1 (categories), Phase 2 (theme), fabric photos
Phase 7 (Backups)        ─── no dependencies
Phase 8 (E2E Testing)    ─── depends on all phases 1-7
Phase 9 (Launch)         ─── depends on Phase 8
```

**Parallelizable:** Phases 1, 2, 3, 4, 7 can all be done in parallel. Phase 5 and 6 follow after 1+2. Phase 8 is the integration gate.

---

## Post-Launch Notes

- **Product additions:** Follow guide in `docs/ecommerce/product-catalog.md` — "Yeni Kumas Ekleme" section
- **Price changes:** Update `_icc_price_per_meter` custom field on individual products
- **Sewing cost changes:** Edit constants in `plugin/inanc-curtain-calculator/inanc-curtain-calculator.php`, re-deploy via SCP
- **Plugin updates:** `scp -r plugin/inanc-curtain-calculator root@5.75.165.158:/opt/inanc-curtain-calculator` then `docker exec wordpress wp cache flush --allow-root`
- **Marketing:** Follow `docs/marketing/README.md` for Google Ads and Meta Ads setup after launch
