<template>
  <div class="app-shell">
    <!-- DS `epfl-header` organism minus search and language switch (HANDOFF §1).
         Rendered from the DS classes: the kit's EpflHeader hard-codes href="#". -->
    <header class="epfl-header">
      <router-link to="/" class="epfl-logo" :aria-label="t('header.home')">
        <span class="logo logo-red" role="img" aria-label="EPFL" :style="logoMask" />
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
        <span class="header-lab-tag">{{ t('header.labTag') }}</span>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <!-- DS footer organism (css/organisms/footer.css). The kit's EpflFooter takes link
         lists that all point to "#"; this footer holds text, so it renders the classes. -->
    <footer v-if="route.meta.footer" class="epfl-footer">
      <div class="epfl-footer-top">
        <span
          class="logo logo-white epfl-footer-logo"
          role="img"
          aria-label="EPFL"
          :style="logoMask"
        />
        <div class="epfl-footer-cols">
          <div class="footer-cite">
            <h6>{{ t('footer.cite') }}</h6>
            <p v-for="c in citations" :key="c">{{ c }}</p>
          </div>
          <div>
            <h6>{{ t('footer.dataset') }}</h6>
            <p>{{ t('footer.lastUpdate', { date: lastUpdate }) }}</p>
            <p>{{ t('footer.counts', { specimens: rows.length, fields: fields.length }) }}</p>
          </div>
          <div>
            <h6>{{ t('footer.maintained') }}</h6>
            <p>{{ t('footer.lab') }}</p>
            <!-- handoff-Q8 (#17): postal address pending from EESD. -->
            <p>{{ t('footer.handoff-Q8-address') }}</p>
          </div>
        </div>
      </div>
      <div class="epfl-footer-bottom">
        <div>{{ t('footer.copyright', { year: new Date().getFullYear() }) }}</div>
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
// Vite inlines the SVG as a data: URI with spaces, so the url() needs its quotes.
const logoMask = { maskImage: `url("${logoUrl}")` }

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
}

// The DS logo SVGs lost their fill style (empty <defs>), so as <img> they draw black.
// Used as a mask instead, the logo takes the brand token: red here, white on the footer.
.logo {
  display: block;
  height: 1.75rem;
  aspect-ratio: 182.4 / 53;
  mask-size: contain;
  mask-repeat: no-repeat;
}

.logo-red {
  background: var(--primary);
}

.logo-white {
  height: 2.25rem;
  background: var(--fg-inverse);
}

.epfl-nav {
  flex-wrap: wrap;
}

// The cite column is twice as wide (the design's 2fr 1fr 1fr) in the DS 4-column grid.
.footer-cite {
  grid-column: span 2;
}

.epfl-footer p {
  margin: 0 0 var(--space-2);
  font-size: var(--fs-sm);
  line-height: var(--lh-relaxed);
  color: var(--epfl-gray-300);
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
