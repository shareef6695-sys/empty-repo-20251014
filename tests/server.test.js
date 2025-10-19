const test = require('node:test')
const assert = require('node:assert/strict')
const { createServer } = require('../src/server')

function requestJson(server, path, init) {
  const { port } = server.address()
  const url = `http://127.0.0.1:${port}${path}`
  return fetch(url, init).then(async (response) => {
    const text = await response.text()
    const body = text ? JSON.parse(text) : null
    return { status: response.status, body, headers: response.headers }
  })
}

test('login is required before metrics can be retrieved', async (t) => {
  const server = createServer()
  await new Promise((resolve) => server.listen(0, resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))

  const unauthorized = await requestJson(server, '/api/metrics')
  assert.equal(unauthorized.status, 401)
  assert.equal(unauthorized.body.error, 'Unauthorized')

  const login = await requestJson(server, '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@acme.com', password: 'letmein123' }),
  })

  assert.equal(login.status, 200)
  assert.equal(login.headers.get('content-type'), 'application/json; charset=utf-8')
  assert.equal(login.body.user.email, 'demo@acme.com')
  assert.ok(login.body.token)

  const metrics = await requestJson(server, '/api/metrics', {
    headers: { Authorization: `Bearer ${login.body.token}` },
  })

  assert.equal(metrics.status, 200)
  assert.equal(metrics.headers.get('content-type'), 'application/json; charset=utf-8')
  assert.equal(metrics.headers.get('cache-control'), 'no-store')
  assert.equal(metrics.body.user.email, 'demo@acme.com')

  const dashboard = metrics.body.dashboard
  assert.ok(dashboard.headline?.title)
  assert.ok(Array.isArray(dashboard.metrics) && dashboard.metrics.length > 0)
  assert.ok(Array.isArray(dashboard.activities) && dashboard.activities.length > 0)
  assert.ok(Array.isArray(dashboard.team) && dashboard.team.length > 0)
  assert.ok(typeof dashboard.generatedAt === 'string')
})
