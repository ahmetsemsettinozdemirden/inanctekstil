"""
Batch runner for room visualizer pipeline.

Processes all SKUs × rooms through Stage 1 (PIL) and optionally Stage 2 (fal.ai).
Supports resume (skips already-completed outputs), progress logging, and JSONL output.

Usage:
  python room_batch.py --rooms room-04 --stage 1 --limit 10
  python room_batch.py --rooms all --stage 1 --skus BLK
  python room_batch.py --rooms all --stage 1,2 --dry-run
  python room_batch.py --resume --rooms all --stage 1

Output logs:
  catalog/swatch-cropper/logs/run_YYYYMMDD_HHMMSS.log      (DEBUG)
  catalog/swatch-cropper/logs/run_YYYYMMDD_HHMMSS.jsonl    (per-SKU results)
"""
import argparse
import json
import logging
import sys
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional

BASE          = Path('/Users/semsettin/workspace/inanc-tekstil/catalog')
ASSETS_DIR    = BASE / 'swatch-assets'
TEMPLATES_DIR = BASE / 'room-templates'
LOG_DIR       = Path(__file__).parent / 'logs'

ALL_ROOMS = ['room-01', 'room-02', 'room-03', 'room-04']

log = logging.getLogger('room_batch')


# ── Logging setup ─────────────────────────────────────────────────────────────

def setup_logging(log_dir: Path) -> tuple[str, Path]:
    log_dir.mkdir(exist_ok=True)
    run_id = datetime.now().strftime('%Y%m%d_%H%M%S')

    root = logging.getLogger()
    root.setLevel(logging.DEBUG)

    # Console — INFO
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.INFO)
    console.setFormatter(logging.Formatter('%(asctime)s  %(message)s', '%H:%M:%S'))
    root.addHandler(console)

    # File — DEBUG
    file_h = logging.FileHandler(log_dir / f'run_{run_id}.log')
    file_h.setLevel(logging.DEBUG)
    file_h.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(name)s  %(message)s'))
    root.addHandler(file_h)

    json_path = log_dir / f'run_{run_id}.jsonl'
    log.info(f'[batch] Log file: {log_dir}/run_{run_id}.log')
    log.info(f'[batch] JSONL:    {json_path}')
    return run_id, json_path


# ── Result dataclass ──────────────────────────────────────────────────────────

@dataclass
class SkuResult:
    sku:            str
    room_id:        str
    stage:          int
    status:         str           # 'ok' | 'skip' | 'error'
    out_path:       Optional[str]
    elapsed_s:      float
    error:          Optional[str] = None
    color_delta_rgb: Optional[float] = None   # Euclidean RGB distance
    color_delta_e:   Optional[float] = None   # CIE76 ΔE (perceptual; <3 imperceptible)


def write_jsonl(path: Path, result: SkuResult):
    with open(path, 'a') as f:
        f.write(json.dumps(asdict(result)) + '\n')


# ── SKU discovery ─────────────────────────────────────────────────────────────

def discover_skus(assets_dir: Path, sku_filter: Optional[str] = None) -> list[str]:
    """Return sorted list of SKUs that have a meta.json."""
    skus = sorted(
        d.name for d in assets_dir.iterdir()
        if d.is_dir()
        and (d / 'meta.json').exists()
        and d.name != 'designs'
    )
    if sku_filter:
        skus = [s for s in skus if sku_filter.upper() in s.upper()]
    log.info(f'[batch] Discovered {len(skus)} SKUs' + (f' (filter: {sku_filter})' if sku_filter else ''))
    return skus


# ── Stage 1 batch ─────────────────────────────────────────────────────────────

def run_stage1_batch(
    skus: list[str],
    rooms: list[str],
    jsonl_path: Path,
    resume: bool = False,
    dry_run: bool = False,
    assets_dir: Path = ASSETS_DIR,
    templates_dir: Path = TEMPLATES_DIR,
) -> tuple[int, int, int]:
    from room_visualizer import (
        run_stage1, load_fabric_spec, load_room_config,
        measure_color_accuracy, FabricLoadError, MaskNotFoundError,
    )
    import numpy as np
    from PIL import Image

    ok = skip = err = 0
    total = len(skus) * len(rooms)
    done  = 0

    for room_id in rooms:
        for sku in skus:
            done += 1
            t0 = time.time()

            out_path = assets_dir / sku / 'rooms' / f'{room_id}-stage1.jpg'

            if resume and out_path.exists():
                log.info(f'[batch] SKIP  {sku} × {room_id}  (exists)')
                write_jsonl(jsonl_path, SkuResult(
                    sku=sku, room_id=room_id, stage=1, status='skip',
                    out_path=str(out_path), elapsed_s=0.0,
                ))
                skip += 1
                continue

            if dry_run:
                log.info(f'[batch] DRY   {sku} × {room_id}  [{done}/{total}]')
                write_jsonl(jsonl_path, SkuResult(
                    sku=sku, room_id=room_id, stage=1, status='skip',
                    out_path=None, elapsed_s=0.0,
                ))
                skip += 1
                continue

            try:
                run_stage1(sku, room_id, assets_dir, templates_dir, assets_dir)
                elapsed = time.time() - t0

                # Measure color accuracy on output
                delta_rgb = delta_e = None
                try:
                    fabric   = load_fabric_spec(sku, assets_dir)
                    room_cfg = load_room_config(room_id, templates_dir)
                    result   = np.array(Image.open(out_path).convert('RGB'))
                    delta_rgb, delta_e = measure_color_accuracy(
                        result, room_cfg.mask, fabric.dominant_color
                    )
                    qa_flag = '✓' if delta_e < 10 else ' WARN ΔE>10'
                    log.info(
                        f'[batch] OK    {sku} × {room_id}  {elapsed:.2f}s  '
                        f'ΔE={delta_e:.2f}{qa_flag}  [{done}/{total}]'
                    )
                except Exception:
                    log.info(f'[batch] OK    {sku} × {room_id}  {elapsed:.2f}s  [{done}/{total}]')

                write_jsonl(jsonl_path, SkuResult(
                    sku=sku, room_id=room_id, stage=1, status='ok',
                    out_path=str(out_path), elapsed_s=round(elapsed, 3),
                    color_delta_rgb=round(delta_rgb, 1) if delta_rgb is not None else None,
                    color_delta_e=round(delta_e, 3) if delta_e is not None else None,
                ))
                ok += 1

            except MaskNotFoundError as e:
                elapsed = time.time() - t0
                log.error(f'[batch] ERR   {sku} × {room_id}  MaskNotFound: {e}')
                write_jsonl(jsonl_path, SkuResult(
                    sku=sku, room_id=room_id, stage=1, status='error',
                    out_path=None, elapsed_s=round(elapsed, 3),
                    error=f'MaskNotFound: {e}',
                ))
                log.warning(f'[batch] Skipping remaining SKUs for {room_id} (mask missing)')
                err += (len(skus) - skus.index(sku))
                break

            except FabricLoadError as e:
                elapsed = time.time() - t0
                log.error(f'[batch] ERR   {sku} × {room_id}  FabricLoad: {e}')
                write_jsonl(jsonl_path, SkuResult(
                    sku=sku, room_id=room_id, stage=1, status='error',
                    out_path=None, elapsed_s=round(elapsed, 3),
                    error=f'FabricLoad: {e}',
                ))
                err += 1

            except Exception as e:
                import traceback
                elapsed = time.time() - t0
                log.error(f'[batch] ERR   {sku} × {room_id}  {type(e).__name__}: {e}')
                log.debug(traceback.format_exc())
                write_jsonl(jsonl_path, SkuResult(
                    sku=sku, room_id=room_id, stage=1, status='error',
                    out_path=None, elapsed_s=round(elapsed, 3),
                    error=f'{type(e).__name__}: {e}',
                ))
                err += 1

    return ok, skip, err


# ── Stage 2 batch — async concurrent submit ───────────────────────────────────

def run_stage2_batch(
    skus: list[str],
    rooms: list[str],
    jsonl_path: Path,
    resume: bool = False,
    dry_run: bool = False,
    assets_dir: Path = ASSETS_DIR,
    templates_dir: Path = TEMPLATES_DIR,
    concurrency: int = 8,
) -> tuple[int, int, int]:
    """Submit all Stage 2 jobs concurrently using fal_client.submit().

    concurrency controls max parallel fal.ai requests (default 8).
    Avoids HTTP timeouts that occur with synchronous run() at scale.
    """
    from room_visualizer import load_fabric_spec, load_room_config, FabricLoadError, MaskNotFoundError
    from room_visualizer_fal import run_stage2_batch_async

    # Build job list, skipping already-done outputs
    jobs = []
    skip = 0
    err_pre = 0

    for room_id in rooms:
        for sku in skus:
            stage1_path = assets_dir / sku / 'rooms' / f'{room_id}-stage1.jpg'
            out_path    = assets_dir / sku / 'rooms' / f'{room_id}.jpg'
            mask_path   = templates_dir / f'{room_id}-mask.png'

            if resume and out_path.exists():
                log.info(f'[batch] SKIP  {sku} × {room_id}  (stage2 exists)')
                write_jsonl(jsonl_path, SkuResult(
                    sku=sku, room_id=room_id, stage=2, status='skip',
                    out_path=str(out_path), elapsed_s=0.0,
                ))
                skip += 1
                continue

            if not stage1_path.exists():
                log.error(f'[batch] ERR   {sku} × {room_id}  stage1 not found')
                write_jsonl(jsonl_path, SkuResult(
                    sku=sku, room_id=room_id, stage=2, status='error',
                    out_path=None, elapsed_s=0.0,
                    error='stage1 output not found',
                ))
                err_pre += 1
                continue

            try:
                fabric     = load_fabric_spec(sku, assets_dir)
                room_cfg   = load_room_config(room_id, templates_dir)
                jobs.append({
                    'stage1_path':       stage1_path,
                    'sku':               sku,
                    'room_id':           room_id,
                    'dominant_color':    fabric.dominant_color,
                    'transparency_class': fabric.transparency_class,
                    'curtain_type':      room_cfg.curtain_type,
                    'appearance':        fabric.appearance,
                    'out_path':          out_path,
                    'mask_path':         mask_path if mask_path.exists() else None,
                    'swatch_path':       fabric.design_swatch_path,
                })
            except (FabricLoadError, MaskNotFoundError) as e:
                log.error(f'[batch] ERR   {sku} × {room_id}  {type(e).__name__}: {e}')
                write_jsonl(jsonl_path, SkuResult(
                    sku=sku, room_id=room_id, stage=2, status='error',
                    out_path=None, elapsed_s=0.0, error=str(e),
                ))
                err_pre += 1

    if not jobs:
        log.info(f'[batch] Stage 2: no jobs to run (skip={skip}, pre-err={err_pre})')
        return 0, skip, err_pre

    log.info(f'[batch] Stage 2: submitting {len(jobs)} jobs (concurrency={concurrency})')

    results = asyncio.run(run_stage2_batch_async(jobs, dry_run=dry_run, concurrency=concurrency))

    ok = err = 0
    for job, res in zip(jobs, results):
        sku, room_id = job['sku'], job['room_id']
        if res.get('status') == 'ok':
            log.info(
                f'[batch] OK    {sku} × {room_id}  stage2  {res["elapsed_s"]:.2f}s  '
                f'ΔE={res["delta_e"]:.2f}'
            )
            write_jsonl(jsonl_path, SkuResult(
                sku=sku, room_id=room_id, stage=2, status='ok',
                out_path=str(job['out_path']), elapsed_s=res['elapsed_s'],
                color_delta_rgb=res.get('delta_rgb'),
                color_delta_e=res.get('delta_e'),
            ))
            ok += 1
        elif res.get('status') == 'dry_run':
            write_jsonl(jsonl_path, SkuResult(
                sku=sku, room_id=room_id, stage=2, status='skip',
                out_path=str(job['out_path']), elapsed_s=0.0,
            ))
            skip += 1
        else:
            log.error(f'[batch] ERR   {sku} × {room_id}  stage2  {res.get("error", "unknown")}')
            write_jsonl(jsonl_path, SkuResult(
                sku=sku, room_id=room_id, stage=2, status='error',
                out_path=None, elapsed_s=res.get('elapsed_s', 0.0),
                error=res.get('error'),
            ))
            err += 1

    return ok, skip, err + err_pre


# ── Summary printer ────────────────────────────────────────────────────────────

def print_summary(stage: int, ok: int, skip: int, err: int, elapsed: float, jsonl_path: Path):
    total = ok + skip + err
    rate  = ok / elapsed if elapsed > 0 else 0
    log.info('─' * 60)
    log.info(f'[batch] Stage {stage} summary:')
    log.info(f'[batch]   Total:   {total}')
    log.info(f'[batch]   OK:      {ok}')
    log.info(f'[batch]   Skipped: {skip}')
    log.info(f'[batch]   Errors:  {err}')
    log.info(f'[batch]   Time:    {elapsed:.1f}s  ({rate:.1f} img/s)')
    log.info(f'[batch]   JSONL:   {jsonl_path}')
    log.info('─' * 60)


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Room visualizer batch runner')
    parser.add_argument('--rooms',   default='all',
                        help='Comma-separated room IDs or "all" (default: all)')
    parser.add_argument('--stage',   default='1',
                        help='Comma-separated stages: 1, 2, or 1,2 (default: 1)')
    parser.add_argument('--skus',    default=None,
                        help='Filter SKUs by substring (e.g. BLK, FON, TUL)')
    parser.add_argument('--limit',   type=int, default=None,
                        help='Max SKUs to process (for testing)')
    parser.add_argument('--resume',  action='store_true',
                        help='Skip already-completed outputs')
    parser.add_argument('--dry-run',    action='store_true',
                        help='Log plan without writing files')
    parser.add_argument('--concurrency', type=int, default=8,
                        help='Max parallel fal.ai requests for Stage 2 (default: 8)')
    parser.add_argument('--debug',      action='store_true')
    args = parser.parse_args()

    run_id, jsonl_path = setup_logging(LOG_DIR)

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    # Parse rooms
    if args.rooms == 'all':
        rooms = ALL_ROOMS
    else:
        rooms = [r.strip() for r in args.rooms.split(',')]

    # Parse stages
    stages = [int(s.strip()) for s in args.stage.split(',')]

    # Discover SKUs
    skus = discover_skus(ASSETS_DIR, args.skus)
    if args.limit:
        skus = skus[:args.limit]
        log.info(f'[batch] Limit: {args.limit} SKUs')

    log.info(f'[batch] Run ID: {run_id}')
    log.info(f'[batch] Rooms:  {rooms}')
    log.info(f'[batch] Stages: {stages}')
    log.info(f'[batch] SKUs:   {len(skus)}')
    log.info(f'[batch] Total:  {len(skus) * len(rooms)} images per stage')
    if args.dry_run:
        log.info('[batch] DRY RUN — no files will be written')
    if args.resume:
        log.info('[batch] RESUME — existing outputs will be skipped')

    if 1 in stages:
        t0 = time.time()
        ok, skip, err = run_stage1_batch(
            skus, rooms, jsonl_path,
            resume=args.resume,
            dry_run=args.dry_run,
        )
        print_summary(1, ok, skip, err, time.time() - t0, jsonl_path)

    if 2 in stages:
        t0 = time.time()
        ok, skip, err = run_stage2_batch(
            skus, rooms, jsonl_path,
            resume=args.resume,
            dry_run=args.dry_run,
            concurrency=args.concurrency,
        )
        print_summary(2, ok, skip, err, time.time() - t0, jsonl_path)


if __name__ == '__main__':
    main()
