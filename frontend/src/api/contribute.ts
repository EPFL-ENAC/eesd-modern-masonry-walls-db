/** The contribution API (behind the ingress at /api): check a submission, then open a review request. */

const BASE = '/api'

export type PickedFile = { path: string; file: File }
export type Picked = { files: PickedFile[]; skipped: string[] }

export type Issue = {
  message: string
  file: string | null
  row: number | null
  column: string | null
  value: string | null
  severity: 'error' | 'warning'
}

export type Contributor = {
  name: string
  email: string
  institution: string
  orcid: string
  note: string
}

export type Failure = { kind: 'error'; status: number; message: string }
export type CheckResult = { kind: 'ok'; valid: boolean; issues: Issue[] } | Failure
export type SubmitResult =
  | { kind: 'ok'; id: string; url: string; issues: Issue[] }
  | { kind: 'issues'; issues: Issue[] }
  | Failure

// Photos are not accepted yet (the curator asks for them): they are listed as skipped.
const IMAGE = /\.(jpe?g|png|webp|gif|tiff?|heic)$/i

function split(all: PickedFile[]): Picked {
  return {
    files: all.filter((f) => !IMAGE.test(f.path)),
    skipped: all.filter((f) => IMAGE.test(f.path)).map((f) => f.path)
  }
}

/** Files from an <input type="file">, with their path inside the chosen folder when there is one. */
export function filesFromInput(list: ArrayLike<File>): Picked {
  return split(Array.from(list, (file) => ({ path: file.webkitRelativePath || file.name, file })))
}

const fileOf = (e: FileSystemFileEntry) => new Promise<File>((ok, ko) => e.file(ok, ko))
const readBatch = (r: FileSystemDirectoryReader) =>
  new Promise<FileSystemEntry[]>((ok, ko) => r.readEntries(ok, ko))

async function walk(entry: FileSystemEntry): Promise<PickedFile[]> {
  if (entry.isFile) {
    return [
      { path: entry.fullPath.replace(/^\//, ''), file: await fileOf(entry as FileSystemFileEntry) }
    ]
  }
  const reader = (entry as FileSystemDirectoryEntry).createReader()
  const children: FileSystemEntry[] = []
  // readEntries returns at most 100 entries per call: read until it returns none.
  for (let batch = await readBatch(reader); batch.length; batch = await readBatch(reader)) {
    children.push(...batch)
  }
  return (await Promise.all(children.map(walk))).flat()
}

/** Files from a drop, folders walked recursively. */
export async function filesFromDrop(dt: DataTransfer): Promise<Picked> {
  // Entries must be taken before the first await: the DataTransfer empties after the event.
  const entries = Array.from(dt.items, (i) => i.webkitGetAsEntry()).filter(
    (e): e is FileSystemEntry => e != null
  )
  if (!entries.length) return filesFromInput(dt.files)
  return split((await Promise.all(entries.map(walk))).flat())
}

/** Issues by file (null = general), errors first: in each group, and groups with errors before the others. */
export function groupIssues(issues: Issue[]): { file: string | null; issues: Issue[] }[] {
  const groups = new Map<string | null, Issue[]>()
  for (const i of issues) groups.set(i.file, [...(groups.get(i.file) ?? []), i])
  const errorsFirst = (i: Issue[]) => (i.some((x) => x.severity === 'error') ? 0 : 1)
  return [...groups]
    .map(([file, list]) => ({
      file,
      issues: list.toSorted(
        (a, b) => Number(a.severity !== 'error') - Number(b.severity !== 'error')
      )
    }))
    .toSorted((a, b) => errorsFirst(a.issues) - errorsFirst(b.issues))
}

function form(files: PickedFile[], fields: Record<string, string> = {}) {
  const f = new FormData()
  for (const p of files) f.append('files', p.file, p.path)
  for (const [k, v] of Object.entries(fields)) if (v.trim()) f.append(k, v.trim())
  return f
}

type Body = { valid?: boolean; issues?: Issue[]; id?: string; url?: string; detail?: unknown }

async function post(path: string, body: FormData): Promise<{ status: number; body: Body }> {
  try {
    const r = await fetch(BASE + path, { method: 'POST', body })
    return { status: r.status, body: ((await r.json().catch(() => ({}))) ?? {}) as Body }
  } catch {
    return { status: 0, body: {} } // network down: no HTTP status
  }
}

/** The server's reason, as text; '' when it gave none (the page then names the status). */
function detail(body: Body): string {
  const d = body.detail
  if (typeof d === 'string') return d
  // FastAPI validation: [{loc: [..., field], msg}]
  if (Array.isArray(d)) {
    return d
      .map(
        (e: { loc?: unknown[]; msg?: string }) => `${String(e.loc?.at(-1) ?? '')}: ${e.msg ?? ''}`
      )
      .join('; ')
  }
  return ''
}

const failure = (status: number, body: Body): Failure => ({
  kind: 'error',
  status,
  message: detail(body)
})

export async function validate(files: PickedFile[]): Promise<CheckResult> {
  const { status, body } = await post('/validate', form(files))
  if (status === 200) return { kind: 'ok', valid: !!body.valid, issues: body.issues ?? [] }
  return failure(status, body)
}

export async function submit(files: PickedFile[], contributor: Contributor): Promise<SubmitResult> {
  const { status, body } = await post('/contributions', form(files, contributor))
  if (status === 201) {
    return { kind: 'ok', id: String(body.id), url: String(body.url), issues: body.issues ?? [] }
  }
  if (status === 422 && Array.isArray(body.issues)) return { kind: 'issues', issues: body.issues }
  return failure(status, body)
}
