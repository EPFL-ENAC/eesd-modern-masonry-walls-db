<template>
  <!-- Native modal <dialog>: Escape, focus trap and inert page come with showModal(). -->
  <dialog
    ref="el"
    class="modal"
    :class="{ wide }"
    :aria-label="label"
    @close="open = false"
    @click="onClick"
  >
    <!-- Mounted once the dialog shows: a chart inside measures a visible box, not 0 × 0. -->
    <slot v-if="shown" />
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const open = defineModel<boolean>({ required: true })
defineProps<{ label: string; wide?: boolean }>()

const el = ref<HTMLDialogElement>()
const shown = ref(false)
watch(
  [open, el],
  ([o, d]) => {
    if (o && d && !d.open) d.showModal()
    else if (!o && d?.open) d.close()
    shown.value = !!d?.open
  },
  { immediate: true }
)

// A click on the backdrop lands on the <dialog> itself (it has no padding).
const onClick = (e: MouseEvent) => {
  if (e.target === el.value) open.value = false
}
</script>

<style scoped lang="scss">
.modal {
  width: min(26rem, calc(100vw - 2 * var(--space-3)));
  max-width: none;
  max-height: calc(100dvh - 2 * var(--space-3));
  padding: 0;
  overflow: auto;
  color: var(--fg);
  background: var(--bg);
  border: 0;
  border-radius: var(--radius);

  &.wide {
    width: min(80rem, calc(100vw - 2 * var(--space-3)));
  }

  &::backdrop {
    background: color-mix(in srgb, var(--epfl-black) 40%, transparent);
    backdrop-filter: blur(0.25rem);
  }
}

// The page behind doesn't scroll while a modal is open.
:global(html:has(.modal[open])) {
  overflow: hidden;
}

// Small screens: the dialog takes the whole screen.
@media (width <= 40rem) {
  .modal,
  .modal.wide {
    width: 100vw;
    height: 100dvh;
    max-height: none;
    border-radius: 0;
  }
}
</style>
