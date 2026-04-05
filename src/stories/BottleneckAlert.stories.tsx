import type { Meta, StoryObj } from '@storybook/react-vite'
import { BottleneckAlert } from '../components/BottleneckAlert'

const meta: Meta<typeof BottleneckAlert> = {
  component: BottleneckAlert,
  title: 'System/BottleneckAlert',
}

export default meta
type Story = StoryObj<typeof BottleneckAlert>

export const None: Story = {
  args: { stage: 'none' },
}

export const Queue: Story = {
  args: { stage: 'queue' },
}

export const Workers: Story = {
  args: { stage: 'workers' },
}

export const Producer: Story = {
  args: { stage: 'producer' },
}
