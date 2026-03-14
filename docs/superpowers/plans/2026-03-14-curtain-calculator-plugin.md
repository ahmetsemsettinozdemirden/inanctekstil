# Curtain Calculator Plugin Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `inanc-curtain-calculator` WooCommerce plugin that calculates curtain prices based on width, pleat ratio, and product type (Tul/Fon/Blackout/Saten).

**Architecture:** A single WordPress plugin with 5 PHP classes (calculator engine, admin fields, frontend form, cart handler, order handler), 3 PHP templates (tul/fon/saten), frontend JS for live price calculation, and CSS. The calculator engine is pure logic with no WP dependencies, making it unit-testable. All other classes hook into WooCommerce actions/filters.

**Tech Stack:** PHP 8.2, WordPress 6, WooCommerce, vanilla JavaScript, CSS

**Spec:** `docs/ecommerce/pricing-calculator.md`

---

## File Structure

```
plugin/inanc-curtain-calculator/
|-- inanc-curtain-calculator.php      # Main plugin file, constants, autoload
|-- includes/
|   |-- class-calculator.php          # Pure calculation logic (no WP deps)
|   |-- class-product-fields.php      # Admin: custom fields on product edit
|   |-- class-frontend-form.php       # Frontend: render calculator + enqueue assets
|   |-- class-cart-handler.php        # Cart: validation, meta, price override
|   |-- class-order-handler.php       # Order: save line item meta
|-- assets/
|   |-- js/
|   |   |-- curtain-calculator.js     # Frontend live price calculation
|   |-- css/
|   |   |-- curtain-calculator.css    # Form and result styles
|-- templates/
|   |-- calculator-form-tul.php       # Tul calculator form
|   |-- calculator-form-fon.php       # Fon/Blackout calculator form
|   |-- calculator-form-saten.php     # Saten fixed price form
|-- tests/
|   |-- test-calculator.php           # PHPUnit tests for calculator engine
```

---

## Chunk 1: Calculator Engine + Tests

### Task 1: Plugin Scaffold + Calculator Engine

**Files:**
- Create: `plugin/inanc-curtain-calculator/inanc-curtain-calculator.php`
- Create: `plugin/inanc-curtain-calculator/includes/class-calculator.php`

- [ ] **Step 1: Create plugin directory structure**

```bash
mkdir -p plugin/inanc-curtain-calculator/{includes,assets/{js,css},templates,tests}
```

- [ ] **Step 2: Create the calculator engine**

Create `plugin/inanc-curtain-calculator/includes/class-calculator.php` with:

```php
<?php
defined('ABSPATH') || exit;

class ICC_Calculator {

    public static function calculate_tul(
        int $window_width_cm,
        float $pleat_ratio,
        float $fabric_price_per_meter
    ): array {
        $fabric_meters = ($window_width_cm / 100) * $pleat_ratio;
        $fabric_cost = $fabric_meters * $fabric_price_per_meter;
        $sewing_cost = $fabric_meters * ICC_TUL_SEWING_COST_PER_METER;
        $total = $fabric_cost + $sewing_cost;

        return [
            'fabric_meters' => round($fabric_meters, 2),
            'fabric_cost'   => round($fabric_cost, 2),
            'sewing_cost'   => round($sewing_cost, 2),
            'total'         => round($total, 2),
        ];
    }

    public static function calculate_fon(
        int $panel_width_cm,
        float $pleat_ratio,
        float $fabric_price_per_meter
    ): array {
        $fabric_per_panel = ($panel_width_cm / 100) * $pleat_ratio;
        $total_fabric = $fabric_per_panel * 2;
        $fabric_cost = $total_fabric * $fabric_price_per_meter;
        $sewing_cost = ICC_FON_SEWING_COST_PER_PAIR;
        $total = $fabric_cost + $sewing_cost;

        return [
            'fabric_per_panel' => round($fabric_per_panel, 2),
            'total_fabric'     => round($total_fabric, 2),
            'fabric_cost'      => round($fabric_cost, 2),
            'sewing_cost'      => $sewing_cost,
            'total'            => round($total, 2),
        ];
    }

    public static function calculate_blackout(
        int $panel_width_cm,
        float $pleat_ratio,
        float $fabric_price_per_meter
    ): array {
        return self::calculate_fon($panel_width_cm, $pleat_ratio, $fabric_price_per_meter);
    }

    public static function calculate_saten(): array {
        return [
            'total' => ICC_SATEN_FIXED_PRICE,
        ];
    }

    public static function validate_pleat_ratio(float $pleat_ratio) {
        $valid_ratios = [2.0, 2.5, 3.0];
        if (!in_array($pleat_ratio, $valid_ratios, true)) {
            return new WP_Error('invalid_pleat', 'Gecersiz pile orani. Kabul edilen: 1:2, 1:2.5, 1:3');
        }
        return true;
    }

    public static function validate_width(int $width_cm, int $min = 50, int $max = 600) {
        if ($width_cm < $min || $width_cm > $max) {
            return new WP_Error(
                'invalid_width',
                sprintf('Genislik %d-%d cm arasinda olmalidir.', $min, $max)
            );
        }
        return true;
    }
}
```

- [ ] **Step 3: Create main plugin file**

Create `plugin/inanc-curtain-calculator/inanc-curtain-calculator.php`:

```php
<?php
/**
 * Plugin Name: Inanc Perde Fiyat Hesaplayici
 * Description: Metre bazli, pile carpanli perde fiyat hesaplama
 * Version: 2.0.0
 * Author: Inanc Tekstil
 * Requires Plugins: woocommerce
 */

defined('ABSPATH') || exit;

define('ICC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ICC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ICC_VERSION', '2.0.0');

// Constants
define('ICC_TUL_SEWING_COST_PER_METER', 25);
define('ICC_FON_SEWING_COST_PER_PAIR', 500);
define('ICC_SATEN_FIXED_PRICE', 150);
define('ICC_STANDARD_HEIGHT', 260);

// Autoload
require_once ICC_PLUGIN_DIR . 'includes/class-calculator.php';
require_once ICC_PLUGIN_DIR . 'includes/class-product-fields.php';
require_once ICC_PLUGIN_DIR . 'includes/class-frontend-form.php';
require_once ICC_PLUGIN_DIR . 'includes/class-cart-handler.php';
require_once ICC_PLUGIN_DIR . 'includes/class-order-handler.php';

// Init
add_action('plugins_loaded', function () {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function () {
            echo '<div class="error"><p>Inanc Perde Fiyat Hesaplayici icin WooCommerce gereklidir.</p></div>';
        });
        return;
    }

    new ICC_Product_Fields();
    new ICC_Frontend_Form();
    new ICC_Cart_Handler();
    new ICC_Order_Handler();
});

// Price display override: show "X TL / metre" instead of default price
add_filter('woocommerce_get_price_html', function (string $price_html, WC_Product $product): string {
    $product_type = get_post_meta($product->get_id(), '_icc_product_type', true);

    if (empty($product_type)) {
        return $price_html;
    }

    if ($product_type === 'saten') {
        return wc_price(ICC_SATEN_FIXED_PRICE) . ' / pencere';
    }

    $price_per_meter = get_post_meta($product->get_id(), '_icc_price_per_meter', true);
    if (!empty($price_per_meter)) {
        return wc_price($price_per_meter) . ' / metre';
    }

    return $price_html;
}, 10, 2);
```

- [ ] **Step 4: Commit scaffold + calculator**

```bash
git add plugin/inanc-curtain-calculator/inanc-curtain-calculator.php \
        plugin/inanc-curtain-calculator/includes/class-calculator.php
git commit -m "feat: add plugin scaffold and calculator engine

Tul, Fon, Blackout, Saten pricing formulas with validation.
Constants: sewing 25 TL/m (tul), 500 TL/pair (fon), 150 TL fixed (saten)."
```

### Task 2: Calculator Unit Tests

**Files:**
- Create: `plugin/inanc-curtain-calculator/tests/test-calculator.php`

The calculator class uses `ICC_*` constants and `WP_Error`. We stub these for standalone testing.

- [ ] **Step 1: Write calculator tests**

Create `plugin/inanc-curtain-calculator/tests/test-calculator.php`:

```php
<?php
/**
 * Standalone tests for ICC_Calculator.
 * Run: php plugin/inanc-curtain-calculator/tests/test-calculator.php
 *
 * Stubs WP_Error and constants so no WordPress install is needed.
 */

// Stub ABSPATH and WP_Error for standalone execution
if (!defined('ABSPATH')) {
    define('ABSPATH', true);
}

if (!class_exists('WP_Error')) {
    class WP_Error {
        private string $code;
        private string $message;
        public function __construct(string $code, string $message) {
            $this->code = $code;
            $this->message = $message;
        }
        public function get_error_message(): string {
            return $this->message;
        }
        public function get_error_code(): string {
            return $this->code;
        }
    }
}

function is_wp_error($thing): bool {
    return $thing instanceof WP_Error;
}

// Define constants
define('ICC_TUL_SEWING_COST_PER_METER', 25);
define('ICC_FON_SEWING_COST_PER_PAIR', 500);
define('ICC_SATEN_FIXED_PRICE', 150);
define('ICC_STANDARD_HEIGHT', 260);

require_once __DIR__ . '/../includes/class-calculator.php';

// --- Test runner ---
$passed = 0;
$failed = 0;

function assert_equals($expected, $actual, string $label): void {
    global $passed, $failed;
    if ($expected === $actual) {
        $passed++;
    } else {
        $failed++;
        echo "FAIL: $label\n  Expected: " . var_export($expected, true) . "\n  Actual:   " . var_export($actual, true) . "\n";
    }
}

function assert_true($value, string $label): void {
    assert_equals(true, $value, $label);
}

// --- Tul tests ---
// Spec example: 300cm, 1:3, 150 TL/m => 9m, fabric 1350, sewing 225, total 1575
$r = ICC_Calculator::calculate_tul(300, 3.0, 150.0);
assert_equals(9.0, $r['fabric_meters'], 'tul: 300cm 1:3 fabric_meters');
assert_equals(1350.0, $r['fabric_cost'], 'tul: 300cm 1:3 fabric_cost');
assert_equals(225.0, $r['sewing_cost'], 'tul: 300cm 1:3 sewing_cost');
assert_equals(1575.0, $r['total'], 'tul: 300cm 1:3 total');

// Minimum: 100cm, 1:2, 100 TL/m => 2m, fabric 200, sewing 50, total 250
$r = ICC_Calculator::calculate_tul(100, 2.0, 100.0);
assert_equals(2.0, $r['fabric_meters'], 'tul: 100cm 1:2 fabric_meters');
assert_equals(200.0, $r['fabric_cost'], 'tul: 100cm 1:2 fabric_cost');
assert_equals(50.0, $r['sewing_cost'], 'tul: 100cm 1:2 sewing_cost');
assert_equals(250.0, $r['total'], 'tul: 100cm 1:2 total');

// Maximum: 600cm, 1:3, 200 TL/m => 18m, fabric 3600, sewing 450, total 4050
$r = ICC_Calculator::calculate_tul(600, 3.0, 200.0);
assert_equals(18.0, $r['fabric_meters'], 'tul: 600cm 1:3 fabric_meters');
assert_equals(3600.0, $r['fabric_cost'], 'tul: 600cm 1:3 fabric_cost');
assert_equals(450.0, $r['sewing_cost'], 'tul: 600cm 1:3 sewing_cost');
assert_equals(4050.0, $r['total'], 'tul: 600cm 1:3 total');

// --- Fon tests ---
// Spec example: 100cm panel, 1:3, 400 TL/m => 3m/panel, 6m total, fabric 2400, sewing 500, total 2900
$r = ICC_Calculator::calculate_fon(100, 3.0, 400.0);
assert_equals(3.0, $r['fabric_per_panel'], 'fon: 100cm 1:3 fabric_per_panel');
assert_equals(6.0, $r['total_fabric'], 'fon: 100cm 1:3 total_fabric');
assert_equals(2400.0, $r['fabric_cost'], 'fon: 100cm 1:3 fabric_cost');
assert_equals(500, $r['sewing_cost'], 'fon: 100cm 1:3 sewing_cost');
assert_equals(2900.0, $r['total'], 'fon: 100cm 1:3 total');

// 80cm panel, 1:2.5, 350 TL/m => 2m/panel, 4m total, fabric 1400, sewing 500, total 1900
$r = ICC_Calculator::calculate_fon(80, 2.5, 350.0);
assert_equals(2.0, $r['fabric_per_panel'], 'fon: 80cm 1:2.5 fabric_per_panel');
assert_equals(4.0, $r['total_fabric'], 'fon: 80cm 1:2.5 total_fabric');
assert_equals(1400.0, $r['fabric_cost'], 'fon: 80cm 1:2.5 fabric_cost');
assert_equals(1900.0, $r['total'], 'fon: 80cm 1:2.5 total');

// 120cm panel, 1:3, 450 TL/m => 3.6m/panel, 7.2m total, fabric 3240, sewing 500, total 3740
$r = ICC_Calculator::calculate_fon(120, 3.0, 450.0);
assert_equals(3.6, $r['fabric_per_panel'], 'fon: 120cm 1:3 fabric_per_panel');
assert_equals(7.2, $r['total_fabric'], 'fon: 120cm 1:3 total_fabric');
assert_equals(3240.0, $r['fabric_cost'], 'fon: 120cm 1:3 fabric_cost');
assert_equals(3740.0, $r['total'], 'fon: 120cm 1:3 total');

// --- Blackout test (delegates to fon) ---
$r = ICC_Calculator::calculate_blackout(100, 3.0, 400.0);
assert_equals(2900.0, $r['total'], 'blackout: delegates to fon');

// --- Saten test ---
$r = ICC_Calculator::calculate_saten();
assert_equals(150, $r['total'], 'saten: fixed price 150');

// --- Validation tests ---
assert_true(ICC_Calculator::validate_pleat_ratio(2.0) === true, 'valid pleat 2.0');
assert_true(ICC_Calculator::validate_pleat_ratio(2.5) === true, 'valid pleat 2.5');
assert_true(ICC_Calculator::validate_pleat_ratio(3.0) === true, 'valid pleat 3.0');
assert_true(is_wp_error(ICC_Calculator::validate_pleat_ratio(4.0)), 'invalid pleat 4.0');
assert_true(is_wp_error(ICC_Calculator::validate_pleat_ratio(1.5)), 'invalid pleat 1.5');

assert_true(ICC_Calculator::validate_width(300) === true, 'valid width 300');
assert_true(is_wp_error(ICC_Calculator::validate_width(30)), 'invalid width 30 (too small)');
assert_true(is_wp_error(ICC_Calculator::validate_width(700)), 'invalid width 700 (too large)');
assert_true(ICC_Calculator::validate_width(100, 100, 600) === true, 'valid tul width 100');
assert_true(is_wp_error(ICC_Calculator::validate_width(99, 100, 600)), 'invalid tul width 99');

// Fon width validation (50-150 range)
assert_true(ICC_Calculator::validate_width(100, 50, 150) === true, 'valid fon width 100');
assert_true(ICC_Calculator::validate_width(50, 50, 150) === true, 'valid fon width 50 (min)');
assert_true(ICC_Calculator::validate_width(150, 50, 150) === true, 'valid fon width 150 (max)');
assert_true(is_wp_error(ICC_Calculator::validate_width(49, 50, 150)), 'invalid fon width 49');
assert_true(is_wp_error(ICC_Calculator::validate_width(151, 50, 150)), 'invalid fon width 151');

// --- Results ---
echo "\n" . ($passed + $failed) . " tests, $passed passed, $failed failed\n";
exit($failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
php plugin/inanc-curtain-calculator/tests/test-calculator.php
```

Expected: All tests pass (the calculator code matches the spec examples exactly).

- [ ] **Step 3: Commit tests**

```bash
git add plugin/inanc-curtain-calculator/tests/test-calculator.php
git commit -m "test: add calculator engine unit tests

Covers all spec examples: tul, fon, blackout, saten pricing.
Includes validation tests for pleat ratio and width bounds."
```

---

## Chunk 2: Admin Fields + Frontend Form + Templates

### Task 3: Admin Product Fields

**Files:**
- Create: `plugin/inanc-curtain-calculator/includes/class-product-fields.php`

- [ ] **Step 1: Create admin product fields class**

Create `plugin/inanc-curtain-calculator/includes/class-product-fields.php` with the complete class from spec (`docs/ecommerce/pricing-calculator.md` lines 397-495).

Fields added to WooCommerce product edit page:
- `_icc_product_type` — select: Tul/Fon/Blackout/Saten
- `_icc_kartela_code` — text: e.g. "TUL-2024-A15"
- `_icc_price_per_meter` — number: e.g. 150.00
- `_icc_available_pleats` — checkboxes: 1:2, 1:2.5, 1:3

Uses WooCommerce hooks:
- `woocommerce_product_options_general_product_data` to render fields
- `woocommerce_process_product_meta` to save fields

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/includes/class-product-fields.php
git commit -m "feat: add admin custom fields for curtain products

Product type selector, kartela code, price per meter, pleat ratios."
```

### Task 4: Frontend Form + Templates

**Files:**
- Create: `plugin/inanc-curtain-calculator/includes/class-frontend-form.php`
- Create: `plugin/inanc-curtain-calculator/templates/calculator-form-tul.php`
- Create: `plugin/inanc-curtain-calculator/templates/calculator-form-fon.php`
- Create: `plugin/inanc-curtain-calculator/templates/calculator-form-saten.php`

- [ ] **Step 1: Create frontend form class**

Create `plugin/inanc-curtain-calculator/includes/class-frontend-form.php` from spec (lines 503-589).

Hooks:
- `woocommerce_before_add_to_cart_button` — renders the calculator form
- `wp_enqueue_scripts` — loads JS + CSS, passes product data via `wp_localize_script`

- [ ] **Step 2: Create tul template**

Create `plugin/inanc-curtain-calculator/templates/calculator-form-tul.php` from spec (lines 631-669).

Form fields: window width (100-600cm), window height (default 260cm), pleat ratio dropdown, room name (optional). Result area shows fabric meters, fabric cost, sewing cost, total.

- [ ] **Step 3: Create fon template**

Create `plugin/inanc-curtain-calculator/templates/calculator-form-fon.php` from spec (lines 676-738).

Form fields: panel width (50-150cm), pleat ratio dropdown, room name. Result shows per-panel fabric, total fabric (2 panels), costs, total. Used for both fon and blackout types.

- [ ] **Step 4: Create saten template**

Create `plugin/inanc-curtain-calculator/templates/calculator-form-saten.php` from spec (lines 745-773).

Simple: room name field, hidden `icc_saten_fixed=1` input, fixed price display. No calculator needed.

- [ ] **Step 5: Commit**

```bash
git add plugin/inanc-curtain-calculator/includes/class-frontend-form.php \
        plugin/inanc-curtain-calculator/templates/
git commit -m "feat: add frontend calculator forms for tul, fon, saten

Renders type-specific form on product page with live price calculation."
```

---

## Chunk 3: Cart + Order + JS + CSS

### Task 5: JavaScript Live Calculation

**Files:**
- Create: `plugin/inanc-curtain-calculator/assets/js/curtain-calculator.js`

- [ ] **Step 1: Create JS calculator**

Create `plugin/inanc-curtain-calculator/assets/js/curtain-calculator.js` from spec (lines 783-911).

Features:
- Reads `window.iccData` (injected by `wp_localize_script`)
- `calculateTul()`: listens to width input + pleat select, computes fabric/sewing/total
- `calculateFon()`: listens to panel width + pleat select, computes per-panel/total/costs
- `formatPrice()`: Turkish locale formatting (e.g. "1.575,00 TL")
- Shows/hides result and error divs
- No calculation needed for saten (fixed price displayed server-side)

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/assets/js/curtain-calculator.js
git commit -m "feat: add frontend JS live price calculation

Turkish locale formatting, tul and fon calculators with input validation."
```

### Task 6: CSS Styles

**Files:**
- Create: `plugin/inanc-curtain-calculator/assets/css/curtain-calculator.css`

- [ ] **Step 1: Create CSS**

Create `plugin/inanc-curtain-calculator/assets/css/curtain-calculator.css` from spec (lines 1197-1305).

Styles: calculator wrapper with border/gradient, info box with blue left border, form fields with focus states, green result box with total highlight, red error box, saten-specific orange variant.

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/assets/css/curtain-calculator.css
git commit -m "feat: add calculator form CSS styles"
```

### Task 7: Cart Handler

**Files:**
- Create: `plugin/inanc-curtain-calculator/includes/class-cart-handler.php`

- [ ] **Step 1: Create cart handler class**

Create `plugin/inanc-curtain-calculator/includes/class-cart-handler.php` from spec (lines 920-1103).

4 hooks:
- `woocommerce_add_to_cart_validation` — validates width/pleat before adding
- `woocommerce_add_cart_item_data` — stores measurements as cart item meta
- `woocommerce_before_calculate_totals` — overrides price with calculated amount
- `woocommerce_get_item_data` — displays measurements in cart page

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/includes/class-cart-handler.php
git commit -m "feat: add cart handler with validation and price override

Validates dimensions on add-to-cart, stores measurements as meta,
calculates dynamic price, displays specs in cart."
```

### Task 8: Order Handler

**Files:**
- Create: `plugin/inanc-curtain-calculator/includes/class-order-handler.php`

- [ ] **Step 1: Create order handler class**

Create `plugin/inanc-curtain-calculator/includes/class-order-handler.php` from spec (lines 1112-1187).

Single hook: `woocommerce_checkout_create_order_line_item` — saves all measurements, calculations, and costs as order item meta. This data appears in admin order detail and is used for production.

Meta saved per type:
- **Tul:** window width, height, pleat ratio, fabric meters, fabric cost, sewing cost, total
- **Fon/Blackout:** panel width, pleat ratio, per-panel fabric, total fabric, costs, total
- **Saten:** fixed price
- **All:** product type, kartela code, room name

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/includes/class-order-handler.php
git commit -m "feat: add order handler to save production data

Saves measurements, calculations, costs as order line item meta
for production tracking in admin order detail."
```

---

## Chunk 4: Deployment + Testing

### Task 9: Deploy Plugin to Server

**Files:**
- Modify: `gitopsprod/docker/docker-compose.yml` (add plugin volume mount)

- [ ] **Step 1: Deploy plugin to server**

```bash
# Get server IP from terraform
cd gitopsprod && SERVER_IP=$(terraform output -raw server_ipv4) && cd ..

# Copy plugin to server
scp -r plugin/inanc-curtain-calculator root@$SERVER_IP:/opt/inanc-curtain-calculator

# SSH to server and update docker-compose
ssh root@$SERVER_IP
```

On server, add volume mount to docker-compose.yml:
```yaml
wordpress:
  volumes:
    - /opt/inanc-curtain-calculator:/var/www/html/wp-content/plugins/inanc-curtain-calculator:ro
```

Then restart:
```bash
cd /opt/docker && docker compose up -d wordpress
```

- [ ] **Step 5: Activate plugin in WordPress admin**

Navigate to: `https://inanctekstil.store/wp-admin/plugins.php`
Find "Inanc Perde Fiyat Hesaplayici" and click "Activate".

- [ ] **Step 6: Commit docker-compose changes**

```bash
git add gitopsprod/docker/docker-compose.yml
git commit -m "deploy: add curtain calculator plugin volume mount"
```

### Task 10: Manual Testing on Live Site

- [ ] **Step 1: Create a test Tul product**

```
WordPress Admin > WooCommerce > Products > Add New
  Name: Test Tul Kumasi
  SKU: TUL-TEST-001
  Regular Price: 0 (calculator overrides this)

Scroll to "Perde Tipi" section:
  Perde Tipi: Tul
  Kartela Kodu: TUL-TEST-001
  Metre Fiyati: 150
  Pile Oranlari: check all three (1:2, 1:2.5, 1:3)

Publish the product.
```

- [ ] **Step 2: Test Tul calculator on product page**

Visit the product page. Verify:
- Calculator form appears with width, height, pleat ratio, room name fields
- Enter width: 300, select pile 1:3
- Result should show: 9.00 metre, 1.350,00 TL fabric, 225,00 TL sewing, 1.575,00 TL total
- Price display shows "150,00 TL / metre" (not the default WooCommerce price)

- [ ] **Step 3: Test add to cart**

Click "Sepete Ekle". Verify:
- Cart page shows: Kartela: TUL-TEST-001, Pencere Eni: 300 cm, Pile: 1:3
- Price shows 1.575,00 TL
- Try adding with invalid width (e.g. 50cm) — should show validation error
- Try invalid pleat ratio — should show error
- Verify error messages display correctly in the UI

- [ ] **Step 4: Create and test Fon product**

```
Name: Test Fon Kumasi
Perde Tipi: Fon
Kartela Kodu: FON-TEST-001
Metre Fiyati: 400
Pile Oranlari: all three
```

Test: panel 100cm, pile 1:3 => 2.900,00 TL total

- [ ] **Step 5: Create and test Saten product**

```
Name: Saten Astar - Krem
Perde Tipi: Saten
Regular Price: 0
```

Test: page shows "150,00 TL / pencere", add to cart works, price is 150 TL.

- [ ] **Step 6: Test full checkout flow**

Add tul + saten to cart. Proceed to checkout (use PayTR sandbox or cash on delivery if available). Verify order in admin shows all meta: measurements, calculations, room name, kartela code.

- [ ] **Step 7: Clean up test products**

Delete or unpublish test products after verification.

- [ ] **Step 8: Final commit**

```bash
git add plugin/
git commit -m "feat: complete curtain calculator plugin v2.0.0

WooCommerce plugin with per-meter pricing for Tul, Fon, Blackout
curtains and fixed-price Saten. Live JS calculation, cart validation,
order meta for production tracking."
```

---

## Post-Implementation Notes

- Plugin source of truth: `plugin/inanc-curtain-calculator/`
- Deploy updates: `scp -r plugin/inanc-curtain-calculator root@<server>:/opt/inanc-curtain-calculator` then `docker compose restart wordpress`
- Constants (sewing costs, saten price) are in main plugin file — edit there when prices change
- To add a new product type: add calculation method to `class-calculator.php`, create template, update `class-frontend-form.php` switch statement
