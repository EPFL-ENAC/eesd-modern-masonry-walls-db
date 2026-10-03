<template>
  <div>
    <header class="submit-band">
      <div class="page-container submit-band-inner">
        <div class="submit-eyebrow">
          <router-link to="/" class="submit-eyebrow-link">{{ t('submit.contribute') }}</router-link>
          · {{ t('submit.database') }}
        </div>
        <h1 class="submit-title">{{ t('submit.title') }}</h1>
        <p class="submit-lead">{{ t('submit.lead') }}</p>
      </div>
    </header>

    <div class="page-container submit">
      <div class="submit-main">
        <div class="submit-tools">
          <h2 class="submit-label">{{ t('submit.specimens') }}</h2>
          <div class="submit-tool-row">
            <button
              type="button"
              class="epfl-btn epfl-btn-secondary epfl-btn-sm"
              :disabled="busy"
              @click="run(kit)"
            >
              <q-icon :name="matInventory2" />{{ t('submit.starterKit') }}
            </button>
            <button
              type="button"
              class="submit-tool"
              :disabled="busy"
              @click="run(saveTemplateCsv)"
            >
              <q-icon :name="matFileDownload" />{{ t('submit.template') }}
            </button>
            <router-link class="submit-tool" :to="{ path: '/documentation', hash: '#glossary' }">
              <q-icon :name="matDescription" />{{ t('submit.dictionary') }}
            </router-link>
            <a class="submit-tool" href="#guide"
              ><q-icon :name="matMenuBook" />{{ t('submit.guide') }}</a
            >
          </div>
        </div>
        <p v-if="error" class="submit-error" role="alert">{{ error }}</p>

        <div class="submit-text">
          <p>{{ t('submit.p1', { n: fields.length }) }}</p>
          <i18n-t keypath="submit.p2" tag="p" scope="global">
            <template #file><code>fd_curve_SW0.1.csv</code></template>
          </i18n-t>
          <p>
            {{ t('submit.p3') }} <a href="#guide">{{ t('submit.guide') }}</a>
          </p>
        </div>

        <!-- handoff-Q2: drop zone, manual row editor, check and submit are drawn but have no
             backend yet; their states (matched / unmatched files, errors, submitted) are not designed. -->
        <div class="drop" aria-disabled="true">
          <q-icon :name="matUpload" size="1.5rem" />
          <p class="drop-title">{{ t('submit.dropTitle') }}</p>
          <p class="drop-text">{{ t('submit.dropText') }}</p>
          <div class="drop-actions">
            <button type="button" class="epfl-btn epfl-btn-secondary epfl-btn-sm" disabled>
              <q-icon :name="matFolderOpen" />{{ t('submit.chooseFolder') }}
            </button>
            <button type="button" class="epfl-btn epfl-btn-secondary epfl-btn-sm" disabled>
              <q-icon :name="matUpload" />{{ t('submit.chooseFiles') }}
            </button>
          </div>
        </div>

        <button type="button" class="add-manual" disabled>
          <q-icon :name="matAdd" />{{ t('submit.addManual') }}
        </button>

        <div class="submit-bar" role="status">
          <p class="submit-warning"><q-icon :name="matWarningAmber" />{{ t('submit.warning') }}</p>
          <div class="submit-actions">
            <button type="button" class="epfl-btn epfl-btn-secondary epfl-btn-sm" disabled>
              {{ t('submit.check') }}
            </button>
            <button type="button" class="epfl-btn epfl-btn-primary epfl-btn-sm" disabled>
              <q-icon :name="matSend" />{{ t('submit.submit') }}
            </button>
          </div>
          <p class="submit-note">{{ t('submit.note', { repo: REPO_NAME }) }}</p>
        </div>
      </div>

      <aside id="guide" class="guide" :aria-label="t('submit.guideTitle')">
        <div class="guide-head">
          <div class="guide-title-row">
            <h2 class="submit-label">{{ t('submit.guideTitle') }}</h2>
            <a :href="REPO" class="guide-github"
              >{{ t('submit.github') }} <q-icon :name="matOpenInNew"
            /></a>
          </div>
          <div role="tablist" class="guide-tabs" :aria-label="t('submit.guideTitle')">
            <button
              v-for="id in ['guide', 'dictionary'] as const"
              :id="`guide-tab-${id}`"
              :key="id"
              type="button"
              role="tab"
              class="guide-tab"
              :aria-selected="tab === id"
              aria-controls="guide-panel"
              @click="tab = id"
            >
              {{ t(`submit.tabs.${id}`) }}
              <span v-if="id === 'dictionary'" class="guide-count">{{ fields.length }}</span>
            </button>
          </div>
        </div>

        <div
          id="guide-panel"
          role="tabpanel"
          :aria-labelledby="`guide-tab-${tab}`"
          class="guide-body"
        >
          <template v-if="tab === 'guide'">
            <h3 class="guide-h3">{{ t('submit.layout') }}</h3>
            <p class="guide-muted">{{ t('submit.layoutIntro') }}</p>
            <div class="tree">
              <code>masonry_walls/</code>
              <div v-for="e in TREE" :key="e.path" class="tree-entry">
                <code>{{ e.path }}</code>
                <div class="tree-desc">
                  <span class="pill" :class="{ required: e.required }">
                    {{ t(e.required ? 'submit.required' : 'submit.optional') }}
                  </span>
                  {{ t(`submit.tree.${e.key}`, { n: fields.length }) }}
                  <code v-if="e.columns">{{ e.columns }}</code>
                </div>
              </div>
            </div>
            <button type="button" class="guide-kit" :disabled="busy" @click="run(kit)">
              <q-icon :name="matInventory2" />{{ t('submit.downloadKit') }}
            </button>
            <p class="guide-empty">
              {{ t('submit.noGuide') }} <a :href="REPO">{{ t('submit.github') }}</a>
            </p>
          </template>
          <ul v-else class="dict">
            <li v-for="f in fields" :key="f.n" class="dict-row">
              <span class="dict-name"><FieldLabel :field="f" units /></span>
              <span v-if="REQUIRED.includes(f.name)" class="pill required">{{
                t('submit.required')
              }}</span>
              <span v-else-if="f.name === 'N'" class="guide-muted">{{ t('submit.curator') }}</span>
              <span class="dict-def">{{ f.definition }}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  matAdd,
  matDescription,
  matFileDownload,
  matFolderOpen,
  matInventory2,
  matMenuBook,
  matOpenInNew,
  matSend,
  matUpload,
  matWarningAmber
} from '@quasar/extras/material-icons'
import { fields } from '../api/dataset.ts'
import FieldLabel from '../components/FieldLabel.vue'
import { saveStarterKit, saveTemplateCsv } from '../lib/download.ts'

const { t } = useI18n()

// Open question 2: submissions become review requests on this repository.
const REPO_NAME = 'EPFL-ENAC/eesd-modern-masonry-walls-db'
const REPO = `https://github.com/${REPO_NAME}`
// The 17 columns every one of the 198 specimens fills (open question 2); N is the curator's.
const REQUIRED = [
  ...['Reference', 'Specimen name', 'Unit type', 'N° courses', 'H', 'L', 't', 'Bed Joints'],
  ...['lb', 'wb', 'hb', 'fv0', 'H0/H', 'σ0', 'Failure mode', 'Vmax+', 'Vmax-']
]
const CURVE = 'drift [%], horizontal_force [kN]'
// The submission folder mirrors the dataset, keyed by specimen name.
const TREE = [
  { key: 'table', path: 'ModernMasonryDatabase_EIA_Database.csv', required: true },
  { key: 'fd', path: '02_fd_curve/fd_curve_<specimen>.csv', columns: CURVE },
  { key: 'envelope', path: '03_envelope/envelope_<specimen>_pos.csv · _neg.csv', columns: CURVE },
  {
    key: 'bilinear',
    path: '04_bilinear_curve/bilinear_<specimen>_pos.csv · _neg.csv',
    columns: CURVE
  },
  { key: 'photos', path: '05_fig_setup/ … 08_fig_cracks/fig_<kind>_<specimen>.jpg' }
].map((e) => ({ required: false, columns: '', ...e }))

const tab = ref<'guide' | 'dictionary'>('guide')

const busy = ref(false)
const error = ref('')
async function run(job: () => Promise<void>) {
  busy.value = true
  error.value = ''
  try {
    await job()
  } catch (e) {
    error.value = t('export.failed', { reason: (e as Error).message })
  } finally {
    busy.value = false
  }
}
// Placeholders as parameters: vue-i18n flags "<…>" in a message as HTML.
const kit = () =>
  saveStarterKit(t('submit.readme', { n: fields.length, s: '<specimen>', k: '<kind>' }))
</script>

<style scoped lang="scss">
.submit-band {
  border-bottom: var(--border-w) solid var(--fg);
}

.submit-band-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-5);
  padding-bottom: var(--gutter);
}

.submit-eyebrow {
  font-size: 0.8125rem;
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.submit-eyebrow-link {
  color: var(--primary);
  text-decoration: none;
}

.submit-title {
  margin: 0;
  font-weight: var(--w-light);
}

.submit-lead {
  max-width: 40rem;
  margin: 0;
  line-height: 1.5;
  color: var(--fg-muted);
}

.submit {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 25rem;
  gap: var(--space-5);
  align-items: start;
  padding-top: var(--gutter);
  padding-bottom: 4rem;
}

.submit-main {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  min-width: 0;
}

.submit-tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: var(--border-w) solid var(--border-subtle);
}

.submit-label {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--w-bold);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.submit-tool-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
}

.submit-tool {
  display: inline-flex;
  gap: 0.375rem;
  align-items: center;
  padding: 0;
  font: inherit;
  font-size: var(--fs-sm);
  font-weight: var(--w-bold);
  color: var(--fg);
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: 0;
}

.submit-error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--danger);
}

.submit-text {
  max-width: 42rem;
  font-size: 0.9375rem;
  line-height: 1.6;

  p {
    margin: 0 0 0.75rem;
  }

  code {
    color: var(--fg);
  }
}

.drop {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-5) var(--space-4);
  color: var(--fg-muted);
  text-align: center;
  border: calc(1.5 * var(--border-w)) dashed var(--border-strong);
}

.drop-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: var(--w-bold);
  color: var(--fg);
}

.drop-text {
  max-width: 42rem;
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
}

.drop-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.add-manual {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
  padding: 0.875rem;
  font: inherit;
  font-weight: var(--w-bold);
  color: var(--fg-muted);
  background: none;
  border: var(--border-w) dashed var(--border-strong);
  border-radius: var(--radius);
}

.submit-bar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border: var(--border-w) solid var(--border);
}

.submit-warning {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  margin: 0;
  font-weight: var(--w-bold);
}

.submit-actions {
  display: flex;
  gap: var(--space-2);
}

.submit-note {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--fg-muted);
}

.guide {
  position: sticky;
  top: var(--gutter);
  border: var(--border-w) solid var(--border);
}

.guide-head {
  padding: 1.25rem 1.25rem 0;
  border-bottom: var(--border-w) solid var(--border-subtle);
}

.guide-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.guide-github {
  font-size: 0.8125rem;
  color: var(--fg-muted);
  text-decoration: none;
}

.guide-tabs {
  display: flex;
  gap: 1.25rem;
  margin-top: 0.75rem;
}

.guide-tab {
  margin-bottom: calc(-1 * var(--border-w));
  padding: 0 0 var(--space-2);
  font: inherit;
  font-size: 0.9375rem;
  font-weight: var(--w-bold);
  color: var(--fg-muted);
  cursor: pointer;
  background: none;
  border: 0;
  border-bottom: 0.1875rem solid transparent;

  &[aria-selected='true'] {
    color: var(--fg);
    border-bottom-color: var(--primary);
  }
}

.guide-count {
  padding: 0 0.375rem;
  font-size: 0.75rem;
  font-weight: var(--w-normal);
  background: var(--bg-subtle);
  border-radius: var(--radius);
}

.guide-body {
  padding: 1.25rem;
  font-size: 0.8125rem;
}

.guide-h3 {
  margin: 0 0 var(--space-2);
  font-size: 0.9375rem;
  font-weight: var(--w-bold);
  text-transform: uppercase;
}

.guide-muted {
  margin: 0 0 var(--space-3);
  color: var(--fg-muted);
}

.tree {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  code {
    font-size: 0.75rem;
    color: var(--fg);
    overflow-wrap: anywhere;
  }
}

.tree-entry {
  padding-left: var(--space-3);
}

.tree-desc {
  padding: var(--space-1) 0 0 0.75rem;
  color: var(--fg-muted);

  code {
    color: var(--fg-muted);
  }
}

.pill {
  display: inline-block;
  padding: 0 var(--space-2);
  font-size: 0.6875rem;
  font-weight: var(--w-bold);
  color: var(--fg-muted);
  text-transform: uppercase;
  border: var(--border-w) solid var(--border-strong);
  border-radius: var(--radius-pill);

  &.required {
    color: var(--danger-fg);
    border-color: var(--danger);
  }
}

.guide-kit {
  display: inline-flex;
  gap: 0.375rem;
  align-items: center;
  margin: 1.25rem 0 0;
  padding: 0;
  font: inherit;
  font-weight: var(--w-bold);
  color: var(--fg);
  text-decoration: underline;
  cursor: pointer;
  background: none;
  border: 0;
}

.guide-empty {
  margin: var(--space-3) 0 0;
  padding-top: var(--space-3);
  color: var(--fg-muted);
  border-top: var(--border-w) solid var(--border-subtle);
}

.dict {
  max-height: 60vh;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.dict-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-2);
  align-items: baseline;
  padding: var(--space-2) 0;
  border-bottom: var(--border-w) solid var(--border-subtle);
}

.dict-name {
  font-weight: var(--w-bold);
}

.dict-def {
  flex-basis: 100%;
  color: var(--fg-muted);
}

@media (width <= 64rem) {
  .submit {
    grid-template-columns: minmax(0, 1fr);
  }

  .guide {
    position: static;
  }
}
</style>
