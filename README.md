# PVC compounding formula builder

This project provides a small Node.js API and React front-end for quickly assembling PVC compounding formulas. Enter ingredients in PHR, pick a batch size, and the tool calculates ingredient weights, total cost, cost per kilogram, and an estimated density when densities are provided.

## Getting started

### API
1. Start the API: `npm start`
2. Optional health check: `curl http://localhost:3000/api/health`

The API exposes:
- `GET /api/compounds/samples` – sample PVC formula for quick testing
- `POST /api/compounds/preview` – calculate batch weights and costs for a submitted formula

### Front-end
1. `cd web`
2. Install dependencies: `npm install`
3. Run the dev server: `npm run dev -- --host`
4. Build for production: `npm run build`

Tip: start the API (`npm start` in the project root) and then click **Load sample from API** in the UI to pull the baseline flexible PVC recipe into the builder.
