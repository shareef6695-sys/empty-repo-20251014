const http = require('http')
const path = require('path')
const fs = require('fs/promises')
const { getDashboardData } = require('./data')
const { authenticateCredentials, verifyToken } = require('./auth')

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

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk.toString()
      if (data.length > 1e6) {
        req.destroy()
        reject(new Error('Payload too large'))
      }
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

async function readJsonBody(req) {
  const body = await readRequestBody(req)
  if (!body) return null
  try {
    return JSON.parse(body)
  } catch (error) {
    throw new Error('Invalid JSON')
  }
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

    if (url.pathname === '/api/login') {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.setHeader('Allow', 'POST')
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: 'Method Not Allowed' }))
        return
      }

      try {
        const body = await readJsonBody(req)
        if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
          sendJson(res, 400, { error: 'Email and password are required' })
          return
        }

        const auth = authenticateCredentials(body.email, body.password)
        if (!auth) {
          sendJson(res, 401, { error: 'Invalid credentials' })
          return
        }

        sendJson(res, 200, auth)
      } catch (error) {
        if (error.message === 'Invalid JSON') {
          sendJson(res, 400, { error: 'Invalid JSON payload' })
        } else if (error.message === 'Payload too large') {
          sendJson(res, 413, { error: 'Payload too large' })
        } else {
          console.error('Failed to process login request', error)
          sendJson(res, 500, { error: 'Internal Server Error' })
        }
      }
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/metrics') {
      const authHeader = req.headers.authorization || ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
      const user = token ? verifyToken(token) : null

      if (!user) {
        sendJson(res, 401, { error: 'Unauthorized' })
        return
      }

      const payload = getDashboardData()
      sendJson(res, 200, { user, dashboard: payload })
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
