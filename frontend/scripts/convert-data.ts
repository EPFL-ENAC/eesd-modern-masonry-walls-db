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
import { flagged } from '../src/lib/derive.ts'
import { isVariant, missingVariants } from '../src/lib/photos.ts'

const FOLDERS = [
  '02_fd_curve',
  '03_envelope_Pavia',
  '04_envelope_EPFL',
  '05_bilinear_curve_Pavia',
  '06_bilinear_curve_EPFL',
  '07_fig_setup',
  '08_fig_failmode',
  '09_fig_materials',
  '10_fig_cracks'
]
/** Database flag column → the folders, one of which holds a file for every flagged row. */
const FLAGS: Record<string, string[]> = {
  'F-d data': ['02_fd_curve'],
  'Env curve': ['03_envelope_Pavia', '04_envelope_EPFL'],
  'Bil curve': ['05_bilinear_curve_Pavia', '06_bilinear_curve_EPFL'],
  'Crack measurements': ['10_fig_cracks']
}

/** Excel's "CSV UTF-8" starts with a BOM; Windows Excel needs it to show σ, δ, μ from /data. */
function read(dir: string, path: string) {
  const text = readFileSync(join(dir, path), 'utf8')
  if (!text.startsWith(BOM)) fail(`${path} has no UTF-8 BOM: write it with scripts/export-csv.py`)
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
    fail(`${where} has ${JSON.stringify(bad)}: write the CSV with scripts/export-csv.py`)
}

/** A CSV with a header row, as one object per row keyed by column name. */
function readTable(dir: string, path: string, columns: string[]) {
  const [head, ...rows] = read(dir, path)
  const at = columns.map((c) => {
    const i = head!.findIndex((h) => h.trim() === c)
    return i >= 0 ? i : fail(`${path} has no "${c}" column`)
  })
  return rows.map((r) => Object.fromEntries(columns.map((c, j) => [c, r[at[j]!]?.trim() ?? ''])))
}

/** A category label on its first column only, filled forward: 'General Information [I]', '', '' … */
const fillForward = (cells: string[]) =>
  cells.map((c, i) => c || cells.slice(0, i).findLast(Boolean)!)

function readFields(dir: string, header: string[], categories: string[]): Field[] {
  const rows = readTable(dir, 'ModernMasonryDatabase_EIA_Fields.csv', [
    'Category',
    'Category description',
    'Name',
    'Units',
    'Definition'
  ])
  const cats = fillForward(rows.map((r) => r.Category!))
  const descriptions = fillForward(rows.map((r) => r['Category description']!))
  // Pavia [VI] and EPFL [VII] share their names (Vbil+, δe+…): a name is only unique per category.
  const byName = new Map(
    rows.map((r, i) => [
      `${cats[i]}|${r.Name}`,
      { units: r.Units!, definition: r.Definition!, description: descriptions[i]! }
    ])
  )
  assertUtf8(
    'Fields.csv',
    rows.map((r) => r.Name!)
  )
  const keys = new Set<string>()
  return header.map((h, i) => {
    // 'Void Ratio        [%]' → 'Void Ratio'
    const name = h.replace(/\[[^\]]*\]\s*$/, '').trim()
    const cat = categories[i]!
    const row =
      byName.get(`${cat}|${name}`) ??
      fail(`Database column ${i + 1} "${h}" (${cat}) has no Fields row`)
    const m = /^(.*?)\s*\[([IVX]+)\]$/.exec(cat) ?? fail(`bad category "${cat}"`)
    // A name an earlier category already uses gets its numeral: 'Vbil+' (Pavia), 'Vbil+ [VII]' (EPFL).
    const key = keys.has(name) ? `${name} [${m[2]}]` : name
    if (keys.has(key)) fail(`Database column ${i + 1} "${h}" repeats in category ${m[2]}`)
    keys.add(key)
    return {
      n: i + 1,
      key,
      category: m[2]!,
      categoryName: m[1]!,
      categoryDescription: row.description,
      name,
      units: row.units,
      definition: row.definition
    }
  })
}

function readReferences(dir: string): Reference[] {
  const figs = new Map(
    readTable(dir, '01_references/ModernMasonryDatabase_EIA_Fig_references.csv', [
      'Reference ID',
      'Reference',
      'Link document'
    ]).map((r) => [r['Reference ID'], r])
  )
  const rows = readTable(dir, '01_references/ModernMasonryDatabase_EIA_References.csv', [
    'Nref',
    'Reference ID',
    'Reference',
    'Link document',
    'Link data'
  ]).filter((r) => r['Reference ID']) // numbered placeholder rows
  const ids = new Set(rows.map((r) => r['Reference ID']))
  for (const id of figs.keys()) if (id && !ids.has(id)) fail(`Fig_references.csv: unknown "${id}"`)
  return rows.map((r) => ({
    nref: Number(r.Nref),
    id: r['Reference ID']!,
    citation: nullable(r.Reference),
    linkDocument: nullable(r['Link document']),
    linkData: nullable(r['Link data']),
    figCitation: nullable(figs.get(r['Reference ID'])?.Reference),
    figLink: nullable(figs.get(r['Reference ID'])?.['Link document'])
  }))
}

function readMeta(dir: string): Meta {
  const text = readFileSync(join(dir, 'readme.txt'), 'utf8')
  const [, d, m, y] =
    /Last update:\s*(\d{2})\/(\d{2})\/(\d{4})/.exec(text) ?? fail('no "Last update" in readme.txt')
  // "primarily taken from:" or, since 22/10/2026, "primarily (188 tests) taken from:"
  const block = /primarily (?:\([^)]*\) )?taken from:\s*([\s\S]*?)\s*and further complemented/.exec(
    text
  )
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
        /_(\d{4})(?:_(?:pos|neg)(?:_cycle\d+)?)?\.\w+$/.exec(name) ??
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
  if (db[0]?.[0] !== '#1')
    fail('Database.csv must start with its "#1, #2…" row: export it with scripts/export-csv.py')
  const header = db[3] ?? fail('Database.csv has fewer than 4 header rows')
  assertUtf8('Database.csv header', db.slice(0, 4).flat())
  const fields = readFields(dir, header, fillForward(db[1]!))
  const references = readReferences(dir)
  const refIds = new Set(references.map((r) => r.id))

  // A row with nothing but its N is a placeholder (N 237 in the 22/10/2026 delivery).
  const rows = db.slice(4).filter((r) => r.slice(1).some((c) => c !== ''))
  const specimens: Specimen[] = rows.map((r) => {
    const values = Object.fromEntries(fields.map((f, i) => [f.key, nullable(r[i])]))
    const N = Number(values.N)
    if (!Number.isInteger(N)) fail(`row with N = ${values.N}`)
    if (!refIds.has(values.Reference!))
      fail(`specimen ${N}: unknown reference "${values.Reference}"`)
    return { N, values, files: [] }
  })
  const files = scanFiles(dir, new Set(specimens.map((s) => s.N)))
  for (const s of specimens) {
    s.files = files.get(s.N) ?? []
    for (const [flag, folders] of Object.entries(FLAGS)) {
      const has = s.files.some((f) => folders.some((d) => f.startsWith(`${d}/`)))
      if (flagged(s.values[flag]) !== has)
        fail(
          `specimen ${s.N}: "${flag}" is ${s.values[flag] ?? 'empty'} but ${folders.join(', ')} ${has ? 'has' : 'lacks'} its file`
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
