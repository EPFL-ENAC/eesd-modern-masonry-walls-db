<template>
  <div class="db" :class="{ 'filters-open': filtersOpen }">
    <FilterSidebar v-show="filtersOpen" id="db-filters" />
    <div class="db-main">
      <div class="db-head">
        <!-- Closed by default; the badge says filters apply while it is. -->
        <button
          type="button"
          class="epfl-btn epfl-btn-secondary epfl-btn-sm db-filters"
          :aria-expanded="filtersOpen"
          aria-controls="db-filters"
          @click="filtersOpen = !filtersOpen"
        >
          <q-icon :name="matFilterList" />
          {{ t('filters.title') }}
          <span v-if="active" class="db-badge">{{ active }}</span>
        </button>
        <nav class="db-tabs" :aria-label="t('database.views')">
          <router-link
            v-for="v in ['table', 'visuals']"
            :key="v"
            :to="{ name: v, query: route.query }"
            class="db-tab"
            exact-active-class="active"
          >
            {{ t(`database.${v}`) }}
          </router-link>
        </nav>
        <!-- Each view teleports its own toolbar here. -->
        <div id="db-toolbar" class="db-toolbar" />
      </div>
      <router-view />
      <ModalDialog
        :model-value="!!specimen"
        wide
        :label="specimen ? t('specimen.label', { name: specimen.specimen }) : ''"
        @update:model-value="(o) => o || close()"
      >
        <SpecimenPanel v-if="specimen" :key="specimen.N" :row="specimen" />
      </ModalDialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { matFilterList } from '@quasar/extras/material-icons'
import { byN } from '../api/dataset.ts'
import FilterSidebar from '../components/FilterSidebar.vue'
import ModalDialog from '../components/ModalDialog.vue'
import SpecimenPanel from '../components/SpecimenPanel.vue'
import { useFilters } from '../composables/useFilters.ts'

const { t } = useI18n()
const route = useRoute()
const { setQuery, chips, filters } = useFilters()
const filtersOpen = ref(false)
// Active filters, the search left out: it shows in its own box.
const active = computed(() => chips.value.length - (filters.value.q ? 1 : 0))
// ?specimen=N opens the specimen in a dialog over either view (HANDOFF §3).
const specimen = computed(() => byN.get(Number(route.query.specimen)))
const close = () => setQuery({ specimen: undefined, tab: undefined })
</script>

<style scoped lang="scss">
// HANDOFF §1: 272 px filter sidebar, fluid main column; the sidebar folds away.
.db {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-height: 100%;

  &.filters-open {
    grid-template-columns: 17rem minmax(0, 1fr);
  }
}

.db-main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
  padding: var(--space-4) var(--gutter) var(--space-5);
}

.db-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-end;
  justify-content: space-between;
  border-bottom: var(--border-w) solid var(--border-subtle);
}

.db-tabs {
  display: flex;
  gap: 1.75rem;
  margin-right: auto;
}

.db-filters {
  margin-bottom: 0.625rem;
}

.db-badge {
  padding: 0 0.375rem;
  font-size: 0.75rem;
  font-weight: var(--w-bold);
  color: var(--epfl-white);
  background: var(--primary);
  border-radius: var(--radius);
}

.db-tab {
  margin-bottom: calc(-1 * var(--border-w));
  padding: 0.625rem 0 0.75rem;
  font-size: var(--fs-h6);
  font-weight: var(--w-bold);
  color: var(--fg-muted);
  text-decoration: none;
  border-bottom: 0.1875rem solid transparent;

  &.active {
    color: var(--fg);
    border-bottom-color: var(--primary);
  }
}

.db-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-bottom: 0.625rem;
}

@media (width <= 64rem) {
  .db.filters-open {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
