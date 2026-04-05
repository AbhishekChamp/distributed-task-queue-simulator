import type { Meta, StoryObj } from '@storybook/react-vite'
import { Sparkline } from '../components/Sparkline'

const meta: Meta<typeof Sparkline> = {
  component: Sparkline,
  title: 'Charts/Sparkline',
}

export default meta
type Story = StoryObj<typeof Sparkline>

export const QueueDepth: Story = {
  args: {
    data: [2, 5, 8, 12, 15, 10, 6, 4, 7, 11],
    width: 120,
    height: 32,
    color: '#0ea5e9',
  },
}

export const FailureRate: Story = {
  args: {
    data: [0, 2, 5, 3, 8, 12, 10, 15, 7, 4],
    width: 120,
    height: 32,
    color: '#f43f5e',
  },
}
