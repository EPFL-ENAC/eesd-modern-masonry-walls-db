/** Shapes of src/assets/data/*.json, written by scripts/convert-data.ts. */

/** Database values by field key; '' and 'NaN' become null, the rest stays a raw string. */
export type Values = Record<string, string | null>

export interface Specimen {
  N: number
  values: Values
  /** Dataset paths present for this specimen, e.g. '02_fd_curve/fd_curve_0227.csv'. */
  files: string[]
}

export interface Field {
  /** Position in the Database CSV, 1–70. */
  n: number
  /** Key in Values: the name, or for a name an earlier category already uses, 'name [VII]'. */
  key: string
  /** Roman numeral, 'I'–'VIII'. */
  category: string
  categoryName: string
  categoryDescription: string
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
  /** Where the specimen photos come from, when it isn't the data's own publication. */
  figCitation: string | null
  figLink: string | null
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
