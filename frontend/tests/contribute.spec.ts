import { afterEach, describe, expect, it, vi } from 'vitest'
import { filesFromInput, groupIssues, submit, type Issue } from '../src/api/contribute.ts'

const file = (name: string, relative = '') =>
  Object.defineProperty(new File(['x'], name), 'webkitRelativePath', { value: relative })

const issue = (file: string | null, severity: Issue['severity'], message = ''): Issue => ({
  message,
  file,
  row: null,
  column: null,
  value: null,
  severity
})

describe('filesFromInput', () => {
  it('keeps relative paths and skips images', () => {
    const picked = filesFromInput([
      file('fd_curve_X.csv', 'masonry_walls/02_fd_curve/fd_curve_X.csv'),
      file('README.txt'),
      file('fig_setup_X.jpg', 'masonry_walls/07_fig_setup/fig_setup_X.jpg')
    ])
    expect(picked.files.map((f) => f.path)).toEqual([
      'masonry_walls/02_fd_curve/fd_curve_X.csv',
      'README.txt'
    ])
    expect(picked.skipped).toEqual(['masonry_walls/07_fig_setup/fig_setup_X.jpg'])
  })
})

describe('groupIssues', () => {
  it('groups by file, errors first', () => {
    const groups = groupIssues([
      issue('a.csv', 'warning', 'w1'),
      issue(null, 'warning', 'g'),
      issue('b.csv', 'warning', 'w2'),
      issue('b.csv', 'error', 'e2')
    ])
    expect(groups.map((g) => g.file)).toEqual(['b.csv', 'a.csv', null])
    expect(groups[0]!.issues.map((i) => i.message)).toEqual(['e2', 'w2'])
  })
})

describe('submit', () => {
  afterEach(() => vi.unstubAllGlobals())
  const who = { name: 'A', email: 'a@example.org', institution: 'X', orcid: '', note: '' }
  const reply = (status: number, body: unknown) =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(body), { status }))
    )

  it('maps 201 to ok', async () => {
    reply(201, { valid: true, issues: [], id: 'c1', url: 'https://github.com/x/pull/1' })
    expect(await submit([], who)).toEqual({
      kind: 'ok',
      id: 'c1',
      url: 'https://github.com/x/pull/1',
      issues: []
    })
  })

  it('maps 422 with issues to issues', async () => {
    const issues = [issue('a.csv', 'error')]
    reply(422, { valid: false, issues })
    expect(await submit([], who)).toEqual({ kind: 'issues', issues })
  })

  it('maps a FastAPI 422 to an error naming the field', async () => {
    reply(422, { detail: [{ loc: ['body', 'email'], msg: 'not an email' }] })
    expect(await submit([], who)).toEqual({
      kind: 'error',
      status: 422,
      message: 'email: not an email'
    })
  })

  it.each([429, 503])('maps %i to an error with the detail', async (status) => {
    reply(status, { detail: 'later' })
    expect(await submit([], who)).toEqual({ kind: 'error', status, message: 'later' })
  })
})
