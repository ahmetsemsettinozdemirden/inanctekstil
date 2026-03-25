"""GA4 tracking/event tools — list custom events and their volume."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from adloop.config import AdLoopConfig


def get_tracking_events(
    config: AdLoopConfig,
    *,
    property_id: str = "",
    date_range_start: str = "28daysAgo",
    date_range_end: str = "today",
) -> dict:
    """List all GA4 events and their event count for the given date range."""
    from adloop.ga4.reports import run_ga4_report

    result = run_ga4_report(
        config,
        property_id=property_id,
        dimensions=["eventName"],
        metrics=["eventCount"],
        date_range_start=date_range_start,
        date_range_end=date_range_end,
        limit=500,
    )

    if "rows" in result:
        result["rows"].sort(
            key=lambda r: int(r.get("eventCount", "0")), reverse=True
        )

    return result
