<template>
  <div class="db">
    <FilterSidebar />
    <div class="db-main">
      <div class="db-head">
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
      <SpecimenPanel v-if="specimen" :key="specimen.N" :row="specimen" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { byN } from '../api/dataset.ts'
import FilterSidebar from '../components/FilterSidebar.vue'
import SpecimenPanel from '../components/SpecimenPanel.vue'

const { t } = useI18n()
const route = useRoute()
// ?specimen=N opens the panel under either view (HANDOFF §3).
const specimen = computed(() => byN.get(Number(route.query.specimen)))
</script>

<style scoped lang="scss">
// HANDOFF §1: 272 px filter sidebar, fluid main column.
.db {
  display: grid;
  grid-template-columns: 17rem minmax(0, 1fr);
  min-height: 100%;
}

.db-main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
  padding: 1.5rem var(--gutter) 3rem;
}

.db-head {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: flex-end;
  justify-content: space-between;
  border-bottom: var(--border-w) solid var(--border-subtle);
}

.db-tabs {
  display: flex;
  gap: 1.75rem;
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
  gap: 0.5rem;
  padding-bottom: 0.625rem;
}

@media (width <= 64rem) {
  .db {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
