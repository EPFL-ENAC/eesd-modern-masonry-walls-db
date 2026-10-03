/** The only module that reads the dataset: JSON from `pnpm convert`, raw files under /data. */
import specimensJson from '../assets/data/specimens.json'
import fieldsJson from '../assets/data/fields.json'
import referencesJson from '../assets/data/references.json'
import metaJson from '../assets/data/meta.json'
import { derive } from '../lib/derive.ts'
import { BOM, parseCsv, toCsv } from '../lib/csv.ts'
import { variant, type PhotoWidth } from '../lib/photos.ts'
import type { Field, Meta, Reference, Specimen } from './types.ts'

export const rows = (specimensJson as Specimen[]).map(derive)
export const fields = fieldsJson as Field[]
export const references = referencesJson as Reference[]
export const meta = metaJson as Meta

export const byN = new Map(rows.map((r) => [r.N, r]))
export const referenceById = new Map(references.map((r) => [r.id, r]))

/** URL of a dataset file, e.g. fileUrl('02_fd_curve/fd_curve_0189.csv'). */
export const fileUrl = (path: string) => `${import.meta.env.BASE_URL}data/${path}`

/** URL of a photo's web version (pnpm optimize-images); downloads keep the original. */
export const photoUrl = (path: string, width: PhotoWidth) => fileUrl(variant(path, width))

export const DATABASE_CSV = 'ModernMasonryDatabase_EIA_Database.csv'
export const FIELDS_CSV = 'ModernMasonryDatabase_EIA_Fields.csv'
export const REFERENCES_CSV = '01_references/ModernMasonryDatabase_EIA_References.csv'

/** A raw dataset file, as served under /data. */
export async function fetchFile(path: string): Promise<Blob> {
  const res = await fetch(fileUrl(path))
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return res.blob()
}

/** The delivered database CSV, parsed: 4 header rows (the 4th holds the column names), then one row per specimen. */
export async function databaseTable(): Promise<string[][]> {
  return parseCsv(await (await fetchFile(DATABASE_CSV)).text())
}

/** The database CSV cut down to the given specimens, with its 4 header rows as delivered. */
export async function databaseCsv(ns: ReadonlySet<number>): Promise<string> {
  const all = await databaseTable()
  return BOM + toCsv([...all.slice(0, 4), ...all.slice(4).filter((r) => ns.has(Number(r[0])))])
}

export type Curve = { d: number[]; V: number[] }

/** A drift [%] / force [kN] curve file, signed. */
export async function loadCurve(path: string): Promise<Curve> {
  const [, ...lines] = parseCsv(await (await fetchFile(path)).text())
  const d: number[] = []
  const V: number[] = []
  for (const [x, y] of lines) {
    d.push(Number(x))
    V.push(Number(y))
  }
  return { d, V }
}
