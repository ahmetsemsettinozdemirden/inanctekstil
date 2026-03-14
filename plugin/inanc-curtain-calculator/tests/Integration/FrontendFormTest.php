<?php

class FrontendFormTest extends WP_UnitTestCase {

    private WC_Product_Simple $product;
    private ICC_Frontend_Form $form;

    public function set_up(): void {
        parent::set_up();
        $this->product = new WC_Product_Simple();
        $this->product->set_name('Test Tul');
        $this->product->set_regular_price('100');
        $this->product->save();
        $this->form = new ICC_Frontend_Form();
    }

    public function tear_down(): void {
        wp_delete_post($this->product->get_id(), true);
        parent::tear_down();
    }

    private function set_product_type(string $type): void {
        update_post_meta($this->product->get_id(), '_icc_product_type', $type);
    }

    public function test_tul_renders_tul_template() {
        $this->set_product_type('tul');
        update_post_meta($this->product->get_id(), '_icc_price_per_meter', '150');
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        ob_start();
        $this->form->render_calculator_form();
        $output = ob_get_clean();

        $this->assertStringContainsString('icc-calculator-tul', $output);
        $this->assertStringContainsString('Tul Perde Hesaplayici', $output);
        $this->assertStringContainsString('icc-window-width', $output);
    }

    public function test_fon_renders_fon_template() {
        $this->set_product_type('fon');
        update_post_meta($this->product->get_id(), '_icc_price_per_meter', '400');
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        ob_start();
        $this->form->render_calculator_form();
        $output = ob_get_clean();

        $this->assertStringContainsString('icc-calculator-fon', $output);
        $this->assertStringContainsString('icc-panel-width', $output);
    }

    public function test_blackout_renders_fon_template() {
        $this->set_product_type('blackout');
        update_post_meta($this->product->get_id(), '_icc_price_per_meter', '400');
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        ob_start();
        $this->form->render_calculator_form();
        $output = ob_get_clean();

        $this->assertStringContainsString('icc-calculator-fon', $output);
    }

    public function test_saten_renders_saten_template() {
        $this->set_product_type('saten');
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        ob_start();
        $this->form->render_calculator_form();
        $output = ob_get_clean();

        $this->assertStringContainsString('icc-calculator-saten', $output);
        $this->assertStringContainsString('Saten Astar', $output);
    }

    public function test_no_form_for_non_curtain_product() {
        // No _icc_product_type set
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        ob_start();
        $this->form->render_calculator_form();
        $output = ob_get_clean();

        $this->assertEmpty($output);
    }

    public function test_localize_script_data_types() {
        $this->set_product_type('tul');
        update_post_meta($this->product->get_id(), '_icc_price_per_meter', '150.50');
        update_post_meta($this->product->get_id(), '_icc_available_pleats', ['2', '2.5', '3']);
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        // Simulate is_product() context
        $this->go_to(get_permalink($this->product->get_id()));
        $GLOBALS['product'] = wc_get_product($this->product->get_id());

        $this->form->enqueue_assets();

        $data = wp_scripts()->get_data('icc-calculator', 'data');
        $this->assertNotEmpty($data, 'Localized script data should not be empty');
        // wp_localize_script outputs a JS string; verify the key values are present
        $this->assertStringContainsString('"tul"', $data);
        $this->assertStringContainsString('150.5', $data);
    }
}
