import { formatGrade, getBlockStatus, getEvaluationInputConfig, getEvaluationInputValue } from '../utils/gradeAnalyzer'

export function AppHeader({ themeToggleLabel, onToggleTheme }) {
  return (
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
      <button id="themeToggle" className="card rounded-xl px-4 py-2 text-sm font-semibold" type="button" onClick={onToggleTheme}>
        {themeToggleLabel}
      </button>
    </header>
  )
}

function WizardEvaluationRow({ evaluation, moduleIndex, evaluationIndex, currentStep, updateGrade }) {
  const inputConfig = getEvaluationInputConfig(evaluation.id)

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-3 items-center">
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
}

function WizardModuleCard({ module, moduleAverage, moduleIndex, currentStep, updateGrade }) {
  return (
    <article className="rounded-3xl p-4 surface-2 border" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h4 className="text-lg font-bold">{module.name}</h4>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {module.credit} crédits
          </p>
        </div>
        <span className="text-sm font-semibold">{moduleAverage !== null ? `${formatGrade(moduleAverage)}/20` : '—'}</span>
      </div>

      <div className="grid gap-3">
        {module.evaluations.map((evaluation, evaluationIndex) => (
          <WizardEvaluationRow
            key={evaluation.id}
            evaluation={evaluation}
            moduleIndex={moduleIndex}
            evaluationIndex={evaluationIndex}
            currentStep={currentStep}
            updateGrade={updateGrade}
          />
        ))}
      </div>
    </article>
  )
}

export function WizardSection({ activeBlock, blocksLength, currentStep, progress, moduleAverages, generalAverage, activeBlockAverage, missingCount, updateGrade, onPrevious, onReturnToAnalysis, onNext }) {
  return (
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
            Bloc {currentStep + 1} / {blocksLength}
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
              {activeBlock.modules.map((module, moduleIndex) => (
                <WizardModuleCard
                  key={module.id}
                  module={module}
                  moduleAverage={moduleAverages[moduleIndex] ?? null}
                  moduleIndex={moduleIndex}
                  currentStep={currentStep}
                  updateGrade={updateGrade}
                />
              ))}
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
                <p className="text-3xl font-extrabold mt-1">{missingCount}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <button id="prevBtn" className="rounded-2xl px-5 py-3 font-semibold border" style={{ borderColor: 'var(--border)' }} type="button" onClick={onPrevious} disabled={currentStep === 0}>
            Bloc précédent
          </button>
          <button id="backToAnalysisBtn" className="rounded-2xl px-5 py-3 font-semibold border" style={{ borderColor: 'var(--border)' }} type="button" onClick={onReturnToAnalysis}>
            Retour à l'analyse
          </button>
        </div>
        <div className="flex gap-3">
          <button id="nextBtn" className="rounded-2xl px-5 py-3 font-semibold text-white" style={{ background: 'var(--primary)' }} type="button" onClick={onNext}>
            {currentStep < blocksLength - 1 ? 'Bloc suivant' : 'Visualiser le tableau'}
          </button>
        </div>
      </div>
    </section>
  )
}

function DashboardBlockCard({ block, average }) {
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
}

function DecisionPanel({ decision, generalAverage, programmationAverage, mathsAverage }) {
  return (
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
  )
}

function MissingEvaluationsPanel({ missingEvaluations, blocks }) {
  return (
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
      <div id="missingList" className="space-y-4">
        {missingEvaluations.length === 0 ? (
          <div className="rounded-2xl p-5 surface-2" style={{ border: '1px solid var(--border)' }}>
            <p className="font-semibold">Aucune note restante.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Toutes les évaluations du modèle ont été renseignées.
            </p>
          </div>
        ) : (
          blocks.map((block) => {
            const blockMissing = missingEvaluations.filter((item) => item.block.id === block.id)
            return blockMissing.length > 0 ? (
              <div key={block.id} className="rounded-2xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <h3 className="font-bold text-base mb-3">{block.name}</h3>
                <div className="space-y-2 ml-2">
                  {blockMissing.map((item) => (
                    <div key={`${item.block.id}-${item.module.id}-${item.evaluation.id}`} className="rounded-xl p-3 border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm">{item.evaluation.name}</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                            {item.module.name}
                          </p>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                          coef {item.evaluation.coefficient}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          })
        )}
      </div>
    </article>
  )
}

export function DashboardSection({ blocks, moduleResults, decision, generalAverage, programmationAverage, mathsAverage, missingEvaluations, onEdit }) {
  return (
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
            <button id="editBtn" className="rounded-2xl px-4 py-3 font-semibold border" style={{ borderColor: 'var(--border)' }} type="button" onClick={onEdit}>
              Modifier les notes
            </button>
          </div>
          <div id="blocksGrid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 ">
            {blocks.map((block, index) => (
              <DashboardBlockCard key={block.id} block={block} average={moduleResults[index]?.average ?? null} />
            ))}
          </div>
        </div>

        <DecisionPanel decision={decision} generalAverage={generalAverage} programmationAverage={programmationAverage} mathsAverage={mathsAverage} />
      </section>

      <section className="grid grid-cols-1 gap-5">
        <MissingEvaluationsPanel missingEvaluations={missingEvaluations} blocks={blocks} />
      </section>
    </section>
  )
}
