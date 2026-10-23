import { DATABASE_CSV, byN, databaseCsv, databaseTable, fetchFile } from '../api/dataset.ts'
import { BOM, toCsv } from './csv.ts'
import type { Row } from './derive.ts'

/** Hand a blob to the browser as a file download. */
export function saveBlob(blob: Blob, name: string) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: name
  })
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 0)
}

/** A .zip of path → content; jszip loads only when someone downloads. */
export async function zip(entries: [path: string, data: Blob | string][]): Promise<Blob> {
  const { default: JSZip } = await import('jszip')
  const z = new JSZip()
  for (const [path, data] of entries) z.file(path, data)
  return z.generateAsync({ type: 'blob' })
}

export const pad = (N: number) => String(N).padStart(4, '0')

/** The specimen's database row alone, as its own CSV. */
export async function saveSpecimenRow(r: Row) {
  saveBlob(new Blob([await databaseCsv(new Set([r.N]))]), `specimen_${pad(r.N)}.csv`)
}

/** Every file of one specimen plus its database row, in the dataset's folders. */
export async function saveSpecimenZip(r: Row) {
  const entries: [string, Blob | string][] = await Promise.all(
    r.files.map(async (p): Promise<[string, Blob]> => [p, await fetchFile(p)])
  )
  entries.push([`specimen_${pad(r.N)}.csv`, await databaseCsv(new Set([r.N]))])
  saveBlob(await zip(entries), `specimen_${pad(r.N)}.zip`)
}

/**
 * Submission template (open question 2): the database's 4 header rows, no specimen.
 * The category row tells apart the columns Pavia [VI] and EPFL [VII] share (Vbil+, δu+…).
 */
export async function saveTemplateCsv() {
  const header = (await databaseTable()).slice(0, 4)
  saveBlob(new Blob([BOM + toCsv(header)]), 'ModernMasonryDatabase_EIA_template.csv')
}

const EXAMPLE = 227 // SW0.1: it has every response file

/**
 * The starter kit: the submission folder as it should be, keyed by specimen name
 * (the curator renames to N on merge): the template with one example row, the
 * example's curves in their folders, and a README.
 */
export async function saveStarterKit(readme: string) {
  const all = await databaseTable()
  const example = ['', ...all.find((r) => r[0] === String(EXAMPLE))!.slice(1)]
  const r = byN.get(EXAMPLE)!
  const curves = await Promise.all(
    r.files
      .filter((p) => /^0[2-6]_/.test(p))
      .map(async (p): Promise<[string, Blob]> => [
        p.replace(pad(EXAMPLE), r.specimen),
        await fetchFile(p)
      ])
  )
  const root = 'masonry_walls/'
  saveBlob(
    await zip([
      [root + DATABASE_CSV, BOM + toCsv([...all.slice(0, 4), example])],
      ...curves.map(([p, b]): [string, Blob] => [root + p, b]),
      [root + 'README.txt', readme]
    ]),
    'masonry_walls_starter_kit.zip'
  )
}
