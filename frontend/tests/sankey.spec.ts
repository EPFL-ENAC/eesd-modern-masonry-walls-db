import { describe, expect, it } from 'vitest'
import { rows } from '../src/api/dataset.ts'
import { FLOW_AXES, flows } from '../src/charts/sankey.ts'

describe('flows', () => {
  const { nodes, links } = flows(rows)

  it('carries every specimen across each pair of adjacent axes', () => {
    for (const axis of FLOW_AXES.slice(1)) {
      const into = links.filter((l) => l.target.startsWith(`${axis}:`))
      expect(into.reduce((s, l) => s + l.value, 0)).toBe(198)
    }
  })

  it('splits bands by unit type (the design tooltip: HC → Shear, 55)', () => {
    const hcShear = links.filter(
      (l) => l.source === 'unit_type:HC' && l.target === 'fm_group:Shear'
    )
    expect(hcShear).toEqual([
      { source: 'unit_type:HC', target: 'fm_group:Shear', value: 55, unit: 'HC' }
    ])
  })

  it('keeps only present categories, in ORDERS order', () => {
    expect(nodes.filter((n) => n.depth === 0).map((n) => n.name)).toEqual(
      ['HC', 'SB-C', 'AAC', 'CS', 'LAC', 'SB-CS'].map((u) => `unit_type:${u}`)
    )
  })
})
