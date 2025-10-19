const test = require('node:test')
const assert = require('node:assert/strict')
const { createServer } = require('../src/server')

function requestJson(server, path) {
  const { port } = server.address()
  const url = `http://127.0.0.1:${port}${path}`
  return fetch(url).then(async (response) => {
    const body = await response.json()
    return { status: response.status, body, headers: response.headers }
  })
}

test('GET /api/metrics returns dashboard data for the frontend', async (t) => {
  const server = createServer()
  await new Promise((resolve) => server.listen(0, resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))

  const { status, body, headers } = await requestJson(server, '/api/metrics')

  assert.equal(status, 200)
  assert.equal(headers.get('content-type'), 'application/json; charset=utf-8')
  assert.equal(headers.get('cache-control'), 'no-store')
  assert.ok(body.headline?.title)
  assert.ok(Array.isArray(body.metrics) && body.metrics.length > 0)
  assert.ok(Array.isArray(body.activities) && body.activities.length > 0)
  assert.ok(Array.isArray(body.team) && body.team.length > 0)
  assert.ok(typeof body.generatedAt === 'string')
})
