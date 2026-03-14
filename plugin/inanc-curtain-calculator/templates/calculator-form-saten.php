<?php defined('ABSPATH') || exit; ?>

<div id="icc-calculator-wrapper" class="icc-calculator icc-calculator-saten">
    <h3>Saten Astar</h3>

    <p class="icc-info">
        <strong>Fiyat:</strong> <?php echo wc_price(ICC_SATEN_FIXED_PRICE); ?> / pencere (sabit)<br>
        <strong>Renkler:</strong> Krem, Beyaz
    </p>

    <div class="icc-field-group">
        <label for="icc-room-name">Oda Adi (Opsiyonel)</label>
        <input
            type="text"
            id="icc-room-name"
            name="icc_room_name"
            placeholder="Ornek: Salon, Yatak Odasi"
        />
    </div>

    <input type="hidden" name="icc_saten_fixed" value="1">

    <div class="icc-result">
        <p class="icc-total-price"><strong>Fiyat:</strong> <?php echo wc_price(ICC_SATEN_FIXED_PRICE); ?></p>
    </div>
</div>
