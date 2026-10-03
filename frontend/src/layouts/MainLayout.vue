<template>
  <div class="app-shell">
    <!-- DS `epfl-header` organism minus search and language switch (HANDOFF §1).
         Rendered from the DS classes: the kit's EpflHeader hard-codes href="#". -->
    <header class="epfl-header">
      <router-link to="/" class="epfl-logo" :aria-label="t('header.home')">
        <img :src="logoUrl" alt="EPFL" />
      </router-link>
      <nav class="epfl-nav" :aria-label="t('header.nav')">
        <!-- "/" is the parent of every route: exact match only, or Overview stays active. -->
        <router-link
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :active-class="item.to === '/' ? '' : 'active'"
          exact-active-class="active"
        >
          {{ t(item.label) }}
        </router-link>
      </nav>
      <div class="header-lab">
        <span class="header-lab-name">{{ t('header.lab') }}</span>
        <span class="header-lab-tag">EESD</span>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <!-- Own markup on DS tokens: the DS epfl-footer organism's structure could not be checked here. -->
    <footer v-if="route.meta.footer" class="app-footer">
      <div class="page-container app-footer-cols">
        <div>
          <h2 class="section-label">{{ t('footer.cite') }}</h2>
          <p v-for="c in citations" :key="c">{{ c }}</p>
        </div>
        <div>
          <h2 class="section-label">{{ t('footer.dataset') }}</h2>
          <p>
            {{ t('footer.lastUpdate', { date: lastUpdate }) }}<br />
            {{ t('footer.counts', { specimens: rows.length, fields: fields.length }) }}
          </p>
        </div>
        <div>
          <h2 class="section-label">{{ t('footer.maintained') }}</h2>
          <!-- handoff-Q8: postal address pending from EESD. -->
          <p>{{ t('footer.lab') }}<br />{{ t('footer.handoff-Q8-address') }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { fields, meta, rows } from '../api/dataset.ts'
import logoUrl from 'epfl-design-system/assets/svg/epfl-logo.svg'

const { t } = useI18n()
const route = useRoute()

// readme.txt lists "Author et al., 2018: full citation"; the footer shows the citation.
const citations = meta.sources.map((s) => s.replace(/^[^:]*:\s*/, ''))
const lastUpdate = new Date(meta.lastUpdate).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
})

const nav = [
  { to: '/', label: 'nav.overview' },
  { to: '/database', label: 'nav.database' },
  { to: '/documentation', label: 'nav.documentation' },
  { to: '/submit', label: 'nav.submit' },
  { to: '/others', label: 'nav.others' }
]
</script>

<style scoped lang="scss">
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
}

// HANDOFF §1: logo 96 × 28, nav 56 after it, wraps on narrow screens.
.epfl-logo {
  line-height: 0;

  img {
    height: 1.75rem;
  }
}

.epfl-nav {
  flex-wrap: wrap;
}

.app-footer {
  color: var(--epfl-white);
  background: var(--bg-dark);
}

.app-footer-cols {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--gutter);
  padding-top: 3rem;
  padding-bottom: 3rem;
  font-size: var(--fs-sm);
  line-height: 1.5;

  .section-label {
    margin-bottom: 0.75rem;
    color: inherit;
  }

  p {
    margin: 0 0 0.5rem;
    color: var(--epfl-gray-300);
  }

  @media (width <= 64rem) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.header-lab {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.header-lab-name {
  font-size: 0.8125rem;
  color: var(--fg-muted);
}

// Narrow screens: the nav wraps, the lab name gives way to its tag.
@media (width <= 64rem) {
  .epfl-header {
    flex-wrap: wrap;
    height: auto;
  }

  .header-lab-name {
    display: none;
  }
}

.header-lab-tag {
  padding: var(--space-1) var(--space-2);
  font-size: 0.9375rem;
  font-weight: var(--w-bold);
  letter-spacing: 0.04em;
  border: var(--border-w) solid var(--epfl-gray-300);
  border-radius: var(--radius);
}
</style>
