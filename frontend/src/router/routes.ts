import type { RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    footer?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'overview',
        component: () => import('../pages/OverviewPage.vue'),
        meta: { footer: true }
      },
      {
        path: 'database',
        component: () => import('../pages/DatabasePage.vue'),
        children: [
          { path: '', name: 'table', component: () => import('../pages/database/TableView.vue') },
          {
            path: 'visuals',
            name: 'visuals',
            component: () => import('../pages/database/VisualsView.vue')
          }
        ]
      },
      {
        path: 'documentation',
        name: 'documentation',
        component: () => import('../pages/DocumentationPage.vue')
      },
      { path: 'submit', name: 'submit', component: () => import('../pages/SubmitPage.vue') },
      { path: 'others', name: 'others', component: () => import('../pages/OthersPage.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export default routes
