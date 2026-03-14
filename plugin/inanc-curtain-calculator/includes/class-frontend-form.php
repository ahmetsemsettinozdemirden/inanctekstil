<?php
defined('ABSPATH') || exit;

class ICC_Frontend_Form {

    public function __construct() {
        add_action('woocommerce_before_add_to_cart_button', [$this, 'render_calculator_form']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    public function render_calculator_form(): void {
        global $product;

        $product_type = get_post_meta($product->get_id(), '_icc_product_type', true);
        if (empty($product_type)) {
            return;
        }

        $price_per_meter = get_post_meta($product->get_id(), '_icc_price_per_meter', true);
        $kartela_code = get_post_meta($product->get_id(), '_icc_kartela_code', true);
        $available_pleats = get_post_meta($product->get_id(), '_icc_available_pleats', true);

        if (!is_array($available_pleats)) {
            $available_pleats = [2, 2.5, 3];
        }

        switch ($product_type) {
            case 'tul':
                include ICC_PLUGIN_DIR . 'templates/calculator-form-tul.php';
                break;
            case 'fon':
            case 'blackout':
                include ICC_PLUGIN_DIR . 'templates/calculator-form-fon.php';
                break;
            case 'saten':
                include ICC_PLUGIN_DIR . 'templates/calculator-form-saten.php';
                break;
        }
    }

    public function enqueue_assets(): void {
        if (!is_product()) {
            return;
        }

        global $post;
        $product = wc_get_product($post->ID);
        if (!$product) {
            return;
        }
        $product_type = get_post_meta($product->get_id(), '_icc_product_type', true);
        if (empty($product_type)) {
            return;
        }

        wp_enqueue_style(
            'icc-calculator',
            ICC_PLUGIN_URL . 'assets/css/curtain-calculator.css',
            [],
            ICC_VERSION
        );

        wp_enqueue_script(
            'icc-calculator',
            ICC_PLUGIN_URL . 'assets/js/curtain-calculator.js',
            [],
            ICC_VERSION,
            true
        );

        $price_per_meter = floatval(get_post_meta($product->get_id(), '_icc_price_per_meter', true));
        $available_pleats = get_post_meta($product->get_id(), '_icc_available_pleats', true);

        wp_localize_script('icc-calculator', 'iccData', [
            'productType'     => $product_type,
            'pricePerMeter'   => $price_per_meter,
            'availablePleats' => is_array($available_pleats) ? $available_pleats : [2, 2.5, 3],
            'tulSewingCost'   => ICC_TUL_SEWING_COST_PER_METER,
            'fonSewingCost'   => ICC_FON_SEWING_COST_PER_PAIR,
            'satenPrice'      => ICC_SATEN_FIXED_PRICE,
            'currency'        => 'TL',
        ]);
    }
}
