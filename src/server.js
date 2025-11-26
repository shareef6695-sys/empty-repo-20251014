const http = require('http')
const { parse } = require('url')

// A baseline flexible PVC compound used for quick previews and documentation.
const sampleFormula = {
  name: 'Flexible PVC Cable Compound',
  batchKg: 25,
  ingredients: [
    { name: 'PVC Resin (K67)', role: 'Base Resin', phr: 100, pricePerKg: 1.2, density: 1.4 },
    { name: 'DINP Plasticizer', role: 'Plasticizer', phr: 40, pricePerKg: 1.1, density: 0.97 },
    { name: 'Ca/Zn Stabilizer', role: 'Stabilizer', phr: 4.5, pricePerKg: 2.2, density: 2.6 },
    { name: 'Calcium Carbonate', role: 'Filler', phr: 25, pricePerKg: 0.25, density: 2.7 },
    { name: 'Epoxidized Soybean Oil', role: 'Secondary Plasticizer', phr: 5, pricePerKg: 1.45, density: 0.99 },
    { name: 'Processing Aid', role: 'Processing Aid', phr: 2, pricePerKg: 2.7, density: 1.1 },
    { name: 'Titanium Dioxide', role: 'Pigment', phr: 3, pricePerKg: 3.4, density: 4.2 },
  ],
}

function calculateBlend(formulaIngredients = [], batchKg = 0) {
  const items = (formulaIngredients || []).map((item) => ({
    name: item.name || 'Unnamed Ingredient',
    role: item.role || '',
    phr: Number(item.phr) || 0,
    pricePerKg: Number(item.pricePerKg) || 0,
    density: item.density ? Number(item.density) : null,
  }))

  const totalPhr = items.reduce((sum, ing) => sum + ing.phr, 0)
  const normalizedBatch = batchKg > 0 ? batchKg : 0

  const resolved = items.map((ing) => {
    const weightKg = totalPhr > 0 ? (normalizedBatch * ing.phr) / totalPhr : 0
    const cost = weightKg * ing.pricePerKg
    const volumeL = ing.density ? weightKg / ing.density : null

    return { ...ing, weightKg, cost, volumeL }
  })

  const totals = resolved.reduce(
    (acc, ing) => {
      acc.weightKg += ing.weightKg
      acc.cost += ing.cost
      acc.volumeL += ing.volumeL || 0
      return acc
    },
    { weightKg: 0, cost: 0, volumeL: 0 }
  )

  const estimatedDensity = totals.volumeL > 0 ? totals.weightKg / totals.volumeL : null

  return {
    totalPhr,
    items: resolved,
    totals: {
      ...totals,
      costPerKg: totals.weightKg > 0 ? totals.cost / totals.weightKg : 0,
      estimatedDensity,
    },
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  })
  res.end(JSON.stringify(payload))
}

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''

    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 1e6) {
        req.destroy()
        reject(new Error('Request body too large'))
      }
    })

    req.on('end', () => {
      if (!data) {
        return resolve({})
      }

      try {
        resolve(JSON.parse(data))
      } catch (err) {
        reject(new Error('Invalid JSON payload'))
      }
    })

    req.on('error', (err) => reject(err))
  })
}

const server = http.createServer(async (req, res) => {
  const { pathname } = parse(req.url, true)

  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { status: 'ok' })
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { status: 'ok' })
  }

  if (req.method === 'GET' && pathname === '/api/compounds/samples') {
    return sendJson(res, 200, { samples: [sampleFormula] })
  }

  if (req.method === 'POST' && pathname === '/api/compounds/preview') {
    try {
      const { formula, batchKg } = await parseJsonBody(req)

      if (!formula || !Array.isArray(formula.ingredients)) {
        return sendJson(res, 400, { error: 'formula.ingredients is required' })
      }

      const calculation = calculateBlend(formula.ingredients, Number(batchKg || formula.batchKg || 0))

      return sendJson(res, 200, {
        name: formula.name || 'Custom PVC Compound',
        batchKg: Number(batchKg || formula.batchKg || 0) || 0,
        ...calculation,
      })
    } catch (err) {
      return sendJson(res, 400, { error: err.message || 'Invalid request payload' })
    }
  }

  sendJson(res, 404, { error: 'Not found' })
})

const port = process.env.PORT || 3000

if (require.main === module) {
  server.listen(port, () => {
    console.log(`PVC compound API listening on http://localhost:${port}`)
  })
}

module.exports = { server, calculateBlend, sampleFormula }
