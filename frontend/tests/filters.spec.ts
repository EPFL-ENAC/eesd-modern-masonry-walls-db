import { describe, expect, it } from 'vitest'
import specimens from '../src/assets/data/specimens.json'
import { derive } from '../src/lib/derive.ts'
import { applyFilters, facet, filtersToQuery, parseFilters } from '../src/lib/filters.ts'
import type { Specimen } from '../src/api/types.ts'

const rows = (specimens as Specimen[]).map(derive)

describe('filters', () => {
  it('round-trips through the query', () => {
    const query = { unit_type: 'HC,AAC', h_min: '1.5', s0_max: '1', has: 'fd', q: 'SW' }
    const f = parseFilters(query)
    expect(f.unit_type).toEqual(['HC', 'AAC'])
    expect(f.h_min).toBe(1.5)
    expect(f.h_max).toBeNull()
    expect(Object.fromEntries(Object.entries(filtersToQuery(f)).filter(([, v]) => v))).toEqual(
      query
    )
  })

  it('ORs within a group and ANDs across groups', () => {
    const hc = applyFilters(rows, parseFilters({ unit_type: 'HC' })).length
    const aac = applyFilters(rows, parseFilters({ unit_type: 'AAC' })).length
    expect(applyFilters(rows, parseFilters({ unit_type: 'HC,AAC' }))).toHaveLength(hc + aac)
    const both = applyFilters(rows, parseFilters({ unit_type: 'HC', fm_group: 'Shear' }))
    expect(both).toHaveLength(55)
    expect(both.every((r) => r.unit_type === 'HC' && r.fm_group === 'Shear')).toBe(true)
  })

  it('drops missing values once a bound is set', () => {
    const all = applyFilters(rows, parseFilters({ h_min: '0' }))
    expect(all).toHaveLength(rows.filter((r) => !Number.isNaN(r.H)).length)
  })

  it('counts each group against the other groups only', () => {
    const f = parseFilters({ unit_type: 'HC' })
    // Unit type ignores its own selection: every type keeps its full count.
    expect(Object.fromEntries(facet(rows, f, 'unit_type'))).toMatchObject({ HC: 111, AAC: 26 })
    // Failure mode is counted within HC.
    expect(facet(rows, f, 'fm_group')).toEqual([
      ['Shear', 55],
      ['Hybrid', 43],
      ['Flexure', 10],
      ['Other', 3]
    ])
    const bed = facet(rows, f, 'bed')
    expect(bed.reduce((s, [, n]) => s + n, 0)).toBe(111)
  })

  it('finds the 10 specimens with curves', () => {
    expect(facet(rows, parseFilters({}), 'has')).toEqual([
      ['fd', 10],
      ['envelope', 10],
      ['bilinear', 10],
      ['cracks', 10],
      ['photos', 10]
    ])
  })
})
