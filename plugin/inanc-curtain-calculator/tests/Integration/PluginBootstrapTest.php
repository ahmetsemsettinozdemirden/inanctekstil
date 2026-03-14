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
