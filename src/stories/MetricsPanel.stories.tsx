import type { Meta, StoryObj } from '@storybook/react-vite'
import { MetricsPanel } from '../components/MetricsPanel'

const meta: Meta<typeof MetricsPanel> = {
  component: MetricsPanel,
  title: 'System/MetricsPanel',
}

export default meta
type Story = StoryObj<typeof MetricsPanel>

const baseMetrics = {
  queued: 12,
  processing: 4,
  success: 86,
  failed: 3,
  retry: 2,
  dead: 1,
  activeWorkers: 4,
  tasksPerSecond: 8,
  failureRate: 1.14,
  p50Latency: 450,
  p95Latency: 890,
  p99Latency: 1200,
}

export const Default: Story = {
  args: {
    metrics: baseMetrics,
    metricsHistory: Array.from({ length: 20 }, (_, i) => ({
      ...baseMetrics,
      queued: Math.max(0, baseMetrics.queued + Math.sin(i) * 5),
      timestamp: Date.now() - (20 - i) * 500,
    })),
    workerUtilization: [
      { workerId: 'worker-1', history: ['busy', 'busy', 'idle', 'busy'] },
      { workerId: 'worker-2', history: ['idle', 'busy', 'busy', 'busy'] },
    ],
    tasks: new Map(),
    events: [],
    snapshots: [],
    onExport: () => {},
    onImport: () => {},
  },
}
