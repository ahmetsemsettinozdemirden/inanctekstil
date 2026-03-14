<?php
defined('ABSPATH') || exit;

class ICC_Product_Fields {

    public function __construct() {
        add_action('woocommerce_product_options_general_product_data', [$this, 'add_custom_fields']);
        add_action('woocommerce_process_product_meta', [$this, 'save_custom_fields']);
    }

    public function add_custom_fields(): void {
        global $post;

        echo '<div class="options_group">';

        woocommerce_wp_select([
            'id'      => '_icc_product_type',
            'label'   => 'Perde Tipi',
            'options' => [
                ''         => 'Seciniz',
                'tul'      => 'Tul',
                'fon'      => 'Fon',
                'blackout' => 'Blackout',
                'saten'    => 'Saten',
            ],
            'desc_tip' => true,
            'description' => 'Bu urunun perde tipi',
        ]);

        woocommerce_wp_text_input([
            'id'    => '_icc_kartela_code',
            'label' => 'Kartela Kodu',
            'placeholder' => 'Orn: TUL-2024-A15',
            'desc_tip' => true,
            'description' => 'Kumasin kartela kodu',
        ]);

        woocommerce_wp_text_input([
            'id'          => '_icc_price_per_meter',
            'label'       => 'Metre Fiyati (TL/m)',
            'type'        => 'number',
            'custom_attributes' => [
                'step' => '0.01',
                'min'  => '0',
            ],
            'desc_tip' => true,
            'description' => 'Kumasin metre basina fiyati. Saten icin kullanilmaz.',
        ]);

        $available_pleats = get_post_meta($post->ID, '_icc_available_pleats', true);
        if (!is_array($available_pleats)) {
            $available_pleats = [];
        }

        echo '<p class="form-field"><label>Mevcut Pile Oranlari</label></p>';
        echo '<fieldset class="form-field" style="padding-left: 20px;">';

        foreach ([2 => '1:2', 2.5 => '1:2.5', 3 => '1:3'] as $ratio => $label) {
            $checked = in_array((string)$ratio, $available_pleats, true) ? 'checked' : '';
            echo '<label style="display: inline-block; margin-right: 15px;">';
            echo '<input type="checkbox" name="_icc_available_pleats[]" value="' . esc_attr($ratio) . '" ' . $checked . '> ';
            echo esc_html($label);
            echo '</label>';
        }

        echo '</fieldset>';
        echo '</div>';
    }

    public function save_custom_fields(int $post_id): void {
        if (isset($_POST['_icc_product_type'])) {
            update_post_meta($post_id, '_icc_product_type', sanitize_text_field($_POST['_icc_product_type']));
        }
        if (isset($_POST['_icc_kartela_code'])) {
            update_post_meta($post_id, '_icc_kartela_code', sanitize_text_field($_POST['_icc_kartela_code']));
        }
        if (isset($_POST['_icc_price_per_meter'])) {
            update_post_meta($post_id, '_icc_price_per_meter', wc_format_decimal($_POST['_icc_price_per_meter']));
        }
        if (isset($_POST['_icc_available_pleats'])) {
            $pleats = array_map('sanitize_text_field', $_POST['_icc_available_pleats']);
            update_post_meta($post_id, '_icc_available_pleats', $pleats);
        } else {
            update_post_meta($post_id, '_icc_available_pleats', []);
        }
    }
}
