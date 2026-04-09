import type { SimulationEvent, MetricsHistoryPoint, Task } from '../types'

export function exportTasksAsCSV(tasks: Map<string, Record<string, unknown>>): string {
  const rows = Array.from(tasks.values())
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h]
          const str = val == null ? '' : String(val)
          return `"${str.replace(/"/g, '""')}"`
        })
        .join(','),
    ),
  ]
  return csvRows.join('\n')
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function buildTaskExportData(
  tasks: Map<string, Task>,
): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>()
  tasks.forEach((task, id) => {
    map.set(id, {
      id: task.id,
      status: task.status,
      priority: task.priority,
      retryCount: task.retryCount,
      maxRetries: task.maxRetries,
      createdAt: new Date(task.createdAt).toISOString(),
      startedAt: task.startedAt ? new Date(task.startedAt).toISOString() : '',
      completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : '',
      duration: task.duration,
      error: task.error || '',
      parentId: task.parentId || '',
    })
  })
  return map
}

export function buildMetricsHistoryCSV(history: MetricsHistoryPoint[]): string {
  if (history.length === 0) return ''
  const headers = Object.keys(history[0])
  const rows = [
    headers.join(','),
    ...history.map((row) =>
      headers
        .map((h) => {
          const val = row[h as keyof MetricsHistoryPoint]
          const str = val == null ? '' : String(val)
          return `"${str.replace(/"/g, '""')}"`
        })
        .join(','),
    ),
  ]
  return rows.join('\n')
}

export function buildEventsCSV(events: SimulationEvent[]): string {
  if (events.length === 0) return ''
  const headers = ['type', 'timestamp', 'taskId', 'workerId', 'message']
  const rows = [
    headers.join(','),
    ...events.map((e) =>
      headers
        .map((h) => {
          const val = (e as unknown as Record<string, unknown>)[h]
          const str = val == null ? '' : String(val)
          return `"${str.replace(/"/g, '""')}"`
        })
        .join(','),
    ),
  ]
  return rows.join('\n')
}
