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
