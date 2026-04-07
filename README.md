# Distributed Task Queue Simulator

A **production-grade, browser-based simulator** for distributed task queues. Experience how real-world systems like Celery, RabbitMQ, and AWS SQS handle concurrency, backpressure, retries, circuit breakers, and dead-letter queues — all running smoothly at 60fps in your browser.

[![CI/CD](https://github.com/abhishekr/distributed-task-queue-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/abhishekr/distributed-task-queue-simulator/actions/workflows/ci.yml)
[![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Vite%20%2B%20TypeScript-blue)](https://react.dev/)
[![Tests](https://img.shields.io/badge/tests-Vitest%20%2B%20RTL-green)]()

> 🚀 **[Live Demo](https://abhishekr.github.io/distributed-task-queue-simulator/)**

![Demo Placeholder](./docs/demo.gif) <!-- Replace with actual GIF or view [docs/showcase.md](./docs/showcase.md) for detailed walkthrough -->

---

## Table of Contents

- [Why I Built This](#why-i-built-this)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Performance](#performance)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Lessons Learned](#lessons-learned)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## Why I Built This

Traditional tutorials explain distributed queues with static diagrams. I wanted to build something **interactive, observable, and visually engaging** — a simulator that lets you _feel_ the behavior of a distributed system:

- What happens when workers are saturated?
- How does backpressure protect the queue?
- What does a circuit breaker look like in real-time?
- How do retries and exponential backoff affect throughput?

This project is both a **learning tool** and a **portfolio piece** demonstrating senior frontend engineering skills: architecture design, performance optimization, accessibility, testing, and CI/CD.

---

## Features

### 🎛️ Core Simulation Engine

- **Event-Driven Architecture**: Custom `EventBus` pub/sub system decouples the engine from the UI.
- **Multi-Queue System**: Main Queue (FIFO + priority), Retry Queue (with exponential backoff), and Dead Letter Queue (DLQ).
- **Worker Pool**: Configurable number of workers with simulated async task processing.
- **Failure Injection**: Adjustable failure probability and variable task durations.
- **Auto-Pause**: Simulation automatically pauses when all tasks are completed.

### ⚡ Advanced Features

- **Web Worker Engine**: The entire scheduler loop runs off the main thread, keeping the UI at 60fps.
- **Circuit Breaker Simulation**: Workers become "unhealthy" after consecutive failures and auto-recover after a cooldown.
- **Backpressure Visualization**: Visual alerts when the producer drops tasks due to queue capacity limits.
- **Priority Lanes**: See high, medium, and low priority tasks distributed across the queue.
- **Batch Jobs**: Simulate batch tasks that spawn sub-tasks upon completion.
- **Time-Travel Debugging**: Save up to 120 snapshots and scrub backward/forward through simulation history.
- **Worker Profiles**: Fast, slow, normal, and unreliable workers with distinct behavioral characteristics.
- **Dynamic Load Balancing**: Switch between Round Robin, Least Connections, and Random strategies in real-time.

### 📊 Observability & Monitoring

- **Live Metrics Panel**: Queue depth, active workers, tasks/sec, success/failure/retry counts, failure rate.
- **Sparkline Charts**: Canvas-based mini charts showing historical trends for every metric.
- **Latency Percentiles**: Real-time p50, p95, and p99 latency tracking.
- **Worker Utilization Heatmap**: Per-worker status history (busy, idle, unhealthy).
- **Bottleneck Detection**: Automatically highlights whether the producer, queue, or workers are the bottleneck.
- **DLQ Inspector**: Modal view with failure reason breakdown and dead task details.
- **Export/Import State**: Save simulation snapshots as JSON and restore them later.

### 🎨 Developer Experience & Polish

- **Keyboard Shortcuts**: `Space` (play/pause), `R` (reset), `1/2/3/4` (add 1/10/100/1000 tasks).
- **Simulation Presets**: One-click "Steady State", "Traffic Spike", "Chaos Mode", "Zero Failure".
- **Shareable URLs**: Current configuration is encoded in query params — share your exact setup.
- **Fullscreen Demo Mode**: Optimized layout for presentations and screen recordings.
- **Audio Feedback**: Optional UI sounds for completions and failures (with user consent).
- **Virtualized Task Table**: `@tanstack/react-virtual` enables smooth rendering of 10,000+ tasks.
- **Toast Notifications**: Real-time event notifications with action buttons.

### ♿ Architecture & Quality

- **Code Splitting**: Heavy panels (Metrics, Task Table, Event Log, DLQ) are lazy-loaded.
- **Accessibility**: ARIA labels, roles, focus management, skip links, and `prefers-reduced-motion` support.
- **PWA Support**: Offline-capable with a service worker, manifest, and installable icons.
- **Storybook**: Component documentation and isolated development environment.
- **Test Suite**: Vitest + React Testing Library for engine logic and UI components.
- **CI/CD**: GitHub Actions workflow for lint, typecheck, test, build, and GitHub Pages deployment.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                    UI Layer                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   TopBar    │  │Visualization│  │ MetricsPanel│  │ Task Table / Events │ │
│  │  (controls) │  │  (pipeline) │  │  (charts)   │  │   (virtualized)     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                    │                                         │
│                              Zustand Store                                   │
│                         (single source of truth)                             │
│                                    │                                         │
│                         useSimulation Hook                                   │
│                    (bridges worker messages to React)                        │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │  postMessage (every 100ms)
┌────────────────────────────────────▼────────────────────────────────────────┐
│                               Web Worker                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────────┐  │
│  │ EventBus │───→│ Scheduler│───→│ Workers  │───→│  TaskQueue System    │  │
│  │ (pub/sub)│    │(100ms tick)│   │(async)   │    │ Main / Retry / DLQ   │  │
│  └────┬─────┘    └──────────┘    └──────────┘    └──────────────────────┘  │
│       │                                                                      │
│       └────────────────→ Events: TASK_CREATED, TASK_COMPLETED,              │
│                          TASK_FAILED, SYSTEM_OVERLOAD,                       │
│                          BACKPRESSURE_APPLIED, WORKER_UNHEALTHY              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Metrics Engine: computes queue depth, TPS, latency percentiles,    │    │
│  │  worker utilization, and bottleneck detection on every tick.        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Strict Separation of Concerns**: The engine is pure TypeScript with zero React dependencies.
2. **State as a Single Source of Truth**: Zustand store holds all simulation state; UI components are purely presentational.
3. **Performance First**: Web Worker keeps the main thread free. Task IDs (not objects) are stored in queues. The task table uses virtualized rendering.
4. **Observable by Default**: Every significant state change emits an event, making the system fully debuggable.

---

## Tech Stack

| Category      | Tools                                            |
| ------------- | ------------------------------------------------ |
| **Framework** | React 19, Vite 8, TypeScript 5.9                 |
| **Routing**   | TanStack Router (file-based, type-safe)          |
| **State**     | Zustand                                          |
| **Styling**   | Tailwind CSS v4                                  |
| **Animation** | Framer Motion                                    |
| **Testing**   | Vitest, React Testing Library, jsdom, Playwright |
| **Docs**      | Storybook 10                                     |
| **Quality**   | ESLint, Prettier, Husky, lint-staged             |
| **CI/CD**     | GitHub Actions                                   |

---

## Performance

Recorded on Chrome 123, M2 MacBook Air:

| Metric                                       | Result              |
| -------------------------------------------- | ------------------- |
| UI frame rate (1,000 active tasks)           | **60 fps**          |
| UI frame rate (10,000 active tasks)          | **58–60 fps**       |
| Time to add 10,000 tasks                     | **~120 ms**         |
| Task table render (10,000 rows, virtualized) | **< 16 ms**         |
| Initial bundle load                          | **~310 KB gzipped** |
| Memory at idle                               | **~18 MB**          |
| Memory with 10,000 tasks                     | **~45 MB**          |
| Worker state broadcast frequency             | **100 ms**          |

### Performance Optimizations

- **Web Worker**: The scheduler loop never blocks the main thread.
- **Queue ID references**: Queues store only task IDs; full objects live in a single `Map<string, Task>` for O(1) lookup.
- **Virtualized rendering**: `@tanstack/react-virtual` renders only visible task rows.
- **Incremental metrics**: Computed inside the engine every tick rather than derived in React.
- **Code splitting**: Heavy panels (Metrics, Task Table, Event Log, DLQ) are lazy-loaded to reduce initial bundle size.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/abhishekr/distributed-task-queue-simulator.git
cd distributed-task-queue-simulator

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

### Available Scripts

| Script                 | Description                         |
| ---------------------- | ----------------------------------- |
| `pnpm dev`             | Start Vite dev server               |
| `pnpm build`           | Type-check and build for production |
| `pnpm preview`         | Preview the production build        |
| `pnpm lint`            | Run ESLint                          |
| `pnpm lint:fix`        | Run ESLint with auto-fix            |
| `pnpm format`          | Format code with Prettier           |
| `pnpm typecheck`       | Run TypeScript type checking        |
| `pnpm test`            | Run Vitest unit tests               |
| `pnpm storybook`       | Start Storybook dev server          |
| `pnpm build-storybook` | Build Storybook for deployment      |

---

## Project Structure

```
src/
├── components/           # React UI components
├── engine/               # Pure TypeScript simulation engine
│   ├── eventBus.ts
│   ├── scheduler.ts
│   ├── simulation.ts
│   ├── task.ts
│   ├── queue.ts
│   └── worker.ts
├── hooks/                # React hooks (useSimulation, useTheme, etc.)
├── routes/               # TanStack Router file-based routes
├── store/                # Zustand store
├── stories/              # Storybook stories
├── types/                # Shared TypeScript types
├── workers/              # Web Worker entry point
├── index.css
└── main.tsx
public/
├── manifest.json         # PWA manifest
├── sw.js                 # Service worker
└── icon-*.png            # PWA icons
.github/
└── workflows/
    └── ci.yml            # GitHub Actions CI/CD
```

---

## Testing

The project includes a comprehensive test suite covering both engine logic and UI components:

```bash
# Run all unit tests
pnpm test

# Run with UI mode
pnpm vitest --ui
```

### Engine Tests

- `simulation.test.ts` — Engine initialization, task processing, backpressure, latency percentiles
- `scheduler.test.ts` — Worker assignment, retry logic, circuit breaker, idle auto-pause
- `queue.test.ts` — FIFO ordering, priority insertion, retry delays
- `eventBus.test.ts` — Pub/sub event emission and wildcard listeners
- `worker.test.ts` — Worker creation and task processing outcomes

### Component Tests

- `TopBar.test.tsx` — Play/pause states, add task buttons
- `BottleneckAlert.test.tsx` — Rendering for different bottleneck stages

---

## CI/CD

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request:

1. **Install** dependencies with pnpm
2. **Lint** with ESLint
3. **Type-check** with TypeScript
4. **Build** the production bundle
5. **Test** with Vitest
6. **Deploy** to GitHub Pages (on `main` branch only)

Pre-commit hooks (Husky + lint-staged) ensure that every commit passes formatting and linting checks locally.

---

## Lessons Learned

### 1. Event-Driven Frontends Are Powerful

Modeling the frontend as an event-driven system (like a real distributed backend) made the architecture incredibly flexible. The UI simply subscribes to events — adding new visualizations or notifications requires zero changes to the engine.

### 2. Web Workers Are Essential for Simulation

Running the scheduler loop on the main thread caused frame drops during heavy load. Moving the engine to a Web Worker immediately solved this, but required careful message-passing design to avoid re-rendering too frequently.

### 3. Stabilize Hook Return Values

A subtle bug occurred because `useAudioFeedback` returned a new object literal every render. This destabilized a `useEffect` that recreated the Web Worker on every frame, causing an infinite loop. Wrapping the return in `useMemo` fixed it.

### 4. Reference Equality Matters for URL Sync

Similarly, `useShareableUrl` was updating `window.history` on every state tick because the config object was freshly cloned each time. Comparing the serialized query string before calling `replaceState` eliminated URL bar thrashing.

### 5. Accessibility Is Not an Afterthought

Adding ARIA labels, focus management, and reduced-motion support early in development was much easier than retrofitting them later. The skip link and keyboard shortcuts also improved the experience for power users.

---

## Future Enhancements

- [ ] **Weighted Fair Queuing**: Simulate more advanced queue scheduling algorithms.
- [ ] **Metrics Persistence**: Store long-term metrics in IndexedDB for trend analysis.
- [ ] **Custom Task Shapes**: Allow users to define task duration distributions (normal, exponential, bimodal).
- [ ] **Multi-Region Simulation**: Simulate latency between producers, queues, and workers in different regions.
- [ ] **Replay Mode**: Record and replay entire simulation sessions.

---

## License

[MIT](LICENSE)

---

Built with 💙 by [Abhishek R](https://github.com/abhishekr)
