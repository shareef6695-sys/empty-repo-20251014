const { authenticateCredentials } = require('../src/auth')

function parseBody(req) {
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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Method Not Allowed' }))
    return
  }

  try {
    const raw = await parseBody(req)
    const body = raw ? JSON.parse(raw) : null
    if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Email and password are required' }))
      return
    }

    const auth = authenticateCredentials(body.email, body.password)
    if (!auth) {
      res.statusCode = 401
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Invalid credentials' }))
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify(auth))
  } catch (error) {
    if (error instanceof SyntaxError) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Invalid JSON payload' }))
      return
    }

    if (error.message === 'Payload too large') {
      res.statusCode = 413
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Payload too large' }))
      return
    }

    console.error('Failed to process login request', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Internal Server Error' }))
  }
}
