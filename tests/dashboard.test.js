const test = require('node:test')
const assert = require('node:assert/strict')
const { createServer } = require('../src/server')

function requestJson(server, path) {
  const address = server.address()
  const url = `http://127.0.0.1:${address.port}${path}`
  return fetch(url).then((response) => {
    return response.json().then((body) => ({ status: response.status, body }))
  })
}

test('GET /api/dashboard/ceo returns analytics snapshot', async (t) => {
  const server = createServer()
  await new Promise((resolve) => server.listen(0, resolve))

  t.after(() => new Promise((resolve) => server.close(resolve)))

  const { status, body } = await requestJson(server, '/api/dashboard/ceo')

  assert.equal(status, 200)
  assert.ok(Array.isArray(body.summary))
  assert.ok(body.summary.find((metric) => metric.id === 'pipeline'))
  assert.ok(body.funnel)
  assert.ok(body.funnel.converted > 0)
  assert.ok(Array.isArray(body.topProducts) && body.topProducts.length > 0)
  assert.ok(body.revenueByQuarter?.labels?.length === body.revenueByQuarter?.data?.length)
  assert.ok(Array.isArray(body.teamPerformance) && body.teamPerformance.length > 0)
  assert.ok(typeof body.taskStatus?.open === 'number')
  assert.ok(Array.isArray(body.targetAttainment) && body.targetAttainment.length > 0)
})
