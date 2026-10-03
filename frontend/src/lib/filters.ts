/**
 * Database filters, as they live in the URL query (shared by /database and
 * /database/visuals). OR within a group, AND across groups.
 */
import { NA, ORDERS, type Row } from './derive.ts'

/** Checkbox groups: query key → the values a row offers to it. */
export const LISTS = {
  unit_type: (r: Row) => [r.unit_type],
  bed: (r: Row) => [r.values['Bed Joints'] ?? NA],
  head: (r: Row) => [r.values['Head Joints'] ?? NA],
  h0h: (r: Row) => [r.bin_H0_H],
  fm_group: (r: Row) => [r.fm_group],
  has: availability
}
export type ListKey = keyof typeof LISTS

/** Min/max inputs: query prefix → the number filtered on. */
export const RANGES = { h: (r: Row) => r.H, s0: (r: Row) => r.sigma0 }
export type RangeKey = keyof typeof RANGES

export const HAS = ['fd', 'envelope', 'bilinear', 'cracks', 'photos'] as const

/** Data availability (open question 9): F-d and cracks from the database flags, the rest from files present. */
export function availability(r: Row): string[] {
  const has = (folder: string) => r.files.some((f) => f.startsWith(folder))
  const out = {
    fd: r.values['F-d data'] != null,
    envelope: has('03_envelope'),
    bilinear: has('04_bilinear_curve'),
    cracks: r.values['Crack measurements'] != null,
    photos: has('05_fig_setup') || has('07_fig_materials')
  }
  return HAS.filter((k) => out[k])
}

export type Filters = { q: string } & Record<ListKey, string[]> &
  Record<`${RangeKey}_${'min' | 'max'}`, number | null>

type Query = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')

export function parseFilters(query: Query): Filters {
  const list = (k: string) => str(query[k]).split(',').filter(Boolean)
  const bound = (k: string) => {
    const n = Number(str(query[k]) || NaN)
    return Number.isNaN(n) ? null : n
  }
  return {
    q: str(query.q),
    unit_type: list('unit_type'),
    bed: list('bed'),
    head: list('head'),
    h0h: list('h0h'),
    fm_group: list('fm_group'),
    has: list('has'),
    h_min: bound('h_min'),
    h_max: bound('h_max'),
    s0_min: bound('s0_min'),
    s0_max: bound('s0_max')
  }
}

/** The query keys for f; empty filters are left out (undefined removes the key). */
export function filtersToQuery(f: Filters): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(f)) {
    const s = Array.isArray(v) ? v.join(',') : v == null ? '' : String(v)
    out[k] = s || undefined
  }
  return out
}

export const isActive = (f: Filters) => Object.values(filtersToQuery(f)).some(Boolean)

function matches(r: Row, f: Filters, skip?: ListKey): boolean {
  const q = f.q.trim().toLowerCase()
  if (q && ![String(r.N), r.specimen, r.reference].some((s) => s.toLowerCase().includes(q)))
    return false
  for (const k of Object.keys(LISTS) as ListKey[]) {
    const want = f[k]
    if (k !== skip && want.length && !LISTS[k](r).some((v) => want.includes(v))) return false
  }
  for (const k of Object.keys(RANGES) as RangeKey[]) {
    const v = RANGES[k](r)
    const lo = f[`${k}_min`]
    const hi = f[`${k}_max`]
    // A missing value fails any bound: it is neither inside nor outside.
    if ((lo != null && !(v >= lo)) || (hi != null && !(v <= hi))) return false
  }
  return true
}

export const applyFilters = (rows: readonly Row[], f: Filters) => rows.filter((r) => matches(r, f))

const ORDER: Partial<Record<ListKey, readonly string[]>> = {
  unit_type: ORDERS.unit_type,
  h0h: ORDERS.bin_H0_H,
  fm_group: ORDERS.fm_group,
  has: HAS
}

/** Options of a group, in chart order, else by count; each counted against the *other* groups. */
export function facet(rows: readonly Row[], f: Filters, key: ListKey): [string, number][] {
  const total = new Map<string, number>()
  const live = new Map<string, number>()
  for (const r of rows) {
    const ok = matches(r, f, key)
    for (const v of LISTS[key](r)) {
      total.set(v, (total.get(v) ?? 0) + 1)
      if (ok) live.set(v, (live.get(v) ?? 0) + 1)
    }
  }
  const order: readonly string[] = ORDER[key] ?? []
  const keys = [...total.keys()].sort(
    (a, b) =>
      (order.includes(a) ? order.indexOf(a) : 99) - (order.includes(b) ? order.indexOf(b) : 99) ||
      total.get(b)! - total.get(a)! ||
      a.localeCompare(b)
  )
  return keys.map((k) => [k, live.get(k) ?? 0])
}
