# Portfolio Showcase — Distributed Task Queue Simulator

## Overview

This project is a **production-grade browser simulation** of distributed task queue systems. It demonstrates senior frontend engineering through architecture design, performance optimization, accessibility, testing, and CI/CD.

---

## What It Simulates

Real-world distributed systems use task queues to handle asynchronous work. This simulator models the complete lifecycle:

```
Producer → Main Queue → Workers → Results
              ↓
         Retry Queue (exponential backoff)
              ↓
         Dead Letter Queue (DLQ)
```

You can observe how backpressure, circuit breakers, retries, and load balancing affect system behavior in real-time.

---

## UI Walkthrough

### 1. Control Panel (Left Sidebar)

- Adjust **worker count**, **failure probability**, **max retries**, **simulation speed**, and **queue capacity**
- Toggle **circuit breaker** and **audio feedback**
- Switch **load balancing strategies**: Round Robin, Least Connections, Random
- Apply **simulation presets**: Steady State, Traffic Spike, Chaos Mode, Zero Failure
- **Time-travel slider**: Rewind through up to 120 saved snapshots

### 2. Visualization (Center)

- **Pipeline overview**: See task flow from Producer → Queue → Workers → Results
- **Priority lanes**: Visual breakdown of high/medium/low priority tasks
- **Queue cards**: Dot-grid representations of Main Queue, Retry Queue, and DLQ
- **Worker pool**: Color-coded workers showing health status and circuit breaker state
- **Live tasks**: Animated processing tasks

### 3. Metrics Panel (Right Sidebar)

- Real-time **sparkline charts** for queue depth, active workers, tasks/sec, success/failure counts
- **Latency percentiles**: p50, p95, p99
- **Worker utilization heatmap**: Per-worker busy/idle/unhealthy history
- **Export/Import state** as JSON

### 4. Event Log & Task Table (Bottom Panel)

- **Virtualized task table**: Smoothly handles 10,000+ tasks
- **Filterable event log**: Like CloudWatch/Datadog — filter by event type
- **DLQ Inspector**: Deep-dive into dead tasks with failure breakdown

### 5. Toast Notifications

- Real-time alerts for task completions, failures, retries, backpressure, and system overload
- Action buttons to inspect DLQ directly from notifications

---

## Architecture Highlights

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                    UI Layer                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  TopBar     │  │ Visualization│  │ MetricsPanel│  │  Task Table / Events │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                    │                                         │
│                              Zustand Store                                   │
│                                    │                                         │
│                         useSimulation Hook                                   │
│                              (Bridge)                                        │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │  postMessage
┌────────────────────────────────────▼────────────────────────────────────────┐
│                               Web Worker                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ EventBus │───→│ Scheduler│───→│ Workers  │───→│  Queues  │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       │                                          (Main / Retry / DLQ)       │
│       │←───────────────────────────────────────────────────────────────┐    │
│       │         Events: TASK_CREATED, TASK_COMPLETED, TASK_FAILED,     │    │
│       │         SYSTEM_OVERLOAD, BACKPRESSURE_APPLIED, etc.            │    │
│       └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Web Worker for the engine**: Keeps the main thread free for 60fps UI updates
2. **Event-driven architecture**: UI subscribes to events; engine knows nothing about React
3. **Queue stores IDs, not objects**: Full tasks live in a single `Map<string, Task>` for O(1) lookup
4. **Virtualized rendering**: Task table uses `@tanstack/react-virtual` for 10k+ rows

---

## Performance Benchmarks

Recorded on Chrome 123, M2 MacBook Air:

| Metric                          | Result              |
| ------------------------------- | ------------------- |
| UI frame rate (1,000 tasks)     | **60 fps**          |
| UI frame rate (10,000 tasks)    | **58–60 fps**       |
| Time to add 10,000 tasks        | **~120 ms**         |
| Task table render (10,000 rows) | **< 16 ms**         |
| Initial bundle load             | **~310 KB gzipped** |
| Memory at idle                  | **~18 MB**          |
| Memory with 10,000 tasks        | **~45 MB**          |
| Worker message frequency        | **100 ms**          |

---

## Quality & Engineering Practices

- **TypeScript** strict mode throughout
- **ESLint + Prettier** enforced via Husky pre-commit hooks
- **Vitest + React Testing Library** for unit tests
- **Storybook** for component isolation and documentation
- **GitHub Actions CI/CD** for automated build, test, and GitHub Pages deployment
- **Accessibility**: ARIA labels, focus management, skip links, `prefers-reduced-motion`
- **PWA**: Service worker, offline caching, installable manifest

---

## Try It Live

🚀 **[Live Demo](https://abhishekr.github.io/distributed-task-queue-simulator/)**

---

Built with 💙 by [Abhishek R](https://github.com/abhishekr)
