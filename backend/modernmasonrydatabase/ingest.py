"""Ingest an accepted submission into the dataset, numbering its specimens.

Runs after a curator merges a contribution PR: the submission folder's rows are
appended to the Database CSV with the next free N, its curve files are copied
under that number, then the folder is deleted. All checks run before the first
write, so an error leaves the dataset untouched.
"""

import argparse
import csv
import io
import shutil
import sys
from pathlib import Path

from enacit4r_contrib import Issue

from modernmasonrydatabase.contribution import (
    CURVE_FOLDERS,
    DATABASE_CSV,
    N,
    N_ID,
    REFERENCE,
    SPECIMEN,
    SUFFIXES,
    _curve_path,
    _decode,
    _filled,
    _parse,
    _read_folder,
    check_submission,
    format_issue,
)

CRACKS = "Crack measurements"
REFERENCES_CSV = "01_references/ModernMasonryDatabase_EIA_References.csv"


class IngestError(Exception):
    def __init__(self, message: str, issues: list[Issue] | None = None):
        super().__init__(message)
        self.message = message
        self.issues = issues or []


def _number(v: str) -> int | None:
    try:
        return int(float(v))
    except ValueError:
        return None


def ingest(submission: Path, data: Path) -> list[tuple[str, int]]:
    """Append the submission to `data/` and delete it; returns [(name, N)]."""
    bundle = _read_folder(submission)
    db_path = data / DATABASE_CSV
    db = db_path.read_bytes()
    errors = [i for i in check_submission(bundle, db) if i.severity == "error"]
    if errors:
        raise IngestError(f"{submission} does not pass the checks", errors)

    with (data / REFERENCES_CSV).open(encoding="utf-8-sig", newline="") as f:
        known_refs = {r["Reference ID"].strip() for r in csv.DictReader(f)}
    text = _decode(bundle[DATABASE_CSV]) or ""
    rows = [r for r in _parse(text)[4:] if any(c.strip() for c in r)]
    for r in rows:
        ref = r[REFERENCE].strip()
        if ref not in known_refs:
            raise IngestError(f"add reference {ref} to 01_references first")

    existing = _parse(db.decode("utf-8-sig"))
    width = len(existing[3])
    # convert-data.ts needs a 10_fig_cracks photo for this flag, and photos wait.
    cracks = [c.strip() for c in existing[3]].index(CRACKS)
    for r in rows:
        v = r[cracks].strip() if cracks < len(r) else ""
        if _filled(v) and v != "No":
            raise IngestError(
                f'{r[SPECIMEN].strip()}: "{CRACKS}" is {v} but photos are not'
                " ingested yet: set it to No, or add the specimen by hand"
            )
    # Placeholder rows (only N) count too: their N is taken.
    taken = [_number(r[j]) for r in existing[4:] for j in (N, N_ID) if j < len(r)]
    n = max(x for x in taken if x is not None)
    new: list[tuple[str, int, list[str]]] = []
    copies: list[tuple[bytes, Path]] = []
    for r in rows:
        n += 1
        name = r[SPECIMEN].strip()
        r = (r + [""] * width)[:width]
        r[N] = r[N_ID] = str(n)
        new.append((name, n, r))
        for d in CURVE_FOLDERS:
            for x in SUFFIXES[d]:
                src = _curve_path(d, name, x)
                if src in bundle:
                    copies.append((bundle[src], data / _curve_path(d, f"{n:04d}", x)))
    for _, target in copies:
        if target.exists():
            raise IngestError(f"{target.relative_to(data)} already exists")

    eol = "\r\n" if b"\r\n" in db else "\n"
    out = io.StringIO()
    csv.writer(out, lineterminator=eol).writerows(r for _, _, r in new)
    lead = b"" if db.endswith(eol.encode()) else eol.encode()
    with db_path.open("ab") as f:
        f.write(lead + out.getvalue().encode("utf-8"))
    for content, target in copies:
        target.write_bytes(content)
    shutil.rmtree(submission)
    return [(name, n) for name, n, _ in new]


def main(argv: list[str] | None = None) -> int:
    default = Path(__file__).parents[2] / "frontend/public/data"
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("submission", type=Path)
    ap.add_argument("--data", type=Path, default=default)
    a = ap.parse_args(argv)
    try:
        done = ingest(a.submission, a.data)
    except IngestError as e:
        print(e.message)
        for i in e.issues:
            print(format_issue(i))
        return 1
    for name, n in done:
        print(f"ingested {name} as N={n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
