"""Submission validator: checks a staging folder before it becomes a PR.

A submission is laid out like the Submit page's starter kit: the database CSV
(its 4 header rows + one row per new specimen, N and N_id blank), curve CSVs
named after the specimen name, and a README.txt. Columns are identified by
index, never by name: the Pavia [VI] and EPFL [VII] columns repeat names.
"""

import argparse
import csv
import io
import re
import sys
from collections.abc import Awaitable, Callable
from pathlib import Path

from enacit4r_contrib import Bundle, Issue

DATABASE_CSV = "ModernMasonryDatabase_EIA_Database.csv"
CURVE_FOLDERS = {
    "02_fd_curve": "fd_curve",
    "03_envelope_Pavia": "envelope",
    "04_envelope_EPFL": "envelope",
    "05_bilinear_curve_Pavia": "bilinear",
    "06_bilinear_curve_EPFL": "bilinear",
}
ALLOW: list[str] = [DATABASE_CSV, "README.txt"] + [f"{d}/*.csv" for d in CURVE_FOLDERS]

_PAVIA = ("neg", "pos", "neg_cycle1", "neg_cycle2", "pos_cycle1", "pos_cycle2")
_EPFL = ("neg", "pos")
SUFFIXES = {
    "02_fd_curve": ("",),
    "03_envelope_Pavia": _PAVIA,
    "04_envelope_EPFL": _EPFL,
    "05_bilinear_curve_Pavia": _PAVIA,
    "06_bilinear_curve_EPFL": _EPFL,
}
# Flag column (row-4 name) -> folders, one of which must hold a file.
FLAGS = {
    "F-d data": ("02_fd_curve",),
    "Env curve": ("03_envelope_Pavia", "04_envelope_EPFL"),
    "Bil curve": ("05_bilinear_curve_Pavia", "06_bilinear_curve_EPFL"),
}
CURVE_HEADER = ["drift [%]", "horizontal_force [kN]"]
N, N_ID, REFERENCE, SPECIMEN = 0, 1, 2, 5  # 0-based indices
_UNIT = re.compile(r"\[[^\]]*\]$")


def _parse(text: str) -> list[list[str]]:
    return list(csv.reader(io.StringIO(text)))


def _decode(data: bytes) -> str | None:
    try:
        return data.decode("utf-8-sig")
    except UnicodeDecodeError:
        return None


def _filled(v: str) -> bool:
    """Same as `nullable` in convert-data.ts: '' and 'NaN' are empty."""
    return v.strip() not in ("", "NaN")


def _float(v: str) -> bool:
    try:
        float(v)
        return True
    except ValueError:
        return False


def _curve_path(folder: str, specimen: str, suffix: str) -> str:
    tail = f"_{suffix}" if suffix else ""
    return f"{folder}/{CURVE_FOLDERS[folder]}_{specimen}{tail}.csv"


class _Dataset:
    def __init__(self, dataset_csv: bytes):
        rows = _parse(dataset_csv.decode("utf-8-sig"))
        self.header = rows[:4]
        names = [c.strip() for c in rows[3]]
        self.width = len(names)
        # EPFL [VII] repeats the Pavia [VI] names: tag the second occurrence.
        self.names = [
            n + " [VII]" if n in names[:i] else n for i, n in enumerate(names)
        ]
        # Placeholder rows (only N/N_id) are not specimens, as in convert-data.ts.
        self.rows = [
            r + [""] * (self.width - len(r))
            for r in rows[4:]
            if any(c.strip() for c in r[2:])
        ]
        col = [[r[j].strip() for r in self.rows] for j in range(self.width)]
        self.numeric = [j for j, n in enumerate(names) if _UNIT.search(n)]
        # ponytail: a non-float the dataset itself holds (fm,t and Gm "x(RILEM)/y
        # (ASTM)") is accepted, else the dataset's own rows fail rule 6.
        self.known = [set(c) for c in col]
        self.required = [
            j for j in range(2, self.width) if all(_filled(v) for v in col[j])
        ]
        self.categorical = [
            j
            for j in range(6, self.width)
            if j not in self.numeric
            and len({v for v in col[j] if v}) <= 15
            and any(col[j])
        ]
        self.ids = {
            (r[REFERENCE].strip(), r[SPECIMEN].strip()): r[N].strip() for r in self.rows
        }
        self.references = set(col[REFERENCE])
        self.flags = {f: names.index(f) for f in FLAGS}


def check_submission(bundle: Bundle, dataset_csv: bytes) -> list[Issue]:
    """Every problem in a submission folder; an empty list means it is clean."""
    if DATABASE_CSV not in bundle:
        return [Issue(f"{DATABASE_CSV} is missing", file=DATABASE_CSV)]
    ds = _Dataset(dataset_csv)
    issues: list[Issue] = []
    specimens = _check_database(bundle[DATABASE_CSV], ds, issues)
    if specimens is not None:
        _check_files(bundle, specimens, ds, issues)
    for path, data in sorted(bundle.items()):
        if path.startswith("0") and path.endswith(".csv"):
            _check_curve(path, data, issues)
    return issues


def _check_database(
    data: bytes, ds: _Dataset, issues: list[Issue]
) -> dict[str, list[str]] | None:
    """Rules 2-9. Returns specimen name -> row, or None if the file is unusable."""
    f = DATABASE_CSV

    def err(msg: str, row: int, j: int, value: str | None = None, sev="error"):
        col = ds.names[j] if j < ds.width else None
        issues.append(Issue(msg, f, row, col, value, sev))

    text = _decode(data)
    if text is None:
        issues.append(Issue("not UTF-8: save it as CSV UTF-8", file=f))
        return None
    rows = _parse(text)
    for i in range(4):
        got = rows[i] if i < len(rows) else []
        for j, want in enumerate(ds.header[i]):
            have = got[j] if j < len(got) else ""
            if have.strip() != want.strip():
                err(
                    "header differs from the database's: "
                    "use the template from the Submit page",
                    i + 1,
                    j,
                    have,
                )
                return None
    data_rows = [
        (i + 1, r + [""] * (ds.width - len(r)))
        for i, r in enumerate(rows)
        if i >= 4 and any(c.strip() for c in r)
    ]
    if not data_rows:
        issues.append(Issue("no specimen rows after the 4 header rows", file=f))
        return None
    specimens: dict[str, list[str]] = {}
    for line, r in data_rows:
        for j in (N, N_ID):
            if r[j].strip():
                err("leave N and N_id blank: the curator assigns them", line, j, r[j])
        for j in ds.required:
            if not _filled(r[j]):
                err("required: every specimen in the database fills it", line, j)
        for j in ds.numeric:
            v = r[j].strip()
            if v in ("", "NaN") or _float(v) or v in ds.known[j]:
                continue
            if v.count(",") == 1 and _float(v.replace(",", ".")):
                err("use a dot as decimal separator", line, j, v)
            else:
                err("not a number (leave it empty or write NaN)", line, j, v)
        for j in ds.categorical:
            v = r[j].strip()
            if _filled(v) and v not in ds.known[j]:
                known = ", ".join(sorted(k for k in ds.known[j] if k))
                err(f"new value {v} (known: {known})", line, j, v, "warning")
        ref, name = r[REFERENCE].strip(), r[SPECIMEN].strip()
        if name in specimens:
            err("specimen name repeated in the submission", line, SPECIMEN, name)
        elif name:
            specimens[name] = r
        if (ref, name) in ds.ids:
            err(f"already in the database as N={ds.ids[ref, name]}", line, SPECIMEN)
        if ref and ref not in ds.references:
            msg = "new reference: give its full citation in the note"
            err(msg, line, REFERENCE, ref, "warning")
    return specimens


def _check_files(
    bundle: Bundle, specimens: dict[str, list[str]], ds: _Dataset, issues: list[Issue]
) -> None:
    """Rule 10: flags <-> curve files, both ways."""
    expected: dict[str, tuple[str, str]] = {}  # path -> (specimen, flag)
    for flag, folders in FLAGS.items():
        for s in specimens:
            for d in folders:
                for x in SUFFIXES[d]:
                    expected[_curve_path(d, s, x)] = (s, flag)
    for s, r in specimens.items():
        for flag, folders in FLAGS.items():
            if r[ds.flags[flag]].strip() != "Yes":
                continue
            if not any(p in bundle for p in _paths(s, flag)):
                where = " or ".join(f"{d}/" for d in folders)
                issues.append(
                    Issue(
                        f'"{flag}" is Yes but {where} has no file for {s}',
                        file=DATABASE_CSV,
                        column=flag,
                        value=s,
                    )
                )
    for p in sorted(bundle):
        if p.split("/")[0] not in CURVE_FOLDERS:
            continue
        if p not in expected:
            issues.append(
                Issue(
                    "no submitted specimen or unknown suffix for this file",
                    file=p,
                )
            )
            continue
        s, flag = expected[p]
        if specimens[s][ds.flags[flag]].strip() != "Yes":
            issues.append(Issue(f'file present but "{flag}" is not Yes', file=p))


def _paths(s: str, flag: str) -> list[str]:
    return [_curve_path(d, s, x) for d in FLAGS[flag] for x in SUFFIXES[d]]


def _check_curve(path: str, data: bytes, issues: list[Issue]) -> None:
    """Rule 11: header, at least 2 rows, 2 floats per row."""
    text = _decode(data)
    if text is None:
        issues.append(Issue("not UTF-8", file=path))
        return
    rows = [r for r in _parse(text) if any(c.strip() for c in r)]
    if not rows or [c.strip() for c in rows[0]] != CURVE_HEADER:
        issues.append(
            Issue(f"header must be {','.join(CURVE_HEADER)}", file=path, row=1)
        )
        return
    if len(rows) < 3:
        issues.append(Issue("needs at least 2 data rows", file=path))
    for i, r in enumerate(_parse(text)[1:], start=2):
        if not any(c.strip() for c in r):
            continue
        if len(r) != 2 or not all(_float(c) for c in r):
            issues.append(
                Issue("expected 2 numbers", file=path, row=i, value=",".join(r))
            )


def make_validator(
    load_dataset: Callable[[], Awaitable[bytes]],
) -> Callable[[Bundle], Awaitable[list[Issue]]]:
    async def validate(bundle: Bundle) -> list[Issue]:
        return check_submission(bundle, await load_dataset())

    return validate


def _read_folder(folder: Path) -> Bundle:
    return {
        p.relative_to(folder).as_posix(): p.read_bytes()
        for p in folder.rglob("*")
        if p.is_file()
    }


def main(argv: list[str] | None = None) -> int:
    default = Path(__file__).parents[2] / "frontend/public/data" / DATABASE_CSV
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("folder", type=Path)
    ap.add_argument("--dataset", type=Path, default=default)
    a = ap.parse_args(argv)
    issues = check_submission(_read_folder(a.folder), a.dataset.read_bytes())
    for i in issues:
        where = ":".join(str(x) for x in (i.file, i.row) if x is not None)
        col = f" [{i.column}]" if i.column else ""
        print(f"{i.severity}: {where}{col}: {i.message}")
    return 1 if any(i.severity == "error" for i in issues) else 0


if __name__ == "__main__":
    sys.exit(main())
