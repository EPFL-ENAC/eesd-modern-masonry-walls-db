<template>
  <v-app>
    <v-app-bar flat border>
      <v-app-bar-title>
        <router-link to="/" class="text-decoration-none text-high-emphasis">
          {{ $t('app.title') }}
        </router-link>
      </v-app-bar-title>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
