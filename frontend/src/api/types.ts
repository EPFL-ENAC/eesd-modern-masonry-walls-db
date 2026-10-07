/** Shapes of src/assets/data/*.json, written by scripts/convert-data.ts. */

/** Database values by field name; '' and 'NaN' become null, the rest stays a raw string. */
export type Values = Record<string, string | null>

export interface Specimen {
  N: number
  values: Values
  /** Dataset paths present for this specimen, e.g. '02_fd_curve/fd_curve_0189.csv'. */
  files: string[]
}

export interface Field {
  /** Position in the Database CSV, 1–47. */
  n: number
  /** Roman numeral, 'I'–'VII'. */
  category: string
  categoryName: string
  name: string
  units: string
  definition: string
}

export interface Reference {
  nref: number
  id: string
  citation: string | null
  linkDocument: string | null
  linkData: string | null
}

export interface Meta {
  /** ISO date from readme.txt. */
  lastUpdate: string
  /** The papers the database is primarily taken from. */
  sources: string[]
}

export interface Dataset {
  specimens: Specimen[]
  fields: Field[]
  references: Reference[]
  meta: Meta
}
