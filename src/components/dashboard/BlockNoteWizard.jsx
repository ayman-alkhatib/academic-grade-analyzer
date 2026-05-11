import { memo, useRef, useCallback } from 'react'
import { computeModuleAverage, roundGrade } from '../../utils/grades'
import EvaluationRow from '../blocs/EvaluationRow'

const BlockNoteWizard = memo(function BlockNoteWizard({
  blocks,
  activeBlockIndex,
  onActiveBlockChange,
  onGradeChange,
  onShowResults,
}) {
  const activeBlock = blocks[activeBlockIndex]
  const refMap = useRef(new Map())

  const focusNextInput = useCallback(
    (currentKey) => {
      // Build all keys in order
      const allKeys = []
      blocks.forEach((block, blockIdx) => {
        block.modules.forEach((module, modIdx) => {
          Object.keys(module.evaluations).forEach((evalName) => {
            allKeys.push(`${blockIdx}-${modIdx}-${evalName}`)
          })
        })
      })

      const currentIdx = allKeys.indexOf(currentKey)
      if (currentIdx < allKeys.length - 1) {
        const nextKey = allKeys[currentIdx + 1]
        refMap.current.get(nextKey)?.focus()
      } else if (currentIdx === allKeys.length - 1) {
        onShowResults?.()
      }
    },
    [blocks, onShowResults],
  )

  if (!activeBlock) {
    return null
  }

  return (
    <section className="min-h-screen bg-slate-100 p-4 dark:bg-slate-950 md:p-6">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
              Étape 1: Saisie des notes
            </p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Renseigne tes notes</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Complète bloc par bloc. Les notes manquantes sont optionnelles.
            </p>
          </div>
        </div>

        {/* Block navigation */}
        <div className="mb-6 flex flex-wrap gap-2">
          {blocks.map((block, index) => (
            <button
              key={block.name}
              type="button"
              onClick={() => onActiveBlockChange(index)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                index === activeBlockIndex
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              {index + 1}. {block.name.split('(')[0].trim()}
            </button>
          ))}
        </div>

        {/* Active block form */}
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{activeBlock.name}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Crédits: {activeBlock.credit} · Modules: {activeBlock.modules.length}
              </p>
            </div>
            <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {activeBlockIndex + 1} / {blocks.length}
            </span>
          </div>

          {/* Modules and evaluations */}
          <div className="space-y-6">
            {activeBlock.modules.map((module, moduleIndex) => {
              const moduleAverage = computeModuleAverage(module)

              return (
                <section
                  key={module.name}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <h3 className="font-semibold text-slate-900 dark:text-white">{module.name}</h3>
                  <p className="mb-4 text-xs text-slate-600 dark:text-slate-400">
                    Crédits: {module.credit} · Moyenne: {roundGrade(moduleAverage) ?? 'N/A'}/20
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          <th className="py-2">Évaluation</th>
                          <th className="py-2">Coef</th>
                          <th className="py-2">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(module.evaluations).map(([evaluationName, evaluation]) => {
                          const inputKey = `${activeBlockIndex}-${moduleIndex}-${evaluationName}`
                          return (
                            <EvaluationRow
                              key={evaluationName}
                              ref={(el) => {
                                if (el) refMap.current.set(inputKey, el)
                              }}
                              evaluationName={evaluationName}
                              evaluation={evaluation}
                              isPixFraction={
                                evaluationName === 'Positionnement_PIX' || evaluationName === 'Certification_PIX'
                              }
                              onChange={(value) =>
                                onGradeChange(activeBlockIndex, moduleIndex, evaluationName, value === '' ? null : value)
                              }
                              onClear={() => onGradeChange(activeBlockIndex, moduleIndex, evaluationName, null)}
                              onNextFocus={() => focusNextInput(inputKey)}
                            />
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )
            })}
          </div>

          {/* Navigation buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 dark:border-slate-700">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onActiveBlockChange(activeBlockIndex - 1)}
                disabled={activeBlockIndex === 0}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                ← Bloc précédent
              </button>
              <button
                type="button"
                onClick={() => onActiveBlockChange(activeBlockIndex + 1)}
                disabled={activeBlockIndex === blocks.length - 1}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Bloc suivant →
              </button>
            </div>
            {activeBlockIndex === blocks.length - 1 && (
              <button
                type="button"
                onClick={onShowResults}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Voir les résultats →
              </button>
            )}
          </div>
        </article>
      </div>
    </section>
  )
})

export default BlockNoteWizard
