import { useEffect, useMemo, useState } from 'react'
import coefData from './data/coef.json'

const STORAGE_KEY = 'l1-grade-analyzer-theme'

function cloneData(data) {
  return data.blocks.map((block) => ({
    ...block,
    modules: block.modules.map((module) => ({
      ...module,
      evaluations: Object.fromEntries(
        Object.entries(module.evaluations).map(([key, evaluation]) => [key, { ...evaluation }]),
      ),
    })),
  }))
}

function formatGrade(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (typeof value === 'string') {
    return value
  }

  const rounded = Math.round((value + Number.EPSILON) * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.00$/, '')
}

function parseGrade(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const text = String(value).trim().replace(',', '.')
  if (!text) {
    return null
  }

  if (/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(text)) {
    const [numerator, denominator] = text.split('/').map(Number)
    if (!denominator) {
      return null
    }
    return (numerator / denominator) * 20
  }

  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
}

function calculateModule(module) {
  const entries = Object.values(module.evaluations)
  const weighted = entries.reduce(
    (sum, evaluation) => {
      const numericGrade = parseGrade(evaluation.grade)
      if (numericGrade === null) {
        return sum
      }

      return {
        total: sum.total + numericGrade * evaluation.coef,
        coefs: sum.coefs + evaluation.coef,
        missing: sum.missing,
      }
    },
    { total: 0, coefs: 0, missing: entries.filter((evaluation) => parseGrade(evaluation.grade) === null).length },
  )

  const average = weighted.coefs > 0 ? weighted.total / weighted.coefs : 0
  return {
    average,
    hasMissing: weighted.missing > 0,
    missingCount: weighted.missing,
    completion: entries.length > 0 ? ((entries.length - weighted.missing) / entries.length) * 100 : 0,
  }
}

function calculateBlock(block) {
  const moduleResults = block.modules.map((module) => calculateModule(module))
  const weighted = moduleResults.reduce(
    (sum, result) => ({
      total: sum.total + result.average,
      count: sum.count + 1,
      missing: sum.missing + result.missingCount,
    }),
    { total: 0, count: 0, missing: 0 },
  )

  const average = weighted.count > 0 ? weighted.total / weighted.count : 0
  return {
    average,
    moduleResults,
    missingCount: weighted.missing,
    status: average >= 10 ? 'Validé' : average >= 8 ? 'Rattrapage' : 'En difficulté',
  }
}

function overallAverage(blockResults) {
  const weighted = blockResults.reduce(
    (sum, blockResult, index) => {
      const block = coefData.blocks[index]
      return {
        total: sum.total + blockResult.average * block.credit,
        credits: sum.credits + block.credit,
      }
    },
    { total: 0, credits: 0 },
  )

  return weighted.credits > 0 ? weighted.total / weighted.credits : 0
}

function getDecisionLabel(average) {
  if (average >= 10) {
    return {
      title: 'Année validée',
      tone: 'success',
      detail: 'Votre moyenne annuelle est suffisante pour valider l’année.',
    }
  }

  if (average >= 9.5) {
    return {
      title: 'Très proche de la validation',
      tone: 'warning',
      detail: 'Quelques points suffisent encore pour atteindre 10/20.',
    }
  }

  return {
    title: 'Année non validée pour le moment',
    tone: 'danger',
    detail: 'Vous devez encore améliorer la moyenne annuelle pour valider l’année.',
  }
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) ?? 'light')
  const [blocks, setBlocks] = useState(() => cloneData(coefData))
  const [activeStep, setActiveStep] = useState(0)
  const [showDashboard, setShowDashboard] = useState(false)

  useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const blockResults = useMemo(
    () => blocks.map((block) => calculateBlock(block)),
    [blocks],
  )

  const yearlyAverage = useMemo(() => overallAverage(blockResults), [blockResults])
  const decision = useMemo(() => getDecisionLabel(yearlyAverage), [yearlyAverage])

  const missingEvaluations = useMemo(() => {
    const items = []

    blocks.forEach((block, blockIndex) => {
      block.modules.forEach((module, moduleIndex) => {
        Object.entries(module.evaluations).forEach(([evaluationName, evaluation]) => {
          if (parseGrade(evaluation.grade) === null) {
            items.push({
              blockIndex,
              moduleIndex,
              evaluationName,
              moduleName: module.name,
              blockName: block.name,
              coef: evaluation.coef,
            })
          }
        })
      })
    })

    return items
  }, [blocks])

  const activeBlock = blocks[activeStep]
  const activeBlockResult = blockResults[activeStep]
  const progress = ((activeStep + 1) / blocks.length) * 100

  const updateGrade = (blockIndex, moduleIndex, evaluationName, nextValue) => {
    setBlocks((current) =>
      current.map((block, currentBlockIndex) => {
        if (currentBlockIndex !== blockIndex) {
          return block
        }

        return {
          ...block,
          modules: block.modules.map((module, currentModuleIndex) => {
            if (currentModuleIndex !== moduleIndex) {
              return module
            }

            return {
              ...module,
              evaluations: {
                ...module.evaluations,
                [evaluationName]: {
                  ...module.evaluations[evaluationName],
                  grade: nextValue,
                },
              },
            }
          }),
        }
      }),
    )
  }

  const goPrevious = () => setActiveStep((step) => Math.max(0, step - 1))
  const goNext = () => {
    if (activeStep < blocks.length - 1) {
      setActiveStep((step) => step + 1)
      return
    }

    setShowDashboard(true)
  }

  const resetWizard = () => {
    setShowDashboard(false)
    setActiveStep(0)
  }

  return (
    <div className="app-shell">
      <header className="page-header">
        <div className="brand-group">
          <div className="brand-icon card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 7.5 12 4l8 3.5-8 3.5L4 7.5Z" />
              <path d="M6 10.5V15c0 1.8 2.7 3.5 6 3.5s6-1.7 6-3.5v-4.5" />
            </svg>
          </div>
          <div>
            <p className="eyebrow">Tableau académique</p>
            <h1>L1 Grade Analyzer</h1>
          </div>
        </div>
        <button type="button" className="theme-toggle card" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}>
          {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        </button>
      </header>

      <main className="page-main">
        {!showDashboard ? (
          <section className="card wizard-section">
            <div className="wizard-topbar">
              <div>
                <p className="section-kicker">Étape guidée</p>
                <h2>Saisir les notes bloc par bloc</h2>
                <p className="section-description">
                  Entrez les notes connues, passez celles que vous ne connaissez pas encore, puis visualisez immédiatement votre situation.
                </p>
              </div>
              <div className="progress-card card">
                <p className="progress-label">Progression</p>
                <p className="progress-step">Bloc {activeStep + 1} / {blocks.length}</p>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="step-container">
              <div className="step-heading">
                <div>
                  <p className="step-block-name">{activeBlock.name}</p>
                  <p className="step-status">{activeBlockResult.status} · moyenne {formatGrade(activeBlockResult.average)}/20</p>
                </div>
                <div className="step-credit">{activeBlock.credit} crédits</div>
              </div>

              <div className="modules-grid">
                {activeBlock.modules.map((module, moduleIndex) => {
                  const moduleResult = activeBlockResult.moduleResults[moduleIndex]
                  return (
                    <article className="module-card surface-2" key={module.name}>
                      <div className="module-header">
                        <div>
                          <h3>{module.name}</h3>
                          <p>{module.credit} crédits</p>
                        </div>
                        <div className="module-average">{formatGrade(moduleResult.average)}/20</div>
                      </div>

                      <div className="evaluation-list">
                        {Object.entries(module.evaluations).map(([evaluationName, evaluation]) => (
                          <label className="evaluation-row" key={evaluationName}>
                            <span>{evaluationName}</span>
                            <div className="evaluation-input-group">
                              <input
                                type="text"
                                value={evaluation.grade ?? ''}
                                placeholder="—"
                                inputMode="decimal"
                                onChange={(event) => updateGrade(activeStep, moduleIndex, evaluationName, event.target.value)}
                              />
                              <span className="evaluation-coef">x{evaluation.coef}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>

            <div className="wizard-actions">
              <button type="button" className="secondary-button" onClick={goPrevious} disabled={activeStep === 0}>
                Bloc précédent
              </button>
              <div className="wizard-actions-right">
                <button type="button" className="primary-button" onClick={goNext}>
                  {activeStep < blocks.length - 1 ? 'Bloc suivant' : 'Voir le tableau'}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section id="dashboardSection">
            <section className="dashboard-top grid-3">
              <div className="card overview-card">
                <div className="card-head">
                  <div>
                    <p className="section-kicker">Vue d'ensemble</p>
                    <h2>Moyennes des blocs</h2>
                  </div>
                  <button type="button" className="secondary-button" onClick={resetWizard}>
                    Modifier les notes
                  </button>
                </div>

                <div className="blocks-grid">
                  {blocks.map((block, index) => {
                    const result = blockResults[index]
                    return (
                      <article className="block-summary surface-2" key={block.name}>
                        <p className="block-summary-name">{block.name}</p>
                        <div className="block-summary-average">{formatGrade(result.average)}</div>
                        <p className="block-summary-meta">{result.status} · {block.credit} crédits</p>
                      </article>
                    )
                  })}
                </div>
              </div>

              <div className="card decision-card">
                <p className="section-kicker">Statut annuel</p>
                <h2>Décision</h2>
                <div className={`decision-panel surface-2 ${decision.tone}`}>
                  <p className="decision-average">{formatGrade(yearlyAverage)}/20</p>
                  <h3>{decision.title}</h3>
                  <p>{decision.detail}</p>
                </div>
              </div>
            </section>

            <section className="dashboard-bottom grid-2">
              <article className="card panel-card">
                <div className="card-head compact">
                  <div>
                    <p className="section-kicker">Notes restantes</p>
                    <h2>Ce qu'il manque</h2>
                  </div>
                  <span className="badge">{missingEvaluations.length}</span>
                </div>

                <div className="missing-list">
                  {missingEvaluations.length === 0 ? (
                    <p className="empty-state">Toutes les notes sont saisies.</p>
                  ) : (
                    missingEvaluations.map((item) => (
                      <div className="missing-item surface-2" key={`${item.blockIndex}-${item.moduleIndex}-${item.evaluationName}`}>
                        <div>
                          <p className="missing-title">{item.evaluationName}</p>
                          <p className="missing-meta">{item.moduleName}</p>
                          <p className="missing-meta muted">{item.blockName}</p>
                        </div>
                        <span className="evaluation-coef">x{item.coef}</span>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="card panel-card">
                <p className="section-kicker">Objectif annuel</p>
                <h2>Ce qu'il faut pour valider l'année</h2>
                <div className="requirements-panel">
                  <div className="requirement-item surface-2">
                    <span>Moyenne annuelle cible</span>
                    <strong>10/20</strong>
                  </div>
                  <div className="requirement-item surface-2">
                    <span>Moyenne actuelle</span>
                    <strong>{formatGrade(yearlyAverage)}/20</strong>
                  </div>
                  <div className="requirement-item surface-2">
                    <span>Points restants</span>
                    <strong>{Math.max(0, 10 - yearlyAverage).toFixed(2)}</strong>
                  </div>
                  <div className="requirement-item surface-2">
                    <span>Bloc le plus proche du seuil</span>
                    <strong>
                      {blocks
                        .map((block, index) => ({ block, average: blockResults[index].average }))
                        .sort((left, right) => right.average - left.average)[0]?.block.name}
                    </strong>
                  </div>
                </div>
              </article>
            </section>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
