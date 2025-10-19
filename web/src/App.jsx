import { useEffect, useState } from 'react'
import './styles.css'

function formatMetricValue(metric) {
  if (metric.units === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(metric.value)
  }
  if (metric.units === 'percent') {
    return `${metric.value.toFixed(1)}%`
  }
  if (metric.units === 'deals') {
    return `${metric.value} deals`
  }
  if (metric.units === 'out of 5') {
    return metric.value.toFixed(1)
  }
  return metric.value
}

function MetricCard({ metric }) {
  const direction = metric.trend === 'up' ? 'metric-card__delta--up' : metric.trend === 'down' ? 'metric-card__delta--down' : ''
  const prefix = metric.trend === 'up' ? '▲' : metric.trend === 'down' ? '▼' : ''

  return (
    <article className="metric-card">
      <h3>{metric.label}</h3>
      <p className="metric-card__value">{formatMetricValue(metric)}</p>
      <p className={`metric-card__delta ${direction}`}>
        {prefix} {Math.abs(metric.change).toFixed(1)}%
      </p>
    </article>
  )
}

function ActivityItem({ activity }) {
  return (
    <li className="activity-item">
      <div>
        <p className="activity-item__user">{activity.user}</p>
        <p className="activity-item__description">{activity.description}</p>
      </div>
      <span className="activity-item__time">{activity.relativeTime}</span>
    </li>
  )
}

function TeamCard({ team }) {
  return (
    <li className="team-card">
      <h4>{team.name}</h4>
      <p>{team.focus}</p>
      <span className={`team-card__status team-card__status--${team.health.replace(/[^a-z-]/gi, '')}`}>
        {team.health.replace('-', ' ')}
      </span>
    </li>
  )
}

export default function App() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    fetch('/api/metrics')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        return response.json()
      })
      .then((data) => setState({ status: 'ready', data, error: null }))
      .catch((error) => setState({ status: 'error', data: null, error: error.message }))
  }, [])

  if (state.status === 'loading') {
    return (
      <main className="app">
        <header className="app__header">
          <h1>Loading dashboard…</h1>
          <p>Please wait while we fetch the latest metrics.</p>
        </header>
      </main>
    )
  }

  if (state.status === 'error') {
    return (
      <main className="app">
        <header className="app__header">
          <h1>Something went wrong</h1>
          <p className="app__error">{state.error}</p>
        </header>
      </main>
    )
  }

  const { headline, metrics, activities, team } = state.data

  return (
    <main className="app">
      <header className="app__header">
        <h1>{headline.title}</h1>
        <p>{headline.subtitle}</p>
      </header>

      <section className="metric-grid" aria-label="Key metrics">
        {metrics.map((metric) => (
          <MetricCard metric={metric} key={metric.id} />
        ))}
      </section>

      <section className="app__content">
        <article className="activities" aria-label="Recent activity">
          <h2>Recent activity</h2>
          <ul>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </ul>
        </article>

        <article className="team" aria-label="Team focus">
          <h2>Team focus</h2>
          <ul>
            {team.map((member) => (
              <TeamCard key={member.id} team={member} />
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}
