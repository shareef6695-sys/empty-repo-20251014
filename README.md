# React + Node.js sample dashboard

This repository demonstrates a very small full-stack application. The Node.js server exposes authenticated endpoints that return a synthetic dashboard payload while also serving the bundled React single-page application from `web/`.

## Getting started

```bash
npm install
npm install --prefix web
npm run build            # optional: compiles the React bundle
npm start                # starts the Node.js server on http://localhost:3000
```

During development you can run the Vite dev server for instant feedback:

```bash
npm run dev --prefix web
```

## Authentication

The sample dashboard is protected behind a demo login. Use the credentials below to authenticate against the `/api/login` endpoint and retrieve a bearer token for subsequent requests to `/api/metrics`:

```
Email:    demo@acme.com
Password: letmein123
```

The React app stores the token locally so you stay signed in between refreshes. Use the **Log out** button in the interface to clear the session.

## Testing

```bash
npm test
```
