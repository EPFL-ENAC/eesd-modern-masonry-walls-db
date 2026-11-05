"""Export the dataset CSVs from ModernMasonryDatabase_EIA.xlsx.

    python3 export-csv.py path/to/ModernMasonryDatabase_EIA.xlsx [out_dir]

Writes, as UTF-8 with a BOM (Excel needs it to read σ, δ, μ), into out_dir
(default: the workbook's folder):

    ModernMasonryDatabase_EIA_Database.csv
    ModernMasonryDatabase_EIA_Fields.csv
    01_references/ModernMasonryDatabase_EIA_References.csv
    01_references/ModernMasonryDatabase_EIA_Fig_references.csv

Same result on every machine, whatever Excel's language or code page: use this
instead of Excel's "Save as CSV". Python 3.9+, standard library only.
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
SHEETS = {
    "Database": "ModernMasonryDatabase_EIA_Database.csv",
    "Fields": "ModernMasonryDatabase_EIA_Fields.csv",
    "References": "01_references/ModernMasonryDatabase_EIA_References.csv",
    "Fig_references": "01_references/ModernMasonryDatabase_EIA_Fig_references.csv",
}


def col_index(ref: str) -> int:
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group():
        n = n * 26 + ord(ch) - 64
    return n - 1


def number(v: str) -> str:
    """The cell's double to Excel's own precision (15 significant digits): 0.17499999999999999 → 0.175."""
    return f"{float(v):.15g}"


def read_sheets(xlsx: Path) -> dict[str, list[list[str]]]:
    z = zipfile.ZipFile(xlsx)
    shared = [
        "".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t"))
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)
    ]
    rels = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
    out = {}
    for sheet in ET.fromstring(z.read("xl/workbook.xml")).find("m:sheets", NS):
        target = rels[sheet.get(f"{{{NS['r']}}}id")].lstrip("/")
        root = ET.fromstring(z.read(target if target.startswith("xl/") else f"xl/{target}"))
        rows = []
        for row in root.iter(f"{{{NS['m']}}}row"):
            r = int(row.get("r")) - 1
            rows += [[]] * (r - len(rows))  # rows Excel skipped because they are empty
            cells: list[str] = []
            for c in row.findall("m:c", NS):
                cells += [""] * (col_index(c.get("r")) - len(cells))
                t, v = c.get("t"), c.find("m:v", NS)
                text = v.text if v is not None and v.text is not None else ""
                if t == "e":
                    sys.exit(f"{sheet.get('name')}!{c.get('r')}: Excel error {text}, fix the cell")
                if t == "s":
                    text = shared[int(text)]
                elif t == "inlineStr":
                    text = "".join(x.text or "" for x in c.iter(f"{{{NS['m']}}}t"))
                elif t in (None, "n") and text:
                    text = number(text)
                cells.append(text)
            rows.append(cells)
        out[sheet.get("name")] = rows
    return out


def table(rows: list[list[str]]) -> list[list[str]]:
    """Trailing empty rows dropped, every row padded to the widest used column."""
    while rows and not any(rows[-1]):
        rows.pop()
    width = max(max((i + 1 for i, c in enumerate(r) if c), default=0) for r in rows)
    return [(r + [""] * width)[:width] for r in rows]


if __name__ == "__main__":
    if len(sys.argv) not in (2, 3):
        sys.exit(__doc__)
    xlsx = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) == 3 else xlsx.parent
    sheets = read_sheets(xlsx)
    for name, path in SHEETS.items():
        if name not in sheets:
            sys.exit(f"{xlsx.name} has no {name} sheet")
        rows = table(sheets[name])
        if name == "Database":
            # The title row above the 4 header rows is not data: the CSV starts at '#1'.
            rows = rows[next(i for i, r in enumerate(rows) if r[0] == "#1") :]
        (out / path).parent.mkdir(parents=True, exist_ok=True)
        with (out / path).open("w", encoding="utf-8-sig", newline="") as f:
            csv.writer(f, lineterminator="\n").writerows(rows)
        print(f"wrote {path} ({len(rows)} rows)")
