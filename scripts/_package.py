"""Shared list of what actually ships."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Each entry is a self-contained folder: its own index.html, css/, js/ and assets/.
DELIVERABLES = [
    'scorecard-option-1',
    'ticker-option-1-broadcast-bar',
    'ticker-option-2-corner-card',
    'ticker-option-3-baseline-strip',
    'ticker-option-4-replay-wall',
]

SKIP_NAMES = {'.DS_Store', 'Thumbs.db'}


def files_in(folder: Path):
    """Every shippable file under folder, sorted."""
    for path in sorted(folder.rglob('*')):
        if not path.is_file() or path.name in SKIP_NAMES:
            continue
        if any(part.startswith('.') for part in path.relative_to(folder).parts):
            continue
        yield path
