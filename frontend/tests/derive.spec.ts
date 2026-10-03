import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCsv } from '../src/lib/csv.ts'
import { counts, derive, medianIqr, type Row } from '../src/lib/derive.ts'
import { convert } from '../scripts/convert-data.ts'
import specimens from '../src/assets/data/specimens.json'
import fields from '../src/assets/data/fields.json'
import references from '../src/assets/data/references.json'
import meta from '../src/assets/data/meta.json'
import summary from './fixtures/summary.json'
import type { Specimen } from '../src/api/types.ts'

const rows = (specimens as Specimen[]).map(derive)
const fixture = (name: string) => new URL(`./fixtures/${name}`, import.meta.url)

describe('derive() against build_charts.py', () => {
  const [header, ...oracle] = parseCsv(readFileSync(fixture('derived_specimens.csv'), 'utf8'))
  // ALR was an assumption the dataset owners replaced by σ₀ (open question 1).
  // specimen/reference come from the old cp1252 export, which lost ć, Ž, ’.
  const skip = new Set(['ALR', 'bin_ALR', 'specimen', 'reference'])

  it('has one row per specimen, in order', () => {
    expect(rows.map((r) => r.N)).toEqual(oracle.map((o) => Number(o[0])))
  })

  for (const [i, col] of header!.entries()) {
    if (skip.has(col)) continue
    it(`matches column ${col}`, () => {
      for (const [j, o] of oracle.entries()) {
        const want = o[i]!
        const got = rows[j]![col as keyof Row]
        if (typeof got === 'number') {
          if (want === '') expect(got, `N ${rows[j]!.N}`).toBeNaN()
          else expect(got, `N ${rows[j]!.N}`).toBeCloseTo(Number(want), 9)
        } else expect(got ?? '', `N ${rows[j]!.N}`).toBe(want)
      }
    })
  }

  it('matches specimen and reference up to the lost characters', () => {
    const ascii = (s: string) => s.replace(/[^\x20-\x7e]/g, '?')
    for (const [j, o] of oracle.entries()) {
      expect(ascii(rows[j]!.specimen)).toBe(ascii(o[1]!))
      expect(ascii(rows[j]!.reference)).toBe(ascii(o[2]!))
    }
  })
})

describe('summary.json', () => {
  it('has the donut counts', () => {
    expect(rows.length).toBe(summary.total)
    for (const key of ['unit_type', 'fm_group', 'bin_H0_H', 'bin_H'] as const)
      expect(Object.fromEntries(counts(rows, key))).toEqual(summary.donuts[key])
  })

  it('bins σ₀ in place of ALR', () => {
    expect(counts(rows, 'bin_sigma0')).toEqual([
      ['< 0.5', 39],
      ['0.5–1.0', 79],
      ['1.0–1.5', 64],
      ['≥ 1.5', 16]
    ])
  })

  it('has the HC data-visuals example', () => {
    const ex = summary.data_visuals_example
    const hc = rows.filter((r) => r.unit_type === ex.filter.unit_type)
    expect(hc.length).toBe(ex.n)
    for (const key of ['drift_peak', 'drift_u'] as const) {
      const got = medianIqr(hc.map((r) => r[key]))!
      expect(got.n).toBe(ex[key].n)
      for (const s of ['median', 'q1', 'q3'] as const)
        expect(Math.abs(got[s] - ex[key][s])).toBeLessThanOrEqual(5e-4)
    }
    expect(Object.fromEntries(counts(hc, 'fm_group'))).toEqual(ex.fm_group_counts)
  })
})

describe('committed JSON', () => {
  it('is what `pnpm convert` writes today', () => {
    const fresh = convert(new URL('../public/data', import.meta.url).pathname)
    expect(JSON.parse(JSON.stringify(fresh))).toEqual({ specimens, fields, references, meta })
  })

  it('has 47 fields and 25 references', () => {
    expect(fields).toHaveLength(47)
    expect(references).toHaveLength(25)
    expect(references.find((r) => r.nref === 25)?.citation).toBeNull()
  })
})
