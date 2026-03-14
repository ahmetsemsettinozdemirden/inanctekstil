<?php
/**
 * Plugin Name: Inanc Tekstil Site Ozellikleri
 * Description: WhatsApp butonu, duyuru cubugu ve guven sinyalleri
 * Version: 1.0.0
 * Author: Inanc Tekstil
 */

defined('ABSPATH') || exit;

define('ISF_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ISF_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ISF_VERSION', '1.0.0');

// WhatsApp number (update with real number)
define('ISF_WHATSAPP_NUMBER', '905320000000');
define('ISF_WHATSAPP_MESSAGE', 'Merhaba, perde siparişi hakkında bilgi almak istiyorum.');

add_action('wp_enqueue_scripts', function () {
    if (is_admin()) {
        return;
    }

    wp_enqueue_style(
        'isf-site-features',
        ISF_PLUGIN_URL . 'assets/css/site-features.css',
        [],
        ISF_VERSION
    );
});

// Announcement bar
add_action('astra_header_before', function () {
    ?>
    <div class="isf-announcement-bar">
        <div class="isf-announcement-inner">
            <span class="isf-announcement-item">✂️ Kendi Atölyemizde Özel Dikim</span>
            <span class="isf-announcement-sep">|</span>
            <span class="isf-announcement-item">🚚 Hatay İçi Ücretsiz Kargo (1.000 TL+)</span>
            <span class="isf-announcement-sep">|</span>
            <span class="isf-announcement-item">📞 WhatsApp: 0532 XXX XX XX</span>
        </div>
    </div>
    <?php
});

// Floating WhatsApp button
add_action('wp_footer', function () {
    $message = urlencode(ISF_WHATSAPP_MESSAGE);
    $number = ISF_WHATSAPP_NUMBER;
    ?>
    <a href="https://wa.me/<?php echo esc_attr($number); ?>?text=<?php echo esc_attr($message); ?>"
       class="isf-whatsapp-btn"
       target="_blank"
       rel="noopener noreferrer"
       aria-label="WhatsApp ile iletişime geçin">
        <svg viewBox="0 0 32 32" width="32" height="32" fill="currentColor">
            <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958C9.72 30.876 12.764 32 16.004 32 24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.302 22.602c-.388 1.092-1.938 1.998-3.156 2.264-.834.178-1.922.32-5.588-1.202-4.692-1.944-7.71-6.696-7.944-7.006-.226-.31-1.846-2.462-1.846-4.696 0-2.234 1.168-3.332 1.584-3.788.388-.424.91-.598 1.214-.598.152 0 .288.008.41.014.416.018.624.042.898.696.344.82 1.154 2.822 1.256 3.028.102.206.204.488.068.778-.128.296-.242.482-.448.738-.206.256-.424.454-.63.73-.188.24-.398.496-.17.874.226.372 1.01 1.664 2.168 2.696 1.488 1.328 2.742 1.74 3.132 1.932.288.142.632.118.866-.128.296-.312.662-.83 1.034-1.342.264-.364.598-.41.918-.278.324.124 2.052.968 2.404 1.144.352.178.586.264.672.41.084.146.084.852-.304 1.944z"/>
        </svg>
        <span class="isf-whatsapp-text">Bize Yazın</span>
    </a>
    <?php
});

// Meta descriptions for SEO
add_action('wp_head', function () {
    // Skip if an SEO plugin handles this
    if (defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('FLAVOR_SEO_VERSION')) {
        return;
    }

    $description = '';

    if (is_front_page()) {
        $description = '30 yıldır İskenderun\'da hizmet veren İnanç Tekstil. Tül, fon, blackout perde. Ölçünüze özel dikim, kendi atölyemizde imalat.';
    } elseif (is_page('hakkimizda')) {
        $description = 'Hatice ve Hüseyin Özdemirden tarafından kurulan İnanç Tekstil\'in hikayesi.';
    } elseif (is_page('iletisim')) {
        $description = 'İnanç Tekstil mağaza adresi, telefon, WhatsApp ve iletişim bilgileri.';
    } elseif (is_tax('product_cat', 'tul-perdeler') || is_tax('product_cat', 'tul')) {
        $description = 'Tül perde modelleri. Ölçüye özel dikim, kendi atölyemizde imalat. İnanç Tekstil, İskenderun.';
    } elseif (is_tax('product_cat', 'fon-perdeler') || is_tax('product_cat', 'fon')) {
        $description = 'Fon perde modelleri. Ölçüye özel dikim, kendi atölyemizde imalat. İnanç Tekstil, İskenderun.';
    } elseif (is_tax('product_cat', 'blackout-perdeler') || is_tax('product_cat', 'blackout')) {
        $description = 'Blackout karartma perde modelleri. Ölçüye özel dikim. İnanç Tekstil, İskenderun.';
    } elseif (is_tax('product_cat', 'saten-perdeler') || is_tax('product_cat', 'saten')) {
        $description = 'Saten perde modelleri. Hazır dikim, şık tasarım. İnanç Tekstil, İskenderun.';
    }

    if ($description) {
        echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
    }
}, 1);

// Trust signals on product pages
add_action('woocommerce_single_product_summary', function () {
    ?>
    <div class="isf-trust-signals">
        <div class="isf-trust-item">
            <span class="isf-trust-icon">✂️</span>
            <span>Kendi Atölyemizde Dikilir</span>
        </div>
        <div class="isf-trust-item">
            <span class="isf-trust-icon">📦</span>
            <span>5-10 İş Günü Teslimat</span>
        </div>
        <div class="isf-trust-item">
            <span class="isf-trust-icon">🔄</span>
            <a href="/iade-ve-degisim-politikasi/">İade Politikası</a>
        </div>
        <div class="isf-trust-item">
            <span class="isf-trust-icon">💬</span>
            <a href="https://wa.me/<?php echo esc_attr(ISF_WHATSAPP_NUMBER); ?>" target="_blank" rel="noopener">WhatsApp Destek</a>
        </div>
    </div>
    <?php
}, 35);
