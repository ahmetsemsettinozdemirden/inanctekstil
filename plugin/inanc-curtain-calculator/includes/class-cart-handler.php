<?php
defined('ABSPATH') || exit;

class ICC_Cart_Handler {

    public function __construct() {
        add_filter('woocommerce_add_to_cart_validation', [$this, 'validate_add_to_cart'], 10, 3);
        add_filter('woocommerce_add_cart_item_data', [$this, 'add_cart_item_data'], 10, 2);
        add_action('woocommerce_before_calculate_totals', [$this, 'calculate_custom_price'], 20, 1);
        add_filter('woocommerce_get_item_data', [$this, 'display_cart_item_data'], 10, 2);
    }

    public function validate_add_to_cart(bool $passed, int $product_id, int $quantity): bool {
        $product_type = get_post_meta($product_id, '_icc_product_type', true);
        if (empty($product_type)) {
            return $passed;
        }

        if ($product_type === 'tul') {
            $width = intval($_POST['icc_window_width'] ?? 0);
            $pleat = floatval($_POST['icc_pleat_ratio'] ?? 0);

            $width_check = ICC_Calculator::validate_width($width, 100, 600);
            if (is_wp_error($width_check)) {
                wc_add_notice($width_check->get_error_message(), 'error');
                return false;
            }

            $pleat_check = ICC_Calculator::validate_pleat_ratio($pleat);
            if (is_wp_error($pleat_check)) {
                wc_add_notice($pleat_check->get_error_message(), 'error');
                return false;
            }
        }

        if ($product_type === 'fon' || $product_type === 'blackout') {
            $width = intval($_POST['icc_panel_width'] ?? 0);
            $pleat = floatval($_POST['icc_pleat_ratio'] ?? 0);

            $width_check = ICC_Calculator::validate_width($width, 50, 150);
            if (is_wp_error($width_check)) {
                wc_add_notice($width_check->get_error_message(), 'error');
                return false;
            }

            $pleat_check = ICC_Calculator::validate_pleat_ratio($pleat);
            if (is_wp_error($pleat_check)) {
                wc_add_notice($pleat_check->get_error_message(), 'error');
                return false;
            }
        }

        return $passed;
    }

    public function add_cart_item_data(array $cart_item_data, int $product_id): array {
        $product_type = get_post_meta($product_id, '_icc_product_type', true);
        if (empty($product_type)) {
            return $cart_item_data;
        }

        $cart_item_data['icc_product_type'] = $product_type;
        $cart_item_data['icc_kartela_code'] = get_post_meta($product_id, '_icc_kartela_code', true);
        $cart_item_data['icc_room_name'] = sanitize_text_field($_POST['icc_room_name'] ?? '');

        if ($product_type === 'tul') {
            $cart_item_data['icc_window_width'] = intval($_POST['icc_window_width'] ?? 0);
            $cart_item_data['icc_window_height'] = intval($_POST['icc_window_height'] ?? ICC_STANDARD_HEIGHT);
            $cart_item_data['icc_pleat_ratio'] = floatval($_POST['icc_pleat_ratio'] ?? 0);
        }

        if ($product_type === 'fon' || $product_type === 'blackout') {
            $cart_item_data['icc_panel_width'] = intval($_POST['icc_panel_width'] ?? 0);
            $cart_item_data['icc_pleat_ratio'] = floatval($_POST['icc_pleat_ratio'] ?? 0);
        }

        $cart_item_data['unique_key'] = md5(json_encode($cart_item_data));

        return $cart_item_data;
    }

    public function calculate_custom_price(WC_Cart $cart): void {
        if (is_admin() && !defined('DOING_AJAX')) {
            return;
        }

        if (did_action('woocommerce_before_calculate_totals') >= 2) {
            return;
        }

        foreach ($cart->get_cart() as $cart_item) {
            if (!isset($cart_item['icc_product_type'])) {
                continue;
            }

            $product_id = $cart_item['product_id'];
            $product_type = $cart_item['icc_product_type'];
            $price_per_meter = floatval(get_post_meta($product_id, '_icc_price_per_meter', true));

            if ($product_type === 'tul') {
                $result = ICC_Calculator::calculate_tul(
                    $cart_item['icc_window_width'],
                    $cart_item['icc_pleat_ratio'],
                    $price_per_meter
                );
                $cart_item['data']->set_price($result['total']);
            }

            if ($product_type === 'fon' || $product_type === 'blackout') {
                $result = ICC_Calculator::calculate_fon(
                    $cart_item['icc_panel_width'],
                    $cart_item['icc_pleat_ratio'],
                    $price_per_meter
                );
                $cart_item['data']->set_price($result['total']);
            }

            if ($product_type === 'saten') {
                $result = ICC_Calculator::calculate_saten();
                $cart_item['data']->set_price($result['total']);
            }
        }
    }

    public function display_cart_item_data(array $item_data, array $cart_item): array {
        if (!isset($cart_item['icc_product_type'])) {
            return $item_data;
        }

        $product_type = $cart_item['icc_product_type'];

        if (!empty($cart_item['icc_kartela_code'])) {
            $item_data[] = [
                'key'   => 'Kartela',
                'value' => $cart_item['icc_kartela_code'],
            ];
        }

        if ($product_type === 'tul') {
            $item_data[] = [
                'key'   => 'Pencere Eni',
                'value' => $cart_item['icc_window_width'] . ' cm',
            ];
            $item_data[] = [
                'key'   => 'Pile Orani',
                'value' => '1:' . $cart_item['icc_pleat_ratio'],
            ];
        }

        if ($product_type === 'fon' || $product_type === 'blackout') {
            $item_data[] = [
                'key'   => 'Panel Eni',
                'value' => $cart_item['icc_panel_width'] . ' cm',
            ];
            $item_data[] = [
                'key'   => 'Pile Orani',
                'value' => '1:' . $cart_item['icc_pleat_ratio'],
            ];
        }

        if (!empty($cart_item['icc_room_name'])) {
            $item_data[] = [
                'key'   => 'Oda',
                'value' => $cart_item['icc_room_name'],
            ];
        }

        return $item_data;
    }
}
