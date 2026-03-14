# Curtain Calculator Test Suite Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Docker-based PHPUnit test suite for the inanc-curtain-calculator WooCommerce plugin with unit and integration tests.

**Architecture:** Docker Compose with mysql:8.0 + php:8.2-cli containers. WordPress test framework (wp-phpunit) bootstraps a test WP+WooCommerce environment. PHPUnit 9.6 runs unit tests for calculator logic and integration tests for WooCommerce hooks (cart, order, product fields, frontend).

**Tech Stack:** PHP 8.2, PHPUnit 9.6, wp-phpunit 6.4, WooCommerce, Docker Compose, Composer

**Plugin root:** `plugin/inanc-curtain-calculator/`

---

## Chunk 1: Infrastructure (Docker, Composer, Bootstrap)

### Task 1: Create composer.json

**Files:**
- Create: `plugin/inanc-curtain-calculator/composer.json`

- [ ] **Step 1: Create composer.json**

```json
{
    "name": "inanc/curtain-calculator-tests",
    "description": "Test suite for Inanc Curtain Calculator plugin",
    "require-dev": {
        "phpunit/phpunit": "^9.6",
        "wp-phpunit/wp-phpunit": "^6.4",
        "yoast/phpunit-polyfills": "^2.0"
    },
    "config": {
        "allow-plugins": {
            "dealerdirect/phpcodesniffer-composer-installer": true
        }
    }
}
```

Note: WooCommerce is NOT a Composer dependency. The bootstrap script downloads it from GitHub releases to avoid Composer authentication issues with wpackagist.

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/composer.json
git commit -m "chore: add composer.json for test dependencies"
```

---

### Task 2: Create WP test framework install script

**Files:**
- Create: `plugin/inanc-curtain-calculator/bin/install-wp-tests.sh`

This script downloads WordPress test library and creates `wp-tests-config.php`. It is called by the Docker entrypoint.

- [ ] **Step 1: Create install script**

```bash
#!/usr/bin/env bash
# Downloads WordPress test framework for PHPUnit integration tests.
# Usage: ./install-wp-tests.sh <db-name> <db-user> <db-pass> <db-host> [wp-version]

set -euo pipefail

DB_NAME=${1:-wordpress_test}
DB_USER=${2:-root}
DB_PASS=${3:-root}
DB_HOST=${4:-db}
WP_VERSION=${5:-latest}
WC_VERSION=${6:-9.0.0}

WP_TESTS_DIR=${WP_TESTS_DIR:-/tmp/wordpress-tests-lib}
WP_CORE_DIR=${WP_CORE_DIR:-/tmp/wordpress}

download() {
    if command -v curl &>/dev/null; then
        curl -sL "$1" > "$2"
    elif command -v wget &>/dev/null; then
        wget -nv -O "$2" "$1"
    fi
}

if [ "$WP_VERSION" = "latest" ]; then
    WP_VERSION=$(curl -s https://api.wordpress.org/core/version-check/1.0/ | head -5 | tail -1)
fi

# Install WP core
mkdir -p "$WP_CORE_DIR"
if [ ! -f "$WP_CORE_DIR/wp-settings.php" ]; then
    echo "Downloading WordPress $WP_VERSION..."
    download "https://wordpress.org/wordpress-${WP_VERSION}.tar.gz" /tmp/wordpress.tar.gz
    tar --strip-components=1 -zxf /tmp/wordpress.tar.gz -C "$WP_CORE_DIR"
fi

# Install WP test suite
mkdir -p "$WP_TESTS_DIR"
if [ ! -f "$WP_TESTS_DIR/includes/functions.php" ]; then
    echo "Downloading WordPress test suite..."
    SVN_URL="https://develop.svn.wordpress.org/tags/${WP_VERSION}/tests/phpunit"
    # Try tag first, fall back to trunk
    if ! svn export --quiet "$SVN_URL/includes" "$WP_TESTS_DIR/includes" 2>/dev/null; then
        svn export --quiet "https://develop.svn.wordpress.org/trunk/tests/phpunit/includes" "$WP_TESTS_DIR/includes"
        svn export --quiet "https://develop.svn.wordpress.org/trunk/tests/phpunit/data" "$WP_TESTS_DIR/data"
    else
        svn export --quiet "$SVN_URL/data" "$WP_TESTS_DIR/data"
    fi
fi

# Install WooCommerce
WC_DIR="$WP_CORE_DIR/wp-content/plugins/woocommerce"
if [ ! -d "$WC_DIR" ]; then
    echo "Downloading WooCommerce $WC_VERSION..."
    download "https://github.com/woocommerce/woocommerce/releases/download/${WC_VERSION}/woocommerce.zip" /tmp/woocommerce.zip
    mkdir -p "$WP_CORE_DIR/wp-content/plugins"
    unzip -q /tmp/woocommerce.zip -d "$WP_CORE_DIR/wp-content/plugins/"
fi

# Create wp-tests-config.php
cat > "$WP_TESTS_DIR/wp-tests-config.php" <<EOF
<?php
define('ABSPATH', '${WP_CORE_DIR}/');
define('DB_NAME', '${DB_NAME}');
define('DB_USER', '${DB_USER}');
define('DB_PASSWORD', '${DB_PASS}');
define('DB_HOST', '${DB_HOST}');
define('DB_CHARSET', 'utf8');
define('DB_COLLATE', '');
define('WP_TESTS_DOMAIN', 'example.org');
define('WP_TESTS_EMAIL', 'admin@example.org');
define('WP_TESTS_TITLE', 'Test Blog');
define('WP_PHP_BINARY', 'php');
\$table_prefix = 'wptests_';
EOF

echo "WordPress test environment ready."
```

- [ ] **Step 2: Make executable and commit**

```bash
chmod +x plugin/inanc-curtain-calculator/bin/install-wp-tests.sh
git add plugin/inanc-curtain-calculator/bin/install-wp-tests.sh
git commit -m "chore: add WP test framework install script"
```

---

### Task 3: Create test bootstrap

**Files:**
- Create: `plugin/inanc-curtain-calculator/tests/bootstrap.php`

- [ ] **Step 1: Create bootstrap.php**

```php
<?php
/**
 * PHPUnit bootstrap for inanc-curtain-calculator tests.
 *
 * Loads WP test framework, activates WooCommerce, then loads our plugin.
 */

$plugin_dir = dirname(__DIR__);

// Composer autoloader
require_once $plugin_dir . '/vendor/autoload.php';

// WP test suite location
$_tests_dir = getenv('WP_TESTS_DIR') ?: '/tmp/wordpress-tests-lib';

if (!file_exists("{$_tests_dir}/includes/functions.php")) {
    echo "Could not find WordPress test framework at {$_tests_dir}.\n";
    echo "Run bin/install-wp-tests.sh first.\n";
    exit(1);
}

// Load WP test functions
require_once "{$_tests_dir}/includes/functions.php";

// Activate WooCommerce + our plugin before WP loads
tests_add_filter('muplugins_loaded', function () use ($plugin_dir) {
    $wp_dir = getenv('WP_CORE_DIR') ?: '/tmp/wordpress';
    $wc_path = "{$wp_dir}/wp-content/plugins/woocommerce/woocommerce.php";

    if (file_exists($wc_path)) {
        require $wc_path;
    } else {
        echo "WooCommerce not found at {$wc_path}.\n";
        exit(1);
    }

    require $plugin_dir . '/inanc-curtain-calculator.php';
});

// After WP loads, install WooCommerce tables
tests_add_filter('setup_theme', function () {
    WC_Install::install();

    $GLOBALS['wp_roles']->reinit();
    echo "Installing WooCommerce...\n";
});

// Boot WP test suite
require "{$_tests_dir}/includes/bootstrap.php";
```

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/tests/bootstrap.php
git commit -m "chore: add PHPUnit test bootstrap with WP+WC loading"
```

---

### Task 4: Create phpunit.xml.dist

**Files:**
- Create: `plugin/inanc-curtain-calculator/phpunit.xml.dist`

- [ ] **Step 1: Create phpunit.xml.dist**

```xml
<?xml version="1.0"?>
<phpunit
    bootstrap="tests/bootstrap.php"
    backupGlobals="false"
    colors="true"
    convertErrorsToExceptions="true"
    convertNoticesToExceptions="true"
    convertWarningsToExceptions="true"
>
    <testsuites>
        <testsuite name="unit">
            <directory suffix="Test.php">./tests/Unit</directory>
        </testsuite>
        <testsuite name="integration">
            <directory suffix="Test.php">./tests/Integration</directory>
        </testsuite>
    </testsuites>

    <php>
        <env name="WP_TESTS_DIR" value="/tmp/wordpress-tests-lib"/>
        <env name="WP_CORE_DIR" value="/tmp/wordpress"/>
    </php>
</phpunit>
```

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/phpunit.xml.dist
git commit -m "chore: add phpunit.xml.dist with unit and integration suites"
```

---

### Task 5: Create docker-compose.test.yml

**Files:**
- Create: `plugin/inanc-curtain-calculator/docker-compose.test.yml`

- [ ] **Step 1: Create docker-compose.test.yml**

```yaml
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: wordpress_test
    tmpfs:
      - /var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "--silent"]
      interval: 3s
      timeout: 3s
      retries: 10

  phpunit:
    image: php:8.2-cli
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - .:/app
    working_dir: /app
    environment:
      DB_NAME: wordpress_test
      DB_USER: root
      DB_PASS: root
      DB_HOST: db
      WP_TESTS_DIR: /tmp/wordpress-tests-lib
      WP_CORE_DIR: /tmp/wordpress
    entrypoint: >
      bash -c "
        apt-get update -qq &&
        apt-get install -y -qq subversion unzip libzip-dev default-mysql-client > /dev/null 2>&1 &&
        docker-php-ext-install mysqli pdo_mysql zip > /dev/null 2>&1 &&
        curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer > /dev/null 2>&1 &&
        composer install --no-interaction --quiet &&
        bash bin/install-wp-tests.sh wordpress_test root root db latest 9.0.0 &&
        vendor/bin/phpunit --colors=always
      "
```

- [ ] **Step 2: Add .gitignore for vendor directory**

Add to `plugin/inanc-curtain-calculator/.gitignore`:

```
/vendor/
composer.lock
```

- [ ] **Step 3: Commit**

```bash
git add plugin/inanc-curtain-calculator/docker-compose.test.yml plugin/inanc-curtain-calculator/.gitignore
git commit -m "chore: add Docker Compose test environment"
```

---

## Chunk 2: Unit Tests

### Task 6: Create CalculatorTest (Unit)

**Files:**
- Create: `plugin/inanc-curtain-calculator/tests/Unit/CalculatorTest.php`

These are pure unit tests — no WP/WC dependency needed. The bootstrap loads them anyway, but the tests only call static methods on `ICC_Calculator`.

- [ ] **Step 1: Create CalculatorTest.php**

```php
<?php

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

class CalculatorTest extends TestCase {

    // --- calculate_tul ---

    public function test_tul_standard_case() {
        $r = ICC_Calculator::calculate_tul(300, 3.0, 150.0);
        $this->assertSame(9.0, $r['fabric_meters']);
        $this->assertSame(1350.0, $r['fabric_cost']);
        $this->assertSame(225.0, $r['sewing_cost']);
        $this->assertSame(1575.0, $r['total']);
    }

    public function test_tul_minimum_width() {
        $r = ICC_Calculator::calculate_tul(100, 2.0, 100.0);
        $this->assertSame(2.0, $r['fabric_meters']);
        $this->assertSame(200.0, $r['fabric_cost']);
        $this->assertSame(50.0, $r['sewing_cost']);
        $this->assertSame(250.0, $r['total']);
    }

    public function test_tul_maximum_width() {
        $r = ICC_Calculator::calculate_tul(600, 3.0, 200.0);
        $this->assertSame(18.0, $r['fabric_meters']);
        $this->assertSame(3600.0, $r['fabric_cost']);
        $this->assertSame(450.0, $r['sewing_cost']);
        $this->assertSame(4050.0, $r['total']);
    }

    public function test_tul_pleat_ratio_2_5() {
        $r = ICC_Calculator::calculate_tul(200, 2.5, 120.0);
        $this->assertSame(5.0, $r['fabric_meters']);
        $this->assertSame(600.0, $r['fabric_cost']);
        $this->assertSame(125.0, $r['sewing_cost']);
        $this->assertSame(725.0, $r['total']);
    }

    // --- calculate_fon ---

    public function test_fon_standard_case() {
        $r = ICC_Calculator::calculate_fon(100, 3.0, 400.0);
        $this->assertSame(3.0, $r['fabric_per_panel']);
        $this->assertSame(6.0, $r['total_fabric']);
        $this->assertSame(2400.0, $r['fabric_cost']);
        $this->assertSame(500, $r['sewing_cost']);
        $this->assertSame(2900.0, $r['total']);
    }

    public function test_fon_minimum_panel_width() {
        $r = ICC_Calculator::calculate_fon(50, 2.0, 300.0);
        $this->assertSame(1.0, $r['fabric_per_panel']);
        $this->assertSame(2.0, $r['total_fabric']);
        $this->assertSame(600.0, $r['fabric_cost']);
        $this->assertSame(1100.0, $r['total']);
    }

    public function test_fon_pleat_ratio_2_5() {
        $r = ICC_Calculator::calculate_fon(80, 2.5, 350.0);
        $this->assertSame(2.0, $r['fabric_per_panel']);
        $this->assertSame(4.0, $r['total_fabric']);
        $this->assertSame(1400.0, $r['fabric_cost']);
        $this->assertSame(1900.0, $r['total']);
    }

    public function test_fon_always_two_panels() {
        $r = ICC_Calculator::calculate_fon(120, 3.0, 450.0);
        $this->assertSame($r['fabric_per_panel'] * 2, $r['total_fabric']);
    }

    // --- calculate_blackout ---

    public function test_blackout_delegates_to_fon() {
        $fon = ICC_Calculator::calculate_fon(100, 3.0, 400.0);
        $blackout = ICC_Calculator::calculate_blackout(100, 3.0, 400.0);
        $this->assertSame($fon, $blackout);
    }

    // --- calculate_saten ---

    public function test_saten_fixed_price() {
        $r = ICC_Calculator::calculate_saten();
        $this->assertSame(ICC_SATEN_FIXED_PRICE, $r['total']);
    }

    // --- validate_pleat_ratio ---

    /** @dataProvider validPleatRatioProvider */
    public function test_valid_pleat_ratios(float $ratio) {
        $this->assertTrue(ICC_Calculator::validate_pleat_ratio($ratio));
    }

    public function validPleatRatioProvider(): array {
        return [
            '1:2'   => [2.0],
            '1:2.5' => [2.5],
            '1:3'   => [3.0],
        ];
    }

    /** @dataProvider invalidPleatRatioProvider */
    public function test_invalid_pleat_ratios(float $ratio) {
        $this->assertWPError(ICC_Calculator::validate_pleat_ratio($ratio));
    }

    public function invalidPleatRatioProvider(): array {
        return [
            '1.0' => [1.0],
            '1.5' => [1.5],
            '4.0' => [4.0],
            '0'   => [0.0],
        ];
    }

    // --- validate_width ---

    public function test_valid_width_default_range() {
        $this->assertTrue(ICC_Calculator::validate_width(300));
    }

    public function test_invalid_width_too_small() {
        $this->assertWPError(ICC_Calculator::validate_width(30));
    }

    public function test_invalid_width_too_large() {
        $this->assertWPError(ICC_Calculator::validate_width(700));
    }

    public function test_valid_width_custom_range() {
        $this->assertTrue(ICC_Calculator::validate_width(100, 50, 150));
        $this->assertTrue(ICC_Calculator::validate_width(50, 50, 150));
        $this->assertTrue(ICC_Calculator::validate_width(150, 50, 150));
    }

    public function test_invalid_width_custom_range() {
        $this->assertWPError(ICC_Calculator::validate_width(49, 50, 150));
        $this->assertWPError(ICC_Calculator::validate_width(151, 50, 150));
    }

    // --- Helper ---

    private function assertWPError($actual, string $message = ''): void {
        $this->assertInstanceOf(WP_Error::class, $actual, $message);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/tests/Unit/CalculatorTest.php
git commit -m "test: add CalculatorTest unit tests"
```

---

## Chunk 3: Integration Tests

### Task 7: Create ProductFieldsTest

**Files:**
- Create: `plugin/inanc-curtain-calculator/tests/Integration/ProductFieldsTest.php`

- [ ] **Step 1: Create ProductFieldsTest.php**

```php
<?php

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

class ProductFieldsTest extends TestCase {

    private int $product_id;

    public function set_up(): void {
        parent::set_up();
        $product = new WC_Product_Simple();
        $product->set_name('Test Tul');
        $product->set_regular_price('100');
        $product->save();
        $this->product_id = $product->get_id();
    }

    public function tear_down(): void {
        wp_delete_post($this->product_id, true);
        parent::tear_down();
    }

    public function test_save_product_type() {
        $_POST['_icc_product_type'] = 'tul';
        $handler = new ICC_Product_Fields();
        $handler->save_custom_fields($this->product_id);

        $this->assertSame('tul', get_post_meta($this->product_id, '_icc_product_type', true));
    }

    public function test_save_kartela_code() {
        $_POST['_icc_kartela_code'] = 'TUL-2024-A15';
        $handler = new ICC_Product_Fields();
        $handler->save_custom_fields($this->product_id);

        $this->assertSame('TUL-2024-A15', get_post_meta($this->product_id, '_icc_kartela_code', true));
    }

    public function test_save_price_per_meter() {
        $_POST['_icc_price_per_meter'] = '150.50';
        $handler = new ICC_Product_Fields();
        $handler->save_custom_fields($this->product_id);

        $saved = get_post_meta($this->product_id, '_icc_price_per_meter', true);
        $this->assertEquals(150.50, (float) $saved);
    }

    public function test_save_available_pleats() {
        $_POST['_icc_available_pleats'] = ['2', '3'];
        $handler = new ICC_Product_Fields();
        $handler->save_custom_fields($this->product_id);

        $pleats = get_post_meta($this->product_id, '_icc_available_pleats', true);
        $this->assertSame(['2', '3'], $pleats);
    }

    public function test_empty_pleats_saves_empty_array() {
        // No _icc_available_pleats in POST
        unset($_POST['_icc_available_pleats']);
        $_POST['_icc_product_type'] = 'tul';
        $handler = new ICC_Product_Fields();
        $handler->save_custom_fields($this->product_id);

        $pleats = get_post_meta($this->product_id, '_icc_available_pleats', true);
        $this->assertSame([], $pleats);
    }

    public function test_sanitizes_html_in_kartela_code() {
        $_POST['_icc_kartela_code'] = '<script>alert("xss")</script>';
        $handler = new ICC_Product_Fields();
        $handler->save_custom_fields($this->product_id);

        $saved = get_post_meta($this->product_id, '_icc_kartela_code', true);
        $this->assertStringNotContainsString('<script>', $saved);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/tests/Integration/ProductFieldsTest.php
git commit -m "test: add ProductFieldsTest integration tests"
```

---

### Task 8: Create FrontendFormTest

**Files:**
- Create: `plugin/inanc-curtain-calculator/tests/Integration/FrontendFormTest.php`

- [ ] **Step 1: Create FrontendFormTest.php**

```php
<?php

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

class FrontendFormTest extends TestCase {

    private WC_Product_Simple $product;
    private ICC_Frontend_Form $form;

    public function set_up(): void {
        parent::set_up();
        $this->product = new WC_Product_Simple();
        $this->product->set_name('Test Tul');
        $this->product->set_regular_price('100');
        $this->product->save();
        $this->form = new ICC_Frontend_Form();
    }

    public function tear_down(): void {
        wp_delete_post($this->product->get_id(), true);
        parent::tear_down();
    }

    private function set_product_type(string $type): void {
        update_post_meta($this->product->get_id(), '_icc_product_type', $type);
    }

    public function test_tul_renders_tul_template() {
        $this->set_product_type('tul');
        update_post_meta($this->product->get_id(), '_icc_price_per_meter', '150');
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        ob_start();
        $this->form->render_calculator_form();
        $output = ob_get_clean();

        $this->assertStringContainsString('icc-calculator-tul', $output);
        $this->assertStringContainsString('Tul Perde Hesaplayici', $output);
        $this->assertStringContainsString('icc-window-width', $output);
    }

    public function test_fon_renders_fon_template() {
        $this->set_product_type('fon');
        update_post_meta($this->product->get_id(), '_icc_price_per_meter', '400');
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        ob_start();
        $this->form->render_calculator_form();
        $output = ob_get_clean();

        $this->assertStringContainsString('icc-calculator-fon', $output);
        $this->assertStringContainsString('icc-panel-width', $output);
    }

    public function test_blackout_renders_fon_template() {
        $this->set_product_type('blackout');
        update_post_meta($this->product->get_id(), '_icc_price_per_meter', '400');
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        ob_start();
        $this->form->render_calculator_form();
        $output = ob_get_clean();

        $this->assertStringContainsString('icc-calculator-fon', $output);
    }

    public function test_saten_renders_saten_template() {
        $this->set_product_type('saten');
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        ob_start();
        $this->form->render_calculator_form();
        $output = ob_get_clean();

        $this->assertStringContainsString('icc-calculator-saten', $output);
        $this->assertStringContainsString('Saten Astar', $output);
    }

    public function test_no_form_for_non_curtain_product() {
        // No _icc_product_type set
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        ob_start();
        $this->form->render_calculator_form();
        $output = ob_get_clean();

        $this->assertEmpty($output);
    }

    public function test_localize_script_data_types() {
        $this->set_product_type('tul');
        update_post_meta($this->product->get_id(), '_icc_price_per_meter', '150.50');
        update_post_meta($this->product->get_id(), '_icc_available_pleats', ['2', '2.5', '3']);
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        // Simulate is_product() context
        $this->go_to(get_permalink($this->product->get_id()));
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        $this->form->enqueue_assets();

        $data = wp_scripts()->get_data('icc-calculator', 'data');
        $this->assertNotEmpty($data, 'Localized script data should not be empty');
        // wp_localize_script outputs a JS string; verify the key values are present
        $this->assertStringContainsString('"tul"', $data);
        $this->assertStringContainsString('150.5', $data);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/tests/Integration/FrontendFormTest.php
git commit -m "test: add FrontendFormTest integration tests"
```

---

### Task 9: Create CartHandlerTest

**Files:**
- Create: `plugin/inanc-curtain-calculator/tests/Integration/CartHandlerTest.php`

- [ ] **Step 1: Create CartHandlerTest.php**

```php
<?php

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

class CartHandlerTest extends TestCase {

    private int $product_id;
    private ICC_Cart_Handler $handler;

    public function set_up(): void {
        parent::set_up();

        $product = new WC_Product_Simple();
        $product->set_name('Test Tul');
        $product->set_regular_price('100');
        $product->save();
        $this->product_id = $product->get_id();

        update_post_meta($this->product_id, '_icc_product_type', 'tul');
        update_post_meta($this->product_id, '_icc_price_per_meter', '150');
        update_post_meta($this->product_id, '_icc_kartela_code', 'TUL-001');

        $this->handler = new ICC_Cart_Handler();
    }

    public function tear_down(): void {
        WC()->cart->empty_cart();
        wp_delete_post($this->product_id, true);
        $_POST = [];
        parent::tear_down();
    }

    // --- Validation ---

    public function test_tul_valid_submission_passes() {
        $_POST['icc_window_width'] = '300';
        $_POST['icc_pleat_ratio'] = '3.0';

        $result = $this->handler->validate_add_to_cart(true, $this->product_id, 1);
        $this->assertTrue($result);
    }

    public function test_tul_invalid_width_rejects() {
        $_POST['icc_window_width'] = '50'; // min is 100
        $_POST['icc_pleat_ratio'] = '3.0';

        $result = $this->handler->validate_add_to_cart(true, $this->product_id, 1);
        $this->assertFalse($result);
    }

    public function test_tul_invalid_pleat_rejects() {
        $_POST['icc_window_width'] = '300';
        $_POST['icc_pleat_ratio'] = '4.0';

        $result = $this->handler->validate_add_to_cart(true, $this->product_id, 1);
        $this->assertFalse($result);
    }

    public function test_fon_invalid_width_rejects() {
        update_post_meta($this->product_id, '_icc_product_type', 'fon');
        $_POST['icc_panel_width'] = '200'; // max is 150
        $_POST['icc_pleat_ratio'] = '3.0';

        $result = $this->handler->validate_add_to_cart(true, $this->product_id, 1);
        $this->assertFalse($result);
    }

    public function test_non_curtain_product_passes_through() {
        update_post_meta($this->product_id, '_icc_product_type', '');

        $result = $this->handler->validate_add_to_cart(true, $this->product_id, 1);
        $this->assertTrue($result);
    }

    // --- Cart item data ---

    public function test_tul_cart_item_data_stored() {
        $_POST['icc_window_width'] = '300';
        $_POST['icc_window_height'] = '260';
        $_POST['icc_pleat_ratio'] = '3.0';
        $_POST['icc_room_name'] = 'Salon';

        $data = $this->handler->add_cart_item_data([], $this->product_id);

        $this->assertSame('tul', $data['icc_product_type']);
        $this->assertSame(300, $data['icc_window_width']);
        $this->assertSame(260, $data['icc_window_height']);
        $this->assertSame(3.0, $data['icc_pleat_ratio']);
        $this->assertSame('Salon', $data['icc_room_name']);
        $this->assertSame('TUL-001', $data['icc_kartela_code']);
        $this->assertArrayHasKey('unique_key', $data);
    }

    public function test_fon_cart_item_data_stored() {
        update_post_meta($this->product_id, '_icc_product_type', 'fon');
        $_POST['icc_panel_width'] = '100';
        $_POST['icc_pleat_ratio'] = '2.5';
        $_POST['icc_room_name'] = 'Yatak Odasi';

        $data = $this->handler->add_cart_item_data([], $this->product_id);

        $this->assertSame('fon', $data['icc_product_type']);
        $this->assertSame(100, $data['icc_panel_width']);
        $this->assertSame(2.5, $data['icc_pleat_ratio']);
    }

    public function test_non_curtain_product_no_data_added() {
        update_post_meta($this->product_id, '_icc_product_type', '');

        $data = $this->handler->add_cart_item_data([], $this->product_id);

        $this->assertArrayNotHasKey('icc_product_type', $data);
    }

    // --- Price override ---

    public function test_tul_price_override() {
        // 300cm, 1:3, 150 TL/m => fabric: 9m * 150 = 1350, sewing: 9 * 25 = 225, total: 1575
        WC()->cart->empty_cart();
        $_POST['icc_window_width'] = '300';
        $_POST['icc_window_height'] = '260';
        $_POST['icc_pleat_ratio'] = '3.0';
        $_POST['icc_room_name'] = '';
        WC()->cart->add_to_cart($this->product_id);

        // Trigger price calculation
        WC()->cart->calculate_totals();

        $cart_items = WC()->cart->get_cart();
        $item = reset($cart_items);
        $this->assertEquals(1575.0, (float) $item['data']->get_price());
    }

    public function test_saten_price_override() {
        update_post_meta($this->product_id, '_icc_product_type', 'saten');
        WC()->cart->empty_cart();
        $_POST['icc_room_name'] = '';
        WC()->cart->add_to_cart($this->product_id);

        WC()->cart->calculate_totals();

        $cart_items = WC()->cart->get_cart();
        $item = reset($cart_items);
        $this->assertEquals(ICC_SATEN_FIXED_PRICE, (float) $item['data']->get_price());
    }

    // --- Cart display ---

    public function test_tul_cart_display_data() {
        $cart_item = [
            'icc_product_type' => 'tul',
            'icc_kartela_code' => 'TUL-001',
            'icc_window_width' => 300,
            'icc_pleat_ratio'  => 3.0,
            'icc_room_name'    => 'Salon',
        ];

        $item_data = $this->handler->display_cart_item_data([], $cart_item);

        $keys = array_column($item_data, 'key');
        $this->assertContains('Kartela', $keys);
        $this->assertContains('Pencere Eni', $keys);
        $this->assertContains('Pile Orani', $keys);
        $this->assertContains('Oda', $keys);
    }

    public function test_fon_cart_display_data() {
        $cart_item = [
            'icc_product_type' => 'fon',
            'icc_kartela_code' => 'FON-001',
            'icc_panel_width'  => 100,
            'icc_pleat_ratio'  => 3.0,
            'icc_room_name'    => '',
        ];

        $item_data = $this->handler->display_cart_item_data([], $cart_item);

        $keys = array_column($item_data, 'key');
        $this->assertContains('Panel Eni', $keys);
        $this->assertContains('Pile Orani', $keys);
        $this->assertNotContains('Oda', $keys); // empty room name not shown
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/tests/Integration/CartHandlerTest.php
git commit -m "test: add CartHandlerTest integration tests"
```

---

### Task 10: Create OrderHandlerTest

**Files:**
- Create: `plugin/inanc-curtain-calculator/tests/Integration/OrderHandlerTest.php`

- [ ] **Step 1: Create OrderHandlerTest.php**

```php
<?php

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

class OrderHandlerTest extends TestCase {

    private int $product_id;
    private ICC_Order_Handler $handler;

    public function set_up(): void {
        parent::set_up();

        $product = new WC_Product_Simple();
        $product->set_name('Test Perde');
        $product->set_regular_price('100');
        $product->save();
        $this->product_id = $product->get_id();

        $this->handler = new ICC_Order_Handler();
    }

    public function tear_down(): void {
        wp_delete_post($this->product_id, true);
        parent::tear_down();
    }

    private function create_order_item(array $values): WC_Order_Item_Product {
        $order = wc_create_order();
        $item = new WC_Order_Item_Product();
        $item->set_product_id($this->product_id);
        $item->set_quantity(1);
        $order->add_item($item);
        $order->save();

        $this->handler->save_order_item_meta($item, 'test_key', $values, $order);

        return $item;
    }

    public function test_tul_order_meta() {
        update_post_meta($this->product_id, '_icc_price_per_meter', '150');

        $item = $this->create_order_item([
            'product_id'       => $this->product_id,
            'icc_product_type' => 'tul',
            'icc_kartela_code' => 'TUL-001',
            'icc_room_name'    => 'Salon',
            'icc_window_width' => 300,
            'icc_window_height'=> 260,
            'icc_pleat_ratio'  => 3.0,
        ]);

        $this->assertSame('Tul', $item->get_meta('Urun Tipi'));
        $this->assertSame('TUL-001', $item->get_meta('Kartela Kodu'));
        $this->assertSame('Salon', $item->get_meta('Oda Adi'));
        $this->assertEquals(300, $item->get_meta('Pencere Eni (cm)'));
        $this->assertEquals(260, $item->get_meta('Pencere Boyu (cm)'));
        $this->assertSame('1:3', $item->get_meta('Pile Orani'));
        $this->assertEquals(9.0, $item->get_meta('Gerekli Kumas (m)'));
        $this->assertEquals(1350.0, $item->get_meta('Kumas Maliyeti (TL)'));
        $this->assertEquals(225.0, $item->get_meta('Dikis Maliyeti (TL)'));
        $this->assertEquals(1575.0, $item->get_meta('Toplam Fiyat (TL)'));
    }

    public function test_fon_order_meta() {
        update_post_meta($this->product_id, '_icc_price_per_meter', '400');

        $item = $this->create_order_item([
            'product_id'       => $this->product_id,
            'icc_product_type' => 'fon',
            'icc_kartela_code' => 'FON-001',
            'icc_room_name'    => '',
            'icc_panel_width'  => 100,
            'icc_pleat_ratio'  => 3.0,
        ]);

        $this->assertSame('Fon', $item->get_meta('Urun Tipi'));
        $this->assertEquals(100, $item->get_meta('Panel Eni (cm)'));
        $this->assertSame('1:3', $item->get_meta('Pile Orani'));
        $this->assertEquals(3.0, $item->get_meta('Panel Basina Kumas (m)'));
        $this->assertEquals(6.0, $item->get_meta('Toplam Kumas (m)'));
        $this->assertEquals(2400.0, $item->get_meta('Kumas Maliyeti (TL)'));
        $this->assertEquals(500, $item->get_meta('Dikis Maliyeti (TL)'));
        $this->assertEquals(2900.0, $item->get_meta('Toplam Fiyat (TL)'));
    }

    public function test_saten_order_meta() {
        $item = $this->create_order_item([
            'product_id'       => $this->product_id,
            'icc_product_type' => 'saten',
            'icc_kartela_code' => '',
            'icc_room_name'    => '',
        ]);

        $this->assertSame('Saten', $item->get_meta('Urun Tipi'));
        $this->assertEquals(ICC_SATEN_FIXED_PRICE, $item->get_meta('Fiyat (TL)'));
    }

    public function test_non_curtain_product_no_meta() {
        $item = $this->create_order_item([
            'product_id' => $this->product_id,
            // no icc_product_type
        ]);

        $this->assertEmpty($item->get_meta('Urun Tipi'));
    }

    public function test_empty_kartela_not_saved() {
        $item = $this->create_order_item([
            'product_id'       => $this->product_id,
            'icc_product_type' => 'saten',
            'icc_kartela_code' => '',
            'icc_room_name'    => '',
        ]);

        $this->assertEmpty($item->get_meta('Kartela Kodu'));
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/tests/Integration/OrderHandlerTest.php
git commit -m "test: add OrderHandlerTest integration tests"
```

---

### Task 11: Create PluginBootstrapTest

**Files:**
- Create: `plugin/inanc-curtain-calculator/tests/Integration/PluginBootstrapTest.php`

- [ ] **Step 1: Create PluginBootstrapTest.php**

```php
<?php

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

class PluginBootstrapTest extends TestCase {

    private WC_Product_Simple $product;

    public function set_up(): void {
        parent::set_up();
        $this->product = new WC_Product_Simple();
        $this->product->set_name('Test Perde');
        $this->product->set_regular_price('100');
        $this->product->save();
    }

    public function tear_down(): void {
        wp_delete_post($this->product->get_id(), true);
        parent::tear_down();
    }

    public function test_tul_price_html_shows_per_metre() {
        update_post_meta($this->product->get_id(), '_icc_product_type', 'tul');
        update_post_meta($this->product->get_id(), '_icc_price_per_meter', '150');

        $product = wc_get_product($this->product->get_id());
        $html = $product->get_price_html();

        $this->assertStringContainsString('/ metre', $html);
        $this->assertStringContainsString('150', $html);
    }

    public function test_fon_price_html_shows_per_metre() {
        update_post_meta($this->product->get_id(), '_icc_product_type', 'fon');
        update_post_meta($this->product->get_id(), '_icc_price_per_meter', '400');

        $product = wc_get_product($this->product->get_id());
        $html = $product->get_price_html();

        $this->assertStringContainsString('/ metre', $html);
    }

    public function test_saten_price_html_shows_per_pencere() {
        update_post_meta($this->product->get_id(), '_icc_product_type', 'saten');

        $product = wc_get_product($this->product->get_id());
        $html = $product->get_price_html();

        $this->assertStringContainsString('/ pencere', $html);
        $this->assertStringContainsString('150', $html);
    }

    public function test_non_curtain_product_default_price_html() {
        // No _icc_product_type set
        $product = wc_get_product($this->product->get_id());
        $html = $product->get_price_html();

        $this->assertStringNotContainsString('/ metre', $html);
        $this->assertStringNotContainsString('/ pencere', $html);
    }

    public function test_plugin_constants_defined() {
        $this->assertTrue(defined('ICC_TUL_SEWING_COST_PER_METER'));
        $this->assertTrue(defined('ICC_FON_SEWING_COST_PER_PAIR'));
        $this->assertTrue(defined('ICC_SATEN_FIXED_PRICE'));
        $this->assertTrue(defined('ICC_STANDARD_HEIGHT'));
        $this->assertSame(25, ICC_TUL_SEWING_COST_PER_METER);
        $this->assertSame(500, ICC_FON_SEWING_COST_PER_PAIR);
        $this->assertSame(150, ICC_SATEN_FIXED_PRICE);
        $this->assertSame(260, ICC_STANDARD_HEIGHT);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugin/inanc-curtain-calculator/tests/Integration/PluginBootstrapTest.php
git commit -m "test: add PluginBootstrapTest integration tests"
```

---

## Chunk 4: Verify & Run

### Task 12: Run the full test suite

- [ ] **Step 1: Build and run Docker test suite**

```bash
cd plugin/inanc-curtain-calculator
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

Expected: all tests pass (green output).

- [ ] **Step 2: Fix any failures, re-run until green**

- [ ] **Step 3: Final commit**

```bash
git add -A plugin/inanc-curtain-calculator/
git commit -m "test: complete test suite with Docker Compose for curtain calculator"
```
