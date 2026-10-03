<template>
  <Teleport defer to="#db-toolbar">
    <input
      type="search"
      class="db-search"
      :placeholder="t('table.search')"
      :aria-label="t('table.search')"
      :value="filters.q"
      @input="update({ q: ($event.target as HTMLInputElement).value })"
    />
    <button type="button" class="epfl-btn epfl-btn-secondary epfl-btn-sm" @click="toExport">
      <q-icon :name="matFileDownload" />
      {{ t('table.export') }}
    </button>
  </Teleport>

  <div class="status">
    <i18n-t keypath="table.count" tag="span" scope="global">
      <template #n
        ><b>{{ filtered.length }}</b></template
      >
      <template #total>{{ rows.length }}</template>
    </i18n-t>
    <template v-if="chips.length">
      <span class="status-sep" aria-hidden="true">|</span>
      <span v-for="c in chips" :key="c.label" class="chip">
        {{ c.label }}
        <button
          type="button"
          :aria-label="t('table.removeFilter', { filter: c.label })"
          @click="update(c.patch)"
        >
          ×
        </button>
      </span>
    </template>
    <span class="status-hint">{{ t('table.hint') }}</span>
  </div>

  <div class="table-layout">
    <SpecimenTable :rows="filtered" :visible="visible" />
    <div class="table-side">
      <ExportBox />
      <ColumnsBox v-model="visible" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { matFileDownload } from '@quasar/extras/material-icons'
import { rows } from '../../api/dataset.ts'
import ColumnsBox from '../../components/ColumnsBox.vue'
import ExportBox from '../../components/ExportBox.vue'
import SpecimenTable from '../../components/SpecimenTable.vue'
import { useFilters } from '../../composables/useFilters.ts'

const { t } = useI18n()
const { filters, filtered, update, chips } = useFilters()

// The design's default columns (local state, not the URL).
const visible = ref([
  ...['N', 'Reference', 'Specimen name', 'Unit type', 'N° courses', 'H', 'L', 't'],
  ...[
    'Bed Joints',
    'Head Joints',
    'Void Ratio',
    'fm,c',
    'H0/H',
    'σ0',
    'Failure mode',
    'Vmax+',
    'δu+'
  ]
])

function toExport() {
  const box = document.getElementById('export')
  box?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  box?.focus({ preventScroll: true })
}
</script>

<style scoped lang="scss">
.db-search {
  width: 16.25rem;
  padding: 0.4375rem 0.625rem;
  font: inherit;
  font-size: var(--fs-sm);
  border: var(--border-w) solid var(--epfl-gray-300);
  border-radius: var(--radius);
}

.status {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  font-size: var(--fs-sm);
}

.status-sep {
  color: var(--epfl-gray-300);
}

.status-hint {
  margin-left: auto;
  color: var(--fg-muted);
}

// HANDOFF §4.2: fluid table, 232 px right column.
.table-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 14.5rem;
  gap: 1.5rem;
  align-items: start;
}

.table-side {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (width <= 80rem) {
  .table-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
