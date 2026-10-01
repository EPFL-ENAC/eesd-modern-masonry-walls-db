import BackendInfo from '@/components/BackendInfo.vue'
import i18n from '@/plugins/i18n'
import vuetify from '@/plugins/vuetify'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

// jsdom has no ResizeObserver; Vuetify's VProgressCircular needs one.
// ponytail: per-spec stub, move to a vitest setupFiles once a second spec needs it
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

const getInfo = vi.fn()
vi.mock('@/api/info', () => ({ getInfo: () => getInfo() }))

function render() {
  return mount(BackendInfo, { global: { plugins: [vuetify, i18n] } })
}

describe('BackendInfo', () => {
  it('shows the backend name and version', async () => {
    getInfo.mockResolvedValue({ name: 'modernmasonrydatabase', version: '1.2.3' })
    const wrapper = render()
    await flushPromises()
    expect(wrapper.text()).toContain('modernmasonrydatabase 1.2.3')
  })

  it('shows the error when the backend is unreachable', async () => {
    getInfo.mockRejectedValue(new Error('Network Error'))
    const wrapper = render()
    await flushPromises()
    expect(wrapper.text()).toContain('Network Error')
  })
})
