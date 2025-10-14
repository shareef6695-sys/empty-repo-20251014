import React, { useEffect, useState } from 'react'
import { Bar, Pie } from 'react-chartjs-2'
import 'chart.js/auto'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/dashboard/ceo')
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="error">Error: {error}</div>
  if (!data) return <div>Loading...</div>

  const funnel = data.funnel || { leads: 0, contacted: 0, demos: 0, proposals: 0, converted: 0 }
  const funnelChart = {
    labels: Object.keys(funnel),
    datasets: [{ label: 'Funnel', data: Object.values(funnel), backgroundColor: '#4f46e5' }],
  }

  const topProducts = data.topProducts || []
  const topProductsChart = {
    labels: topProducts.map((p) => p.product),
    datasets: [{ data: topProducts.map((p) => p.quantity), backgroundColor: ['#ef4444', '#f59e0b', '#10b981'] }],
  }

  return (
    <div className="dashboard">
      <section className="chart">
        <h2>Sales Funnel</h2>
        <Bar data={funnelChart} />
      </section>

      <section className="chart">
        <h2>Top Products</h2>
        <Pie data={topProductsChart} />
      </section>
    </div>
  )
}
