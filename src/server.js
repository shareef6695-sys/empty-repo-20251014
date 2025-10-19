const http = require('http')
const path = require('path')
const fs = require('fs/promises')
const { getDashboardData } = require('./data')

const PORT = process.env.PORT || 3000
const STATIC_ROOT = path.resolve(__dirname, '..', 'web', 'dist')
const FALLBACK_FILE = path.resolve(__dirname, '..', 'web', 'index.html')

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

function sanitizePath(requestPath) {
  const normalized = path.posix.normalize(requestPath)
  if (normalized === '/' || normalized === '') {
    return '/index.html'
  }
  return normalized
}

async function tryRead(filePath) {
  try {
    const data = await fs.readFile(filePath)
    return data
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

async function serveStaticFile(urlPath, res) {
  const safePath = sanitizePath(urlPath)
  const filePath = path.join(STATIC_ROOT, safePath)
  if (!filePath.startsWith(STATIC_ROOT)) {
    return false
  }

  const file = await tryRead(filePath)
  if (!file) {
    return false
  }

  const ext = path.extname(filePath)
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'
  res.statusCode = 200
  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable')
  res.end(file)
  return true
}

async function serveFallback(res) {
  const fromDist = await tryRead(path.join(STATIC_ROOT, 'index.html'))
  if (fromDist) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(fromDist)
    return
  }

  const devIndex = await tryRead(FALLBACK_FILE)
  if (devIndex) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(devIndex)
    return
  }

  res.statusCode = 404
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end('Not Found')
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`)

    if (req.method === 'GET' && url.pathname === '/api/metrics') {
      const payload = getDashboardData()
      sendJson(res, 200, payload)
      return
    }

    if (url.pathname.startsWith('/api/')) {
      sendJson(res, 404, { error: 'Not Found' })
      return
    }

    try {
      const served = await serveStaticFile(url.pathname, res)
      if (!served) {
        await serveFallback(res)
      }
    } catch (error) {
      console.error('Failed to serve request', error)
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      }
      res.end('Internal Server Error')
    }
  })
}

if (require.main === module) {
  const server = createServer()
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

module.exports = { createServer, getDashboardData }
