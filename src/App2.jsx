import { useEffect, useMemo, useState } from 'react'
import coefReal from './data/coef_real.json'

const STORAGE_KEY = 'l1-grade-analyzer-theme'

const validationRules = { general: 10, programmation: 10, maths: 7 }
const totalCredits = coefReal.total_credits ?? coefReal.totalCredits ?? 60

function mapRealCoefToApp(blocksRaw) {
  // Convert coef.json shape into the app's internal blocks/modules/evaluations arrays
  return blocksRaw.map((b, bIndex) => ({
    id: `block-${bIndex}`,
    name: b.name,
    threshold: b.threshold ?? null,
    credits: b.credit ?? b.credit ?? 0,
    modules: (b.modules || []).map((m, mIndex) => ({
      id: `block-${bIndex}-mod-${mIndex}`,
      name: m.name,
      credit: m.credit,
      evaluations: Object.entries(m.evaluations || {}).map(([evKey, ev]) => ({
        id: evKey,
        name: evKey,
        coefficient: ev.coef ?? ev.coefficient ?? 1,
        grade: ev.grade,
      })),
    })),
  }))
}

function getEvaluationScale(evaluationId) {
  if (evaluationId === 'Certification_PIX' || evaluationId === 'Positionnement_PIX') {
    return 800
  }

  if (evaluationId === 'S1_1_campagne' || evaluationId === 'S1_2campagne' || evaluationId === 'S1_3_campagnes') {
    return 100
  }

  return 20
}

function getEvaluationPlaceholder(evaluationId) {
  const scale = getEvaluationScale(evaluationId)

  if (scale === 800) {
    return 'ex: 545'
  }

  if (scale === 100) {
    return 'ex: 80'
  }

  return '0 à 20'
}

function getEvaluationInputConfig(evaluationId) {
  const scale = getEvaluationScale(evaluationId)

  return {
    max: scale,
    min: 0,
    step: scale === 20 ? 0.25 : 1,
    placeholder: getEvaluationPlaceholder(evaluationId),
  }
}

function getEvaluationInputValue(evaluation) {
  if (evaluation.grade === null || evaluation.grade === undefined || evaluation.grade === '') {
    return ''
  }

  if (typeof evaluation.grade === 'number') {
    return evaluation.grade
  }

  const numericGrade = parseGrade(evaluation.grade, evaluation.id)
  return numericGrade === null ? '' : numericGrade
}

// create initial mapped blocks from the real coef JSON
const initialBlocks = mapRealCoefToApp(coefReal.blocks || [])

const hasPreloadedGrades = initialBlocks.some((block) =>
  block.modules.some((module) => module.evaluations.some((evaluation) => evaluation.grade !== null && evaluation.grade !== '')),
)

function parseGrade(value, evaluationId) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null
    }

    const scale = getEvaluationScale(evaluationId)

    if (scale === 20) {
      return value >= 0 && value <= 20 ? value : null
    }

    if (scale === 100) {
      return value >= 0 && value <= 100 ? (value / 100) * 20 : null
    }

    if (scale === 800) {
      return value >= 0 && value <= 800 ? (value / 800) * 20 : null
    }

    return value
  }

  const text = String(value).trim().replace(',', '.')
  if (!text) {
    return null
  }

  const scale = getEvaluationScale(evaluationId)

  if (/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(text)) {
    const [numerator, denominator] = text.split('/').map(Number)
    if (!denominator) {
      return null
    }

    if (scale !== 20) {
      return (numerator / denominator) * 20
    }

    return null
  }

  const parsed = Number(text)
  if (!Number.isFinite(parsed)) {
    return null
  }

  if (scale === 20) {
    return parsed >= 0 && parsed <= 20 ? parsed : null
  }

  if (scale === 100) {
    return parsed >= 0 && parsed <= 100 ? (parsed / 100) * 20 : null
  }

  if (scale === 800) {
    return parsed >= 0 && parsed <= 800 ? (parsed / 800) * 20 : null
  }

  return parsed
}

function formatGrade(value) {
  if (value === null || value === undefined) {
    return '—'
  }

  const normalized = Math.round((value + Number.EPSILON) * 20) / 20
  return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(2).replace(/\.00$/, '')
}

function computeKnownWeightedAverage(items, getGrade, getWeight) {
  let weighted = 0
  let weightTotal = 0

  items.forEach((item) => {
    const grade = getGrade(item)
    const weight = getWeight(item)
    if (grade !== null && grade !== '' && !Number.isNaN(Number(grade))) {
      weighted += Number(grade) * Number(weight)
      weightTotal += Number(weight)
    }
  })

  return weightTotal ? weighted / weightTotal : null
}

function computeModuleAverage(module) {
  return computeKnownWeightedAverage(module.evaluations, (evaluation) => parseGrade(evaluation.grade, evaluation.id), (evaluation) => evaluation.coefficient)
}

function computeBlockAverage(block) {
  return computeKnownWeightedAverage(block.modules, (module) => computeModuleAverage(module), (module) => module.credit)
}

function computeGeneralAverage(blocks) {
  return computeKnownWeightedAverage(
    blocks.flatMap((block) => block.modules),
    (module) => computeModuleAverage(module),
    (module) => module.credit,
  )
}

function getMissingEvaluations(blocks) {
  const missing = []
  blocks.forEach((block) => {
    block.modules.forEach((module) => {
      module.evaluations.forEach((evaluation) => {
        if (evaluation.grade === null || evaluation.grade === '') {
          missing.push({ block, module, evaluation })
        }
      })
    })
  })
  return missing
}

function estimateNeededAverageForRemaining(target, knownContribution, remainingWeight, totalWeight) {
  if (remainingWeight <= 0) {
    return null
  }
  return (target * totalWeight - knownContribution) / remainingWeight
}

function computeScenario(blocks) {
  let knownContribution = 0
  let remainingWeight = 0

  blocks.forEach((block) => {
    block.modules.forEach((module) => {
      module.evaluations.forEach((evaluation) => {
        const normalizedWeight = module.credit * evaluation.coefficient
        const grade = parseGrade(evaluation.grade, evaluation.id)
        if (grade === null) {
          remainingWeight += normalizedWeight
        } else {
          knownContribution += grade * normalizedWeight
        }
      })
    })
  })

  const totalWeight = totalCredits || 60
    const bestCase = totalWeight ? (knownContribution + remainingWeight * 20) / totalWeight : null
    const worstCase = totalWeight ? knownContribution / totalWeight : null
  const needed = estimateNeededAverageForRemaining(validationRules.general, knownContribution, remainingWeight, totalWeight)

  return { knownContribution, remainingWeight, bestCase, worstCase, needed }
}

function getBlockStatus(block, average) {
  if (block.threshold !== null) {
    if (average === null) {
      return { color: 'var(--warning)', label: 'À compléter' }
    }

    return average >= block.threshold
      ? { color: 'var(--success)', label: 'Seuil atteint' }
      : { color: 'var(--danger)', label: 'Sous le seuil' }
  }

  if (average === null) {
    return { color: 'var(--warning)', label: 'Incomplet' }
  }

  return average >= 10 ? { color: 'var(--success)', label: 'Bonne contribution' } : { color: 'var(--danger)', label: 'À renforcer' }
}

function getYearDecision(general, programmation, maths, scenario, hasMissing) {
  const currentValidated = general !== null && programmation !== null && maths !== null && general >= 10 && programmation >= 10 && maths >= 7

  if (currentValidated && !hasMissing) {
    return {
      title: 'Validation déjà acquise',
      tone: 'var(--success)',
      text: 'Toutes les conditions connues sont remplies et il ne reste plus de note manquante.',
    }
  }

  if (scenario.bestCase < 10) {
    return {
      title: 'Validation impossible',
      tone: 'var(--danger)',
      text: 'Même avec des notes maximales sur le reste, la moyenne générale ne peut plus atteindre 10/20.',
    }
  }

  if (currentValidated) {
    return {
      title: 'Validation presque assurée',
      tone: 'var(--success)',
      text: 'Les seuils visibles sont déjà atteints. Les notes restantes peuvent encore améliorer ou fragiliser légèrement la situation.',
    }
  }

  return {
    title: 'Validation possible',
    tone: 'var(--warning)',
    text: 'L’année reste atteignable, mais il faut surveiller les blocs à seuil et les notes encore manquantes.',
  }
}

export default function App2() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) ?? 'light')
  const [blocks, setBlocks] = useState(() => initialBlocks)
  const [currentStep, setCurrentStep] = useState(0)
  const [showDashboard, setShowDashboard] = useState(() => hasPreloadedGrades)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const moduleResults = useMemo(
    () =>
      blocks.map((block) => ({
        average: computeBlockAverage(block),
        moduleResults: block.modules.map((module) => computeModuleAverage(module)),
      })),
    [blocks],
  )

  const generalAverage = useMemo(() => computeGeneralAverage(blocks), [blocks])
  const missingEvaluations = useMemo(() => getMissingEvaluations(blocks), [blocks])
  const scenario = useMemo(() => computeScenario(blocks), [blocks])
  const programmationAverage = moduleResults[0]?.average ?? null
  const mathsAverage = moduleResults[1]?.average ?? null
  const decision = useMemo(
    () => getYearDecision(generalAverage, programmationAverage, mathsAverage, scenario, missingEvaluations.length > 0),
    [generalAverage, programmationAverage, mathsAverage, scenario, missingEvaluations.length],
  )

  const activeBlock = blocks[currentStep]
  const activeBlockAverage = moduleResults[currentStep]?.average ?? null
  const progress = ((currentStep + 1) / blocks.length) * 100

  const updateGrade = (blockIndex, moduleIndex, evaluationIndex, nextValue) => {
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
              evaluations: module.evaluations.map((evaluation, currentEvaluationIndex) => {
                if (currentEvaluationIndex !== evaluationIndex) {
                  return evaluation
                }

                return {
                  ...evaluation,
                  grade: nextValue,
                }
              }),
            }
          }),
        }
      }),
    )
  }

  // per-evaluation skipping removed per user request

  const goPrevious = () => setCurrentStep((step) => Math.max(0, step - 1))

  const goNext = () => {
    if (currentStep < blocks.length - 1) {
      setCurrentStep((step) => step + 1)
      return
    }

    setShowDashboard(true)
  }

  // skip block action removed per user request

  const resetWizard = () => {
    setShowDashboard(false)
  }

  const returnToAnalysis = () => {
    setShowDashboard(true)
  }

  const themeToggleLabel = theme === 'dark' ? 'Mode clair' : 'Mode sombre'

  return (
    <div className="min-h-screen">
      <header className="max-w-7xl mx-auto px-4 py-5 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl card flex items-center justify-center text-teal-700 dark:text-teal-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 7.5 12 4l8 3.5-8 3.5L4 7.5Z" />
              <path d="M6 10.5V15c0 1.8 2.7 3.5 6 3.5s6-1.7 6-3.5v-4.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Tableau académique
            </p>
            <h1 className="text-xl md:text-2xl font-extrabold">L1 Grade Analyzer</h1>
          </div>
        </div>
        <button id="themeToggle" className="card rounded-xl px-4 py-2 text-sm font-semibold" type="button" onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}>
          {themeToggleLabel}
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-12 md:px-6">
        {!showDashboard ? (
          <section id="wizardSection" className="card rounded-3xl p-5 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                  Étape guidée
                </p>
                <h2 className="text-2xl md:text-3xl font-extrabold mt-1">Saisir les notes bloc par bloc</h2>
                <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--muted)' }}>
                  Entrez les notes connues, passez celles que vous ne connaissez pas encore, puis visualisez immédiatement votre situation.
                </p>
              </div>
              <div className="card rounded-2xl px-4 py-3 min-w-[220px]">
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                  Progression
                </p>
                <p id="stepLabel" className="text-lg font-bold mt-1">
                  Bloc {currentStep + 1} / {blocks.length}
                </p>
                <div className="mt-3 h-2 rounded-full surface-2 overflow-hidden">
                  <div id="progressBar" className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--primary)' }} />
                </div>
              </div>
            </div>

            <div id="stepContainer">
              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] gap-5">
                <div className="card rounded-3xl p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                        Bloc actuel
                      </p>
                      <h3 className="text-2xl font-extrabold mt-1">{activeBlock.name}</h3>
                      <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                        {activeBlock.credits} crédits{activeBlock.threshold !== null ? ` · seuil ${activeBlock.threshold}/20` : ' · contribue à la moyenne générale'}
                      </p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: 'var(--surface-2)' }}>
                      {activeBlock.modules.length} modules
                    </span>
                  </div>

                  <div className="space-y-4">
                    {activeBlock.modules.map((module, moduleIndex) => {
                      const average = moduleResults[currentStep]?.moduleResults[moduleIndex]
                      return (
                        <article key={module.id} className="rounded-3xl p-4 surface-2 border" style={{ borderColor: 'var(--border)' }}>
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                              <h4 className="text-lg font-bold">{module.name}</h4>
                              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                                {module.credit} crédits
                              </p>
                            </div>
                            <span className="text-sm font-semibold">{average !== null ? `${formatGrade(average)}/20` : '—'}</span>
                          </div>

                          <div className="grid gap-3">
                            {module.evaluations.map((evaluation, evaluationIndex) => {
                              const inputConfig = getEvaluationInputConfig(evaluation.id)

                              return (
                                <div key={evaluation.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-3 items-center">
                                  <div>
                                    <p className="font-semibold">{evaluation.name}</p>
                                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                                      Coefficient {evaluation.coefficient}
                                    </p>
                                  </div>
                                  <input
                                    type="number"
                                    role="spinbutton"
                                    min={inputConfig.min}
                                    max={inputConfig.max}
                                    step={inputConfig.step}
                                    value={getEvaluationInputValue(evaluation)}
                                    className="w-full rounded-2xl px-4 py-3 border bg-transparent outline-none"
                                    style={{ borderColor: 'var(--border)' }}
                                    placeholder={inputConfig.placeholder}
                                    onChange={(event) => {
                                      const rawValue = event.target.value
                                      if (rawValue === '') {
                                        updateGrade(currentStep, moduleIndex, evaluationIndex, null)
                                        return
                                      }

                                      const numericValue = Number(rawValue)
                                      if (!Number.isFinite(numericValue)) {
                                        return
                                      }

                                      const clampedValue = Math.max(0, Math.min(inputConfig.max, numericValue))
                                      updateGrade(currentStep, moduleIndex, evaluationIndex, clampedValue)
                                    }}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>

                <aside className="card rounded-3xl p-5 md:p-6">
                  <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                    Aperçu direct
                  </p>
                  <h3 className="text-2xl font-extrabold mt-1">Situation actuelle</h3>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl p-4 surface-2">
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        Moyenne générale actuelle
                      </p>
                      <p className="text-3xl font-extrabold mt-1">{generalAverage !== null ? formatGrade(generalAverage) : '—'}</p>
                    </div>
                    <div className="rounded-2xl p-4 surface-2">
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        Moyenne du bloc
                      </p>
                      <p className="text-3xl font-extrabold mt-1">{activeBlockAverage !== null ? formatGrade(activeBlockAverage) : '—'}</p>
                    </div>
                    <div className="rounded-2xl p-4 surface-2">
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        Notes restantes
                      </p>
                      <p className="text-3xl font-extrabold mt-1">{missingEvaluations.length}</p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-between">
              <div className="flex flex-col sm:flex-row gap-3">
                <button id="prevBtn" className="rounded-2xl px-5 py-3 font-semibold border" style={{ borderColor: 'var(--border)' }} type="button" onClick={goPrevious} disabled={currentStep === 0}>
                  Bloc précédent
                </button>
                <button id="backToAnalysisBtn" className="rounded-2xl px-5 py-3 font-semibold border" style={{ borderColor: 'var(--border)' }} type="button" onClick={returnToAnalysis}>
                  Retour à l'analyse
                </button>
              </div>
              <div className="flex gap-3">
                {/* Skip block button removed per user request */}
                <button id="nextBtn" className="rounded-2xl px-5 py-3 font-semibold text-white" style={{ background: 'var(--primary)' }} type="button" onClick={goNext}>
                  {currentStep < blocks.length - 1 ? 'Bloc suivant' : 'Visualiser le tableau'}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section id="dashboardSection">
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
              <div className="lg:col-span-2 card rounded-3xl p-5 md:p-8">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                      Vue d'ensemble
                    </p>
                    <h2 className="text-2xl md:text-3xl font-extrabold mt-1">Moyennes des blocs</h2>
                  </div>
                  <button id="editBtn" className="rounded-2xl px-4 py-3 font-semibold border" style={{ borderColor: 'var(--border)' }} type="button" onClick={resetWizard}>
                    Modifier les notes
                  </button>
                </div>
                <div id="blocksGrid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 ">
                  {blocks.map((block, index) => {
                    const average = moduleResults[index]?.average ?? null
                    const status = getBlockStatus(block, average)
                    const normalized = average === null ? 8 : Math.max(5, Math.min(100, (average / 20) * 100))
                    return (
                      <article key={block.id} className="rounded-3xl p-5 border" style={{ width: '100%', minWidth: 230, borderColor: 'var(--border)', background: 'var(--surface-2)', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        <div className="ring-progress mx-auto" style={{ background: `conic-gradient(${status.color} ${normalized}%, rgba(128,128,128,.15) 0)` }}>
                          <div className="ring-inner">
                            <div className="text-2xl font-extrabold">{average !== null ? formatGrade(average) : '—'}</div>
                            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                              /20
                            </div>
                          </div>
                        </div>
                        <h3 className="text-center font-bold text-lg mt-4 wrap-break-word" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                          {block.name}
                        </h3>
                        <p className="text-center text-sm mt-1" style={{ color: status.color }}>
                          {status.label}
                        </p>
                        <p className="text-center text-sm mt-2" style={{ color: 'var(--muted)' }}>
                          {block.threshold !== null ? `Seuil requis: ${block.threshold}/20` : 'Contribue à la moyenne générale'}
                        </p>
                      </article>
                    )
                  })}
                </div>
              </div>

              <div className="card rounded-3xl p-5 md:p-8">
                <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                  Statut annuel
                </p>
                <h2 className="text-2xl font-extrabold mt-1">Décision</h2>
                <div id="yearStatus" className="mt-5 rounded-3xl p-5 surface-2">
                  <div className="inline-flex rounded-full px-3 py-1 text-sm font-bold" style={{ background: decision.tone, color: 'white' }}>
                    {decision.title}
                  </div>
                  <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
                    {decision.text}
                  </p>
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Moyenne générale</span>
                      <strong>{generalAverage !== null ? `${formatGrade(generalAverage)}/20` : '—'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Bloc Programmation</span>
                      <strong>{programmationAverage !== null ? `${formatGrade(programmationAverage)}/20` : '—'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Bloc Maths</span>
                      <strong>{mathsAverage !== null ? `${formatGrade(mathsAverage)}/20` : '—'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-5">
              <article className="card rounded-3xl p-5 md:p-8 w-full">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                      Notes restantes
                    </p>
                    <h2 className="text-2xl font-extrabold mt-1">Ce qu'il manque</h2>
                  </div>
                  <span id="missingCountBadge" className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: 'var(--surface-2)' }}>
                    {missingEvaluations.length} restantes
                  </span>
                </div>
                <div id="missingList" className="space-y-3">
                  {missingEvaluations.length === 0 ? (
                    <div className="rounded-2xl p-5 surface-2" style={{ border: '1px solid var(--border)' }}>
                      <p className="font-semibold">Aucune note restante.</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        Toutes les évaluations du modèle ont été renseignées.
                      </p>
                    </div>
                  ) : (
                    missingEvaluations.map((item) => (
                      <div key={`${item.block.id}-${item.module.id}-${item.evaluation.id}`} className="rounded-2xl p-4 surface-2 border" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">{item.evaluation.name}</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                              {item.block.name} · {item.module.name}
                            </p>
                          </div>
                          <span className="text-sm font-semibold">coef {item.evaluation.coefficient}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>
          </section>
        )}
      </main>
    </div>
  )
}
