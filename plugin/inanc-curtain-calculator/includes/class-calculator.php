<?php
defined('ABSPATH') || exit;

class ICC_Calculator {

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

    public static function calculate_fon(
        int $panel_width_cm,
        float $pleat_ratio,
        float $fabric_price_per_meter
    ): array {
        $fabric_per_panel = ($panel_width_cm / 100) * $pleat_ratio;
        $total_fabric = $fabric_per_panel * 2;
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

    public static function calculate_blackout(
        int $panel_width_cm,
        float $pleat_ratio,
        float $fabric_price_per_meter
    ): array {
        return self::calculate_fon($panel_width_cm, $pleat_ratio, $fabric_price_per_meter);
    }

    public static function calculate_saten(): array {
        return [
            'total' => ICC_SATEN_FIXED_PRICE,
        ];
    }

    public static function validate_pleat_ratio(float $pleat_ratio) {
        $valid_ratios = [2.0, 2.5, 3.0];
        if (!in_array($pleat_ratio, $valid_ratios, true)) {
            return new WP_Error('invalid_pleat', 'Gecersiz pile orani. Kabul edilen: 1:2, 1:2.5, 1:3');
        }
        return true;
    }

    public static function validate_width(int $width_cm, int $min = 50, int $max = 600) {
        if ($width_cm < $min || $width_cm > $max) {
            return new WP_Error(
                'invalid_width',
                sprintf('Genislik %d-%d cm arasinda olmalidir.', $min, $max)
            );
        }
        return true;
    }
}
