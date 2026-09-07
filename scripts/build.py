"""Stage the landing page and the five deliverable folders into public/.

Every deliverable folder is already self-contained and uses only relative paths,
so the build is a filtered copy. The landing page and the design notes ship with
them; the markdown source and the brief do not.
"""
import shutil
from _package import ROOT, DELIVERABLES, files_in

OUTPUT = ROOT / 'public'
if OUTPUT.exists():
    shutil.rmtree(OUTPUT)
OUTPUT.mkdir()

shutil.copy2(ROOT / 'index.html', OUTPUT / 'index.html')
count = 1

for name in DELIVERABLES:
    folder = ROOT / name
    assert (folder / 'index.html').is_file(), f'{name}/index.html is missing'
    for source in files_in(folder):
        target = OUTPUT / name / source.relative_to(folder)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        count += 1

# The landing page links the design notes, so they ship alongside it.
shutil.copy2(ROOT / 'explanation.html', OUTPUT / 'explanation.html')
count += 1

print(f'Staged {count} files in public/ across {len(DELIVERABLES)} deliverables')
