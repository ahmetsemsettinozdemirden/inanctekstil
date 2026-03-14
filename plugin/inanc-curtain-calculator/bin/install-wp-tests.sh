#!/usr/bin/env bash
# Downloads WordPress test framework for PHPUnit integration tests.
# Usage: ./install-wp-tests.sh <db-name> <db-user> <db-pass> <db-host> [wp-version] [wc-version]

set -euo pipefail

DB_NAME=${1:-wordpress_test}
DB_USER=${2:-root}
DB_PASS=${3:-root}
DB_HOST=${4:-db}
WP_VERSION=${5:-latest}
WC_VERSION=${6:-9.0.0}

WP_TESTS_DIR=${WP_TESTS_DIR:-/tmp/wordpress-tests-lib}
WP_CORE_DIR=${WP_CORE_DIR:-/tmp/wordpress}

download() {
    if command -v curl &>/dev/null; then
        curl -sL "$1" > "$2"
    elif command -v wget &>/dev/null; then
        wget -nv -O "$2" "$1"
    fi
}

# Resolve "latest" to actual version number via WP API
if [ "$WP_VERSION" = "latest" ]; then
    WP_VERSION=$(curl -s https://api.wordpress.org/core/version-check/1.0/ | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 || true)
    if [ -z "$WP_VERSION" ]; then
        echo "Could not determine latest WP version, using 6.7.2"
        WP_VERSION="6.7.2"
    fi
fi

# Install WP core
mkdir -p "$WP_CORE_DIR"
if [ ! -f "$WP_CORE_DIR/wp-settings.php" ]; then
    echo "Downloading WordPress $WP_VERSION..."
    download "https://wordpress.org/wordpress-${WP_VERSION}.tar.gz" /tmp/wordpress.tar.gz
    if ! tar --strip-components=1 -zxf /tmp/wordpress.tar.gz -C "$WP_CORE_DIR" 2>/dev/null; then
        echo "Failed to extract, trying latest.tar.gz..."
        download "https://wordpress.org/latest.tar.gz" /tmp/wordpress.tar.gz
        tar --strip-components=1 -zxf /tmp/wordpress.tar.gz -C "$WP_CORE_DIR"
    fi
fi

# Install WP test suite
mkdir -p "$WP_TESTS_DIR"
if [ ! -f "$WP_TESTS_DIR/includes/functions.php" ]; then
    echo "Downloading WordPress test suite..."
    SVN_URL="https://develop.svn.wordpress.org/tags/${WP_VERSION}/tests/phpunit"
    # Try tag first, fall back to trunk
    if ! svn export --quiet "$SVN_URL/includes" "$WP_TESTS_DIR/includes" 2>/dev/null; then
        svn export --quiet "https://develop.svn.wordpress.org/trunk/tests/phpunit/includes" "$WP_TESTS_DIR/includes"
        svn export --quiet "https://develop.svn.wordpress.org/trunk/tests/phpunit/data" "$WP_TESTS_DIR/data"
    else
        svn export --quiet "$SVN_URL/data" "$WP_TESTS_DIR/data"
    fi
fi

# Install WooCommerce
WC_DIR="$WP_CORE_DIR/wp-content/plugins/woocommerce"
if [ ! -d "$WC_DIR" ]; then
    echo "Downloading WooCommerce $WC_VERSION..."
    download "https://github.com/woocommerce/woocommerce/releases/download/${WC_VERSION}/woocommerce.zip" /tmp/woocommerce.zip
    mkdir -p "$WP_CORE_DIR/wp-content/plugins"
    unzip -q /tmp/woocommerce.zip -d "$WP_CORE_DIR/wp-content/plugins/"
fi

# Create wp-tests-config.php
cat > "$WP_TESTS_DIR/wp-tests-config.php" <<EOF
<?php
define('ABSPATH', '${WP_CORE_DIR}/');
define('DB_NAME', '${DB_NAME}');
define('DB_USER', '${DB_USER}');
define('DB_PASSWORD', '${DB_PASS}');
define('DB_HOST', '${DB_HOST}');
define('DB_CHARSET', 'utf8');
define('DB_COLLATE', '');
define('WP_TESTS_DOMAIN', 'example.org');
define('WP_TESTS_EMAIL', 'admin@example.org');
define('WP_TESTS_TITLE', 'Test Blog');
define('WP_PHP_BINARY', 'php');
\$table_prefix = 'wptests_';
EOF

echo "WordPress test environment ready."
