<template>
  <div class="app-shell">
    <!-- DS `epfl-header` organism minus search and language switch (HANDOFF §1).
         Rendered from the DS classes: the kit's EpflHeader hard-codes href="#". -->
    <header class="epfl-header" @keydown.esc="closeMenu">
      <router-link to="/" class="epfl-logo" :aria-label="t('header.home')">
        <span class="logo logo-red" role="img" aria-label="EPFL" :style="logoMask" />
      </router-link>
      <!-- Phones only: the links fold into a menu under a one-line bar. -->
      <button
        ref="menuBtn"
        type="button"
        class="epfl-btn epfl-btn-secondary epfl-btn-sm header-menu"
        :aria-expanded="menuOpen"
        aria-controls="header-links"
        @click="menuOpen = !menuOpen"
      >
        <q-icon :name="menuOpen ? matClose : matMenu" />
        {{ t('header.menu') }}
      </button>
      <div id="header-links" class="header-links" :class="{ open: menuOpen }">
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
        <a class="header-lab" href="https://www.epfl.ch/labs/eesd/">
          <span class="header-lab-name">{{ t('header.lab') }}</span>
          <span class="header-lab-tag">{{ t('header.labTag') }}</span>
          <q-icon :name="matNorthEast" size="0.875rem" aria-hidden="true" />
        </a>
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
    <FieldTip />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { matClose, matMenu, matNorthEast } from '@quasar/extras/material-icons'
import { fields, meta, rows } from '../api/dataset.ts'
import logoUrl from 'epfl-design-system/assets/svg/epfl-logo.svg'
import FieldTip from '../components/FieldTip.vue'

const { t } = useI18n()
const route = useRoute()
const menuOpen = ref(false)
const menuBtn = ref<HTMLButtonElement>()
// Escape closes the menu and puts focus back on its button, not on a hidden link.
function closeMenu() {
  if (!menuOpen.value) return
  menuOpen.value = false
  menuBtn.value?.focus()
}
// Following a link closes the menu.
watch(
  () => route.fullPath,
  () => (menuOpen.value = false)
)
// Vite inlines the SVG as a data: URI with spaces, so the url() needs its quotes.
const logoMask = { maskImage: `url("${logoUrl}")` }

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

.epfl-footer p {
  margin: 0 0 var(--space-2);
  font-size: var(--fs-sm);
  line-height: var(--lh-relaxed);
  color: var(--epfl-gray-300);
}

// The lab's site, as a plain link: the name, a thin rule, then the acronym.
.header-lab {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  color: var(--fg);
  text-decoration: none;

  &:hover .header-lab-tag {
    text-decoration: underline;
  }
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

// Wider screens: the links sit in the header row, as the DS draws it.
.header-links {
  display: contents;
}

.header-menu {
  display: none;
}

// Phones: a one-line bar (logo, Menu); the links open as a list under it.
@media (width <= 40rem) {
  .epfl-header {
    padding: var(--space-3);
  }

  .header-menu {
    display: inline-flex;
    margin-left: auto;
  }

  .header-links {
    display: none;
    flex-direction: column;
    gap: var(--space-2);
    width: 100%;
    padding-top: var(--space-2);

    &.open {
      display: flex;
    }
  }

  .epfl-nav {
    flex-direction: column;
    margin-left: 0;

    a {
      padding: 0.75rem 0 0.75rem var(--space-4);
    }

    // The red marker sits left of the item instead of under it.
    a.active::after,
    a:hover::after {
      top: calc(50% - 0.1875rem);
      bottom: auto;
      left: 0;
    }
  }

  .header-lab {
    padding: 0.75rem 0 0.75rem var(--space-4);
  }
}

// Phones: the footer's logo and columns stack.
@media (width <= 40rem) {
  .epfl-footer {
    padding-inline: var(--space-3);
  }

  .epfl-footer-top {
    flex-direction: column;
  }

  .epfl-footer-cols {
    grid-template-columns: minmax(0, 1fr);
  }
}

.header-lab-tag {
  padding-left: 0.75rem;
  font-size: 0.9375rem;
  font-weight: var(--w-bold);
  letter-spacing: 0.04em;
  border-left: var(--border-w) solid var(--epfl-gray-300);
}

@media (width <= 64rem) {
  .header-lab-tag {
    padding-left: 0;
    border-left: 0;
  }
}
</style>
