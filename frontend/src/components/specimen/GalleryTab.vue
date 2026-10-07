<template>
  <div class="gallery">
    <figure v-for="fig in figures" :key="fig.key" class="fig">
      <div>
        <figcaption class="fig-title">{{ t(`specimen.gallery.${fig.key}`) }}</figcaption>
        <button v-if="fig.path" type="button" class="fig-open" @click="enlarge(fig.path, fig.key)">
          <img
            :src="photoUrl(fig.path, 512)"
            :srcset="`${photoUrl(fig.path, 512)} 512w, ${photoUrl(fig.path, 1920)} 1920w`"
            sizes="(width <= 64rem) 100vw, 25vw"
            :alt="t(`specimen.gallery.${fig.key}Alt`, { name: row.specimen })"
            class="fig-img"
            loading="lazy"
          />
        </button>
        <!-- Missing photo: dashed placeholder with the expected file name (HANDOFF §5.2). -->
        <div v-else class="fig-img fig-missing">
          {{ t('specimen.gallery.missing', { file: `${fig.stem}_${pad(row.N)}` }) }}
        </div>
      </div>
      <FieldRows :row="row" :names="fig.fields" class="fig-kv" />
    </figure>

    <dialog ref="dialog" class="fig-dialog" @click.self="dialog?.close()">
      <img v-if="big" :src="photoUrl(big.path, 1920)" :alt="big.alt" />
      <button
        type="button"
        class="epfl-btn epfl-btn-secondary epfl-btn-sm"
        @click="dialog?.close()"
      >
        {{ t('specimen.close') }}
      </button>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { photoUrl } from '../../api/dataset.ts'
import type { Row } from '../../lib/derive.ts'
import { pad } from '../../lib/download.ts'
import FieldRows from './FieldRows.vue'

const props = defineProps<{ row: Row }>()
const { t } = useI18n()

// σ₀/fm left out of the setup list: no derived ratio (open question 1).
const FIGURES = [
  { key: 'setup', folder: '05_fig_setup/', stem: 'fig_setup', fields: ['H0/H', 'σ0'] },
  { key: 'failmode', folder: '06_fig_failmode/', stem: 'fig_failmode', fields: ['Failure mode'] },
  {
    key: 'materials',
    folder: '07_fig_materials/',
    stem: 'fig_mat',
    fields: ['Unit type', 'fb,Ʇ', 'fmo']
  },
  { key: 'cracks', folder: '08_fig_cracks/', stem: 'fig_cracks', fields: ['Crack measurements'] }
]
const figures = computed(() =>
  FIGURES.map((f) => ({ ...f, path: props.row.files.find((p) => p.startsWith(f.folder)) }))
)

const dialog = ref<HTMLDialogElement>()
const big = ref<{ path: string; alt: string }>()
function enlarge(path: string, key: string) {
  big.value = { path, alt: t(`specimen.gallery.${key}Alt`, { name: props.row.specimen }) }
  dialog.value?.showModal()
}
</script>

<style scoped lang="scss">
.gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.fig {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 9.375rem;
  gap: var(--space-3);
  margin: 0;
  padding-top: 0.75rem;
  border-top: var(--border-w) solid var(--fg);
}

.fig-title {
  margin-bottom: 0.625rem;
  font-size: var(--fs-h6);
  font-weight: var(--w-bold);
}

.fig-open {
  display: block;
  width: 100%;
  padding: 0;
  line-height: 0;
  cursor: zoom-in;
  background: none;
  border: 0;
}

.fig-img {
  width: 100%;
  height: 16.25rem;
  object-fit: cover;
  background: var(--bg-subtle);
}

.fig-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  color: var(--fg-muted);
  border: var(--border-w) dashed var(--epfl-gray-300);
}

.fig-kv {
  margin-top: 2.125rem;
}

.fig-dialog {
  max-width: 90vw;
  max-height: 90vh;
  padding: var(--space-3);
  border: 0;
  border-radius: var(--radius);

  img {
    display: block;
    max-width: 100%;
    max-height: calc(90vh - 5rem);
    margin-bottom: 0.75rem;
  }
}

@media (width <= 64rem) {
  .gallery,
  .fig {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
