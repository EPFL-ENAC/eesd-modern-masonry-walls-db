import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseCsv } from '../src/lib/csv.ts'
import { counts, derive, medianIqr, type Row } from '../src/lib/derive.ts'
import { convert } from '../scripts/convert-data.ts'
import specimens from '../src/assets/data/specimens.json'
import fields from '../src/assets/data/fields.json'
import references from '../src/assets/data/references.json'
import meta from '../src/assets/data/meta.json'
import summary from './fixtures/summary.json'
import { rows20260924 as rows } from './fixtures/rows-2026-09-24.ts'

const fixture = (name: string) => new URL(`./fixtures/${name}`, import.meta.url)

describe('derive() against build_charts.py', () => {
  const [header, ...oracle] = parseCsv(readFileSync(fixture('derived_specimens.csv'), 'utf8'))
  // ALR was an assumption the dataset owners replaced by σ₀ (open question 1).
  // specimen/reference come from the old cp1252 export, which lost ć, Ž, ’.
  // bin_H0_H splits the handoff's '≤ 0.5' into '< 0.5' and '= 0.5' (requested 2026-10-23).
  const skip = new Set(['ALR', 'bin_ALR', 'specimen', 'reference', 'bin_H0_H'])

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
    for (const key of ['unit_type', 'fm_group', 'bin_H'] as const)
      expect(Object.fromEntries(counts(rows, key))).toEqual(summary.donuts[key])
  })

  it('bins H₀/H with 0.5 and 1.0 apart', () => {
    expect(counts(rows, 'bin_H0_H')).toEqual([
      ['= 0.5', summary.donuts.bin_H0_H['≤ 0.5']],
      ['0.5–1.0', summary.donuts.bin_H0_H['0.5–1.0']],
      ['= 1.0', summary.donuts.bin_H0_H['1.0']],
      ['> 1.0', summary.donuts.bin_H0_H['> 1.0']],
      ['n/a', summary.donuts.bin_H0_H['n/a']]
    ])
    const bin = (v: string) => derive({ N: 0, values: { 'H0/H': v }, files: [] }).bin_H0_H
    expect(['0.4', '0.5', '0.75', '1', '1.5', ''].map(bin)).toEqual([
      '< 0.5',
      '= 0.5',
      '0.5–1.0',
      '= 1.0',
      '> 1.0',
      'n/a'
    ])
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

  it('rejects a CSV exported without its UTF-8 BOM (Windows Excel needs it)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mmdb-'))
    // CSVs and folders only: the BOM check comes before any file lookup.
    cpSync(new URL('../public/data', import.meta.url).pathname, dir, {
      recursive: true,
      filter: (src) => !/\.jpe?g$/i.test(src)
    })
    const path = join(dir, 'ModernMasonryDatabase_EIA_Fields.csv')
    writeFileSync(path, readFileSync(path, 'utf8').replace(/^\uFEFF/, ''))
    expect(() => convert(dir)).toThrow(/no UTF-8 BOM/)
  })

  it('has 236 specimens, 70 fields and 31 references', () => {
    // N 237 has nothing but its number; Nref 32 and 33 nothing but theirs.
    expect(specimens.map((s) => s.N)).toEqual(Array.from({ length: 236 }, (_, i) => i + 1))
    expect(fields).toHaveLength(70)
    expect(references).toHaveLength(31)
    expect(references.find((r) => r.nref === 31)?.citation).toBeNull()
  })

  it('keys the EPFL bilinear columns apart from the Pavia ones', () => {
    const vi = fields.filter((f) => f.category === 'VI').map((f) => f.key)
    const vii = fields.filter((f) => f.category === 'VII').map((f) => f.key)
    expect(vii).toEqual(vi.map((k) => `${k} [VII]`))
  })
})
