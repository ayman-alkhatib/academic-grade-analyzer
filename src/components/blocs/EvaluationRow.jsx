import { memo } from 'react'

const EvaluationRow = memo(function EvaluationRow({
  evaluationName,
  evaluation,
  onChange,
  isPixFraction,
}) {
  const isMissing = evaluation.grade === null || evaluation.grade === '' || evaluation.grade === 'null/800'

  return (
    <tr className="border-b border-slate-200 dark:border-slate-700">
      <td className="py-2 pr-2 text-sm">{evaluationName}</td>
      <td className="py-2 pr-2 text-sm text-slate-600 dark:text-slate-300">{evaluation.coef}</td>
      <td className="py-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={evaluation.grade ?? ''}
            placeholder={isPixFraction ? 'ex: 401/800' : 'ex: 12.5'}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none ring-indigo-300 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
          />
          {isMissing && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              Manquante
            </span>
          )}
        </div>
      </td>
    </tr>
  )
})

export default EvaluationRow
