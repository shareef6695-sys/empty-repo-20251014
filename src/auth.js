const DEMO_USER = {
  id: 'user-1',
  email: 'demo@acme.com',
  password: 'letmein123',
  name: 'Demo User',
  role: 'Growth Lead',
}

const DEMO_TOKEN = 'demo-dashboard-token'

function authenticateCredentials(email, password) {
  if (email === DEMO_USER.email && password === DEMO_USER.password) {
    return {
      token: DEMO_TOKEN,
      user: {
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        role: DEMO_USER.role,
      },
    }
  }
  return null
}

function verifyToken(token) {
  if (token === DEMO_TOKEN) {
    return {
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      role: DEMO_USER.role,
    }
  }
  return null
}

module.exports = { authenticateCredentials, verifyToken, DEMO_USER, DEMO_TOKEN }
