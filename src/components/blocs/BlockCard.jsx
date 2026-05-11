import { memo, useMemo, useState } from 'react'
import { computeBlockAverage, computeModuleAverage, roundGrade } from '../../utils/grades'
import EvaluationRow from './EvaluationRow'

const statusClasses = {
  ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  risk: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  fail: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
}

function getBlockStatus(name, average) {
  const target = name.includes('Bloc Maths') ? 7 : name.includes('Bloc Algorithmique & Programmation') ? 10 : null
  if (target === null || average === null) return { label: 'En cours', color: 'risk' }
  if (average >= target) return { label: 'Seuil atteint', color: 'ok' }
  return { label: 'Sous le seuil', color: 'fail' }
}

const BlockCard = memo(function BlockCard({ block, blockIndex, onGradeChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const blockAverage = useMemo(() => computeBlockAverage(block), [block])
  const status = getBlockStatus(block.name, blockAverage)

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{block.name}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Crédits: {block.credit} · Moyenne: {roundGrade(blockAverage) ?? 'N/A'}/20
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses[status.color]}`}>
          {status.label}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {block.modules.map((module, moduleIndex) => {
            const moduleAverage = computeModuleAverage(module)
            return (
              <section key={module.name} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <h4 className="font-medium text-slate-900 dark:text-white">{module.name}</h4>
                <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">
                  Crédits: {module.credit} · Moyenne: {roundGrade(moduleAverage) ?? 'N/D'}/20
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        <th className="py-2">Évaluation</th>
                        <th className="py-2">Coef</th>
                        <th className="py-2">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(module.evaluations).map(([evaluationName, evaluation]) => (
                        <EvaluationRow
                          key={evaluationName}
                          evaluationName={evaluationName}
                          evaluation={evaluation}
                          isPixFraction={
                            evaluationName === 'Positionnement_PIX' || evaluationName === 'Certification_PIX'
                          }
                          onChange={(value) =>
                            onGradeChange(blockIndex, moduleIndex, evaluationName, value === '' ? null : value)
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </article>
  )
})

export default BlockCard
