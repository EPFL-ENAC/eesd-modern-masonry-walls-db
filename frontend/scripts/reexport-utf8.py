"""One-off: rewrite the dataset CSVs as UTF-8 from the source workbook.

The delivered CSVs were saved by Excel in a legacy code page, which turned σ, δ,
μ, Ʇ, ǁ, ć, Ž… into '?' or ASCII stand-ins. This takes text cells from the xlsx
and keeps the CSV's display string for numbers, joining Database rows on N.
Any other difference means the CSV was edited after the export: it exits 1.

    python3 scripts/reexport-utf8.py path/to/ModernMasonryDatabase_EIA.xlsx

Writes UTF-8 with a BOM (Excel needs it to read σ) over public/data/*.csv.
Kept for the record; EESD now exports "CSV UTF-8" directly.
"""

import csv
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
DATA = Path(__file__).resolve().parent.parent / "public" / "data"
FILES = {
    "Database": DATA / "ModernMasonryDatabase_EIA_Database.csv",
    "Fields": DATA / "ModernMasonryDatabase_EIA_Fields.csv",
    "References": DATA / "01_references" / "ModernMasonryDatabase_EIA_References.csv",
}
LEGACY = "cp1252"
# ASCII names the researcher typed by hand for symbols the code page lacks.
STAND_INS = {"Ʇ": "perp", "ǁ": "paral", "μ": "mu", "σ0": "Ntot/Ag", "δ": "drift"}


def col_index(ref: str) -> int:
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group():
        n = n * 26 + ord(ch) - 64
    return n - 1


def read_sheets(xlsx: Path) -> dict[str, list[list[tuple[str, str]]]]:
    """Sheet name -> rows of (kind, text); kind is 's' for text, 'n' for numbers."""
    z = zipfile.ZipFile(xlsx)
    shared = [
        "".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t"))
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)
    ]
    rels = {
        r.get("Id"): r.get("Target")
        for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    }
    out = {}
    for sheet in ET.fromstring(z.read("xl/workbook.xml")).find("m:sheets", NS):
        target = rels[sheet.get(f"{{{NS['r']}}}id")].lstrip("/")
        root = ET.fromstring(z.read(target if target.startswith("xl/") else f"xl/{target}"))
        rows = []
        for row in root.iter(f"{{{NS['m']}}}row"):
            cells: list[tuple[str, str]] = []
            for c in row.findall("m:c", NS):
                i = col_index(c.get("r"))
                cells += [("s", "")] * (i - len(cells))
                t, v = c.get("t"), c.find("m:v", NS)
                if t == "s":
                    cells.append(("s", shared[int(v.text)]))
                elif t == "inlineStr":
                    cells.append(("s", "".join(x.text or "" for x in c.iter(f"{{{NS['m']}}}t"))))
                elif t in ("str", "e"):
                    cells.append(("s", v.text if v is not None else ""))
                else:
                    cells.append(("n", v.text if v is not None else ""))
            rows.append(cells)
        out[sheet.get("name")] = rows
    return out


def lossy_equal(xlsx_text: str, csv_text: str) -> bool:
    """True when csv_text is what the legacy code page, or a hand-typed stand-in,
    made of xlsx_text."""
    if xlsx_text.encode(LEGACY, errors="replace").decode(LEGACY) == csv_text:
        return True
    for symbol, ascii_name in STAND_INS.items():
        xlsx_text = xlsx_text.replace(symbol, ascii_name)
    return xlsx_text.strip() == csv_text.strip()


def merge(name: str, sheet, csv_rows, header_rows: int, title_rows: int, problems: list[str]):
    """Header rows align by position, data rows join on column 1 (N, #n, Nref)."""
    by_key = {r[0][1]: r for r in sheet[title_rows + header_rows :] if r and r[0][1]}
    out = []
    for i, row in enumerate(csv_rows):
        src = sheet[title_rows + i] if i < header_rows else by_key.get(row[0])
        if src is None:
            problems.append(f"{name}: no xlsx row for CSV row {i + 1} {row[:3]}")
            out.append(row)
            continue
        new = []
        for j, cell in enumerate(row):
            kind, text = src[j] if j < len(src) else ("s", "")
            if kind == "n" or text == cell:
                new.append(cell)
            elif lossy_equal(text, cell):
                new.append(text)
            else:
                new.append(cell)
                problems.append(f"{name} row {i + 1} col {j + 1}: csv {cell!r} xlsx {text!r}")
        out.append(new)
    return out


if __name__ == "__main__":
    sheets = read_sheets(Path(sys.argv[1]))
    problems: list[str] = []
    merged = {}
    # (header rows in the CSV, title rows above them in the sheet)
    for name, (header_rows, title_rows) in {
        "Database": (4, 1),
        "Fields": (1, 0),
        "References": (1, 0),
    }.items():
        with FILES[name].open(encoding=LEGACY, newline="") as f:
            rows = list(csv.reader(f))
        merged[name] = merge(name, sheets[name], rows, header_rows, title_rows, problems)
    if problems:
        print("\n".join(problems), file=sys.stderr)
        sys.exit(1)
    for name, rows in merged.items():
        with FILES[name].open("w", encoding="utf-8-sig", newline="") as f:
            csv.writer(f, lineterminator="\n").writerows(rows)
        print(f"wrote {FILES[name].relative_to(DATA)} ({len(rows)} rows)")
