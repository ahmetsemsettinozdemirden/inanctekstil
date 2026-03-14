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
