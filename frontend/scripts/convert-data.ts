/**
 * public/data/*.csv → src/assets/data/*.json (`pnpm convert`).
 *
 * Fails loudly on anything that would otherwise show up as a silent gap in the
 * app: a lossy (non-UTF-8) or BOM-less export, a column with no Fields row, a reference ID
 * with no entry, a file for an unknown specimen, a flag without its file.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BOM, parseCsv } from '../src/lib/csv.ts'
import type { Dataset, Field, Meta, Reference, Specimen } from '../src/api/types.ts'
import { isVariant, missingVariants } from '../src/lib/photos.ts'

const FOLDERS = [
  '02_fd_curve',
  '03_envelope',
  '04_bilinear_curve',
  '05_fig_setup',
  '06_fig_failmode',
  '07_fig_materials',
  '08_fig_cracks'
]
/** Database flag column → the folder that must hold a file for every flagged row. */
const FLAGS: Record<string, string> = {
  'F-d data': '02_fd_curve',
  'Crack measurements': '08_fig_cracks'
}

/** Excel's "CSV UTF-8" starts with a BOM; Windows Excel needs it to show σ, δ, μ from /data. */
function read(dir: string, path: string) {
  const text = readFileSync(join(dir, path), 'utf8')
  if (!text.startsWith(BOM)) fail(`${path} has no UTF-8 BOM: export it from Excel as "CSV UTF-8"`)
  return parseCsv(text)
}
const nullable = (s: string | undefined) => (s === undefined || s === '' || s === 'NaN' ? null : s)

function fail(message: string): never {
  throw new Error(`convert-data: ${message}`)
}

/** Header cells never hold '?': one means σ/δ/μ were lost to a legacy code page. */
function assertUtf8(where: string, cells: string[]) {
  const bad = cells.find((c) => c.includes('?') || c.includes('�'))
  if (bad !== undefined)
    fail(`${where} has ${JSON.stringify(bad)}: re-export the CSV from Excel as "CSV UTF-8"`)
}

function readFields(dir: string, header: string[]): Field[] {
  const [, ...rows] = read(dir, 'ModernMasonryDatabase_EIA_Fields.csv')
  let category = ''
  const byName = new Map<string, string[]>()
  for (const r of rows) {
    category = r[1] || category // the category is written on its first row only
    byName.set(r[3]!.trim(), [category, ...r])
  }
  assertUtf8('Fields.csv', [...byName.keys()])
  return header.map((h, i) => {
    // 'Void Ratio        [%]' → 'Void Ratio'
    const name = h.replace(/\[[^\]]*\]\s*$/, '').trim()
    const row = byName.get(name) ?? fail(`Database column ${i + 1} "${h}" has no Fields row`)
    const [cat, , , , , units, definition] = row
    const m = /^(.*?)\s*\[([IVX]+)\]$/.exec(cat!) ?? fail(`bad category "${cat}"`)
    return {
      n: i + 1,
      category: m[2]!,
      categoryName: m[1]!,
      name,
      units: units!.trim(),
      definition: definition!.trim()
    }
  })
}

function readReferences(dir: string): Reference[] {
  const [, ...rows] = read(dir, '01_references/ModernMasonryDatabase_EIA_References.csv')
  return rows.map(([nref, id, citation, linkDocument, linkData]) => ({
    nref: Number(nref),
    id: id!,
    citation: nullable(citation?.trim()),
    linkDocument: nullable(linkDocument?.trim()),
    linkData: nullable(linkData?.trim())
  }))
}

function readMeta(dir: string): Meta {
  const text = readFileSync(join(dir, 'readme.txt'), 'utf8')
  const [, d, m, y] =
    /Last update:\s*(\d{2})\/(\d{2})\/(\d{4})/.exec(text) ?? fail('no "Last update" in readme.txt')
  const block = /primarily taken from:\s*([\s\S]*?)\s*and further complemented/.exec(text)
  if (!block) fail('no source list in readme.txt')
  const sources = block[1]!
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  return { lastUpdate: `${y}-${m}-${d}`, sources }
}

/** N → dataset paths present, from the file names (fd_curve_0189.csv, envelope_0189_pos.csv…). */
function scanFiles(dir: string, known: Set<number>): Map<number, string[]> {
  const files = new Map<number, string[]>()
  const all: string[] = []
  for (const folder of FOLDERS) {
    for (const name of readdirSync(join(dir, folder)).sort()) {
      if (name.startsWith('.')) continue
      all.push(`${folder}/${name}`)
      // Photo web versions are served, not dataset files: no specimen entry, no download.
      if (isVariant(name)) continue
      const m =
        /_(\d{4})(?:_(?:pos|neg))?\.\w+$/.exec(name) ??
        fail(`${folder}/${name}: no specimen number`)
      const N = Number(m[1])
      if (!known.has(N)) fail(`${folder}/${name}: no specimen ${N} in the database`)
      files.set(N, [...(files.get(N) ?? []), `${folder}/${name}`])
    }
  }
  const missing = missingVariants(all)
  if (missing.length)
    fail(
      `${missing.length} photo web versions missing, e.g. ${missing[0]}: run \`pnpm optimize-images\``
    )
  return files
}

export function convert(dir: string): Dataset {
  const db = read(dir, 'ModernMasonryDatabase_EIA_Database.csv')
  const header = db[3] ?? fail('Database.csv has fewer than 4 header rows')
  assertUtf8('Database.csv header', db.slice(0, 4).flat())
  const fields = readFields(dir, header)
  const references = readReferences(dir)
  const refIds = new Set(references.map((r) => r.id))

  const rows = db.slice(4).filter((r) => r.some((c) => c !== ''))
  const specimens: Specimen[] = rows.map((r) => {
    const values = Object.fromEntries(fields.map((f, i) => [f.name, nullable(r[i])]))
    const N = Number(values.N)
    if (!Number.isInteger(N)) fail(`row with N = ${values.N}`)
    if (!refIds.has(values.Reference!))
      fail(`specimen ${N}: unknown reference "${values.Reference}"`)
    return { N, values, files: [] }
  })
  const files = scanFiles(dir, new Set(specimens.map((s) => s.N)))
  for (const s of specimens) {
    s.files = files.get(s.N) ?? []
    for (const [flag, folder] of Object.entries(FLAGS)) {
      const has = s.files.some((f) => f.startsWith(folder))
      if (Boolean(s.values[flag]) !== has)
        fail(
          `specimen ${s.N}: "${flag}" is ${s.values[flag] ?? 'empty'} but ${folder} ${has ? 'has' : 'lacks'} its file`
        )
    }
  }
  return { specimens, fields, references, meta: readMeta(dir) }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const out = join(root, 'src/assets/data')
  for (const [name, value] of Object.entries(convert(join(root, 'public/data')))) {
    writeFileSync(join(out, `${name}.json`), JSON.stringify(value, null, 1) + '\n')
    console.log(`wrote src/assets/data/${name}.json`)
  }
}
