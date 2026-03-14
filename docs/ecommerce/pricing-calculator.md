# Perde Fiyat Hesaplama Eklentisi -- Teknik Spesifikasyon

## Genel Bakis

`inanc-curtain-calculator` ozel bir WordPress/WooCommerce eklentisidir. Musteri urun sayfasinda en (cm) ve boy (cm) girer, eklenti canli olarak fiyat hesaplar ve gosterir. Sepete eklerken ve odeme sirasinda PHP tarafinda dogrulama yapilir.

**Formul:**

```
fiyat_tl = (en_cm * boy_cm) / 10000 * metrekare_fiyat_tl
```

**Kisitlamalar:**
- Minimum: 30 cm (en ve boy icin ayri ayri)
- Maksimum: 600 cm (en ve boy icin ayri ayri)

---

## Eklenti Dizin Yapisi

```
wp-content/plugins/inanc-curtain-calculator/
|-- inanc-curtain-calculator.php      # Ana eklenti dosyasi, hook'lar
|-- includes/
|   |-- class-calculator.php          # Fiyat hesaplama ve dogrulama sinifi
|   |-- class-product-fields.php      # WooCommerce urun sayfasina custom field ekleme
|   |-- class-cart-handler.php        # Sepet islemleri (meta kaydetme, fiyat guncelleme)
|   |-- class-order-handler.php       # Siparis meta islemleri
|-- assets/
|   |-- js/
|   |   |-- curtain-calculator.js     # Frontend fiyat hesaplama
|   |-- css/
|   |   |-- curtain-calculator.css    # Form stilleri
|-- templates/
|   |-- calculator-form.php           # Urun sayfasindaki form sablonu
|-- languages/
|   |-- inanc-curtain-calculator-tr_TR.po
|   |-- inanc-curtain-calculator-tr_TR.mo
```

---

## Ana Eklenti Dosyasi

```php
<?php
/**
 * Plugin Name: Inanc Perde Fiyat Hesaplayici
 * Description: WooCommerce urun sayfasinda perde olculeri ile canli fiyat hesaplama.
 * Version: 1.0.0
 * Author: Inanc Tekstil
 * Text Domain: inanc-curtain-calculator
 * Domain Path: /languages
 * Requires Plugins: woocommerce
 */

defined('ABSPATH') || exit;

define('ICC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ICC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ICC_VERSION', '1.0.0');

// Autoload
require_once ICC_PLUGIN_DIR . 'includes/class-calculator.php';
require_once ICC_PLUGIN_DIR . 'includes/class-product-fields.php';
require_once ICC_PLUGIN_DIR . 'includes/class-cart-handler.php';
require_once ICC_PLUGIN_DIR . 'includes/class-order-handler.php';

// Init
add_action('plugins_loaded', function () {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function () {
            echo '<div class="error"><p>Inanc Perde Fiyat Hesaplayici icin WooCommerce gereklidir.</p></div>';
        });
        return;
    }

    new ICC_Product_Fields();
    new ICC_Cart_Handler();
    new ICC_Order_Handler();
});
```

---

## WooCommerce Urun Sayfasina Custom Field Ekleme

Her kumas urununde metrekare fiyati saklanir. Bu deger admin panelindeki urun duzenleme ekraninda girilir.

### class-product-fields.php

```php
<?php
defined('ABSPATH') || exit;

class ICC_Product_Fields {

    public function __construct() {
        // Admin: Urun duzenleme ekranina alan ekle
        add_action('woocommerce_product_options_pricing', [$this, 'add_price_per_sqm_field']);
        add_action('woocommerce_process_product_meta', [$this, 'save_price_per_sqm_field']);

        // Frontend: Urun sayfasina hesaplama formu ekle
        add_action('woocommerce_before_add_to_cart_button', [$this, 'render_calculator_form']);

        // JS ve CSS yukle
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    /**
     * Admin urun sayfasina "Metrekare Fiyati" alani ekle.
     * Fiyatlandirma bolumunun altinda gorunur.
     */
    public function add_price_per_sqm_field(): void {
        woocommerce_wp_text_input([
            'id'          => '_icc_price_per_sqm',
            'label'       => 'Metrekare Fiyati (TL/m2)',
            'description' => 'Bu kumasin metrekare birim fiyati. Ornek: 450',
            'desc_tip'    => true,
            'type'        => 'number',
            'custom_attributes' => [
                'step' => '0.01',
                'min'  => '0',
            ],
        ]);
    }

    /**
     * Custom field degerini kaydet.
     */
    public function save_price_per_sqm_field(int $post_id): void {
        if (isset($_POST['_icc_price_per_sqm'])) {
            $value = wc_format_decimal(sanitize_text_field($_POST['_icc_price_per_sqm']));
            update_post_meta($post_id, '_icc_price_per_sqm', $value);
        }
    }

    /**
     * Urun sayfasinda hesaplama formunu goster.
     * Yalnizca metrekare fiyati tanimlanmis urunlerde gosterilir.
     */
    public function render_calculator_form(): void {
        global $product;

        $price_per_sqm = get_post_meta($product->get_id(), '_icc_price_per_sqm', true);
        if (empty($price_per_sqm)) {
            return; // Bu urun icin hesaplama yok
        }

        // Template yukle
        include ICC_PLUGIN_DIR . 'templates/calculator-form.php';
    }

    /**
     * Frontend JS ve CSS dosyalarini yukle.
     * Yalnizca WooCommerce urun sayfalarinda.
     */
    public function enqueue_assets(): void {
        if (!is_product()) {
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
            [], // Vanilla JS, jQuery gerektirmiyor
            ICC_VERSION,
            true // Footer'da yukle
        );

        global $product;
        $price_per_sqm = get_post_meta($product->get_id(), '_icc_price_per_sqm', true);

        wp_localize_script('icc-calculator', 'iccData', [
            'pricePerSqm' => floatval($price_per_sqm),
            'minDimension' => 30,
            'maxDimension' => 600,
            'currency'     => 'TL',
            'i18n'         => [
                'invalidMin'  => 'Minimum olcu 30 cm olmalidir.',
                'invalidMax'  => 'Maksimum olcu 600 cm olmalidir.',
                'priceLabel'  => 'Tahmini Fiyat:',
                'areaLabel'   => 'Alan:',
            ],
        ]);
    }
}
```

---

## Frontend Hesaplama Formu

### templates/calculator-form.php

```php
<?php defined('ABSPATH') || exit; ?>

<div id="icc-calculator-wrapper" class="icc-calculator">
    <h3>Perde Olculerinizi Girin</h3>

    <div class="icc-field-group">
        <label for="icc-width">En (cm)</label>
        <input
            type="number"
            id="icc-width"
            name="icc_width"
            min="30"
            max="600"
            step="1"
            placeholder="Ornek: 150"
            required
        />
    </div>

    <div class="icc-field-group">
        <label for="icc-height">Boy (cm)</label>
        <input
            type="number"
            id="icc-height"
            name="icc_height"
            min="30"
            max="600"
            step="1"
            placeholder="Ornek: 250"
            required
        />
    </div>

    <div id="icc-result" class="icc-result" style="display: none;">
        <p class="icc-area"></p>
        <p class="icc-price"></p>
    </div>

    <div id="icc-error" class="icc-error" style="display: none;"></div>
</div>
```

---

## JavaScript Frontend -- Canli Fiyat Hesaplama

### assets/js/curtain-calculator.js

```javascript
(function () {
    'use strict';

    const data = window.iccData;
    if (!data) return;

    const MIN = data.minDimension;
    const MAX = data.maxDimension;
    const PRICE_PER_SQM = data.pricePerSqm;

    const widthInput  = document.getElementById('icc-width');
    const heightInput = document.getElementById('icc-height');
    const resultDiv   = document.getElementById('icc-result');
    const errorDiv    = document.getElementById('icc-error');
    const areaEl      = resultDiv ? resultDiv.querySelector('.icc-area') : null;
    const priceEl     = resultDiv ? resultDiv.querySelector('.icc-price') : null;

    if (!widthInput || !heightInput) return;

    function validate(value) {
        const num = parseInt(value, 10);
        if (isNaN(num)) return null;
        if (num < MIN) return { error: data.i18n.invalidMin };
        if (num > MAX) return { error: data.i18n.invalidMax };
        return { value: num };
    }

    function formatPrice(amount) {
        return amount.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ' + data.currency;
    }

    function calculate() {
        const w = validate(widthInput.value);
        const h = validate(heightInput.value);

        // Henuz iki alan da doldurulmamissa, sonuc gosterme
        if (w === null || h === null) {
            resultDiv.style.display = 'none';
            errorDiv.style.display = 'none';
            return;
        }

        // Hata varsa goster
        if (w.error || h.error) {
            errorDiv.textContent = w.error || h.error;
            errorDiv.style.display = 'block';
            resultDiv.style.display = 'none';
            return;
        }

        // Hesapla
        const areaSqm = (w.value * h.value) / 10000;
        const price = areaSqm * PRICE_PER_SQM;

        areaEl.textContent = data.i18n.areaLabel + ' ' + areaSqm.toFixed(4) + ' m\u00B2';
        priceEl.textContent = data.i18n.priceLabel + ' ' + formatPrice(price);

        resultDiv.style.display = 'block';
        errorDiv.style.display = 'none';
    }

    widthInput.addEventListener('input', calculate);
    heightInput.addEventListener('input', calculate);
})();
```

**Tasarim kararlari:**
- Vanilla JS, jQuery bagimliligini yok. Daha hafif, daha hizli.
- `input` eventi kullaniliyor (keyup yerine), boylece yapistirilmis degerler de yakalanir.
- Formatter `tr-TR` locale kullanarak Turkce sayi formatini uygular (1.250,00 TL).

---

## PHP Backend -- Sepete Ekleme Dogrulamasi ve Fiyat Hesaplama

### class-cart-handler.php

```php
<?php
defined('ABSPATH') || exit;

class ICC_Cart_Handler {

    public function __construct() {
        // Sepete eklerken dogrula
        add_filter('woocommerce_add_to_cart_validation', [$this, 'validate_dimensions'], 10, 3);

        // Sepete eklenen urune meta ekle
        add_filter('woocommerce_add_cart_item_data', [$this, 'add_dimension_data'], 10, 2);

        // Sepet urun fiyatini dinamik olarak hesapla
        add_action('woocommerce_before_calculate_totals', [$this, 'calculate_custom_price'], 20, 1);

        // Sepet sayfasinda olculeri goster
        add_filter('woocommerce_get_item_data', [$this, 'display_dimensions_in_cart'], 10, 2);
    }

    /**
     * Sepete eklerken en/boy degerlerini dogrula.
     * Dogrulama basarisizsa sepete ekleme engellenir.
     */
    public function validate_dimensions(bool $passed, int $product_id, int $quantity): bool {
        $price_per_sqm = get_post_meta($product_id, '_icc_price_per_sqm', true);

        // Bu urun hesaplayici kullanan bir urun degilse, dogrudan gec
        if (empty($price_per_sqm)) {
            return $passed;
        }

        $width  = isset($_POST['icc_width'])  ? intval($_POST['icc_width'])  : 0;
        $height = isset($_POST['icc_height']) ? intval($_POST['icc_height']) : 0;

        if ($width < 30 || $width > 600) {
            wc_add_notice('Perde eni 30 cm ile 600 cm arasinda olmalidir.', 'error');
            return false;
        }

        if ($height < 30 || $height > 600) {
            wc_add_notice('Perde boyu 30 cm ile 600 cm arasinda olmalidir.', 'error');
            return false;
        }

        return $passed;
    }

    /**
     * Sepet item'ina olcu bilgilerini meta olarak ekle.
     * Bu meta verisi, sepet oturumu boyunca saklanir.
     */
    public function add_dimension_data(array $cart_item_data, int $product_id): array {
        $price_per_sqm = get_post_meta($product_id, '_icc_price_per_sqm', true);
        if (empty($price_per_sqm)) {
            return $cart_item_data;
        }

        $width  = intval($_POST['icc_width']  ?? 0);
        $height = intval($_POST['icc_height'] ?? 0);

        if ($width >= 30 && $height >= 30) {
            $cart_item_data['icc_width']  = $width;
            $cart_item_data['icc_height'] = $height;

            // Benzersiz cart item key olustur (ayni urun farkli olcuyle ayri satirda gorunsun)
            $cart_item_data['unique_key'] = md5($product_id . '_' . $width . '_' . $height);
        }

        return $cart_item_data;
    }

    /**
     * Sepet toplamlarini hesaplamadan once her item'in fiyatini guncelle.
     * Bu hook her sayfa yuklemesinde calisir, boylece fiyat her zaman guncel kalir.
     */
    public function calculate_custom_price(WC_Cart $cart): void {
        if (is_admin() && !defined('DOING_AJAX')) {
            return;
        }

        // Sonsuz donguyu onle
        if (did_action('woocommerce_before_calculate_totals') >= 2) {
            return;
        }

        foreach ($cart->get_cart() as $cart_item) {
            if (!isset($cart_item['icc_width'], $cart_item['icc_height'])) {
                continue;
            }

            $product_id    = $cart_item['product_id'];
            $price_per_sqm = floatval(get_post_meta($product_id, '_icc_price_per_sqm', true));

            if ($price_per_sqm <= 0) {
                continue;
            }

            $width  = intval($cart_item['icc_width']);
            $height = intval($cart_item['icc_height']);
            $area   = ($width * $height) / 10000; // cm2 -> m2
            $price  = $area * $price_per_sqm;

            $cart_item['data']->set_price(round($price, 2));
        }
    }

    /**
     * Sepet sayfasinda urun satirinda olculeri goster.
     */
    public function display_dimensions_in_cart(array $item_data, array $cart_item): array {
        if (isset($cart_item['icc_width'])) {
            $item_data[] = [
                'key'   => 'Perde Eni',
                'value' => $cart_item['icc_width'] . ' cm',
            ];
        }
        if (isset($cart_item['icc_height'])) {
            $item_data[] = [
                'key'   => 'Perde Boyu',
                'value' => $cart_item['icc_height'] . ' cm',
            ];
        }
        if (isset($cart_item['icc_width'], $cart_item['icc_height'])) {
            $area = ($cart_item['icc_width'] * $cart_item['icc_height']) / 10000;
            $item_data[] = [
                'key'   => 'Alan',
                'value' => number_format($area, 2, ',', '.') . ' m2',
            ];
        }

        return $item_data;
    }
}
```

---

## Siparis Meta Kaydetme

Olcu bilgileri siparis tamamlandiginda kalici olarak order item meta'ya yazilir. Bu bilgiler admin panelinde siparis detayinda ve uretimde kullanilir.

### class-order-handler.php

```php
<?php
defined('ABSPATH') || exit;

class ICC_Order_Handler {

    public function __construct() {
        // Sepetten siparise gecerken meta'yi kaydet
        add_action('woocommerce_checkout_create_order_line_item', [$this, 'save_order_item_meta'], 10, 4);

        // Admin siparis detay sayfasinda olculeri goster
        add_action('woocommerce_admin_order_item_headers', [$this, 'admin_order_item_headers']);
        add_action('woocommerce_admin_order_item_values', [$this, 'admin_order_item_values'], 10, 3);
    }

    /**
     * Siparis olusturulurken olcu bilgilerini order item meta olarak kaydet.
     */
    public function save_order_item_meta(
        WC_Order_Item_Product $item,
        string $cart_item_key,
        array $values,
        WC_Order $order
    ): void {
        if (isset($values['icc_width'])) {
            $item->add_meta_data('Perde Eni (cm)', intval($values['icc_width']));
        }
        if (isset($values['icc_height'])) {
            $item->add_meta_data('Perde Boyu (cm)', intval($values['icc_height']));
        }
        if (isset($values['icc_width'], $values['icc_height'])) {
            $area = (intval($values['icc_width']) * intval($values['icc_height'])) / 10000;
            $item->add_meta_data('Alan (m2)', number_format($area, 4, '.', ''));
        }
    }

    /**
     * Admin siparis sayfasinda ek baslik.
     */
    public function admin_order_item_headers(): void {
        echo '<th class="icc-dimensions">Perde Olculeri</th>';
    }

    /**
     * Admin siparis sayfasinda olcu degerlerini goster.
     */
    public function admin_order_item_values(
        ?WC_Product $product,
        WC_Order_Item $item,
        int $item_id
    ): void {
        $width  = $item->get_meta('Perde Eni (cm)');
        $height = $item->get_meta('Perde Boyu (cm)');

        echo '<td class="icc-dimensions">';
        if ($width && $height) {
            echo esc_html($width . ' x ' . $height . ' cm');
        } else {
            echo '-';
        }
        echo '</td>';
    }
}
```

---

## Hesaplama Sinifi

### includes/class-calculator.php

Merkezi hesaplama ve dogrulama mantigi. Diger siniflar tarafindan kullanilir.

```php
<?php
defined('ABSPATH') || exit;

class ICC_Calculator {

    public const MIN_DIMENSION = 30;
    public const MAX_DIMENSION = 600;

    /**
     * Olculeri dogrula.
     *
     * @return true|WP_Error
     */
    public static function validate(int $width, int $height) {
        if ($width < self::MIN_DIMENSION || $width > self::MAX_DIMENSION) {
            return new WP_Error(
                'invalid_width',
                sprintf('Perde eni %d-%d cm arasinda olmalidir.', self::MIN_DIMENSION, self::MAX_DIMENSION)
            );
        }
        if ($height < self::MIN_DIMENSION || $height > self::MAX_DIMENSION) {
            return new WP_Error(
                'invalid_height',
                sprintf('Perde boyu %d-%d cm arasinda olmalidir.', self::MIN_DIMENSION, self::MAX_DIMENSION)
            );
        }
        return true;
    }

    /**
     * Fiyat hesapla.
     *
     * @param int   $width_cm       En (cm)
     * @param int   $height_cm      Boy (cm)
     * @param float $price_per_sqm  Metrekare fiyati (TL)
     * @return float Toplam fiyat (TL), 2 ondalik basamakli
     */
    public static function calculate_price(int $width_cm, int $height_cm, float $price_per_sqm): float {
        $area_sqm = ($width_cm * $height_cm) / 10000;
        return round($area_sqm * $price_per_sqm, 2);
    }

    /**
     * Alan hesapla (m2).
     */
    public static function calculate_area(int $width_cm, int $height_cm): float {
        return ($width_cm * $height_cm) / 10000;
    }
}
```

---

## Veri Akisi Ozeti

```
1. ADMIN: Urun duzenleme > _icc_price_per_sqm = 450 (TL/m2)

2. FRONTEND (urun sayfasi):
   - PHP: _icc_price_per_sqm okunur, wp_localize_script ile JS'e aktarilir
   - JS: Musteri en=150, boy=250 girer
   - JS: (150*250)/10000 * 450 = 1687.50 TL gosterilir (canli)

3. SEPETE EKLEME (POST):
   - PHP: woocommerce_add_to_cart_validation -> olculer dogrulanir
   - PHP: woocommerce_add_cart_item_data -> icc_width=150, icc_height=250 cart meta'ya yazilir

4. SEPET GORUNUMU:
   - PHP: woocommerce_before_calculate_totals -> fiyat (150*250)/10000*450 = 1687.50 olarak set edilir
   - PHP: woocommerce_get_item_data -> "Perde Eni: 150 cm, Perde Boyu: 250 cm" gosterilir

5. SIPARIS:
   - PHP: woocommerce_checkout_create_order_line_item -> olcueler order_item_meta'ya yazilir
   - Admin panelinde siparis detayinda olculer gorunur
```

---

## WooCommerce Urun Fiyati Hakkinda Not

WooCommerce, fiyati olmayan urunleri satin alinamaz olarak isaretler. Bu durumu cozmek icin iki yaklasim var:

### Yaklasim 1: Placeholder Fiyat (Onerilen)

Urune sembolik bir "regular price" gir (ornegin 0.01 TL). `woocommerce_before_calculate_totals` hook'u bu fiyatin uzerine yazar. Musteri hicbir zaman 0.01 TL gormez cunku urun sayfasinda fiyat yerine hesaplama formu gosterilir.

Varsayilan fiyat gorunumunu gizle:

```php
// Urun sayfasindaki varsayilan fiyat gorunumunu gizle (metrekare fiyati olan urunlerde)
add_filter('woocommerce_get_price_html', function (string $price_html, WC_Product $product): string {
    $sqm_price = get_post_meta($product->get_id(), '_icc_price_per_sqm', true);
    if (!empty($sqm_price)) {
        return '<span class="icc-sqm-price">' .
               wc_price($sqm_price) . ' / m<sup>2</sup>' .
               '</span>';
    }
    return $price_html;
}, 10, 2);
```

### Yaklasim 2: "Sepete Ekle" Butonunu Ozellestirme

WooCommerce'in urun tipini "simple" olarak birak ama fiyat kontrolunu atla. Bu daha karmasik ve kirilgan -- Yaklasim 1 yeterli.

---

## Test Senaryolari

| Senaryo | Girdi | Beklenen Sonuc |
|---|---|---|
| Normal hesaplama | en=150, boy=250, birim=450 TL/m2 | 1.687,50 TL |
| Minimum siniir | en=30, boy=30, birim=300 TL/m2 | 2,70 TL |
| Maksimum sinir | en=600, boy=600, birim=500 TL/m2 | 18.000,00 TL |
| En cok kucuk | en=29, boy=200 | Hata: minimum 30 cm |
| Boy cok buyuk | en=200, boy=601 | Hata: maksimum 600 cm |
| Negatif deger | en=-50, boy=200 | Hata: minimum 30 cm |
| Bos alan | en=(bos), boy=200 | Sepete ekleme engellenir |
| JS devre disi | - | PHP dogrulamasi devreye girer, form POST ile gonderilir |

---

## CSS Ornegi

### assets/css/curtain-calculator.css

```css
.icc-calculator {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    background: #fafafa;
}

.icc-calculator h3 {
    margin: 0 0 16px 0;
    font-size: 1.1em;
}

.icc-field-group {
    margin-bottom: 12px;
}

.icc-field-group label {
    display: block;
    margin-bottom: 4px;
    font-weight: 600;
    font-size: 0.9em;
}

.icc-field-group input[type="number"] {
    width: 100%;
    max-width: 200px;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1em;
}

.icc-result {
    margin-top: 16px;
    padding: 12px;
    background: #e8f5e9;
    border-radius: 4px;
    border-left: 4px solid #4caf50;
}

.icc-result .icc-price {
    font-size: 1.3em;
    font-weight: 700;
    color: #2e7d32;
    margin: 4px 0 0 0;
}

.icc-result .icc-area {
    font-size: 0.9em;
    color: #555;
    margin: 0;
}

.icc-error {
    margin-top: 12px;
    padding: 10px;
    background: #ffebee;
    border-radius: 4px;
    border-left: 4px solid #f44336;
    color: #c62828;
    font-size: 0.9em;
}

.icc-sqm-price {
    font-size: 1.1em;
    color: #333;
}
```
