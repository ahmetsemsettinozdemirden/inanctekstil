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
