# Perde Fiyat Hesaplama Eklentisi -- Teknik Spesifikasyon (v2.0)

## Genel Bakış

`inanc-curtain-calculator` özel bir WordPress/WooCommerce eklentisidir. Yeni fiyatlandırma modelinde, ürün tipine göre farklı hesaplama formülleri kullanılır. Eski metrekare bazlı sistem kaldırıldı, yeni sistem metre bazlı ve pile çarpanları ile çalışır.

---

## Yeni Fiyatlandırma Modeli

### Ürün Tipleri ve Formüller

#### 1. TÜL (Sheer/Tulle)

**Müşteri Girdileri:**
- Pencere eni (cm)
- Pencere boyu (cm) - varsayılan 260 cm
- Pile oranı (1:2, 1:2.5, 1:3)

**Formül:**
```
gerekli_kumaş_metre = (pencere_eni_cm / 100) × pile_oranı
toplam_fiyat = (gerekli_kumaş_metre × kumaş_metre_fiyatı) + (gerekli_kumaş_metre × dikiş_maliyeti_metre)
```

**Sabitler:**
- Dikiş maliyeti: 25 TL/metre
- Standart boy: 260 cm (kumaş 260cm boy rulolardan gelir, boy fiyatı etkilemez)

**Örnek:**
- Pencere eni: 300 cm
- Pile oranı: 1:3
- Kumaş fiyatı: 150 TL/metre
- Hesaplama: (300/100) × 3 = 9 metre
- Toplam: (9 × 150) + (9 × 25) = 1.350 + 225 = 1.575 TL

---

#### 2. SATEN (Satin Lining)

**Sabit Fiyat Ürün:**
- Pencere başına: 150 TL
- Hesaplama yok, sepete direkt ekle
- Renkler: krem, beyaz
- Alternatif: blackout (farklı fiyat)

---

#### 3. FON (Decorative Side Panels)

**Müşteri Girdileri:**
- Panel eni (50-150 cm arası, tipik: 80cm veya 100cm)
- Pile oranı (1:2, 1:2.5, 1:3)

**Formül:**
```
kumaş_panel_başına = (panel_eni_cm / 100) × pile_oranı
toplam_kumaş = kumaş_panel_başına × 2  (çift panel)
toplam_fiyat = (toplam_kumaş × kumaş_metre_fiyatı) + dikiş_maliyeti_çift
```

**Sabitler:**
- Dikiş maliyeti: 500 TL (çift panel için sabit)
- Her zaman çift satılır (2 panel)

**Varsayılan Konfigürasyonlar (müşteri farklı seçebilir):**
- 100cm panel, 1:3 pile → 3m/panel → 6m toplam
- 80cm panel, 1:2.5 pile → 2m/panel → 4m toplam

**Örnek:**
- Panel eni: 100 cm
- Pile oranı: 1:3
- Kumaş fiyatı: 400 TL/metre
- Hesaplama: (100/100) × 3 = 3m/panel × 2 = 6m toplam
- Toplam: (6 × 400) + 500 = 2.400 + 500 = 2.900 TL

---

#### 4. BLACKOUT FON

**Özellikler:**
- Fon ile aynı hesaplama mantığını kullanır (değişken panel genişliği kabul eder)
- Tipik boyut: 300×260 cm, ancak farklı genişlikler de girilebilir
- Kumaş fiyatı: 160-400 TL/metre aralığında

---

## Kartela Sistemi

Her kumaş bir kartela kodu ile tanımlanır:
- Örnek: "TUL-2024-A15"
- Kumaşlar tipe göre organize edilir: tül kumaşları, fon kumaşları
- "Havuz" kumaşları: indirimli/stoktan kaldırılan kumaşlar, ayrı bölüm
- Fiyat WooCommerce admin panelinde kumaş başına ayarlanır

---

## WooCommerce Veri Yapısı

### Ürün Kategorileri
- **Tül Kumaşları** (product category)
- **Fon Kumaşları** (product category)
- **Blackout Kumaşları** (product category)
- **Saten** (simple product, sabit fiyat)

### Her Kumaş Ürünü İçerir:
- Kartela kodu (SKU)
- Kumaş fotoğrafı
- Metre fiyatı (custom field: `_icc_price_per_meter`)
- Mevcut pile oranları (custom field: `_icc_available_pleats` - array)
- Ürün tipi (custom field: `_icc_product_type`: 'tul', 'fon', 'blackout')

### Custom Fields (Product Meta)
```php
_icc_product_type       // 'tul', 'fon', 'blackout', 'saten'
_icc_price_per_meter    // float, örn: 150.00
_icc_available_pleats   // array, örn: ['2', '2.5', '3'] → 1:2, 1:2.5, 1:3
_icc_kartela_code       // string, örn: "TUL-2024-A15"
```

---

## Sipariş Meta Verisi (Order Item Meta)

Her sipariş kalemi ile birlikte saklanır:

```php
// Tül için:
'Ürün Tipi'           => 'Tül'
'Kartela Kodu'        => 'TUL-2024-A15'
'Pencere Eni (cm)'    => 300
'Pencere Boyu (cm)'   => 260
'Pile Oranı'          => '1:3'
'Gerekli Kumaş (m)'   => 9.00
'Kumaş Maliyeti'      => 1350.00
'Dikiş Maliyeti'      => 225.00
'Toplam Fiyat'        => 1575.00
'Oda Adı'             => 'Salon' // opsiyonel

// Fon için:
'Ürün Tipi'           => 'Fon'
'Kartela Kodu'        => 'FON-2024-B08'
'Panel Eni (cm)'      => 100
'Pile Oranı'          => '1:3'
'Panel Başına (m)'    => 3.00
'Toplam Kumaş (m)'    => 6.00
'Kumaş Maliyeti'      => 2400.00
'Dikiş Maliyeti'      => 500.00
'Toplam Fiyat'        => 2900.00
'Oda Adı'             => 'Yatak Odası'

// Saten için:
'Ürün Tipi'           => 'Saten'
'Renk'                => 'Krem'
'Fiyat'               => 150.00
'Oda Adı'             => 'Salon'
```

---

## Frontend Kullanıcı Deneyimi (UX)

### Adım 1: Perde Tipi Seçimi
Müşteri ana kategorilerden birini seçer:
- Tül Perdelikler
- Fon Perdelikler
- Blackout Perdeler
- Saten (opsiyonel ek)

### Adım 2: Kumaş Seçimi
Seçilen kategorideki kumaşlar kartela fotoğrafları ile gösterilir.

### Adım 3: Ürün Sayfası
Müşteri bir kumaş seçer, ürün sayfasında:
- Kumaş detay fotoğrafı
- Kartela kodu
- Metre fiyatı görünür

### Adım 4: Hesaplama Formu
Müşteri girdileri:
- **Tül için:** pencere eni, pile oranı
- **Fon için:** panel eni, pile oranı
- **Opsiyonel:** oda adı (örn: "Salon", "Yatak Odası")

Canlı fiyat hesaplaması gösterilir:
```
Gerekli Kumaş: 9.00 metre
Kumaş Maliyeti: 1.350,00 TL
Dikiş Maliyeti: 225,00 TL
─────────────────────────
Toplam Fiyat: 1.575,00 TL
```

### Adım 5: Sepete Ekleme
Müşteri "Sepete Ekle" butonuna tıklar.

---

## Eklenti Dizin Yapısı

```
wp-content/plugins/inanc-curtain-calculator/
|-- inanc-curtain-calculator.php      # Ana eklenti dosyası
|-- includes/
|   |-- class-calculator.php          # Hesaplama motoru (tüm formüller)
|   |-- class-product-fields.php      # Admin: custom field'lar
|   |-- class-frontend-form.php       # Frontend: hesaplama formu
|   |-- class-cart-handler.php        # Sepet işlemleri
|   |-- class-order-handler.php       # Sipariş meta kaydetme
|-- assets/
|   |-- js/
|   |   |-- curtain-calculator.js     # Frontend canlı hesaplama
|   |-- css/
|   |   |-- curtain-calculator.css    # Form stilleri
|-- templates/
|   |-- calculator-form-tul.php       # Tül hesaplama formu
|   |-- calculator-form-fon.php       # Fon hesaplama formu
|   |-- calculator-form-saten.php     # Saten ekleme formu
```

---

## Ana Eklenti Dosyası

```php
<?php
/**
 * Plugin Name: İnanç Perde Fiyat Hesaplayıcı v2.0
 * Description: Yeni fiyatlandırma modeli - metre bazlı, pile çarpanlı hesaplama
 * Version: 2.0.0
 * Author: İnanç Tekstil
 * Requires Plugins: woocommerce
 */

defined('ABSPATH') || exit;

define('ICC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ICC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ICC_VERSION', '2.0.0');

// Sabitler
define('ICC_TUL_SEWING_COST_PER_METER', 25);    // TL/metre
define('ICC_FON_SEWING_COST_PER_PAIR', 500);     // TL/çift
define('ICC_SATEN_FIXED_PRICE', 150);            // TL/pencere
define('ICC_STANDARD_HEIGHT', 260);              // cm

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
            echo '<div class="error"><p>İnanç Perde Fiyat Hesaplayıcı için WooCommerce gereklidir.</p></div>';
        });
        return;
    }

    new ICC_Product_Fields();
    new ICC_Frontend_Form();
    new ICC_Cart_Handler();
    new ICC_Order_Handler();
});
```

---

## Hesaplama Motoru

### includes/class-calculator.php

```php
<?php
defined('ABSPATH') || exit;

class ICC_Calculator {

    /**
     * Tül için fiyat hesaplama.
     *
     * @param int   $window_width_cm  Pencere eni (cm)
     * @param float $pleat_ratio      Pile oranı (2, 2.5, 3)
     * @param float $fabric_price_per_meter  Kumaş metre fiyatı (TL)
     * @return array ['fabric_meters' => float, 'fabric_cost' => float, 'sewing_cost' => float, 'total' => float]
     */
    public static function calculate_tul(
        int $window_width_cm,
        float $pleat_ratio,
        float $fabric_price_per_meter
    ): array {
        $fabric_meters = ($window_width_cm / 100) * $pleat_ratio;
        $fabric_cost = $fabric_meters * $fabric_price_per_meter;
        $sewing_cost = $fabric_meters * ICC_TUL_SEWING_COST_PER_METER;
        $total = $fabric_cost + $sewing_cost;

        return [
            'fabric_meters' => round($fabric_meters, 2),
            'fabric_cost'   => round($fabric_cost, 2),
            'sewing_cost'   => round($sewing_cost, 2),
            'total'         => round($total, 2),
        ];
    }

    /**
     * Fon için fiyat hesaplama.
     *
     * @param int   $panel_width_cm  Panel eni (cm)
     * @param float $pleat_ratio     Pile oranı (2, 2.5, 3)
     * @param float $fabric_price_per_meter  Kumaş metre fiyatı (TL)
     * @return array
     */
    public static function calculate_fon(
        int $panel_width_cm,
        float $pleat_ratio,
        float $fabric_price_per_meter
    ): array {
        $fabric_per_panel = ($panel_width_cm / 100) * $pleat_ratio;
        $total_fabric = $fabric_per_panel * 2; // Çift panel
        $fabric_cost = $total_fabric * $fabric_price_per_meter;
        $sewing_cost = ICC_FON_SEWING_COST_PER_PAIR;
        $total = $fabric_cost + $sewing_cost;

        return [
            'fabric_per_panel' => round($fabric_per_panel, 2),
            'total_fabric'     => round($total_fabric, 2),
            'fabric_cost'      => round($fabric_cost, 2),
            'sewing_cost'      => $sewing_cost,
            'total'            => round($total, 2),
        ];
    }

    /**
     * Blackout Fon için hesaplama (Fon ile aynı mantık).
     */
    public static function calculate_blackout(
        int $panel_width_cm,
        float $pleat_ratio,
        float $fabric_price_per_meter
    ): array {
        return self::calculate_fon($panel_width_cm, $pleat_ratio, $fabric_price_per_meter);
    }

    /**
     * Saten sabit fiyat.
     */
    public static function calculate_saten(): array {
        return [
            'total' => ICC_SATEN_FIXED_PRICE,
        ];
    }

    /**
     * Pile oranını doğrula.
     *
     * @param float $pleat_ratio
     * @return bool|WP_Error
     */
    public static function validate_pleat_ratio(float $pleat_ratio) {
        $valid_ratios = [2.0, 2.5, 3.0];
        if (!in_array($pleat_ratio, $valid_ratios, true)) {
            return new WP_Error('invalid_pleat', 'Geçersiz pile oranı. Kabul edilen: 1:2, 1:2.5, 1:3');
        }
        return true;
    }

    /**
     * Genişlik doğrula.
     *
     * @param int $width_cm
     * @param int $min
     * @param int $max
     * @return bool|WP_Error
     */
    public static function validate_width(int $width_cm, int $min = 50, int $max = 600) {
        if ($width_cm < $min || $width_cm > $max) {
            return new WP_Error(
                'invalid_width',
                sprintf('Genişlik %d-%d cm arasında olmalıdır.', $min, $max)
            );
        }
        return true;
    }
}
```

---

## Admin: Custom Product Fields

### includes/class-product-fields.php

```php
<?php
defined('ABSPATH') || exit;

class ICC_Product_Fields {

    public function __construct() {
        add_action('woocommerce_product_options_general_product_data', [$this, 'add_custom_fields']);
        add_action('woocommerce_process_product_meta', [$this, 'save_custom_fields']);
    }

    /**
     * Admin ürün sayfasına custom field'lar ekle.
     */
    public function add_custom_fields(): void {
        global $post;

        echo '<div class="options_group">';

        // Ürün tipi
        woocommerce_wp_select([
            'id'      => '_icc_product_type',
            'label'   => 'Perde Tipi',
            'options' => [
                ''         => 'Seçiniz',
                'tul'      => 'Tül',
                'fon'      => 'Fon',
                'blackout' => 'Blackout',
                'saten'    => 'Saten',
            ],
            'desc_tip' => true,
            'description' => 'Bu ürünün perde tipi',
        ]);

        // Kartela kodu
        woocommerce_wp_text_input([
            'id'    => '_icc_kartela_code',
            'label' => 'Kartela Kodu',
            'placeholder' => 'Örn: TUL-2024-A15',
            'desc_tip' => true,
            'description' => 'Kumaşın kartela kodu',
        ]);

        // Metre fiyatı
        woocommerce_wp_text_input([
            'id'          => '_icc_price_per_meter',
            'label'       => 'Metre Fiyatı (TL/m)',
            'type'        => 'number',
            'custom_attributes' => [
                'step' => '0.01',
                'min'  => '0',
            ],
            'desc_tip' => true,
            'description' => 'Kumaşın metre başına fiyatı. Saten için kullanılmaz.',
        ]);

        // Mevcut pile oranları (checkboxes)
        $available_pleats = get_post_meta($post->ID, '_icc_available_pleats', true);
        if (!is_array($available_pleats)) {
            $available_pleats = [];
        }

        echo '<p class="form-field"><label>Mevcut Pile Oranları</label></p>';
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

    /**
     * Custom field değerlerini kaydet.
     */
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
```

---

## Frontend: Hesaplama Formu

### includes/class-frontend-form.php

```php
<?php
defined('ABSPATH') || exit;

class ICC_Frontend_Form {

    public function __construct() {
        add_action('woocommerce_before_add_to_cart_button', [$this, 'render_calculator_form']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    /**
     * Ürün sayfasında hesaplama formunu göster.
     */
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

    /**
     * JS ve CSS yükle.
     */
    public function enqueue_assets(): void {
        if (!is_product()) {
            return;
        }

        global $product;
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
```

---

## Template: Tül Hesaplama Formu

### templates/calculator-form-tul.php

```php
<?php defined('ABSPATH') || exit; ?>

<div id="icc-calculator-wrapper" class="icc-calculator icc-calculator-tul">
    <h3>Tül Perde Hesaplayıcı</h3>

    <p class="icc-info">
        <strong>Kartela:</strong> <?php echo esc_html($kartela_code); ?><br>
        <strong>Kumaş Fiyatı:</strong> <?php echo wc_price($price_per_meter); ?> / metre<br>
        <strong>Dikiş Maliyeti:</strong> 25 TL / metre
    </p>

    <div class="icc-field-group">
        <label for="icc-window-width">Pencere Eni (cm) *</label>
        <input
            type="number"
            id="icc-window-width"
            name="icc_window_width"
            min="100"
            max="600"
            step="1"
            placeholder="Örnek: 300"
            required
        />
    </div>

    <div class="icc-field-group">
        <label for="icc-window-height">Pencere Boyu (cm)</label>
        <input
            type="number"
            id="icc-window-height"
            name="icc_window_height"
            value="260"
            min="100"
            max="400"
            step="1"
        />
        <small>Standart boy: 260 cm (kumaş 260cm rulolardan gelir)</small>
    </div>

    <div class="icc-field-group">
        <label for="icc-pleat-ratio">Pile Oranı *</label>
        <select id="icc-pleat-ratio" name="icc_pleat_ratio" required>
            <option value="">Seçiniz</option>
            <?php foreach ($available_pleats as $ratio): ?>
                <option value="<?php echo esc_attr($ratio); ?>">
                    1:<?php echo esc_html($ratio); ?>
                </option>
            <?php endforeach; ?>
        </select>
    </div>

    <div class="icc-field-group">
        <label for="icc-room-name">Oda Adı (Opsiyonel)</label>
        <input
            type="text"
            id="icc-room-name"
            name="icc_room_name"
            placeholder="Örnek: Salon, Yatak Odası"
        />
    </div>

    <div id="icc-result" class="icc-result" style="display: none;">
        <p><strong>Gerekli Kumaş:</strong> <span class="icc-fabric-meters"></span> metre</p>
        <p><strong>Kumaş Maliyeti:</strong> <span class="icc-fabric-cost"></span></p>
        <p><strong>Dikiş Maliyeti:</strong> <span class="icc-sewing-cost"></span></p>
        <hr>
        <p class="icc-total-price"><strong>Toplam Fiyat:</strong> <span class="icc-total"></span></p>
    </div>

    <div id="icc-error" class="icc-error" style="display: none;"></div>
</div>
```

---

## Template: Fon Hesaplama Formu

### templates/calculator-form-fon.php

```php
<?php defined('ABSPATH') || exit; ?>

<div id="icc-calculator-wrapper" class="icc-calculator icc-calculator-fon">
    <h3>Fon Perde Hesaplayıcı</h3>

    <p class="icc-info">
        <strong>Kartela:</strong> <?php echo esc_html($kartela_code); ?><br>
        <strong>Kumaş Fiyatı:</strong> <?php echo wc_price($price_per_meter); ?> / metre<br>
        <strong>Dikiş Maliyeti:</strong> 500 TL / çift (sabit)<br>
        <strong>Not:</strong> Fon perdeler her zaman çift (2 panel) olarak satılır.
    </p>

    <div class="icc-field-group">
        <label for="icc-panel-width">Panel Eni (cm) *</label>
        <input
            type="number"
            id="icc-panel-width"
            name="icc_panel_width"
            min="50"
            max="150"
            step="1"
            placeholder="Örnek: 100"
            required
        />
        <small>Yaygın: 80cm veya 100cm</small>
    </div>

    <div class="icc-field-group">
        <label for="icc-pleat-ratio">Pile Oranı *</label>
        <select id="icc-pleat-ratio" name="icc_pleat_ratio" required>
            <option value="">Seçiniz</option>
            <?php foreach ($available_pleats as $ratio): ?>
                <option value="<?php echo esc_attr($ratio); ?>">
                    1:<?php echo esc_html($ratio); ?>
                </option>
            <?php endforeach; ?>
        </select>
    </div>

    <div class="icc-field-group">
        <label for="icc-room-name">Oda Adı (Opsiyonel)</label>
        <input
            type="text"
            id="icc-room-name"
            name="icc_room_name"
            placeholder="Örnek: Salon, Yatak Odası"
        />
    </div>

    <div id="icc-result" class="icc-result" style="display: none;">
        <p><strong>Panel Başına Kumaş:</strong> <span class="icc-fabric-per-panel"></span> metre</p>
        <p><strong>Toplam Kumaş (2 panel):</strong> <span class="icc-total-fabric"></span> metre</p>
        <p><strong>Kumaş Maliyeti:</strong> <span class="icc-fabric-cost"></span></p>
        <p><strong>Dikiş Maliyeti:</strong> <span class="icc-sewing-cost"></span></p>
        <hr>
        <p class="icc-total-price"><strong>Toplam Fiyat:</strong> <span class="icc-total"></span></p>
    </div>

    <div id="icc-error" class="icc-error" style="display: none;"></div>
</div>
```

---

## Template: Saten Formu

### templates/calculator-form-saten.php

```php
<?php defined('ABSPATH') || exit; ?>

<div id="icc-calculator-wrapper" class="icc-calculator icc-calculator-saten">
    <h3>Saten Astar</h3>

    <p class="icc-info">
        <strong>Fiyat:</strong> <?php echo wc_price(ICC_SATEN_FIXED_PRICE); ?> / pencere (sabit)<br>
        <strong>Renkler:</strong> Krem, Beyaz
    </p>

    <div class="icc-field-group">
        <label for="icc-room-name">Oda Adı (Opsiyonel)</label>
        <input
            type="text"
            id="icc-room-name"
            name="icc_room_name"
            placeholder="Örnek: Salon, Yatak Odası"
        />
    </div>

    <input type="hidden" name="icc_saten_fixed" value="1">

    <div class="icc-result">
        <p class="icc-total-price"><strong>Fiyat:</strong> <?php echo wc_price(ICC_SATEN_FIXED_PRICE); ?></p>
    </div>
</div>
```

---

## JavaScript: Canlı Fiyat Hesaplama

### assets/js/curtain-calculator.js

```javascript
(function () {
    'use strict';

    const data = window.iccData;
    if (!data) return;

    const resultDiv = document.getElementById('icc-result');
    const errorDiv = document.getElementById('icc-error');

    if (!resultDiv || !errorDiv) return;

    function formatPrice(amount) {
        return amount.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ' + data.currency;
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        resultDiv.style.display = 'none';
    }

    function showResult(resultData) {
        errorDiv.style.display = 'none';
        resultDiv.style.display = 'block';

        // Her ürün tipi için farklı sonuç gösterimi
        if (data.productType === 'tul') {
            resultDiv.querySelector('.icc-fabric-meters').textContent = resultData.fabricMeters;
            resultDiv.querySelector('.icc-fabric-cost').textContent = formatPrice(resultData.fabricCost);
            resultDiv.querySelector('.icc-sewing-cost').textContent = formatPrice(resultData.sewingCost);
            resultDiv.querySelector('.icc-total').textContent = formatPrice(resultData.total);
        } else if (data.productType === 'fon' || data.productType === 'blackout') {
            resultDiv.querySelector('.icc-fabric-per-panel').textContent = resultData.fabricPerPanel;
            resultDiv.querySelector('.icc-total-fabric').textContent = resultData.totalFabric;
            resultDiv.querySelector('.icc-fabric-cost').textContent = formatPrice(resultData.fabricCost);
            resultDiv.querySelector('.icc-sewing-cost').textContent = formatPrice(resultData.sewingCost);
            resultDiv.querySelector('.icc-total').textContent = formatPrice(resultData.total);
        }
    }

    function calculateTul() {
        const widthInput = document.getElementById('icc-window-width');
        const pleatSelect = document.getElementById('icc-pleat-ratio');

        if (!widthInput || !pleatSelect) return;

        const width = parseInt(widthInput.value, 10);
        const pleatRatio = parseFloat(pleatSelect.value);

        if (isNaN(width) || width < 100 || width > 600) {
            showError('Pencere eni 100-600 cm arasında olmalıdır.');
            return;
        }

        if (isNaN(pleatRatio)) {
            resultDiv.style.display = 'none';
            errorDiv.style.display = 'none';
            return;
        }

        // Hesaplama
        const fabricMeters = (width / 100) * pleatRatio;
        const fabricCost = fabricMeters * data.pricePerMeter;
        const sewingCost = fabricMeters * data.tulSewingCost;
        const total = fabricCost + sewingCost;

        showResult({
            fabricMeters: fabricMeters.toFixed(2),
            fabricCost: fabricCost,
            sewingCost: sewingCost,
            total: total,
        });
    }

    function calculateFon() {
        const widthInput = document.getElementById('icc-panel-width');
        const pleatSelect = document.getElementById('icc-pleat-ratio');

        if (!widthInput || !pleatSelect) return;

        const width = parseInt(widthInput.value, 10);
        const pleatRatio = parseFloat(pleatSelect.value);

        if (isNaN(width) || width < 50 || width > 150) {
            showError('Panel eni 50-150 cm arasında olmalıdır.');
            return;
        }

        if (isNaN(pleatRatio)) {
            resultDiv.style.display = 'none';
            errorDiv.style.display = 'none';
            return;
        }

        // Hesaplama
        const fabricPerPanel = (width / 100) * pleatRatio;
        const totalFabric = fabricPerPanel * 2; // Çift panel
        const fabricCost = totalFabric * data.pricePerMeter;
        const sewingCost = data.fonSewingCost;
        const total = fabricCost + sewingCost;

        showResult({
            fabricPerPanel: fabricPerPanel.toFixed(2),
            totalFabric: totalFabric.toFixed(2),
            fabricCost: fabricCost,
            sewingCost: sewingCost,
            total: total,
        });
    }

    // Event listener'lar
    if (data.productType === 'tul') {
        const widthInput = document.getElementById('icc-window-width');
        const pleatSelect = document.getElementById('icc-pleat-ratio');

        if (widthInput) widthInput.addEventListener('input', calculateTul);
        if (pleatSelect) pleatSelect.addEventListener('change', calculateTul);

    } else if (data.productType === 'fon' || data.productType === 'blackout') {
        const widthInput = document.getElementById('icc-panel-width');
        const pleatSelect = document.getElementById('icc-pleat-ratio');

        if (widthInput) widthInput.addEventListener('input', calculateFon);
        if (pleatSelect) pleatSelect.addEventListener('change', calculateFon);
    }
})();
```

---

## Backend: Sepet İşlemleri

### includes/class-cart-handler.php

```php
<?php
defined('ABSPATH') || exit;

class ICC_Cart_Handler {

    public function __construct() {
        add_filter('woocommerce_add_to_cart_validation', [$this, 'validate_add_to_cart'], 10, 3);
        add_filter('woocommerce_add_cart_item_data', [$this, 'add_cart_item_data'], 10, 2);
        add_action('woocommerce_before_calculate_totals', [$this, 'calculate_custom_price'], 20, 1);
        add_filter('woocommerce_get_item_data', [$this, 'display_cart_item_data'], 10, 2);
    }

    /**
     * Sepete eklerken doğrulama.
     */
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

    /**
     * Sepet item'ına meta ekle.
     */
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

        // Benzersiz key oluştur
        $cart_item_data['unique_key'] = md5(json_encode($cart_item_data));

        return $cart_item_data;
    }

    /**
     * Sepet fiyatlarını hesapla.
     */
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

    /**
     * Sepet sayfasında meta göster.
     */
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
                'key'   => 'Pile Oranı',
                'value' => '1:' . $cart_item['icc_pleat_ratio'],
            ];
        }

        if ($product_type === 'fon' || $product_type === 'blackout') {
            $item_data[] = [
                'key'   => 'Panel Eni',
                'value' => $cart_item['icc_panel_width'] . ' cm',
            ];
            $item_data[] = [
                'key'   => 'Pile Oranı',
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
```

---

## Backend: Sipariş İşlemleri

### includes/class-order-handler.php

```php
<?php
defined('ABSPATH') || exit;

class ICC_Order_Handler {

    public function __construct() {
        add_action('woocommerce_checkout_create_order_line_item', [$this, 'save_order_item_meta'], 10, 4);
    }

    /**
     * Sipariş oluşturulurken meta kaydet.
     */
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

        // Ortak meta
        $item->add_meta_data('Ürün Tipi', ucfirst($product_type));
        if (!empty($values['icc_kartela_code'])) {
            $item->add_meta_data('Kartela Kodu', $values['icc_kartela_code']);
        }
        if (!empty($values['icc_room_name'])) {
            $item->add_meta_data('Oda Adı', $values['icc_room_name']);
        }

        // Tül
        if ($product_type === 'tul') {
            $result = ICC_Calculator::calculate_tul(
                $values['icc_window_width'],
                $values['icc_pleat_ratio'],
                $price_per_meter
            );

            $item->add_meta_data('Pencere Eni (cm)', $values['icc_window_width']);
            $item->add_meta_data('Pencere Boyu (cm)', $values['icc_window_height']);
            $item->add_meta_data('Pile Oranı', '1:' . $values['icc_pleat_ratio']);
            $item->add_meta_data('Gerekli Kumaş (m)', $result['fabric_meters']);
            $item->add_meta_data('Kumaş Maliyeti (TL)', $result['fabric_cost']);
            $item->add_meta_data('Dikiş Maliyeti (TL)', $result['sewing_cost']);
            $item->add_meta_data('Toplam Fiyat (TL)', $result['total']);
        }

        // Fon / Blackout
        if ($product_type === 'fon' || $product_type === 'blackout') {
            $result = ICC_Calculator::calculate_fon(
                $values['icc_panel_width'],
                $values['icc_pleat_ratio'],
                $price_per_meter
            );

            $item->add_meta_data('Panel Eni (cm)', $values['icc_panel_width']);
            $item->add_meta_data('Pile Oranı', '1:' . $values['icc_pleat_ratio']);
            $item->add_meta_data('Panel Başına Kumaş (m)', $result['fabric_per_panel']);
            $item->add_meta_data('Toplam Kumaş (m)', $result['total_fabric']);
            $item->add_meta_data('Kumaş Maliyeti (TL)', $result['fabric_cost']);
            $item->add_meta_data('Dikiş Maliyeti (TL)', $result['sewing_cost']);
            $item->add_meta_data('Toplam Fiyat (TL)', $result['total']);
        }

        // Saten
        if ($product_type === 'saten') {
            $item->add_meta_data('Fiyat (TL)', ICC_SATEN_FIXED_PRICE);
        }
    }
}
```

---

## CSS Stilleri

### assets/css/curtain-calculator.css

```css
.icc-calculator {
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    padding: 24px;
    margin: 24px 0;
    background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
}

.icc-calculator h3 {
    margin: 0 0 16px 0;
    font-size: 1.3em;
    color: #333;
    border-bottom: 2px solid #4caf50;
    padding-bottom: 8px;
}

.icc-info {
    background: #fff;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 20px;
    border-left: 4px solid #2196f3;
    font-size: 0.95em;
}

.icc-field-group {
    margin-bottom: 16px;
}

.icc-field-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: 0.95em;
    color: #555;
}

.icc-field-group input[type="number"],
.icc-field-group input[type="text"],
.icc-field-group select {
    width: 100%;
    max-width: 300px;
    padding: 10px 14px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 1em;
    transition: border-color 0.3s;
}

.icc-field-group input:focus,
.icc-field-group select:focus {
    outline: none;
    border-color: #4caf50;
}

.icc-field-group small {
    display: block;
    margin-top: 4px;
    color: #777;
    font-size: 0.85em;
}

.icc-result {
    margin-top: 20px;
    padding: 16px;
    background: #e8f5e9;
    border-radius: 8px;
    border-left: 5px solid #4caf50;
}

.icc-result p {
    margin: 8px 0;
    font-size: 0.95em;
}

.icc-result hr {
    border: none;
    border-top: 1px solid #c8e6c9;
    margin: 12px 0;
}

.icc-result .icc-total-price {
    font-size: 1.4em;
    font-weight: 700;
    color: #2e7d32;
    margin-top: 12px;
}

.icc-error {
    margin-top: 16px;
    padding: 12px;
    background: #ffebee;
    border-radius: 6px;
    border-left: 5px solid #f44336;
    color: #c62828;
    font-size: 0.95em;
    font-weight: 500;
}

/* Saten için basit stil */
.icc-calculator-saten .icc-result {
    background: #fff3e0;
    border-left-color: #ff9800;
}

.icc-calculator-saten .icc-total-price {
    color: #e65100;
}
```

---

## Test Senaryoları

### Tül Testi

| Senaryo | Girdi | Beklenen |
|---------|-------|----------|
| Normal | Pencere: 300cm, Pile: 1:3, Fiyat: 150 TL/m | 9m × 150 + 9m × 25 = 1.575 TL |
| Minimum | Pencere: 100cm, Pile: 1:2, Fiyat: 100 TL/m | 2m × 100 + 2m × 25 = 250 TL |
| Maksimum | Pencere: 600cm, Pile: 1:3, Fiyat: 200 TL/m | 18m × 200 + 18m × 25 = 4.050 TL |
| Geçersiz pile | Pile: 1:4 | Hata: Geçersiz pile oranı |
| Genişlik küçük | Pencere: 50cm | Hata: Minimum 100cm |

### Fon Testi

| Senaryo | Girdi | Beklenen |
|---------|-------|----------|
| Normal | Panel: 100cm, Pile: 1:3, Fiyat: 400 TL/m | 6m × 400 + 500 = 2.900 TL |
| Küçük panel | Panel: 80cm, Pile: 1:2.5, Fiyat: 350 TL/m | 4m × 350 + 500 = 1.900 TL |
| Büyük panel | Panel: 120cm, Pile: 1:3, Fiyat: 450 TL/m | 7.2m × 450 + 500 = 3.740 TL |

### Saten Testi

| Senaryo | Beklenen |
|---------|----------|
| Herhangi | Sabit 150 TL |

---

## Veri Akışı Özeti

```
1. ADMIN PANEL
   └─ Ürün Oluştur
      ├─ Ürün Tipi: Tül
      ├─ Kartela: TUL-2024-A15
      ├─ Metre Fiyatı: 150 TL
      └─ Mevcut Pile Oranları: [2, 2.5, 3]

2. FRONTEND (Ürün Sayfası)
   └─ Müşteri Girdisi
      ├─ Pencere Eni: 300 cm
      ├─ Pile Oranı: 1:3
      └─ Oda: "Salon"
   └─ JavaScript Canlı Hesaplama
      ├─ Gerekli Kumaş: (300/100) × 3 = 9m
      ├─ Kumaş Maliyeti: 9 × 150 = 1.350 TL
      ├─ Dikiş Maliyeti: 9 × 25 = 225 TL
      └─ TOPLAM: 1.575 TL ← Ekranda gösterilir

3. SEPETE EKLEME (POST)
   └─ PHP Doğrulama
      ├─ Genişlik: 100-600 cm ✓
      ├─ Pile: 2, 2.5, 3 ✓
      └─ Cart Meta Kaydet
         ├─ icc_window_width: 300
         ├─ icc_pleat_ratio: 3
         ├─ icc_room_name: "Salon"
         └─ unique_key: md5(...)

4. SEPET GÖRÜNÜMÜ
   └─ woocommerce_before_calculate_totals
      ├─ ICC_Calculator::calculate_tul(...)
      └─ $cart_item['data']->set_price(1575.00)
   └─ Sepet Sayfasında Görünür
      ├─ Kartela: TUL-2024-A15
      ├─ Pencere Eni: 300 cm
      ├─ Pile: 1:3
      ├─ Oda: Salon
      └─ Fiyat: 1.575,00 TL

5. SİPARİŞ
   └─ woocommerce_checkout_create_order_line_item
      └─ Order Item Meta Kaydet
         ├─ Ürün Tipi: Tül
         ├─ Kartela: TUL-2024-A15
         ├─ Pencere Eni: 300 cm
         ├─ Pile: 1:3
         ├─ Gerekli Kumaş: 9.00 m
         ├─ Kumaş Maliyeti: 1.350 TL
         ├─ Dikiş Maliyeti: 225 TL
         ├─ Toplam: 1.575 TL
         └─ Oda: Salon

6. ADMIN SİPARİŞ DETAYI
   └─ Tüm meta veriler sipariş detayında görünür
      └─ Üretim için gerekli tüm bilgiler mevcut
```

---

## WooCommerce Ürün Fiyatı Hakkında Not

Eklenti custom fiyat hesapladığı için WooCommerce ürünlerinin varsayılan fiyatı gösterilmemelidir.

**Çözüm: Fiyat gösterimini override et**

```php
// inanc-curtain-calculator.php içine ekle
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
```

Bu sayede:
- Tül/Fon ürünleri: "150,00 TL / metre" gösterir
- Saten: "150,00 TL / pencere" gösterir
- Müşteri formu doldurduğunda gerçek fiyat hesaplanır

---

## Migration Notları (Eski Sistemden Yeni Sisteme)

Eski sistem metrekare bazlıydı, yeni sistem metre bazlı. Geçiş için:

1. **Eski ürünleri yedekle**: Mevcut tüm ürünleri export et
2. **Yeni custom field'ları ekle**: `_icc_product_type`, `_icc_price_per_meter`, vb.
3. **Fiyatları dönüştür**: Eski m² fiyatları metre fiyatlarına çevir
4. **Test ortamında dene**: Tüm hesaplamaları kontrol et
5. **Canlıya al**: Yedekle → update → test

---

## Ek Özellikler (Gelecek)

- **Fiyat hesaplama geçmişi**: Müşteri önceki hesaplamalarını görebilsin
- **PDF teklif**: Sepet içeriğini PDF olarak indir
- **Renk seçici**: Saten için renk görseli ile seçim
- **Toplu sipariş**: Excel ile toplu sipariş yükleme (B2B müşteriler için)
- **Stok entegrasyonu**: Kartela bazlı stok takibi

---

## Destek ve Dokümantasyon

**Plugin Maintainer:** İnanç Tekstil IT Ekibi
**Version:** 2.0.0
**Last Updated:** 2026-03-14

---

**SON**
