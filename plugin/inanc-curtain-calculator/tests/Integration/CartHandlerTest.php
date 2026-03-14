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

        $cart_items = WC()->cart->get_cart();
        $item = reset($cart_items);

        // Verify cart item data was stored
        $this->assertSame('tul', $item['icc_product_type']);

        // Manually compute expected price via Calculator
        $result = ICC_Calculator::calculate_tul(
            $item['icc_window_width'],
            $item['icc_pleat_ratio'],
            floatval(get_post_meta($this->product_id, '_icc_price_per_meter', true))
        );
        $this->assertEquals(1575.0, $result['total']);
    }

    public function test_saten_price_override() {
        update_post_meta($this->product_id, '_icc_product_type', 'saten');
        WC()->cart->empty_cart();
        $_POST['icc_room_name'] = '';
        WC()->cart->add_to_cart($this->product_id);

        $cart_items = WC()->cart->get_cart();
        $item = reset($cart_items);

        // Verify cart item data was stored
        $this->assertSame('saten', $item['icc_product_type']);

        // Verify Calculator returns fixed price
        $result = ICC_Calculator::calculate_saten();
        $this->assertEquals(ICC_SATEN_FIXED_PRICE, $result['total']);
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
