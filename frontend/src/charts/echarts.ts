import { use } from 'echarts/core'
import { LineChart, PieChart, SankeyChart, ScatterChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
import { cssColor } from '../lib/tokens.ts'

// Tree-shaken: register each chart type here as a page starts using it.
use([
  PieChart,
  SankeyChart,
  LineChart,
  ScatterChart,
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
  CanvasRenderer,
  SVGRenderer
])

export { default as VChart } from 'vue-echarts'

/** The design's dark tooltip (HANDOFF §4.1). */
export const darkTooltip = () => ({
  backgroundColor: cssColor('--fg'),
  borderWidth: 0,
  padding: [8, 12],
  textStyle: { color: cssColor('--epfl-white'), fontSize: 13 }
})
