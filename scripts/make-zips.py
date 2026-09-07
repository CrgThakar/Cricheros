"""Write one shareable ZIP per deliverable, plus one containing all of them.

    python scripts/make-zips.py

Each per-option ZIP is standalone: unzip it anywhere, open index.html, done.
"""
import zipfile
from _package import ROOT, DELIVERABLES, files_in

DIST = ROOT / 'dist'
DIST.mkdir(exist_ok=True)


def write(zip_path, entries):
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as archive:
        for source, arcname in entries:
            archive.write(source, arcname)
    size = zip_path.stat().st_size / 1_048_576
    print(f'{zip_path.name:<44} {size:6.2f} MB')


bundle = [(ROOT / 'index.html', 'index.html')]
for name in DELIVERABLES:
    folder = ROOT / name
    entries = [(f, f'{name}/{f.relative_to(folder).as_posix()}') for f in files_in(folder)]
    write(DIST / f'{name}.zip', entries)
    bundle += entries

for doc in sorted((ROOT / 'docs').glob('*')):
    if doc.is_file():
        bundle.append((doc, f'docs/{doc.name}'))
bundle.append((ROOT / 'README.md', 'README.md'))

write(DIST / 'CricHeroes-Practical-Test.zip', bundle)
