<?php

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

class CalculatorTest extends TestCase {

    // --- calculate_tul ---

    public function test_tul_standard_case() {
        $r = ICC_Calculator::calculate_tul(300, 3.0, 150.0);
        $this->assertSame(9.0, $r['fabric_meters']);
        $this->assertSame(1350.0, $r['fabric_cost']);
        $this->assertSame(225.0, $r['sewing_cost']);
        $this->assertSame(1575.0, $r['total']);
    }

    public function test_tul_minimum_width() {
        $r = ICC_Calculator::calculate_tul(100, 2.0, 100.0);
        $this->assertSame(2.0, $r['fabric_meters']);
        $this->assertSame(200.0, $r['fabric_cost']);
        $this->assertSame(50.0, $r['sewing_cost']);
        $this->assertSame(250.0, $r['total']);
    }

    public function test_tul_maximum_width() {
        $r = ICC_Calculator::calculate_tul(600, 3.0, 200.0);
        $this->assertSame(18.0, $r['fabric_meters']);
        $this->assertSame(3600.0, $r['fabric_cost']);
        $this->assertSame(450.0, $r['sewing_cost']);
        $this->assertSame(4050.0, $r['total']);
    }

    public function test_tul_pleat_ratio_2_5() {
        $r = ICC_Calculator::calculate_tul(200, 2.5, 120.0);
        $this->assertSame(5.0, $r['fabric_meters']);
        $this->assertSame(600.0, $r['fabric_cost']);
        $this->assertSame(125.0, $r['sewing_cost']);
        $this->assertSame(725.0, $r['total']);
    }

    // --- calculate_fon ---

    public function test_fon_standard_case() {
        $r = ICC_Calculator::calculate_fon(100, 3.0, 400.0);
        $this->assertSame(3.0, $r['fabric_per_panel']);
        $this->assertSame(6.0, $r['total_fabric']);
        $this->assertSame(2400.0, $r['fabric_cost']);
        $this->assertSame(500, $r['sewing_cost']);
        $this->assertSame(2900.0, $r['total']);
    }

    public function test_fon_minimum_panel_width() {
        $r = ICC_Calculator::calculate_fon(50, 2.0, 300.0);
        $this->assertSame(1.0, $r['fabric_per_panel']);
        $this->assertSame(2.0, $r['total_fabric']);
        $this->assertSame(600.0, $r['fabric_cost']);
        $this->assertSame(1100.0, $r['total']);
    }

    public function test_fon_pleat_ratio_2_5() {
        $r = ICC_Calculator::calculate_fon(80, 2.5, 350.0);
        $this->assertSame(2.0, $r['fabric_per_panel']);
        $this->assertSame(4.0, $r['total_fabric']);
        $this->assertSame(1400.0, $r['fabric_cost']);
        $this->assertSame(1900.0, $r['total']);
    }

    public function test_fon_always_two_panels() {
        $r = ICC_Calculator::calculate_fon(120, 3.0, 450.0);
        $this->assertSame($r['fabric_per_panel'] * 2, $r['total_fabric']);
    }

    // --- calculate_blackout ---

    public function test_blackout_delegates_to_fon() {
        $fon = ICC_Calculator::calculate_fon(100, 3.0, 400.0);
        $blackout = ICC_Calculator::calculate_blackout(100, 3.0, 400.0);
        $this->assertSame($fon, $blackout);
    }

    // --- calculate_saten ---

    public function test_saten_fixed_price() {
        $r = ICC_Calculator::calculate_saten();
        $this->assertSame(ICC_SATEN_FIXED_PRICE, $r['total']);
    }

    // --- validate_pleat_ratio ---

    /** @dataProvider validPleatRatioProvider */
    public function test_valid_pleat_ratios(float $ratio) {
        $this->assertTrue(ICC_Calculator::validate_pleat_ratio($ratio));
    }

    public function validPleatRatioProvider(): array {
        return [
            '1:2'   => [2.0],
            '1:2.5' => [2.5],
            '1:3'   => [3.0],
        ];
    }

    /** @dataProvider invalidPleatRatioProvider */
    public function test_invalid_pleat_ratios(float $ratio) {
        $this->assertWPError(ICC_Calculator::validate_pleat_ratio($ratio));
    }

    public function invalidPleatRatioProvider(): array {
        return [
            '1.0' => [1.0],
            '1.5' => [1.5],
            '4.0' => [4.0],
            '0'   => [0.0],
        ];
    }

    // --- validate_width ---

    public function test_valid_width_default_range() {
        $this->assertTrue(ICC_Calculator::validate_width(300));
    }

    public function test_invalid_width_too_small() {
        $this->assertWPError(ICC_Calculator::validate_width(30));
    }

    public function test_invalid_width_too_large() {
        $this->assertWPError(ICC_Calculator::validate_width(700));
    }

    public function test_valid_width_custom_range() {
        $this->assertTrue(ICC_Calculator::validate_width(100, 50, 150));
        $this->assertTrue(ICC_Calculator::validate_width(50, 50, 150));
        $this->assertTrue(ICC_Calculator::validate_width(150, 50, 150));
    }

    public function test_invalid_width_custom_range() {
        $this->assertWPError(ICC_Calculator::validate_width(49, 50, 150));
        $this->assertWPError(ICC_Calculator::validate_width(151, 50, 150));
    }

    // --- Helper ---

    private function assertWPError($actual, string $message = ''): void {
        $this->assertInstanceOf(WP_Error::class, $actual, $message);
    }
}
