import { defineRouter } from '#q-app'
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

export default defineRouter(() =>
  createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: (to, from, saved) => {
      if (saved) return saved
      if (to.hash) {
        // scrollIntoView keeps the target's CSS scroll-margin; vue-router's { el } doesn't.
        document.getElementById(to.hash.slice(1))?.scrollIntoView()
        return false
      }
      return to.path === from.path ? false : { top: 0 }
    }
  })
)
