import { defineRouter } from '#q-app'
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

export default defineRouter(() =>
  createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: (to, from, saved) =>
      saved ?? (to.hash ? { el: to.hash } : to.path === from.path ? false : { top: 0 })
  })
)
