/**
 * Port of the handoff's charts/build_charts.py `load()` and `summary()`.
 * Tested against its outputs in tests/fixtures. Formulas run client-side
 * because there is no backend (see CLAUDE.md).
 */
import type { Specimen } from '../api/types.ts'

/** pd.to_numeric(errors='coerce'): missing or non-numeric text ('25-55%') → NaN. */
export function num(v: string | null | undefined): number {
  return v == null || v.trim() === '' ? NaN : Number(v)
}

/** Mean of the + and − directions, ignoring a missing one (pandas mean(axis=1)). */
export function avg(a: number, b: number): number {
  if (Number.isNaN(a)) return b
  if (Number.isNaN(b)) return a
  return (a + b) / 2
}

export const NA = 'n/a'

/** First label whose edge v is below, else the last label; NaN → n/a. */
function binner(edges: number[], labels: string[]) {
  return (v: number) =>
    Number.isNaN(v) ? NA : (labels[edges.findIndex((e) => v < e)] ?? labels[labels.length - 1]!)
}

function binH0H(v: number) {
  if (Number.isNaN(v)) return NA
  if (v <= 0.5) return '≤ 0.5'
  if (v < 1) return '0.5–1.0'
  if (v === 1) return '1.0'
  return '> 1.0'
}

function fmGroup(mode: string | null) {
  if (mode === 'S') return 'Shear'
  if (mode === 'F') return 'Flexure'
  if (mode?.startsWith('H-')) return 'Hybrid'
  return 'Other'
}

/** Category order on every chart axis and legend. */
export const ORDERS = {
  unit_type: ['HC', 'SB-C', 'AAC', 'CS', 'LAC', 'SB-CS', 'CB', 'HCB'],
  fm_group: ['Shear', 'Hybrid', 'Flexure', 'Other'],
  bin_H0_H: ['≤ 0.5', '0.5–1.0', '1.0', '> 1.0', NA],
  bin_H: ['< 1.5', '1.5–2.0', '2.0–2.5', '≥ 2.5'],
  bin_sigma0: ['< 0.5', '0.5–1.0', '1.0–1.5', '≥ 1.5', NA],
  bin_H_L: ['< 1', '1–1.5', '≥ 1.5'],
  bin_fm: ['< 5', '5–10', '≥ 10', NA],
  bin_drift_u: ['< 0.3', '0.3–0.6', '0.6–1.0', '≥ 1.0', NA]
} as const
export type Category = keyof typeof ORDERS

const bin = {
  H: binner([1.5, 2, 2.5], ORDERS.bin_H.slice()),
  // σ₀ replaces the handoff's assumed ALR = σ₀/fm (open question 1, answered).
  sigma0: binner([0.5, 1, 1.5], ORDERS.bin_sigma0.slice(0, -1)),
  H_L: binner([1, 1.5], ORDERS.bin_H_L.slice()),
  fm: binner([5, 10], ORDERS.bin_fm.slice(0, -1)),
  drift_u: binner([0.3, 0.6, 1], ORDERS.bin_drift_u.slice(0, -1))
}

export type Row = ReturnType<typeof derive>

/** One specimen with every derived column of derived_specimens.csv (bin_ALR → bin_sigma0). */
export function derive({ N, values, files }: Specimen) {
  const v = (name: string) => num(values[name])
  const pm = (name: string) => avg(v(`${name}+`), v(`${name}-`))
  const H = v('H')
  const L = v('L')
  const t = v('t')
  const H0_H = v('H0/H')
  const sigma0 = v('σ0')
  const fm = v('fm,c')
  const drift_u = pm('δu')
  const Vmax = pm('Vmax')
  const Vbil = pm('Vbil')
  const drift_e = pm('δe')
  const fm_group = fmGroup(values['Failure mode'] ?? null)
  return {
    N,
    values,
    files,
    specimen: values['Specimen name'] ?? '',
    reference: values.Reference ?? '',
    unit_type: values['Unit type'] ?? NA,
    failure_mode: values['Failure mode'] ?? null,
    H,
    L,
    t,
    H0_H,
    sigma0,
    fm,
    Em: v('Em'),
    H_L: H / L,
    drift_peak: pm('δVmax'),
    drift_u,
    Vmax,
    Vbil,
    drift_e,
    tau_max: Vmax / (L * t) / 1000, // MPa
    Keff: Vbil / ((drift_e / 100) * H * 1000), // kN/mm: Vbil over the yield displacement
    fm_group,
    bin_H0_H: binH0H(H0_H),
    bin_H: bin.H(H),
    bin_sigma0: bin.sigma0(sigma0),
    bin_H_L: bin.H_L(H / L),
    bin_fm: bin.fm(fm),
    bin_drift_u: bin.drift_u(drift_u)
  }
}

/** Linear-interpolated quantile of sorted values (pandas' default). */
export function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo)
}

const round3 = (x: number) => Number(x.toFixed(3))

/** summary.json's iqr(): NaN dropped, rounded to 3 decimals; null when nothing is left. */
export function medianIqr(xs: number[]) {
  const s = xs.filter((x) => !Number.isNaN(x)).sort((a, b) => a - b)
  if (!s.length) return null
  return {
    n: s.length,
    median: round3(quantile(s, 0.5)),
    q1: round3(quantile(s, 0.25)),
    q3: round3(quantile(s, 0.75))
  }
}

/** Count per category, in ORDERS order, empty categories left out. */
export function counts(rows: readonly Row[], key: Category): [string, number][] {
  const c = new Map<string, number>()
  for (const r of rows) c.set(r[key], (c.get(r[key]) ?? 0) + 1)
  return ORDERS[key].filter((k) => c.has(k)).map((k) => [k, c.get(k)!])
}
