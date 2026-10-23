/**
 * The 24/09/2026 dataset (198 specimens) as `pnpm convert` wrote it then: the
 * data build_charts.py and the design's numbers come from. Later deliveries
 * change the counts, not the logic these numbers check.
 */
import specimens from './specimens-2026-09-24.json'
import { derive } from '../../src/lib/derive.ts'
import type { Specimen } from '../../src/api/types.ts'

export const rows20260924 = (specimens as Specimen[]).map(derive)
