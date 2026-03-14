<?php
defined('ABSPATH') || exit;

class ICC_Order_Handler {

    public function __construct() {
        add_action('woocommerce_checkout_create_order_line_item', [$this, 'save_order_item_meta'], 10, 4);
    }

    public function save_order_item_meta(
        WC_Order_Item_Product $item,
        string $cart_item_key,
        array $values,
        WC_Order $order
    ): void {
        if (!isset($values['icc_product_type'])) {
            return;
        }

        $product_type = $values['icc_product_type'];
        $product_id = $values['product_id'];
        $price_per_meter = floatval(get_post_meta($product_id, '_icc_price_per_meter', true));

        $item->add_meta_data('Urun Tipi', ucfirst($product_type));
        if (!empty($values['icc_kartela_code'])) {
            $item->add_meta_data('Kartela Kodu', $values['icc_kartela_code']);
        }
        if (!empty($values['icc_room_name'])) {
            $item->add_meta_data('Oda Adi', $values['icc_room_name']);
        }

        if ($product_type === 'tul') {
            $result = ICC_Calculator::calculate_tul(
                $values['icc_window_width'],
                $values['icc_pleat_ratio'],
                $price_per_meter
            );

            $item->add_meta_data('Pencere Eni (cm)', $values['icc_window_width']);
            $item->add_meta_data('Pencere Boyu (cm)', $values['icc_window_height']);
            $item->add_meta_data('Pile Orani', '1:' . $values['icc_pleat_ratio']);
            $item->add_meta_data('Gerekli Kumas (m)', $result['fabric_meters']);
            $item->add_meta_data('Kumas Maliyeti (TL)', $result['fabric_cost']);
            $item->add_meta_data('Dikis Maliyeti (TL)', $result['sewing_cost']);
            $item->add_meta_data('Toplam Fiyat (TL)', $result['total']);
        }

        if ($product_type === 'fon' || $product_type === 'blackout') {
            $result = ICC_Calculator::calculate_fon(
                $values['icc_panel_width'],
                $values['icc_pleat_ratio'],
                $price_per_meter
            );

            $item->add_meta_data('Panel Eni (cm)', $values['icc_panel_width']);
            $item->add_meta_data('Pile Orani', '1:' . $values['icc_pleat_ratio']);
            $item->add_meta_data('Panel Basina Kumas (m)', $result['fabric_per_panel']);
            $item->add_meta_data('Toplam Kumas (m)', $result['total_fabric']);
            $item->add_meta_data('Kumas Maliyeti (TL)', $result['fabric_cost']);
            $item->add_meta_data('Dikis Maliyeti (TL)', $result['sewing_cost']);
            $item->add_meta_data('Toplam Fiyat (TL)', $result['total']);
        }

        if ($product_type === 'saten') {
            $item->add_meta_data('Fiyat (TL)', ICC_SATEN_FIXED_PRICE);
        }
    }
}
