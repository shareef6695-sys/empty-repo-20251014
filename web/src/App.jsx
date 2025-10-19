import React from 'react'
import Dashboard from './Dashboard'

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>CRM — CEO Dashboard</h1>
        <p className="subtitle">Real-time view of pipeline health, revenue momentum, and strategic execution.</p>
      </header>
      <main>
        <Dashboard />
      </main>
    </div>
  )
}
