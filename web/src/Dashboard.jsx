import React, { useEffect, useMemo, useState } from 'react'
import { Bar, Pie, Line } from 'react-chartjs-2'
import 'chart.js/auto'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-US')

function formatMetricValue(metric) {
  if (!metric) return '—'
  const value = metric.value ?? 0
  switch (metric.type) {
    case 'currency':
      return currencyFormatter.format(value)
    case 'percentage':
      return `${Math.round(value)}%`
    case 'days':
      return `${Number(value).toFixed(1)} days`
    default:
      return numberFormatter.format(Math.round(value))
  }
}

function formatTargetValue(value, type) {
  if (type === 'currency') return currencyFormatter.format(value)
  if (type === 'percentage') return `${Math.round(value)}%`
  if (type === 'days') return `${Number(value).toFixed(1)} days`
  return numberFormatter.format(Math.round(value))
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/dashboard/ceo')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load dashboard data')
        }
        return response.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  const funnelChart = useMemo(() => {
    if (!data?.funnel) return null
    return {
      labels: ['Leads', 'Contacted', 'Demos', 'Proposals', 'Converted'],
      datasets: [
        {
          label: 'Pipeline volume',
          data: [
            data.funnel.leads,
            data.funnel.contacted,
            data.funnel.demos,
            data.funnel.proposals,
            data.funnel.converted,
          ],
          backgroundColor: '#4f46e5',
          borderRadius: 6,
        },
      ],
    }
  }, [data])

  const revenueChart = useMemo(() => {
    if (!data?.revenueByQuarter) return null
    return {
      labels: data.revenueByQuarter.labels,
      datasets: [
        {
          label: 'Closed revenue',
          data: data.revenueByQuarter.data,
          fill: true,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          tension: 0.35,
        },
      ],
    }
  }, [data])

  const topProductsChart = useMemo(() => {
    if (!data?.topProducts) return null
    return {
      labels: data.topProducts.map((product) => product.product),
      datasets: [
        {
          data: data.topProducts.map((product) => product.quantity),
          backgroundColor: ['#f97316', '#22c55e', '#0ea5e9', '#8b5cf6', '#f43f5e'],
        },
      ],
    }
  }, [data])

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  if (!data) {
    return <div className="loading">Loading executive insights…</div>
  }

  return (
    <div className="dashboard">
      <section className="summary-grid">
        {(data.summary || []).map((metric) => (
          <div className="summary-card" key={metric.id}>
            <span className="label">{metric.label}</span>
            <span className="value">{formatMetricValue(metric)}</span>
          </div>
        ))}
      </section>

      <div className="panel-grid two-column">
        <section className="panel chart-panel">
          <div className="panel-header">
            <h2>Sales Funnel</h2>
            <span className="panel-subtitle">Conversion progress across the quarter</span>
          </div>
          {funnelChart && <Bar data={funnelChart} options={{ plugins: { legend: { display: false } } }} />}
        </section>

        <section className="panel chart-panel">
          <div className="panel-header">
            <h2>Quarterly Revenue</h2>
            <span className="panel-subtitle">Closed business by fiscal quarter</span>
          </div>
          {revenueChart && <Line data={revenueChart} options={{ plugins: { legend: { display: false } } }} />}
        </section>
      </div>

      <div className="panel-grid two-column">
        <section className="panel chart-panel">
          <div className="panel-header">
            <h2>Top Products</h2>
            <span className="panel-subtitle">Contribution by quantity sold</span>
          </div>
          {topProductsChart && <Pie data={topProductsChart} />}
        </section>

        <section className="panel list-panel">
          <div className="panel-header">
            <h2>Target Attainment</h2>
            <span className="panel-subtitle">Progress against CEO-level targets</span>
          </div>
          <ul className="target-list">
            {(data.targetAttainment || []).map((target) => {
              const pct = Math.min(100, Math.round((target.attainment || 0) * 100))
              return (
                <li className="target-row" key={target.id}>
                  <div className="target-header">
                    <span>{target.metric}</span>
                    <span className="target-percent">{pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-value" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="target-footnote">
                    <span>Target: {formatTargetValue(target.target, target.type)}</span>
                    <span>Actual: {formatTargetValue(target.actual, target.type)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section className="panel task-panel">
        <div className="panel-header">
          <h2>Strategic Task Execution</h2>
          <span className="panel-subtitle">In-flight initiatives tracked by the revenue office</span>
        </div>
        <div className="task-metrics">
          <div className="task-card">
            <span className="label">Open</span>
            <span className="value">{numberFormatter.format(data.taskStatus?.open || 0)}</span>
          </div>
          <div className="task-card">
            <span className="label">Completed</span>
            <span className="value">{numberFormatter.format(data.taskStatus?.completed || 0)}</span>
          </div>
        </div>
      </section>

      <section className="panel table-panel">
        <div className="panel-header">
          <h2>Executive Team Performance</h2>
          <span className="panel-subtitle">Closed revenue and pipeline by operating leader</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Executive</th>
              <th>Closed Revenue</th>
              <th>Closed Deals</th>
              <th>Open Pipeline</th>
            </tr>
          </thead>
          <tbody>
            {(data.teamPerformance || []).map((leader) => (
              <tr key={leader.ownerId}>
                <td>{leader.name}</td>
                <td>{currencyFormatter.format(leader.revenue || 0)}</td>
                <td>{numberFormatter.format(leader.closedDeals || 0)}</td>
                <td>{currencyFormatter.format(leader.openPipeline || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
