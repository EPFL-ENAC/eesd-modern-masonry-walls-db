"""Ingest an accepted submission into the dataset, numbering its specimens.

Runs after a curator merges a contribution PR: the submission folder's rows are
appended to the Database CSV with the next free N, its curve files are copied
under that number, then the folder is deleted. All checks run before the first
write, so an error leaves the dataset untouched.
"""

import argparse
import csv
import sys
from pathlib import Path

from enacit4r_contrib.ingest import IngestError, Plan, next_number, read_folder, run

from modernmasonrydatabase.contribution import (
    CURVE_FOLDERS,
    DATABASE_CSV,
    N_ID,
    REFERENCE,
    SPECIMEN,
    SUFFIXES,
    N,
    _curve_path,
    _decode,
    _filled,
    _parse,
    check_submission,
)

__all__ = ["IngestError", "ingest", "main"]

CRACKS = "Crack measurements"
REFERENCES_CSV = "01_references/ModernMasonryDatabase_EIA_References.csv"


def ingest(submission: Path, data: Path) -> list[tuple[str, int]]:
    """Append the submission to `data/` and delete it; returns [(name, N)]."""
    bundle = read_folder(submission)
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
                " ingested yet: leave it empty, or add the specimen by hand"
            )
    # Placeholder rows (only N) count too: their N is taken.
    n = next_number(r[j] for r in existing[4:] for j in (N, N_ID) if j < len(r))
    plan = Plan()
    done: list[tuple[str, int]] = []
    new: list[list[str]] = []
    for n, r in enumerate(rows, start=n):
        name = r[SPECIMEN].strip()
        r = (r + [""] * width)[:width]
        r[N] = r[N_ID] = str(n)
        new.append(r)
        done.append((name, n))
        for d in CURVE_FOLDERS:
            for x in SUFFIXES[d]:
                src = _curve_path(d, name, x)
                if src in bundle:
                    plan.create(data / _curve_path(d, f"{n:04d}", x), bundle[src])
    plan.append(db_path, new)
    plan.remove(submission)
    try:
        plan.check()
    except IngestError as e:
        raise IngestError(
            "; ".join(
                f"{Path(i.file or '').relative_to(data)} {i.message}" for i in e.issues
            )
        ) from None
    plan.apply()
    return done


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(add_help=False)
    ap.add_argument(
        "--data", type=Path, default=Path(__file__).parents[2] / "frontend/public/data"
    )
    a, rest = ap.parse_known_args(argv)
    return run(
        lambda s: [f"ingested {name} as N={n}" for name, n in ingest(s, a.data)], rest
    )


if __name__ == "__main__":
    sys.exit(main())
