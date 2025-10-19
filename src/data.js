const dayFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

function createActivities(now = Date.now()) {
  const DAY = 24 * 60 * 60 * 1000
  const entries = [
    { id: 'activity-1', user: 'Alex Chen', description: 'Closed a new annual deal with Globex Manufacturing', daysAgo: 1 },
    { id: 'activity-2', user: 'Skylar Reed', description: 'Scheduled onboarding workshop for Vandelay Imports', daysAgo: 2 },
    { id: 'activity-3', user: 'Drew Miller', description: 'Shared demo recording with Initech stakeholders', daysAgo: 3 },
    { id: 'activity-4', user: 'Harper Singh', description: 'Flagged renewal risk for Hooli support contract', daysAgo: 5 },
  ]

  return entries.map((entry) => {
    const time = new Date(now - entry.daysAgo * DAY)
    const rel = dayFormatter.format(-entry.daysAgo, 'day')
    return {
      id: entry.id,
      user: entry.user,
      description: entry.description,
      occurredAt: time.toISOString(),
      relativeTime: rel,
    }
  })
}

function getDashboardData(now = Date.now()) {
  return {
    headline: {
      title: 'Acme Growth Dashboard',
      subtitle: 'A lightweight example showing a Node.js API paired with a React frontend',
    },
    metrics: [
      {
        id: 'revenue',
        label: 'Monthly Recurring Revenue',
        value: 125000,
        units: 'USD',
        change: 12.4,
        trend: 'up',
      },
      {
        id: 'pipeline',
        label: 'Open Pipeline',
        value: 18,
        units: 'deals',
        change: 3,
        trend: 'up',
      },
      {
        id: 'churn',
        label: 'Net Revenue Retention',
        value: 97.2,
        units: 'percent',
        change: -1.1,
        trend: 'down',
      },
      {
        id: 'satisfaction',
        label: 'Customer Satisfaction',
        value: 4.6,
        units: 'out of 5',
        change: 0.2,
        trend: 'up',
      },
    ],
    team: [
      { id: 'team-1', name: 'Sales', focus: 'New business', health: 'on-track' },
      { id: 'team-2', name: 'Success', focus: 'Customer onboarding', health: 'needs-attention' },
      { id: 'team-3', name: 'Support', focus: 'Issue resolution', health: 'on-track' },
    ],
    activities: createActivities(now),
    generatedAt: new Date(now).toISOString(),
  }
}

module.exports = { getDashboardData }
