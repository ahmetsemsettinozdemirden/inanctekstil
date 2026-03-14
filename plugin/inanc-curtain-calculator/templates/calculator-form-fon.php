<?php defined('ABSPATH') || exit; ?>

<div id="icc-calculator-wrapper" class="icc-calculator icc-calculator-fon">
    <h3>Fon Perde Hesaplayici</h3>

    <p class="icc-info">
        <strong>Kartela:</strong> <?php echo esc_html($kartela_code); ?><br>
        <strong>Kumas Fiyati:</strong> <?php echo wc_price($price_per_meter); ?> / metre<br>
        <strong>Dikis Maliyeti:</strong> 500 TL / cift (sabit)<br>
        <strong>Not:</strong> Fon perdeler her zaman cift (2 panel) olarak satilir.
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
            placeholder="Ornek: 100"
            required
        />
        <small>Yaygin: 80cm veya 100cm</small>
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
        <p><strong>Panel Basina Kumas:</strong> <span class="icc-fabric-per-panel"></span> metre</p>
        <p><strong>Toplam Kumas (2 panel):</strong> <span class="icc-total-fabric"></span> metre</p>
        <p><strong>Kumas Maliyeti:</strong> <span class="icc-fabric-cost"></span></p>
        <p><strong>Dikis Maliyeti:</strong> <span class="icc-sewing-cost"></span></p>
        <hr>
        <p class="icc-total-price"><strong>Toplam Fiyat:</strong> <span class="icc-total"></span></p>
    </div>

    <div id="icc-error" class="icc-error" style="display: none;"></div>
</div>
