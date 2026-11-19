import csv
import io
from pathlib import Path

import pytest

from modernmasonrydatabase.contribution import (
    DATABASE_CSV,
    _Dataset,
    check_submission,
    main,
    make_validator,
)

DATA = Path(__file__).parents[2] / "frontend/public/data"
DATASET = (DATA / DATABASE_CSV).read_bytes()
NAME = "SW0.1-new"


def _rows(data: bytes) -> list[list[str]]:
    return list(csv.reader(io.StringIO(data.decode("utf-8-sig"))))


def _csv(rows: list[list[str]]) -> bytes:
    out = io.StringIO()
    csv.writer(out, lineterminator="\r\n").writerows(rows)
    return ("﻿" + out.getvalue()).encode()


HEADER = _rows(DATASET)[:4]
COL = {n.strip(): j for j, n in enumerate(HEADER[3])}  # first occurrence


def _example() -> list[str]:
    row = next(r for r in _rows(DATASET)[4:] if r[1] == "227")
    row = ["", "", *row[2:5], NAME, *row[6:]]
    # SW0.1 has a crack method, which needs a photo the upload does not take yet.
    row[_rows(DATASET)[3].index("Crack measurements")] = ""
    return row


def _kit(*rows: list[str]) -> dict[str, bytes]:
    bundle = {DATABASE_CSV: _csv(HEADER + list(rows or [_example()]))}
    bundle["README.txt"] = b"note"
    for p in DATA.glob("0[2-6]_*/*_0227*.csv"):
        rel = p.relative_to(DATA).as_posix().replace("0227", NAME)
        bundle[rel] = p.read_bytes()
    return bundle


def _msgs(bundle, severity="error") -> list[str]:
    return [
        i.message for i in check_submission(bundle, DATASET) if i.severity == severity
    ]


def _with(col: str, value: str) -> dict[str, bytes]:
    row = _example()
    row[COL[col]] = value
    return _kit(row)


def test_starter_kit_is_clean():
    assert check_submission(_kit(), DATASET) == []


def test_rule1_missing_database():
    assert _msgs({"README.txt": b"x"}) == [f"{DATABASE_CSV} is missing"]


def test_non_utf8():
    b = _kit()
    b[DATABASE_CSV] = "é".encode("latin-1")
    assert any("UTF-8" in m for m in _msgs(b))


def test_rule2_header_mismatch_stops():
    head = [list(r) for r in HEADER]
    head[3][8] = "H [cm]"
    b = _kit()
    b[DATABASE_CSV] = _csv(head + [_example()])
    issues = [i for i in check_submission(b, DATASET) if i.file == DATABASE_CSV]
    assert len(issues) == 1
    assert (issues[0].row, issues[0].column) == (4, "H [m]")
    assert "template from the Submit page" in issues[0].message


def test_rule3_no_data_rows():
    b = _kit()
    b[DATABASE_CSV] = _csv(HEADER + [[""] * 72])
    assert "no specimen rows" in _msgs(b)[0]


def test_rule4_n_filled():
    assert "leave N and N_id blank" in _msgs(_with("N_id", "300"))[0]


@pytest.mark.parametrize("col", ["Reference", "Specimen name", "Unit type", "H [m]"])
def test_rule5_required(col):
    issues = check_submission(_with(col, ""), DATASET)
    assert any(i.message.startswith("required") and i.column == col for i in issues)


def test_rule5_required_is_computed():
    req = {_Dataset(DATASET).names[j] for j in _Dataset(DATASET).required}
    assert {"Reference", "Specimen name", "Unit type"} <= req


def test_rule6_comma_decimal():
    issues = check_submission(_with("H [m]", "1,4"), DATASET)
    assert [(i.row, i.column) for i in issues] == [(5, "H [m]")]
    assert "dot as decimal separator" in issues[0].message


def test_rule6_not_a_number():
    assert "not a number" in _msgs(_with("L [m]", "abc"))[0]


def test_rule6_new_text_in_a_textual_column_warns():
    issues = check_submission(_with("Gm [MPa]", "900(RILEM)"), DATASET)
    assert [(i.severity, i.column) for i in issues] == [("warning", "Gm [MPa]")]


def test_rule6_dataset_rows_pass():
    ds = _Dataset(DATASET)
    rows = [r for r in _rows(DATASET)[4:] if any(c.strip() for c in r[2:])]
    b = {DATABASE_CSV: _csv(HEADER + rows)}
    numeric = {ds.names[j] for j in ds.numeric}
    bad = [i for i in check_submission(b, DATASET) if i.column in numeric]
    assert bad == []
    # Only these columns hold non-floats in the dataset; any new one must fail here.
    mixed = set()
    for j in ds.numeric:
        for r in ds.rows:
            v = r[j].strip()
            try:
                float(v) if v not in ("", "NaN") else None
            except ValueError:
                mixed.add(ds.names[j])
    assert mixed == {"fm,t [MPa]", "Gm [MPa]"}


def test_rule7_new_value_warns():
    w = _msgs(_with("Unit type", "XYZ"), "warning")
    assert w and w[0].startswith("new value XYZ (known: AAC")


def test_rule8_duplicate_in_submission():
    assert any("repeated" in m for m in _msgs(_kit(_example(), _example())))


def test_rule8_already_in_dataset():
    assert "already in the database as N=227" in _msgs(_with("Specimen name", "SW0.1"))


def test_rule9_new_reference_warns():
    w = _msgs(_with("Reference", "Doe et al. (2027)"), "warning")
    assert w == ["new reference: give its full citation in the note"]


def test_rule10_flag_without_file():
    b = _kit()
    del b[f"02_fd_curve/fd_curve_{NAME}.csv"]
    assert _msgs(b) == [f'"F-d data" is Yes but 02_fd_curve/ has no file for {NAME}']


def test_rule10_file_without_flag():
    b = _with("Bil curve", "No")
    assert {m for m in _msgs(b)} == {'file present but "Bil curve" is not Yes'}


def test_rule10_unknown_specimen_or_suffix():
    b = _kit()
    b["03_envelope_Pavia/envelope_other_neg.csv"] = b"x"
    b["04_envelope_EPFL/envelope_SW0.1-new_neg_cycle1.csv"] = b"x"
    errs = [i.file for i in check_submission(b, DATASET) if "no submitted" in i.message]
    assert sorted(errs) == [
        "03_envelope_Pavia/envelope_other_neg.csv",
        "04_envelope_EPFL/envelope_SW0.1-new_neg_cycle1.csv",
    ]


def test_rule11_curves():
    b = _kit()
    p = f"02_fd_curve/fd_curve_{NAME}.csv"
    b[p] = b"drift,force\n0,1\n1,2\n"
    assert [i.row for i in check_submission(b, DATASET)] == [1]
    b[p] = b"drift [%],horizontal_force [kN]\n0,1\n"
    assert _msgs(b) == ["needs at least 2 data rows"]
    b[p] = b"drift [%],horizontal_force [kN]\n0,1\n1,x\n2,3\n"
    assert [(i.row, i.value) for i in check_submission(b, DATASET)] == [(3, "1,x")]


async def test_make_validator():
    async def load() -> bytes:
        return DATASET

    assert await make_validator(load)(_kit()) == []


def test_cli_exit_codes(tmp_path, capsys):
    for rel, data in _kit().items():
        (tmp_path / rel).parent.mkdir(parents=True, exist_ok=True)
        (tmp_path / rel).write_bytes(data)
    assert main([str(tmp_path)]) == 0
    (tmp_path / f"02_fd_curve/fd_curve_{NAME}.csv").unlink()
    assert main([str(tmp_path), "--dataset", str(DATA / DATABASE_CSV)]) == 1
    assert '"F-d data" is Yes' in capsys.readouterr().out


def test_crack_method_warns_that_a_photo_is_needed():
    issues = check_submission(_with("Crack measurements", "DIC + ACDM v2.0"), DATASET)
    assert [(i.severity, i.column) for i in issues] == [
        ("warning", "Crack measurements")
    ]
    assert "crack photo" in issues[0].message
    assert check_submission(_with("Crack measurements", "No"), DATASET) == []
