import { useEffect, useState } from 'react'
import './styles.css'

function formatMetricValue(metric) {
  if (metric.units === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(metric.value)
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
  const direction =
    metric.trend === 'up' ? 'metric-card__delta--up' : metric.trend === 'down' ? 'metric-card__delta--down' : ''
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

function readStoredAuth() {
  if (typeof window === 'undefined') return null
  const token = window.localStorage.getItem('authToken')
  const rawUser = window.localStorage.getItem('authUser')
  if (token && rawUser) {
    try {
      const user = JSON.parse(rawUser)
      return { token, user }
    } catch (error) {
      window.localStorage.removeItem('authUser')
    }
  }
  return null
}

function storeAuth(token, user) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('authToken', token)
  window.localStorage.setItem('authUser', JSON.stringify(user))
}

function clearStoredAuth() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem('authToken')
  window.localStorage.removeItem('authUser')
}

function LoginForm({ onSubmit, submitting, error }) {
  const [email, setEmail] = useState('demo@acme.com')
  const [password, setPassword] = useState('letmein123')

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({ email, password })
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-form__field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={submitting}
        />
      </div>
      <div className="login-form__field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={submitting}
        />
      </div>
      {error ? <p className="login-form__error" role="alert">{error}</p> : null}
      <button type="submit" className="login-form__button" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

export default function App() {
  const stored = readStoredAuth()
  const [auth, setAuth] = useState(
    stored
      ? { status: 'authenticated', token: stored.token, user: stored.user }
      : { status: 'unauthenticated', token: null, user: null }
  )
  const [loginState, setLoginState] = useState({ submitting: false, error: null })
  const [dashboardState, setDashboardState] = useState(
    stored ? { status: 'loading', data: null, error: null } : { status: 'idle', data: null, error: null }
  )
  const [reloadFlag, setReloadFlag] = useState(0)

  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.token) {
      return
    }

    let cancelled = false
    setDashboardState({ status: 'loading', data: null, error: null })

    async function loadMetrics() {
      try {
        const response = await fetch('/api/metrics', {
          headers: { Authorization: `Bearer ${auth.token}` },
        })
        const text = await response.text()
        const data = text ? JSON.parse(text) : null

        if (!response.ok) {
          const message = data?.error || 'Failed to load dashboard metrics'
          const error = new Error(message)
          error.status = response.status
          throw error
        }

        if (cancelled) return

        if (data.user) {
          setAuth((previous) =>
            previous.status === 'authenticated'
              ? { ...previous, user: data.user }
              : previous
          )
          storeAuth(auth.token, data.user)
        }

        setDashboardState({ status: 'ready', data: data.dashboard, error: null })
      } catch (error) {
        if (cancelled) return
        if (error.status === 401) {
          clearStoredAuth()
          setAuth({ status: 'unauthenticated', token: null, user: null })
          setDashboardState({ status: 'idle', data: null, error: null })
          setLoginState({ submitting: false, error: 'Your session expired. Please log in again.' })
        } else {
          setDashboardState({ status: 'error', data: null, error: error.message })
        }
        }
      }

    loadMetrics()

    return () => {
      cancelled = true
    }
  }, [auth.status, auth.token, reloadFlag])

  async function handleLogin(credentials) {
    setLoginState({ submitting: true, error: null })
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      const text = await response.text()
      const data = text ? JSON.parse(text) : null

      if (!response.ok) {
        const message = data?.error || 'Unable to sign in'
        throw new Error(message)
      }

      storeAuth(data.token, data.user)
      setAuth({ status: 'authenticated', token: data.token, user: data.user })
      setLoginState({ submitting: false, error: null })
    } catch (error) {
      setLoginState({ submitting: false, error: error.message || 'Unable to sign in' })
    }
  }

  function handleLogout() {
    clearStoredAuth()
    setAuth({ status: 'unauthenticated', token: null, user: null })
    setDashboardState({ status: 'idle', data: null, error: null })
    setLoginState({ submitting: false, error: null })
  }

  if (auth.status !== 'authenticated') {
    return (
      <main className="app app--centered">
        <section className="login-card">
          <header className="login-card__header">
            <h1>Welcome back</h1>
            <p>Use the sample account to explore the growth dashboard.</p>
          </header>
          <LoginForm onSubmit={handleLogin} submitting={loginState.submitting} error={loginState.error} />
          <footer className="login-card__footer">
            <p>
              Demo credentials: <code>demo@acme.com</code> / <code>letmein123</code>
            </p>
          </footer>
        </section>
      </main>
    )
  }

  if (dashboardState.status === 'loading') {
    return (
      <main className="app app--centered">
        <section className="loading-card" role="status" aria-live="polite">
          <h1>Loading your dashboard…</h1>
          <p>Fetching the latest metrics for {auth.user?.name || 'your team'}.</p>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Log out
          </button>
        </section>
      </main>
    )
  }

  if (dashboardState.status === 'error') {
    return (
      <main className="app app--centered">
        <section className="loading-card" role="alert">
          <h1>We hit a snag</h1>
          <p className="app__error">{dashboardState.error}</p>
          <div className="error-actions">
            <button
              type="button"
              className="login-form__button"
              onClick={() => {
                setDashboardState({ status: 'loading', data: null, error: null })
                setReloadFlag((value) => value + 1)
              }}
            >
              Try again
            </button>
            <button type="button" className="logout-button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </section>
      </main>
    )
  }

  const { headline, metrics, activities, team } = dashboardState.data

  return (
    <main className="app">
      <header className="app__header app__header--with-actions">
        <div>
          <h1>{headline.title}</h1>
          <p>{headline.subtitle}</p>
        </div>
        <div className="app__user-panel">
          <div className="app__user-details">
            <p className="app__user-name">{auth.user?.name}</p>
            <p className="app__user-email">{auth.user?.email}</p>
          </div>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
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
