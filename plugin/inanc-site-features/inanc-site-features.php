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

define('ISF_WHATSAPP_NUMBER', '905414288005');
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

// Announcement bar — disabled, content moved to Astra header-html-1

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

// PostHog analytics — initialization
add_action('wp_head', function () {
    if (is_admin()) {
        return;
    }
    ?>
    <script>
        !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group identify setPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags resetGroups onFeatureFlags addFeatureFlagsHandler onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        posthog.init('phc_knhZGJSkRM7w0MmIssVXa7U6QzDiGipYDXu4xwyflQp', {
            api_host: 'https://eu.i.posthog.com',
            defaults: '2026-01-30',
            capture_pageview: true,
            capture_pageleave: true,
            capture_performance: {
                web_vitals: true,
                web_vitals_allowed_metrics: ['CLS', 'FCP', 'INP', 'LCP']
            },
            session_recording: {
                maskAllInputs: true,
                maskTextSelector: '.sensitive'
            },
            persistence: 'localStorage+cookie',
            autocapture: {
                dom_event_allowlist: ['click', 'change', 'submit'],
                element_allowlist: ['button', 'a', 'input']
            },
            enable_heatmaps: true
        })
    </script>
    <?php
}, 5);

// PostHog — identify logged-in WooCommerce customers
add_action('wp_footer', function () {
    if (is_admin() || !is_user_logged_in()) {
        return;
    }
    $user = wp_get_current_user();
    $customer_id = 'customer_' . $user->ID;
    $props = [
        'email' => $user->user_email,
        'name'  => $user->display_name,
    ];
    ?>
    <script>
    if(window.posthog){posthog.identify(<?php echo wp_json_encode($customer_id); ?>,<?php echo wp_json_encode($props); ?>)}
    </script>
    <?php
}, 2);

// PostHog — e-commerce events
add_action('wp_footer', function () {
    if (is_admin()) {
        return;
    }

    // Product viewed
    if (function_exists('is_product') && is_product()) {
        global $product;
        if ($product) {
            $cats = wp_get_post_terms($product->get_id(), 'product_cat', ['fields' => 'names']);
            $data = [
                'product_id'   => $product->get_id(),
                'product_name' => $product->get_name(),
                'price'        => (float) $product->get_price(),
                'currency'     => 'TRY',
                'category'     => !empty($cats) ? $cats[0] : '',
            ];
            ?>
            <script>if(window.posthog){posthog.capture('product_viewed',<?php echo wp_json_encode($data); ?>)}</script>
            <?php
        }
    }

    // Category viewed
    if (function_exists('is_product_category') && is_product_category()) {
        $term = get_queried_object();
        if ($term) {
            $data = [
                'category_name' => $term->name,
                'category_slug' => $term->slug,
                'product_count' => $term->count,
            ];
            ?>
            <script>if(window.posthog){posthog.capture('category_viewed',<?php echo wp_json_encode($data); ?>)}</script>
            <?php
        }
    }

    // Cart viewed (block-based cart renders async, wait for it)
    if (function_exists('is_cart') && is_cart()) {
        ?>
        <script>
        (function(){
            if(!window.posthog) return;
            function captureCart(){
                var cartData={page:'cart'};
                try{
                    var totalEl=document.querySelector('.wc-block-components-totals-footer-item .wc-block-components-totals-item__value, .cart-subtotal .amount, .order-total .amount');
                    if(totalEl) cartData.cart_total=totalEl.textContent.trim();
                    var items=document.querySelectorAll('.wc-block-cart-items__row, .woocommerce-cart-form .cart_item');
                    cartData.item_count=items.length;
                }catch(e){}
                posthog.capture('cart_viewed',cartData);
            }
            var obs=new MutationObserver(function(mutations,observer){
                if(document.querySelector('.wc-block-cart-items__row, .woocommerce-cart-form .cart_item')){
                    observer.disconnect();
                    captureCart();
                }
            });
            if(document.querySelector('.wc-block-cart-items__row, .woocommerce-cart-form .cart_item')){
                captureCart();
            } else {
                obs.observe(document.body,{childList:true,subtree:true});
                setTimeout(function(){obs.disconnect();captureCart();},5000);
            }
        })();
        </script>
        <?php
    }

    // Checkout started
    if (function_exists('is_checkout') && is_checkout() && !is_wc_endpoint_url('order-received')) {
        ?>
        <script>if(window.posthog){posthog.capture('checkout_started')}</script>
        <?php
    }

    // Order completed
    if (function_exists('is_wc_endpoint_url') && is_wc_endpoint_url('order-received')) {
        global $wp;
        $order_id = isset($wp->query_vars['order-received']) ? absint($wp->query_vars['order-received']) : 0;
        if ($order_id) {
            $order = wc_get_order($order_id);
            if ($order) {
                $items = [];
                foreach ($order->get_items() as $item) {
                    $items[] = [
                        'name'     => $item->get_name(),
                        'quantity' => $item->get_quantity(),
                        'price'    => (float) $item->get_total(),
                    ];
                }
                $data = [
                    'order_id'       => $order->get_id(),
                    'order_total'    => (float) $order->get_total(),
                    'currency'       => 'TRY',
                    'payment_method' => $order->get_payment_method(),
                    'item_count'     => count($items),
                    'items'          => $items,
                ];
                ?>
                <script>if(window.posthog){posthog.capture('order_completed',<?php echo wp_json_encode($data); ?>)}</script>
                <?php
            }
        }
    }

    // WhatsApp click tracking (floating button)
    ?>
    <script>
    document.addEventListener('DOMContentLoaded',function(){
        var waBtn=document.querySelector('.isf-whatsapp-btn');
        if(waBtn && window.posthog){
            waBtn.addEventListener('click',function(){
                posthog.capture('whatsapp_click',{source:'floating_button',page:location.pathname});
            });
        }
        var waTrust=document.querySelector('.isf-trust-signals a[href*="wa.me"]');
        if(waTrust && window.posthog){
            waTrust.addEventListener('click',function(){
                posthog.capture('whatsapp_click',{source:'trust_signal',page:location.pathname});
            });
        }
    });
    </script>
    <?php

    // Add to cart tracking (WooCommerce AJAX)
    ?>
    <script>
    if(window.jQuery && window.posthog){
        jQuery(document.body).on('added_to_cart',function(e,fragments,hash,btn){
            var card=btn.closest('.product, li');
            var nameEl=card.find('.woocommerce-loop-product__title, .product_title').first();
            var priceEl=card.find('.price .amount').first();
            posthog.capture('add_to_cart',{
                product_name:nameEl.length?nameEl.text().trim():'',
                price:priceEl.length?priceEl.text().trim():'',
                page:location.pathname
            });
        });
    }
    </script>
    <?php
}, 20);

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

// Highlight active nav menu item based on URL
add_action('wp_footer', function () {
    ?>
    <script>
    (function(){
        var path = location.pathname.replace(/\?.*/, '');
        document.querySelectorAll('#primary-site-navigation-desktop .menu-item a').forEach(function(a){
            if(path.indexOf(new URL(a.href).pathname) === 0){
                a.parentElement.classList.add('isf-active-nav');
            }
        });
    })();
    </script>
    <?php
});

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
            <span>5-7 İş Günü Teslimat</span>
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
