"""
Tests for the batch runner utilities.
"""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from room_batch import discover_skus, write_jsonl, SkuResult


class TestDiscoverSkus:

    def test_finds_skus_with_meta_json(self, tmp_path):
        for sku in ('BLK-001', 'FON-001', 'TUL-001'):
            d = tmp_path / sku
            d.mkdir()
            (d / 'meta.json').write_text('{}')
        skus = discover_skus(tmp_path)
        assert set(skus) == {'BLK-001', 'FON-001', 'TUL-001'}

    def test_excludes_dirs_without_meta_json(self, tmp_path):
        (tmp_path / 'BLK-001').mkdir()
        (tmp_path / 'BLK-001' / 'meta.json').write_text('{}')
        (tmp_path / 'no-meta-dir').mkdir()  # no meta.json
        skus = discover_skus(tmp_path)
        assert 'no-meta-dir' not in skus
        assert 'BLK-001' in skus

    def test_excludes_designs_directory(self, tmp_path):
        (tmp_path / 'designs').mkdir()
        (tmp_path / 'designs' / 'meta.json').write_text('{}')
        (tmp_path / 'BLK-001').mkdir()
        (tmp_path / 'BLK-001' / 'meta.json').write_text('{}')
        skus = discover_skus(tmp_path)
        assert 'designs' not in skus

    def test_filter_by_substring(self, tmp_path):
        for sku in ('BLK-001', 'BLK-002', 'FON-001', 'TUL-001'):
            d = tmp_path / sku
            d.mkdir()
            (d / 'meta.json').write_text('{}')
        skus = discover_skus(tmp_path, sku_filter='BLK')
        assert all('BLK' in s for s in skus)
        assert len(skus) == 2

    def test_returns_sorted(self, tmp_path):
        for sku in ('FON-010', 'BLK-001', 'TUL-005'):
            d = tmp_path / sku
            d.mkdir()
            (d / 'meta.json').write_text('{}')
        skus = discover_skus(tmp_path)
        assert skus == sorted(skus)


class TestWriteJsonl:

    def test_writes_valid_json_line(self, tmp_path):
        path = tmp_path / 'results.jsonl'
        result = SkuResult(
            sku='BLK-001', room_id='room-04', stage=1,
            status='ok', out_path='/tmp/test.jpg', elapsed_s=0.123,
            color_delta_rgb=12.5, color_delta_e=4.3,
        )
        write_jsonl(path, result)
        line = path.read_text().strip()
        data = json.loads(line)
        assert data['sku'] == 'BLK-001'
        assert data['room_id'] == 'room-04'
        assert data['status'] == 'ok'
        assert data['elapsed_s'] == pytest.approx(0.123)
        assert data['color_delta_rgb'] == pytest.approx(12.5)
        assert data['color_delta_e']   == pytest.approx(4.3)

    def test_appends_multiple_lines(self, tmp_path):
        path = tmp_path / 'results.jsonl'
        for i in range(3):
            result = SkuResult(
                sku=f'BLK-{i:03d}', room_id='room-04', stage=1,
                status='ok', out_path=f'/tmp/test_{i}.jpg', elapsed_s=0.1 * i,
                color_delta_e=float(i),
            )
            write_jsonl(path, result)
        lines = path.read_text().strip().split('\n')
        assert len(lines) == 3
        assert all(json.loads(l) for l in lines)

    def test_error_result_includes_error_field(self, tmp_path):
        path = tmp_path / 'results.jsonl'
        result = SkuResult(
            sku='BLK-001', room_id='room-04', stage=1,
            status='error', out_path=None, elapsed_s=0.05,
            error='MaskNotFound: room-04-mask.png',
        )
        write_jsonl(path, result)
        data = json.loads(path.read_text().strip())
        assert data['status'] == 'error'
        assert 'MaskNotFound' in data['error']
