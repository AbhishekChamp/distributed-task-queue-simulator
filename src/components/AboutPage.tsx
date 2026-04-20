import { Link } from '@tanstack/react-router'
import { ThemeToggle } from './ThemeToggle'

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <header
        role="banner"
        className="h-14 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-between px-4 shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500" aria-hidden="true" />
          <h1 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
            Distributed Task Queue Simulator
          </h1>
        </div>
        <nav aria-label="Primary navigation" className="flex items-center gap-2">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-md bg-sky-100 dark:bg-sky-600/20 text-sky-700 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-600/30 transition text-sm font-medium"
          >
            Launch Simulator
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          About This Project
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          A production-grade, browser-based simulator for distributed task queues. It demonstrates
          how real-world systems like Celery, RabbitMQ, and AWS SQS handle concurrency,
          backpressure, retries, circuit breakers, and dead-letter queues — all running at 60fps
          entirely in your browser.
        </p>

        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Why I Built This
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Most tutorials explain distributed queues with static diagrams. I wanted to build
              something interactive, observable, and visually engaging — a simulator that lets you
              <em>feel</em> the behavior of a distributed system. What happens when workers are
              saturated? How does backpressure protect the queue? What does a circuit breaker look
              like in real-time? This project answers those questions hands-on.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Architecture Highlights
            </h2>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed">
              <li>
                <strong>Web Worker Engine:</strong> The entire scheduler loop runs off the main
                thread to keep the UI buttery smooth.
              </li>
              <li>
                <strong>Event-Driven Design:</strong> A custom EventBus decouples the engine from
                the UI. Every state change emits an event.
              </li>
              <li>
                <strong>Zustand State Management:</strong> A single source of truth for all
                simulation state, with the UI remaining purely presentational.
              </li>
              <li>
                <strong>Performance Optimized:</strong> Virtualized task tables, queue ID arrays
                instead of object duplication, and incremental metric computation.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Key Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FeatureCard
                title="Multi-Queue System"
                description="Main, Retry, and Dead Letter queues with priority support and exponential backoff."
              />
              <FeatureCard
                title="Circuit Breaker"
                description="Workers become unhealthy after failures and auto-recover after cooldown."
              />
              <FeatureCard
                title="Time-Travel Debugging"
                description="Save up to 120 snapshots and scrub backward through simulation history."
              />
              <FeatureCard
                title="Live Observability"
                description="Sparklines, latency percentiles, worker heatmaps, and bottleneck detection."
              />
              <FeatureCard
                title="Load Balancing"
                description="Switch between Round Robin, Least Connections, and Random strategies on the fly."
              />
              <FeatureCard
                title="Shareable State"
                description="Every configuration is encoded in the URL for easy sharing."
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Tech Stack
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              React 19 · Vite 8 · TypeScript 5.9 · TanStack Router · Zustand · Tailwind CSS v4 ·
              Framer Motion · Vitest · React Testing Library · Storybook · GitHub Actions
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Lessons Learned
            </h2>
            <div className="space-y-3 text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                <strong>Event-driven frontends are incredibly flexible.</strong> By modeling the UI
                as a subscriber to an event stream (just like a real distributed backend), I could
                add new visualizations, notifications, and metrics without touching the engine. The
                engine emits events; the UI decides how to display them.
              </p>
              <p>
                <strong>Web Workers are essential for simulation.</strong> Running the scheduler on
                the main thread caused frame drops under load. Moving it to a worker solved this,
                but required careful message-passing to avoid excessive re-renders.
              </p>
              <p>
                <strong>Reference stability matters.</strong> A subtle bug occurred because{' '}
                <code>useAudioFeedback</code> returned a new object every render. This destabilized
                a <code>useEffect</code> that managed the Web Worker, causing infinite recreation.
                Wrapping the return in <code>useMemo</code> fixed it.
              </p>
              <p>
                <strong>Virtualization unlocks scale.</strong> Rendering 10,000 DOM rows is
                impossible without virtualization. <code>@tanstack/react-virtual</code> made the
                task table feel instant even at massive scale.
              </p>
              <p>
                <strong>Accessibility is best done early.</strong> Adding ARIA labels, focus
                management, and reduced-motion support during development was far easier than
                retrofitting. The skip link and keyboard shortcuts also improved the experience for
                power users.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Open Source
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              This project is open source and available on{' '}
              <a
                href="https://github.com/AbhishekChamp/distributed-task-queue-simulator"
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 dark:text-sky-400 hover:underline"
              >
                GitHub
              </a>
              . Feel free to explore the code, open issues, or suggest features.
            </p>
          </div>
        </section>

        <div className="mt-12 flex items-center justify-center">
          <Link
            to="/"
            className="px-6 py-3 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 transition"
          >
            Try the Simulator →
          </Link>
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  )
}
