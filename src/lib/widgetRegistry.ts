import type { ComponentType } from 'react'
import ColorPalette from '../components/generative-ui/widgets/ColorPalette'
import ProsConsList from '../components/generative-ui/widgets/ProsConsList'
import ComparisonTable from '../components/generative-ui/widgets/ComparisonTable'
import ProgressTracker from '../components/generative-ui/widgets/ProgressTracker'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const widgetRegistry: Record<string, ComponentType<any>> = {
  ColorPalette,
  ProsConsList,
  ComparisonTable,
  ProgressTracker,
}

export type WidgetType = keyof typeof widgetRegistry
