<?php defined('ABSPATH') || exit; ?>

<div id="icc-calculator-wrapper" class="icc-calculator icc-calculator-tul">
    <h3>Tul Perde Hesaplayici</h3>

    <p class="icc-info">
        <strong>Kartela:</strong> <?php echo esc_html($kartela_code); ?><br>
        <strong>Kumas Fiyati:</strong> <?php echo wc_price($price_per_meter); ?> / metre<br>
        <strong>Dikis Maliyeti:</strong> 25 TL / metre
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
            placeholder="Ornek: 300"
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
        <small>Standart boy: 260 cm (kumas 260cm rulolardan gelir)</small>
    </div>

    <div class="icc-field-group">
        <label for="icc-pleat-ratio">Pile Orani *</label>
        <select id="icc-pleat-ratio" name="icc_pleat_ratio" required>
            <option value="">Seciniz</option>
            <?php foreach ($available_pleats as $ratio): ?>
                <option value="<?php echo esc_attr($ratio); ?>">
                    1:<?php echo esc_html($ratio); ?>
                </option>
            <?php endforeach; ?>
        </select>
    </div>

    <div class="icc-field-group">
        <label for="icc-room-name">Oda Adi (Opsiyonel)</label>
        <input
            type="text"
            id="icc-room-name"
            name="icc_room_name"
            placeholder="Ornek: Salon, Yatak Odasi"
        />
    </div>

    <div id="icc-result" class="icc-result" style="display: none;">
        <p><strong>Gerekli Kumas:</strong> <span class="icc-fabric-meters"></span> metre</p>
        <p><strong>Kumas Maliyeti:</strong> <span class="icc-fabric-cost"></span></p>
        <p><strong>Dikis Maliyeti:</strong> <span class="icc-sewing-cost"></span></p>
        <hr>
        <p class="icc-total-price"><strong>Toplam Fiyat:</strong> <span class="icc-total"></span></p>
    </div>

    <div id="icc-error" class="icc-error" style="display: none;"></div>
</div>
