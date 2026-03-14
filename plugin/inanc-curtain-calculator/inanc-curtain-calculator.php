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
