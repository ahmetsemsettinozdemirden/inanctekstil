<?php
/**
 * Standalone tests for ICC_Calculator.
 * Run: php plugin/inanc-curtain-calculator/tests/test-calculator.php
 */

if (!defined('ABSPATH')) {
    define('ABSPATH', true);
}

if (!class_exists('WP_Error')) {
    class WP_Error {
        private string $code;
        private string $message;
        public function __construct(string $code, string $message) {
            $this->code = $code;
            $this->message = $message;
        }
        public function get_error_message(): string {
            return $this->message;
        }
        public function get_error_code(): string {
            return $this->code;
        }
    }
}

function is_wp_error($thing): bool {
    return $thing instanceof WP_Error;
}

define('ICC_TUL_SEWING_COST_PER_METER', 25);
define('ICC_FON_SEWING_COST_PER_PAIR', 500);
define('ICC_SATEN_FIXED_PRICE', 150);
define('ICC_STANDARD_HEIGHT', 260);

require_once __DIR__ . '/../includes/class-calculator.php';

$passed = 0;
$failed = 0;

function assert_equals($expected, $actual, string $label): void {
    global $passed, $failed;
    if ($expected === $actual) {
        $passed++;
    } else {
        $failed++;
        echo "FAIL: $label\n  Expected: " . var_export($expected, true) . "\n  Actual:   " . var_export($actual, true) . "\n";
    }
}

function assert_true($value, string $label): void {
    assert_equals(true, $value, $label);
}

// --- Tul tests ---
$r = ICC_Calculator::calculate_tul(300, 3.0, 150.0);
assert_equals(9.0, $r['fabric_meters'], 'tul: 300cm 1:3 fabric_meters');
assert_equals(1350.0, $r['fabric_cost'], 'tul: 300cm 1:3 fabric_cost');
assert_equals(225.0, $r['sewing_cost'], 'tul: 300cm 1:3 sewing_cost');
assert_equals(1575.0, $r['total'], 'tul: 300cm 1:3 total');

$r = ICC_Calculator::calculate_tul(100, 2.0, 100.0);
assert_equals(2.0, $r['fabric_meters'], 'tul: 100cm 1:2 fabric_meters');
assert_equals(200.0, $r['fabric_cost'], 'tul: 100cm 1:2 fabric_cost');
assert_equals(50.0, $r['sewing_cost'], 'tul: 100cm 1:2 sewing_cost');
assert_equals(250.0, $r['total'], 'tul: 100cm 1:2 total');

$r = ICC_Calculator::calculate_tul(600, 3.0, 200.0);
assert_equals(18.0, $r['fabric_meters'], 'tul: 600cm 1:3 fabric_meters');
assert_equals(3600.0, $r['fabric_cost'], 'tul: 600cm 1:3 fabric_cost');
assert_equals(450.0, $r['sewing_cost'], 'tul: 600cm 1:3 sewing_cost');
assert_equals(4050.0, $r['total'], 'tul: 600cm 1:3 total');

// --- Fon tests ---
$r = ICC_Calculator::calculate_fon(100, 3.0, 400.0);
assert_equals(3.0, $r['fabric_per_panel'], 'fon: 100cm 1:3 fabric_per_panel');
assert_equals(6.0, $r['total_fabric'], 'fon: 100cm 1:3 total_fabric');
assert_equals(2400.0, $r['fabric_cost'], 'fon: 100cm 1:3 fabric_cost');
assert_equals(500, $r['sewing_cost'], 'fon: 100cm 1:3 sewing_cost');
assert_equals(2900.0, $r['total'], 'fon: 100cm 1:3 total');

$r = ICC_Calculator::calculate_fon(80, 2.5, 350.0);
assert_equals(2.0, $r['fabric_per_panel'], 'fon: 80cm 1:2.5 fabric_per_panel');
assert_equals(4.0, $r['total_fabric'], 'fon: 80cm 1:2.5 total_fabric');
assert_equals(1400.0, $r['fabric_cost'], 'fon: 80cm 1:2.5 fabric_cost');
assert_equals(1900.0, $r['total'], 'fon: 80cm 1:2.5 total');

$r = ICC_Calculator::calculate_fon(120, 3.0, 450.0);
assert_equals(3.6, $r['fabric_per_panel'], 'fon: 120cm 1:3 fabric_per_panel');
assert_equals(7.2, $r['total_fabric'], 'fon: 120cm 1:3 total_fabric');
assert_equals(3240.0, $r['fabric_cost'], 'fon: 120cm 1:3 fabric_cost');
assert_equals(3740.0, $r['total'], 'fon: 120cm 1:3 total');

// --- Blackout test ---
$r = ICC_Calculator::calculate_blackout(100, 3.0, 400.0);
assert_equals(2900.0, $r['total'], 'blackout: delegates to fon');

// --- Saten test ---
$r = ICC_Calculator::calculate_saten();
assert_equals(150, $r['total'], 'saten: fixed price 150');

// --- Validation tests ---
assert_true(ICC_Calculator::validate_pleat_ratio(2.0) === true, 'valid pleat 2.0');
assert_true(ICC_Calculator::validate_pleat_ratio(2.5) === true, 'valid pleat 2.5');
assert_true(ICC_Calculator::validate_pleat_ratio(3.0) === true, 'valid pleat 3.0');
assert_true(is_wp_error(ICC_Calculator::validate_pleat_ratio(4.0)), 'invalid pleat 4.0');
assert_true(is_wp_error(ICC_Calculator::validate_pleat_ratio(1.5)), 'invalid pleat 1.5');

assert_true(ICC_Calculator::validate_width(300) === true, 'valid width 300');
assert_true(is_wp_error(ICC_Calculator::validate_width(30)), 'invalid width 30 (too small)');
assert_true(is_wp_error(ICC_Calculator::validate_width(700)), 'invalid width 700 (too large)');
assert_true(ICC_Calculator::validate_width(100, 100, 600) === true, 'valid tul width 100');
assert_true(is_wp_error(ICC_Calculator::validate_width(99, 100, 600)), 'invalid tul width 99');

// Fon width validation (50-150 range)
assert_true(ICC_Calculator::validate_width(100, 50, 150) === true, 'valid fon width 100');
assert_true(ICC_Calculator::validate_width(50, 50, 150) === true, 'valid fon width 50 (min)');
assert_true(ICC_Calculator::validate_width(150, 50, 150) === true, 'valid fon width 150 (max)');
assert_true(is_wp_error(ICC_Calculator::validate_width(49, 50, 150)), 'invalid fon width 49');
assert_true(is_wp_error(ICC_Calculator::validate_width(151, 50, 150)), 'invalid fon width 151');

echo "\n" . ($passed + $failed) . " tests, $passed passed, $failed failed\n";
exit($failed > 0 ? 1 : 0);
