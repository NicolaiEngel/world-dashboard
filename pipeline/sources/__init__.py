"""Source modules. Each exposes fetch(session, **params) -> Fetched; parsing lives in pure
functions so tests can run on recorded fixtures without network access."""
from dataclasses import dataclass, field


@dataclass
class Fetched:
    series: list            # [{"date": ISO str, "value": float}], oldest first
    source: dict            # {"name", "url", ...} as shown on the tile
    caveat_note: str = ""   # appended to the indicator's caveat (e.g. baseline conversion)
    extra: dict = field(default_factory=dict)
