"""Tests for config loading and validation."""

from adloop.config import AdLoopConfig, load_config


class TestLoadConfig:
    def test_returns_defaults_when_no_file(self, tmp_path):
        config = load_config(str(tmp_path / "nonexistent.yaml"))
        assert isinstance(config, AdLoopConfig)
        assert config.safety.max_daily_budget == 50.0
        assert config.safety.require_dry_run is True

    def test_loads_from_yaml(self, tmp_path):
        config_file = tmp_path / "config.yaml"
        config_file.write_text(
            "safety:\n"
            "  max_daily_budget: 25.0\n"
            "  require_dry_run: false\n"
            "ads:\n"
            "  customer_id: '123-456-7890'\n"
        )
        config = load_config(str(config_file))
        assert config.safety.max_daily_budget == 25.0
        assert config.safety.require_dry_run is False
        assert config.ads.customer_id == "123-456-7890"

    def test_missing_sections_use_defaults(self, tmp_path):
        config_file = tmp_path / "config.yaml"
        config_file.write_text("ga4:\n  property_id: 'properties/123'\n")
        config = load_config(str(config_file))
        assert config.ga4.property_id == "properties/123"
        assert config.ads.developer_token == ""
        assert config.safety.max_daily_budget == 50.0
