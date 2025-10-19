const { buildDashboardPayload } = require('../../src/server')

module.exports = async function ceoDashboard(req, res) {
  try {
    if (req.method === 'GET' || req.method === 'HEAD') {
      const payload = buildDashboardPayload()
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')

      if (req.method === 'HEAD') {
        res.statusCode = 200
        res.end()
        return
      }

      res.statusCode = 200
      res.end(JSON.stringify(payload))
      return
    }

    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ error: 'Not found' }))
  } catch (error) {
    console.error('CEO dashboard handler error', error)
    const isHead = req.method === 'HEAD'
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
    }
    if (isHead) {
      res.end()
    } else {
      res.end(JSON.stringify({ error: 'Internal Server Error' }))
    }
  }
}
