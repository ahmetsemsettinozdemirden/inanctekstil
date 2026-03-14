# Curtain Calculator Plugin Test Suite Design

## Goal

Create a comprehensive PHPUnit test suite for the `inanc-curtain-calculator` plugin using Docker Compose, covering unit and integration tests against a real WordPress + WooCommerce environment.

## Architecture

### Docker Compose Setup

Two containers via `docker-compose.test.yml`:

- **db**: `mysql:8.0` — test database, ephemeral
- **phpunit**: `php:8.2-cli` with Composer, wp-phpunit, WooCommerce — runs tests

The PHPUnit container installs WordPress test framework and WooCommerce into a temporary directory, bootstraps them, then runs the test suite.

### Dependencies (Composer)

- `phpunit/phpunit` ^9.6
- `wp-phpunit/wp-phpunit` ^6.4
- `woocommerce/woocommerce` (for test stubs/integration)
- `yoast/phpunit-polyfills` ^2.0 (required by wp-phpunit)

### Test Bootstrap

`tests/bootstrap.php` will:

1. Load Composer autoloader
2. Set WordPress test config (DB host, name, credentials from env vars)
3. Load WordPress test framework (`wp-tests-lib`)
4. Install and activate WooCommerce before tests
5. Load the plugin

### File Structure

```
plugin/inanc-curtain-calculator/
├── docker-compose.test.yml
├── composer.json
├── phpunit.xml.dist
├── bin/
│   └── install-wp-tests.sh        # Downloads WP test framework
├── tests/
│   ├── bootstrap.php              # Test bootstrap
│   ├── Unit/
│   │   └── CalculatorTest.php     # Pure calculation + validation tests
│   └── Integration/
│       ├── ProductFieldsTest.php  # Admin meta save/load
│       ├── FrontendFormTest.php   # Template selection, asset enqueue, localize data
│       ├── CartHandlerTest.php    # Validation, cart data, price override
│       ├── OrderHandlerTest.php   # Order line item meta
│       └── PluginBootstrapTest.php # Price HTML filter, WC dependency
```

The existing `tests/test-calculator.php` standalone file will be kept as-is for quick local testing without Docker.

## Test Coverage

### Unit Tests — CalculatorTest

- `calculate_tul()`: standard cases, boundary widths, all pleat ratios
- `calculate_fon()`: standard cases, boundary widths, 2-panel math
- `calculate_blackout()`: delegates to fon
- `calculate_saten()`: fixed price
- `validate_pleat_ratio()`: valid (2.0, 2.5, 3.0) and invalid values
- `validate_width()`: valid ranges, boundary values, custom min/max

### Integration Tests — ProductFieldsTest

- Save all custom fields via `woocommerce_process_product_meta`
- Load saved fields and verify values
- Empty pleat selection saves empty array
- Product type dropdown options

### Integration Tests — FrontendFormTest

- Correct template loaded per product type (tul/fon/blackout/saten)
- No form rendered for non-curtain products
- CSS and JS enqueued only on curtain product pages
- `wp_localize_script` data contains correct values with numeric types

### Integration Tests — CartHandlerTest

- Valid tul submission passes validation
- Invalid width rejected with WC notice
- Invalid pleat ratio rejected
- Cart item data stored correctly (product type, widths, pleat, room name)
- Price override: tul, fon, blackout, saten prices calculated correctly
- Cart display shows correct metadata (kartela, dimensions, room)

### Integration Tests — OrderHandlerTest

- Tul order: all meta fields saved (width, height, pleat, fabric meters, costs)
- Fon order: all meta fields saved (panel width, pleat, fabric per panel, total fabric, costs)
- Saten order: fixed price meta saved
- Non-curtain products: no meta added

### Integration Tests — PluginBootstrapTest

- Price HTML filter shows "X TL / metre" for tul/fon/blackout
- Price HTML filter shows "X TL / pencere" for saten
- Non-curtain products show default price HTML

## Usage

```bash
# Run all tests
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Run specific test class
docker compose -f docker-compose.test.yml run --rm phpunit vendor/bin/phpunit --filter=CalculatorTest
```
