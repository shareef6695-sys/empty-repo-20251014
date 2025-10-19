# React + Node.js sample dashboard

This repository demonstrates a very small full-stack application. The Node.js server exposes a `/api/metrics` endpoint that returns a synthetic dashboard payload while also serving the bundled React single-page application from `web/`.

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

## Testing

```bash
npm test
```
