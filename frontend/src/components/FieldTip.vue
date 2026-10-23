<template>
  <!-- One tooltip for every [data-tip] element. A popover sits in the top layer, so it
       also shows over the modal specimen dialog, where a QTooltip would render under it. -->
  <div ref="el" popover="manual" role="tooltip" class="tip">{{ text }}</div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const el = ref<HTMLElement>()
const text = ref('')
let host: Element | null = null
let timer: ReturnType<typeof setTimeout> | undefined

function hide() {
  clearTimeout(timer)
  host = null
  if (el.value?.matches(':popover-open')) el.value.hidePopover()
}

// Hover, or keyboard focus on a control holding a label (a table header's sort button).
function enter(e: Event) {
  const target = e.target as Element
  const next =
    target.closest?.('[data-tip]') ??
    (e.type === 'focusin' ? target.querySelector?.('[data-tip]') : null)
  if (next === host) return
  hide()
  if (!next) return
  host = next
  timer = setTimeout(() => show(next), 300)
}

async function show(h: Element) {
  const tip = el.value!
  text.value = h.getAttribute('data-tip')!
  await nextTick()
  tip.showPopover()
  // Below the label, or above it near the bottom edge; kept inside the viewport.
  const r = h.getBoundingClientRect()
  const gap = 6
  const below = r.bottom + gap + tip.offsetHeight <= innerHeight
  tip.style.top = `${below ? r.bottom + gap : r.top - gap - tip.offsetHeight}px`
  tip.style.left = `${Math.max(gap, Math.min(r.left, innerWidth - tip.offsetWidth - gap))}px`
}

const LISTEN = {
  mouseover: enter,
  focusin: enter,
  focusout: hide,
  pointerdown: hide,
  keydown: hide
}
onMounted(() => {
  for (const [type, fn] of Object.entries(LISTEN)) document.addEventListener(type, fn)
  addEventListener('scroll', hide, { capture: true, passive: true })
})
onBeforeUnmount(() => {
  for (const [type, fn] of Object.entries(LISTEN)) document.removeEventListener(type, fn)
  removeEventListener('scroll', hide, { capture: true })
})
</script>

<style scoped lang="scss">
// The charts' tooltip look (darkTooltip).
.tip {
  position: fixed;
  inset: auto;
  max-width: 22rem;
  margin: 0;
  padding: var(--space-2) 0.75rem;
  font-size: 0.8125rem;
  line-height: var(--lh-relaxed);
  color: var(--epfl-white);
  pointer-events: none;
  background: var(--fg);
  border: 0;
  border-radius: var(--radius);
}

// A label with a definition: dotted underline; in a button it keeps the button's cursor.
:global([data-tip]) {
  text-decoration: underline dotted var(--epfl-gray-300);
  text-underline-offset: 0.2em;
  cursor: help;
}

:global(button [data-tip]) {
  cursor: inherit;
}
</style>
