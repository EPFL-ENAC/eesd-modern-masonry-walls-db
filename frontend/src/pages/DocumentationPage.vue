<template>
  <div class="page-container docs">
    <nav class="toc" :aria-label="t('docs.onThisPage')">
      <div class="toc-title">{{ t('docs.onThisPage') }}</div>
      <ul>
        <li v-for="s in TOP" :key="s">
          <a :href="`#${s}`" :class="{ active: active === s }">{{ t(`docs.toc.${s}`) }}</a>
          <ul v-if="s === 'glossary'">
            <li v-for="c in categories" :key="c.cat">
              <a
                :href="`#cat-${c.cat}`"
                class="toc-sub"
                :class="{ active: active === `cat-${c.cat}` }"
              >
                {{ c.cat }} · {{ c.name }}
              </a>
            </li>
          </ul>
        </li>
      </ul>
      <a :href="fileUrl(FIELDS_CSV)" download class="epfl-btn epfl-btn-secondary epfl-btn-sm">
        {{ t('docs.downloadFields') }}
      </a>
    </nav>

    <div class="docs-main">
      <section id="about" class="docs-section">
        <h1 class="docs-title">{{ t('docs.title') }}</h1>
        <p class="docs-lead">{{ t('docs.about', { n: rows.length }) }}</p>
        <p class="docs-muted">{{ t('footer.lastUpdate', { date: lastUpdate }) }}</p>
      </section>

      <section id="files" class="docs-section">
        <h2 class="docs-h2">{{ t('docs.toc.files') }}</h2>
        <p>{{ t('docs.filesIntro') }}</p>
        <div class="folders">
          <div v-for="f in FOLDERS" :key="f.folder" class="folder">
            <div class="docs-muted">{{ f.folder }}</div>
            <div class="folder-name">{{ t(`docs.folders.${f.folder}`) }}</div>
            <code>{{ f.pattern }}</code>
          </div>
        </div>
      </section>

      <section id="glossary" class="docs-section">
        <div class="glossary-head">
          <div>
            <h2 class="docs-h2">{{ t('docs.toc.glossary') }}</h2>
            <p class="docs-muted" role="status">
              {{
                query
                  ? t('docs.matching', {
                      n: shown.reduce((s, c) => s + c.count, 0),
                      total: fields.length
                    })
                  : t('docs.count', { n: fields.length, c: categories.length })
              }}
            </p>
          </div>
          <input
            v-model="query"
            type="search"
            class="glossary-filter"
            :placeholder="t('docs.filter')"
            :aria-label="t('docs.filter')"
          />
        </div>

        <section v-for="c in shown" :id="`cat-${c.cat}`" :key="c.cat" class="glossary-cat">
          <h3 class="glossary-cat-title">{{ c.cat }} · {{ c.name }}</h3>
          <table class="glossary">
            <thead>
              <tr>
                <th scope="col">{{ t('docs.col.n') }}</th>
                <th scope="col">{{ t('docs.col.field') }}</th>
                <th scope="col">{{ t('docs.col.unit') }}</th>
                <th scope="col">{{ t('docs.col.definition') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in c.entries" :key="e.n">
                <td class="glossary-n">{{ e.n }}</td>
                <th scope="row" class="glossary-field">
                  <FieldLabel :field="e.field" /><template v-if="e.pair">
                    {{ t('docs.pair') }}</template
                  >
                </th>
                <td class="docs-muted">{{ e.field.units }}</td>
                <td>
                  <template v-if="e.codes">
                    <template v-for="(code, i) in e.codes" :key="code[0]">
                      <template v-if="i"> · </template><span class="code">{{ code[0] }}</span>
                      {{ code[1] }}
                    </template>
                  </template>
                  <template v-else>{{ e.definition }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FIELDS_CSV, fields, fileUrl, meta, rows } from '../api/dataset.ts'
import type { Field } from '../api/types.ts'
import FieldLabel from '../components/FieldLabel.vue'

const { t } = useI18n()

const TOP = ['about', 'files', 'glossary'] as const
// File-name patterns from readme.txt.
const FOLDERS = [
  { folder: '01_references', pattern: '…_References.csv' },
  { folder: '02_fd_curve', pattern: 'fd_curve_N' },
  { folder: '03_envelope', pattern: 'envelope_N_pos / _neg' },
  { folder: '04_bilinear_curve', pattern: 'bilinear_N_pos / _neg' },
  { folder: '05_fig_setup', pattern: 'fig_setup_N' },
  { folder: '06_fig_failmode', pattern: 'fig_failmode_N' },
  { folder: '07_fig_materials', pattern: 'fig_mat_N' },
  { folder: '08_fig_cracks', pattern: 'fig_cracks_N' }
]

const lastUpdate = new Date(meta.lastUpdate).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
})

type Entry = {
  n: string
  field: Pick<Field, 'name' | 'units'>
  pair: boolean
  definition: string
  codes: [string, string][] | null
}

// "HC (Hollow Clay), AAC (…)" → code tags; anything else stays prose.
const CODE_LIST = /^\s*(?:[A-Z][A-Z-]*\s*\([^)]*\)\s*,?\s*)+$/
function codes(def: string): [string, string][] | null {
  if (!CODE_LIST.test(def)) return null
  return [...def.matchAll(/([A-Z][A-Z-]*)\s*\(([^)]*)\)/g)].map(([, c, name]) => [
    c!,
    name!.toLowerCase()
  ])
}

/** Glossary rows: a "+" field and its "−" twin share one row, as in the design. */
function entries(of: Field[]): Entry[] {
  const out: Entry[] = []
  for (const f of of) {
    if (f.name.endsWith('-') && of.some((g) => g.name === f.name.slice(0, -1) + '+')) continue
    const twin = f.name.endsWith('+')
      ? of.find((g) => g.name === f.name.slice(0, -1) + '-')
      : undefined
    out.push({
      n: twin ? `${f.n}–${twin.n}` : String(f.n),
      field: twin ? { name: f.name.slice(0, -1), units: f.units } : f,
      pair: !!twin,
      definition: twin
        ? f.definition.replace(/ in the positive direction$/, '') + t('docs.bothDirections')
        : f.definition,
      codes: codes(f.definition)
    })
  }
  return out
}

const categories = [...new Set(fields.map((f) => f.category))].map((cat) => {
  const of = fields.filter((f) => f.category === cat)
  return { cat, name: of[0]!.categoryName, fields: of, entries: entries(of) }
})

const query = ref('')
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return categories
    .map((c) => {
      const fs = q
        ? c.fields.filter((f) =>
            [f.name, f.definition, f.units].some((s) => s.toLowerCase().includes(q))
          )
        : c.fields
      return { ...c, entries: q ? entries(fs) : c.entries, count: fs.length }
    })
    .filter((c) => c.count)
})

// Highlight the section at the top of the viewport (2 px red rule in the TOC).
const active = ref('about')
let observer: IntersectionObserver | undefined
onMounted(() => {
  observer = new IntersectionObserver(
    (seen) => {
      const hit = seen.find((e) => e.isIntersecting)
      if (hit) active.value = hit.target.id
    },
    { rootMargin: '0px 0px -75% 0px' }
  )
  document.querySelectorAll('.docs-section, .glossary-cat').forEach((el) => observer!.observe(el))
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped lang="scss">
.docs {
  display: grid;
  grid-template-columns: 13rem minmax(0, 1fr);
  gap: 4rem;
  padding-top: var(--space-5);
  padding-bottom: 4rem;
}

.toc {
  position: sticky;
  top: var(--gutter);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-self: start;
  font-size: var(--fs-sm);

  .epfl-btn {
    margin-top: var(--space-3);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  a:not(.epfl-btn) {
    display: block;
    padding: var(--space-1) 0 var(--space-1) 0.75rem;
    color: var(--fg);
    text-decoration: none;
    border-left: 0.125rem solid transparent;

    &.active {
      font-weight: var(--w-bold);
      border-left-color: var(--primary);
    }
  }

  .toc-sub {
    padding-left: var(--space-4);
    font-size: 0.75rem;
    color: var(--fg-muted);
  }
}

.toc-title {
  font-size: 0.75rem;
  font-weight: var(--w-bold);
  color: var(--fg-muted);
}

.docs-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 62rem;
}

.docs-section {
  scroll-margin-top: var(--space-3);
}

.docs-title {
  margin: 0 0 var(--space-3);
}

.docs-lead {
  max-width: 47.5rem;
  margin: 0 0 var(--space-3);
  font-size: var(--fs-lead);
  font-weight: var(--w-light);
  line-height: 1.5;
}

.docs-muted {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--fg-muted);
}

.docs-h2 {
  margin: 0 0 var(--space-2);
  font-size: var(--fs-h3);
  font-weight: var(--w-bold);
}

.folders {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: var(--border-w) solid var(--border);
}

.folder {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: 0.75rem var(--space-3);
  border-right: var(--border-w) solid var(--border-subtle);
  border-bottom: var(--border-w) solid var(--border-subtle);

  code {
    font-size: 0.75rem;
    color: var(--fg);
  }
}

.folder-name {
  font-weight: var(--w-bold);
}

.glossary-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.glossary-filter {
  width: 20rem;
  padding: 0.4375rem 0.625rem;
  font: inherit;
  font-size: var(--fs-sm);
  border: var(--border-w) solid var(--epfl-gray-300);
  border-radius: var(--radius);
}

.glossary-cat {
  margin-bottom: var(--gutter);
  scroll-margin-top: var(--space-3);
}

.glossary-cat-title {
  margin: 0 0 var(--space-2);
  font-size: 1rem;
  font-weight: var(--w-normal);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.glossary {
  width: 100%;
  font-size: var(--fs-sm);
  border-collapse: collapse;

  thead th {
    padding: var(--space-2);
    font-size: 0.75rem;
    font-weight: var(--w-normal);
    color: var(--fg-muted);
    text-align: left;
    border-bottom: var(--border-w) solid var(--fg);
  }

  td,
  tbody th {
    padding: 0.625rem var(--space-2);
    text-align: left;
    vertical-align: top;
    border-bottom: var(--border-w) solid var(--border-subtle);
  }
}

.glossary-n {
  width: 3.5rem;
  white-space: nowrap;
  color: var(--fg-muted);
}

.glossary-field {
  width: 13rem;
  font-weight: var(--w-bold);
}

.code {
  padding: 0 var(--space-1);
  font-size: 0.75rem;
  font-weight: var(--w-bold);
  border: var(--border-w) solid var(--epfl-gray-300);
  border-radius: var(--radius);
}

@media (width <= 64rem) {
  .docs {
    grid-template-columns: minmax(0, 1fr);
  }

  .toc {
    position: static;
  }

  .folders {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
