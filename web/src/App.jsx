import React, { useMemo, useState } from 'react'
import './styles.css'

const defaultIngredients = [
  { name: 'PVC Resin (K67)', role: 'Base Resin', phr: 100, pricePerKg: 1.2, density: 1.4 },
  { name: 'DINP Plasticizer', role: 'Plasticizer', phr: 40, pricePerKg: 1.1, density: 0.97 },
  { name: 'Ca/Zn Stabilizer', role: 'Stabilizer', phr: 4.5, pricePerKg: 2.2, density: 2.6 },
  { name: 'Calcium Carbonate', role: 'Filler', phr: 25, pricePerKg: 0.25, density: 2.7 },
  { name: 'Epoxidized Soybean Oil', role: 'Secondary Plasticizer', phr: 5, pricePerKg: 1.45, density: 0.99 },
  { name: 'Processing Aid', role: 'Processing Aid', phr: 2, pricePerKg: 2.7, density: 1.1 },
  { name: 'Titanium Dioxide', role: 'Pigment', phr: 3, pricePerKg: 3.4, density: 4.2 },
]

function calculateBlend(ingredients, batchKg) {
  const valid = ingredients.map((ing) => ({
    ...ing,
    phr: Number(ing.phr) || 0,
    pricePerKg: Number(ing.pricePerKg) || 0,
    density: ing.density ? Number(ing.density) : null,
  }))

  const totalPhr = valid.reduce((sum, ing) => sum + ing.phr, 0)
  const totalParts = totalPhr > 0 ? totalPhr : 0
  const items = valid.map((ing) => {
    const weightKg = totalParts > 0 ? (batchKg * ing.phr) / totalParts : 0
    const cost = weightKg * ing.pricePerKg
    const volumeL = ing.density ? weightKg / ing.density : null

    return { ...ing, weightKg, cost, volumeL }
  })

  const totals = items.reduce(
    (acc, ing) => {
      acc.weightKg += ing.weightKg
      acc.cost += ing.cost
      acc.volumeL += ing.volumeL || 0
      return acc
    },
    { weightKg: 0, cost: 0, volumeL: 0 }
  )

  const estimatedDensity = totals.volumeL > 0 ? totals.weightKg / totals.volumeL : null

  return {
    items,
    totalPhr,
    totals: {
      ...totals,
      costPerKg: totals.weightKg > 0 ? totals.cost / totals.weightKg : 0,
      estimatedDensity,
    },
  }
}

function IngredientRow({ ingredient, onChange, onRemove }) {
  return (
    <div className="ingredient-row">
      <input
        value={ingredient.name}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="Ingredient name"
      />
      <input
        value={ingredient.role}
        onChange={(e) => onChange('role', e.target.value)}
        placeholder="Role (resin, stabilizer, filler…)"
      />
      <input
        type="number"
        min="0"
        step="0.1"
        value={ingredient.phr}
        onChange={(e) => onChange('phr', e.target.value)}
        placeholder="PHR"
      />
      <input
        type="number"
        min="0"
        step="0.01"
        value={ingredient.pricePerKg}
        onChange={(e) => onChange('pricePerKg', e.target.value)}
        placeholder="$ / kg"
      />
      <input
        type="number"
        min="0"
        step="0.01"
        value={ingredient.density || ''}
        onChange={(e) => onChange('density', e.target.value)}
        placeholder="Density"
      />
      <button className="ghost" onClick={onRemove} aria-label="Remove ingredient">
        ✕
      </button>
    </div>
  )
}

export default function App() {
  const [formulaName, setFormulaName] = useState('Flexible PVC Cable Compound')
  const [batchKg, setBatchKg] = useState(25)
  const [ingredients, setIngredients] = useState(defaultIngredients)
  const [status, setStatus] = useState(null)
  const [loadingSample, setLoadingSample] = useState(false)

  const calculated = useMemo(() => calculateBlend(ingredients, Number(batchKg) || 0), [ingredients, batchKg])

  function updateIngredient(index, field, value) {
    setIngredients((ings) => ings.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)))
  }

  function addIngredient() {
    setIngredients((ings) => [...ings, { name: '', role: '', phr: 0, pricePerKg: 0, density: '' }])
  }

  function removeIngredient(index) {
    setIngredients((ings) => ings.filter((_, i) => i !== index))
  }

  async function loadSampleFromApi() {
    setLoadingSample(true)
    setStatus(null)

    try {
      const response = await fetch('/api/compounds/samples')

      if (!response.ok) {
        throw new Error('Request failed')
      }

      const data = await response.json()
      const sample = data.samples?.[0]

      if (!sample) {
        throw new Error('No sample returned')
      }

      setFormulaName(sample.name || 'Sample PVC Compound')
      setBatchKg(sample.batchKg || 25)
      setIngredients(
        (sample.ingredients || []).map((ing) => ({
          name: ing.name || '',
          role: ing.role || '',
          phr: ing.phr ?? 0,
          pricePerKg: ing.pricePerKg ?? 0,
          density: ing.density ?? '',
        }))
      )

      setStatus({ type: 'success', message: 'Loaded sample from API. Adjust values as needed.' })
    } catch (err) {
      setStatus({
        type: 'error',
        message: 'Unable to load sample from API. Start the API with "npm start" in the root folder.',
      })
    } finally {
      setLoadingSample(false)
    }
  }

  return (
    <div className="app">
      <header>
        <p className="eyebrow">Process Engineer Toolkit</p>
        <h1>PVC Compounding Formula Builder</h1>
        <p className="lede">
          Design, cost, and document flexible or rigid PVC formulations using PHR-based inputs.
          Everything calculates live so you can see batch weights, cost per kilogram, and density estimates.
        </p>
        {status && (
          <div className={`alert ${status.type === 'error' ? 'error' : 'success'}`} role="status">
            {status.message}
          </div>
        )}
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Formula</p>
            <h2>{formulaName || 'Untitled PVC Blend'}</h2>
          </div>
          <div className="batch-input">
            <label htmlFor="batch">Batch size (kg)</label>
            <input
              id="batch"
              type="number"
              min="1"
              step="0.5"
              value={batchKg}
              onChange={(e) => setBatchKg(e.target.value)}
            />
          </div>
        </div>

        <div className="actions">
          <button className="secondary" onClick={loadSampleFromApi} disabled={loadingSample}>
            {loadingSample ? 'Loading sample…' : 'Load sample from API'}
          </button>
          <p className="hint">Requires the API running on port 3000.</p>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <p className="label">Total PHR</p>
            <p className="value">{calculated.totalPhr.toFixed(1)}</p>
            <p className="hint">Sum of all parts per hundred resin.</p>
          </div>
          <div className="summary-card">
            <p className="label">Batch weight</p>
            <p className="value">{calculated.totals.weightKg.toFixed(2)} kg</p>
            <p className="hint">Based on PHR split across the batch.</p>
          </div>
          <div className="summary-card">
            <p className="label">Cost per kg</p>
            <p className="value">
              ${calculated.totals.costPerKg.toFixed(2)} <span className="unit">USD/kg</span>
            </p>
            <p className="hint">Uses each ingredient cost and calculated weight.</p>
          </div>
          <div className="summary-card">
            <p className="label">Estimated density</p>
            <p className="value">
              {calculated.totals.estimatedDensity ? `${calculated.totals.estimatedDensity.toFixed(2)} g/cc` : '—'}
            </p>
            <p className="hint">Requires densities for all ingredients to estimate.</p>
          </div>
        </div>

        <div className="input-grid">
          <div>
            <label className="field-label" htmlFor="formula-name">
              Formula name
            </label>
            <input
              id="formula-name"
              value={formulaName}
              onChange={(e) => setFormulaName(e.target.value)}
              placeholder="Flexible PVC Cable Compound"
            />
          </div>
          <div>
            <label className="field-label">Notes</label>
            <div className="notes">
              <p>
                Enter PHR for each ingredient. The calculator scales to the target batch weight and provides total cost,
                weight per ingredient, and an estimated density when densities are supplied.
              </p>
              <p>
                Use this to capture lab trials, create spec sheets, or communicate production-ready blends to operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Ingredients</p>
            <h2>Build your compounding recipe</h2>
          </div>
          <button className="primary" onClick={addIngredient}>
            Add ingredient
          </button>
        </div>

        <div className="ingredient-grid">
          <div className="ingredient-headings">
            <span>Name</span>
            <span>Role</span>
            <span>PHR</span>
            <span>Cost $/kg</span>
            <span>Density (g/cc)</span>
            <span />
          </div>

          {ingredients.map((ing, idx) => (
            <IngredientRow
              key={`${ing.name}-${idx}`}
              ingredient={ing}
              onChange={(field, value) => updateIngredient(idx, field, value)}
              onRemove={() => removeIngredient(idx)}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Results</p>
            <h2>Batch breakdown</h2>
          </div>
        </div>

        <div className="results">
          <div className="results-header">
            <span>Ingredient</span>
            <span>Role</span>
            <span>PHR</span>
            <span>Weight (kg)</span>
            <span>Cost (USD)</span>
            <span>Volume (L)</span>
          </div>
          {calculated.items.map((ing) => (
            <div key={ing.name + ing.role} className="results-row">
              <span>{ing.name}</span>
              <span className="muted">{ing.role || '—'}</span>
              <span>{ing.phr.toFixed(1)}</span>
              <span>{ing.weightKg.toFixed(2)}</span>
              <span>${ing.cost.toFixed(2)}</span>
              <span>{ing.volumeL ? ing.volumeL.toFixed(2) : '—'}</span>
            </div>
          ))}
        </div>

        <div className="totals">
          <div>
            <p className="label">Batch weight</p>
            <p className="value">{calculated.totals.weightKg.toFixed(2)} kg</p>
          </div>
          <div>
            <p className="label">Total cost</p>
            <p className="value">${calculated.totals.cost.toFixed(2)}</p>
          </div>
          <div>
            <p className="label">Cost per kg</p>
            <p className="value">${calculated.totals.costPerKg.toFixed(2)}</p>
          </div>
          <div>
            <p className="label">Estimated density</p>
            <p className="value">{calculated.totals.estimatedDensity ? `${calculated.totals.estimatedDensity.toFixed(2)} g/cc` : 'Add densities'}</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Processing guidance</p>
            <h2>Standard flexible PVC workflow</h2>
          </div>
        </div>
        <ol className="steps">
          <li>Dry blend resin, stabilizer system, and fillers for 3–5 minutes.</li>
          <li>Heat mix to 110–120°C before slowly metering in plasticizer to avoid fish eyes.</li>
          <li>Add processing aids and pigments, mix until homogeneous, and check gelation torque.</li>
          <li>Extrude using a moderate shear profile; target melt temperature between 160–175°C.</li>
          <li>Record lot numbers for all ingredients to maintain traceability in production.</li>
        </ol>
      </section>
    </div>
  )
}
