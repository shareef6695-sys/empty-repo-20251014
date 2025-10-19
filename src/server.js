const http = require('http')
const path = require('path')
const fsPromises = require('fs/promises')
const db = require('./db')

const PORT = process.env.PORT || 3000
const STATIC_ROOT = path.resolve(__dirname, '..', 'web', 'dist')
const DEV_INDEX = path.resolve(__dirname, '..', 'web', 'index.html')
const staticCache = new Map()

function parsePayload(payload) {
  if (!payload) return {}
  if (typeof payload !== 'string') return payload
  try {
    return JSON.parse(payload)
  } catch (err) {
    return {}
  }
}

function seedDatabase() {
  db.init()
  const leadCount = db.all('SELECT COUNT(*) as c FROM leads', {})[0]?.c || 0
  if (leadCount > 0) {
    return
  }

  const companyId = 'acme-co'
  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000

  db.run(
    'INSERT INTO companies (id, name, data) VALUES (@id, @name, @data)',
    {
      id: companyId,
      name: 'Acme Corporation',
      data: JSON.stringify({ industry: 'SaaS', headcount: 1200, hq: 'San Francisco' }),
    }
  )

  const leads = [
    {
      id: 'lead-1',
      customer: 'Globex Manufacturing',
      status: 'won',
      createdAt: now - DAY * 120,
      ownerId: 'rep-alex',
      ownerName: 'Alex Chen',
      source: 'Inbound',
      dealValue: 180000,
    },
    {
      id: 'lead-2',
      customer: 'Initech',
      status: 'proposal',
      createdAt: now - DAY * 45,
      ownerId: 'rep-skylar',
      ownerName: 'Skylar Reed',
      source: 'Outbound',
      dealValue: 95000,
    },
    {
      id: 'lead-3',
      customer: 'Hooli',
      status: 'demo',
      createdAt: now - DAY * 30,
      ownerId: 'rep-drew',
      ownerName: 'Drew Miller',
      source: 'Partner',
      dealValue: 125000,
    },
    {
      id: 'lead-4',
      customer: 'Stark Industries',
      status: 'contacted',
      createdAt: now - DAY * 20,
      ownerId: 'rep-alex',
      ownerName: 'Alex Chen',
      source: 'Event',
      dealValue: 210000,
    },
    {
      id: 'lead-5',
      customer: 'Vandelay Imports',
      status: 'won',
      createdAt: now - DAY * 75,
      ownerId: 'rep-skylar',
      ownerName: 'Skylar Reed',
      source: 'Referral',
      dealValue: 132000,
    },
    {
      id: 'lead-6',
      customer: 'Massive Dynamic',
      status: 'proposal',
      createdAt: now - DAY * 55,
      ownerId: 'rep-drew',
      ownerName: 'Drew Miller',
      source: 'Inbound',
      dealValue: 168000,
    },
    {
      id: 'lead-7',
      customer: 'Wonka Industries',
      status: 'demo',
      createdAt: now - DAY * 18,
      ownerId: 'rep-alex',
      ownerName: 'Alex Chen',
      source: 'Partner',
      dealValue: 87000,
    },
    {
      id: 'lead-8',
      customer: 'Cyberdyne Systems',
      status: 'new',
      createdAt: now - DAY * 10,
      ownerId: 'rep-skylar',
      ownerName: 'Skylar Reed',
      source: 'Outbound',
      dealValue: 205000,
    },
    {
      id: 'lead-9',
      customer: 'Vought International',
      status: 'contacted',
      createdAt: now - DAY * 22,
      ownerId: 'rep-drew',
      ownerName: 'Drew Miller',
      source: 'Inbound',
      dealValue: 142000,
    },
    {
      id: 'lead-10',
      customer: 'Tyrell Corporation',
      status: 'proposal',
      createdAt: now - DAY * 65,
      ownerId: 'rep-alex',
      ownerName: 'Alex Chen',
      source: 'Referral',
      dealValue: 188000,
    },
  ]

  leads.forEach((lead) => {
    db.run(
      'INSERT INTO leads (id, companyId, customer, status, createdAt, data) VALUES (@id, @companyId, @customer, @status, @createdAt, @data)',
      {
        id: lead.id,
        companyId,
        customer: lead.customer,
        status: lead.status,
        createdAt: lead.createdAt,
        data: JSON.stringify({
          ownerId: lead.ownerId,
          ownerName: lead.ownerName,
          source: lead.source,
          dealValue: lead.dealValue,
        }),
      }
    )
  })

  const sales = [
    {
      id: 'sale-1',
      leadId: 'lead-1',
      ownerId: 'rep-alex',
      ownerName: 'Alex Chen',
      customer: 'Globex Manufacturing',
      value: 180000,
      createdAt: now - DAY * 90,
      product: 'Enterprise CRM',
      quantity: 3,
    },
    {
      id: 'sale-2',
      leadId: 'lead-5',
      ownerId: 'rep-skylar',
      ownerName: 'Skylar Reed',
      customer: 'Vandelay Imports',
      value: 132000,
      createdAt: now - DAY * 60,
      product: 'Revenue Intelligence',
      quantity: 2,
    },
    {
      id: 'sale-3',
      leadId: 'lead-1',
      ownerId: 'rep-alex',
      ownerName: 'Alex Chen',
      customer: 'Globex Manufacturing',
      value: 76000,
      createdAt: now - DAY * 42,
      product: 'Customer Data Platform',
      quantity: 4,
    },
    {
      id: 'sale-4',
      leadId: 'lead-5',
      ownerId: 'rep-skylar',
      ownerName: 'Skylar Reed',
      customer: 'Vandelay Imports',
      value: 54000,
      createdAt: now - DAY * 30,
      product: 'Enterprise CRM',
      quantity: 2,
    },
    {
      id: 'sale-5',
      leadId: 'lead-1',
      ownerId: 'rep-alex',
      ownerName: 'Alex Chen',
      customer: 'Globex Manufacturing',
      value: 98000,
      createdAt: now - DAY * 10,
      product: 'AI Forecasting Add-on',
      quantity: 5,
    },
  ]

  sales.forEach((sale) => {
    db.run(
      'INSERT INTO sales (id, leadId, ownerId, customer, value, createdAt, data) VALUES (@id, @leadId, @ownerId, @customer, @value, @createdAt, @data)',
      {
        id: sale.id,
        leadId: sale.leadId,
        ownerId: sale.ownerId,
        customer: sale.customer,
        value: sale.value,
        createdAt: sale.createdAt,
        data: JSON.stringify({
          product: sale.product,
          quantity: sale.quantity,
          ownerName: sale.ownerName,
        }),
      }
    )
  })

  const tasks = [
    { id: 'task-1', title: 'Finalize renewal paperwork — Globex', status: 'completed', ownerId: 'rep-alex', createdAt: now - DAY * 14 },
    { id: 'task-2', title: 'Schedule executive briefing — Initech', status: 'in-progress', ownerId: 'rep-skylar', createdAt: now - DAY * 7 },
    { id: 'task-3', title: 'Prepare custom pricing — Massive Dynamic', status: 'open', ownerId: 'rep-drew', createdAt: now - DAY * 3 },
    { id: 'task-4', title: 'Confirm security review — Cyberdyne', status: 'open', ownerId: 'rep-skylar', createdAt: now - DAY },
  ]

  tasks.forEach((task) => {
    db.run(
      'INSERT INTO tasks (id, title, status, ownerId, createdAt) VALUES (@id, @title, @status, @ownerId, @createdAt)',
      {
        id: task.id,
        title: task.title,
        status: task.status,
        ownerId: task.ownerId,
        createdAt: task.createdAt,
      }
    )
  })

  const targets = [
    { id: 'target-1', companyId, branchId: null, metric: 'quarterly-revenue', value: 450000, ownerId: 'ceo' },
    { id: 'target-2', companyId, branchId: null, metric: 'new-logos', value: 15, ownerId: 'ceo' },
  ]

  targets.forEach((target) => {
    db.run(
      'INSERT INTO targets (id, companyId, branchId, metric, value, ownerId) VALUES (@id, @companyId, @branchId, @metric, @value, @ownerId)',
      {
        id: target.id,
        companyId: target.companyId,
        branchId: target.branchId,
        metric: target.metric,
        value: target.value,
        ownerId: target.ownerId,
      }
    )
  })
}

seedDatabase()

function buildDashboardPayload() {
  const DAY = 24 * 60 * 60 * 1000
  const stageWeights = {
    new: 0.1,
    contacted: 0.25,
    demo: 0.5,
    proposal: 0.75,
    won: 1,
  }

  const leads = db.all('SELECT * FROM leads', {})
  const sales = db.all('SELECT * FROM sales', {})
  const tasks = db.all('SELECT * FROM tasks', {})
  const targets = db.all('SELECT * FROM targets', {})

  const leadById = new Map()
  const ownerStats = new Map()
  let weightedPipeline = 0

  leads.forEach((lead) => {
    leadById.set(lead.id, lead)
    const payload = parsePayload(lead.data)
    const dealValue = payload.dealValue || 0
    const weight = stageWeights[lead.status] ?? 0
    weightedPipeline += dealValue * weight

    const ownerId = payload.ownerId || 'unassigned'
    const ownerName = payload.ownerName || ownerId
    if (!ownerStats.has(ownerId)) {
      ownerStats.set(ownerId, {
        ownerId,
        name: ownerName,
        closedDeals: 0,
        revenue: 0,
        openPipeline: 0,
      })
    }
    if (lead.status !== 'won') {
      ownerStats.get(ownerId).openPipeline += dealValue * weight
    }
  })

  const funnel = {
    leads: leads.length,
    contacted: leads.filter((lead) => ['contacted', 'demo', 'proposal', 'won'].includes(lead.status)).length,
    demos: leads.filter((lead) => ['demo', 'proposal', 'won'].includes(lead.status)).length,
    proposals: leads.filter((lead) => ['proposal', 'won'].includes(lead.status)).length,
    converted: leads.filter((lead) => lead.status === 'won').length,
  }

  let totalRevenue = 0
  const productTotals = new Map()
  const quarterTotals = new Map()
  const cycleDurations = []

  sales.forEach((sale) => {
    const metadata = parsePayload(sale.data)
    totalRevenue += sale.value || 0

    const product = metadata.product || 'Unknown'
    const quantity = metadata.quantity || 1
    productTotals.set(product, (productTotals.get(product) || 0) + quantity)

    const ownerId = sale.ownerId || metadata.ownerId || 'unassigned'
    const ownerName = metadata.ownerName || ownerStats.get(ownerId)?.name || ownerId
    if (!ownerStats.has(ownerId)) {
      ownerStats.set(ownerId, {
        ownerId,
        name: ownerName,
        closedDeals: 0,
        revenue: 0,
        openPipeline: 0,
      })
    }
    const owner = ownerStats.get(ownerId)
    owner.closedDeals += 1
    owner.revenue += sale.value || 0

    if (sale.leadId && leadById.has(sale.leadId)) {
      const lead = leadById.get(sale.leadId)
      if (lead.createdAt && sale.createdAt && sale.createdAt >= lead.createdAt) {
        cycleDurations.push((sale.createdAt - lead.createdAt) / DAY)
      }
    }

    const date = new Date(sale.createdAt || Date.now())
    const year = date.getUTCFullYear()
    const quarter = Math.floor(date.getUTCMonth() / 3) + 1
    const key = `${year}-Q${quarter}`
    if (!quarterTotals.has(key)) {
      quarterTotals.set(key, { key, label: `Q${quarter} ${year}`, revenue: 0 })
    }
    quarterTotals.get(key).revenue += sale.value || 0
  })

  const avgCycle = cycleDurations.length
    ? parseFloat((cycleDurations.reduce((sum, days) => sum + days, 0) / cycleDurations.length).toFixed(1))
    : 0

  const topProducts = Array.from(productTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([product, quantity]) => ({ product, quantity }))

  const revenueByQuarter = Array.from(quarterTotals.values()).sort((a, b) => a.key.localeCompare(b.key))

  const openTasks = tasks.filter((task) => task.status !== 'completed').length
  const completedTasks = tasks.filter((task) => task.status === 'completed').length

  const winRate = funnel.leads ? (funnel.converted / funnel.leads) * 100 : 0
  const averageDealSize = sales.length ? totalRevenue / sales.length : 0

  const summary = [
    { id: 'pipeline', label: 'Weighted Pipeline', value: weightedPipeline, type: 'currency' },
    { id: 'revenue', label: 'Closed Revenue YTD', value: totalRevenue, type: 'currency' },
    { id: 'win-rate', label: 'Win Rate', value: winRate, type: 'percentage' },
    { id: 'avg-cycle', label: 'Average Sales Cycle', value: avgCycle, type: 'days' },
    { id: 'avg-deal', label: 'Average Deal Size', value: averageDealSize, type: 'currency' },
    { id: 'open-tasks', label: 'Open Strategic Tasks', value: openTasks, type: 'number' },
  ]

  const taskStatus = { open: openTasks, completed: completedTasks }

  const latestQuarter = revenueByQuarter[revenueByQuarter.length - 1]
  const targetMeta = {
    'quarterly-revenue': { label: 'Quarterly Revenue', type: 'currency', actual: latestQuarter ? latestQuarter.revenue : 0 },
    'new-logos': { label: 'New Logos', type: 'number', actual: funnel.converted },
  }

  const targetAttainment = targets.map((target) => {
    const meta = targetMeta[target.metric] || { label: target.metric, type: 'number', actual: 0 }
    const attainment = target.value ? meta.actual / target.value : 0
    return {
      id: target.id,
      metric: meta.label,
      target: target.value,
      actual: meta.actual,
      attainment,
      type: meta.type,
    }
  })

  const teamPerformance = Array.from(ownerStats.values())
    .map((owner) => ({
      ownerId: owner.ownerId,
      name: owner.name,
      closedDeals: owner.closedDeals,
      revenue: owner.revenue,
      openPipeline: owner.openPipeline,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    summary,
    funnel,
    topProducts,
    revenueByQuarter: {
      labels: revenueByQuarter.map((entry) => entry.label),
      data: revenueByQuarter.map((entry) => entry.revenue),
    },
    teamPerformance,
    taskStatus,
    targetAttainment,
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath)
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8'
    case '.css':
      return 'text/css; charset=utf-8'
    case '.js':
      return 'application/javascript; charset=utf-8'
    case '.json':
      return 'application/json; charset=utf-8'
    case '.svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}

function isPathWithin(parent, candidate) {
  const relative = path.relative(parent, candidate)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function resolveStaticAsset(rootDir, requestPath) {
  const trimmed = requestPath.replace(/^\/+/, '')
  const resolved = path.resolve(rootDir, trimmed)
  if (!isPathWithin(rootDir, resolved)) {
    return null
  }
  return resolved
}

async function loadStaticAsset(filePath) {
  const useCache = process.env.NODE_ENV === 'production'
  if (useCache && staticCache.has(filePath)) {
    return staticCache.get(filePath)
  }

  const buffer = await fsPromises.readFile(filePath)
  const asset = { buffer, contentType: getContentType(filePath) }
  if (useCache) {
    staticCache.set(filePath, asset)
  }
  return asset
}

async function tryServeStatic(pathname, method, res) {
  const candidates = []

  if (pathname === '/' || pathname === '') {
    candidates.push(path.join(STATIC_ROOT, 'index.html'))
    candidates.push(DEV_INDEX)
  } else {
    const target = resolveStaticAsset(STATIC_ROOT, pathname)
    if (target) {
      candidates.push(target)
    }

    const hasExtension = path.extname(pathname) !== ''
    if (!hasExtension) {
      candidates.push(path.join(STATIC_ROOT, 'index.html'))
      candidates.push(DEV_INDEX)
    }
  }

  for (const candidate of candidates) {
    try {
      const asset = await loadStaticAsset(candidate)
      res.writeHead(200, { 'Content-Type': asset.contentType })
      if (method !== 'HEAD') {
        res.end(asset.buffer)
      } else {
        res.end()
      }
      return true
    } catch (err) {
      if (err && err.code === 'ENOENT') {
        continue
      }

      console.error('Error serving static asset', candidate, err)
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Internal Server Error')
      return true
    }
  }

  return false
}

function createRequestListener() {
  return async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost')
      const pathname = url.pathname

      if ((req.method === 'GET' || req.method === 'HEAD') && pathname === '/api/dashboard/ceo') {
        const payload = buildDashboardPayload()
        const headers = {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        }
        res.writeHead(200, headers)
        if (req.method === 'HEAD') {
          res.end()
        } else {
          res.end(JSON.stringify(payload))
        }
        return
      }

      if (pathname.startsWith('/api/')) {
        res.writeHead(404, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        })
        res.end(JSON.stringify({ error: 'Not found' }))
        return
      }

      if (process.env.NODE_ENV !== 'test' && (req.method === 'GET' || req.method === 'HEAD')) {
        const served = await tryServeStatic(pathname, req.method, res)
        if (served) {
          return
        }
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not found')
    } catch (err) {
      console.error('Unhandled server error', err)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      }
      res.end('Internal Server Error')
    }
  }
}

function createServer() {
  return http.createServer(createRequestListener())
}

if (require.main === module) {
  const server = createServer()
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

module.exports = { createServer, buildDashboardPayload }
