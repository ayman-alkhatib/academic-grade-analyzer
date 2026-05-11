import { memo, useRef, forwardRef } from 'react'

const EvaluationRow = memo(
  forwardRef(function EvaluationRow(
    {
      evaluationName,
      evaluation,
      onChange,
      onClear,
      onNextFocus,
      isPixFraction,
    },
    ref,
  ) {
  const isMissing = evaluation.grade === null || evaluation.grade === '' || evaluation.grade === 'null/800'
  const inputRef = useRef(null)

  // Forward the ref if provided
  if (ref) {
    ref.current = inputRef.current
  }

  const handleBlur = () => {
    if (isPixFraction && evaluation.grade && !evaluation.grade.includes('/')) {
      // Auto-format: if user entered just a number, append /800
      onChange(`${evaluation.grade}/800`)
    }
  }

  const handleClearAndNext = () => {
    onClear()
    setTimeout(() => onNextFocus?.(), 0)
  }

  const displayValue = isPixFraction && evaluation.grade?.includes('/')
    ? evaluation.grade.split('/')[0] // Show only numerator to user
    : evaluation.grade ?? ''

  return (
    <tr className="border-b border-slate-200 dark:border-slate-700">
      <td className="py-2 pr-2 text-sm">{evaluationName}</td>
      <td className="py-2 pr-2 text-sm text-slate-600 dark:text-slate-300">{evaluation.coef}</td>
      <td className="py-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={displayValue}
              placeholder={isPixFraction ? 'ex: 401' : 'ex: 12.5'}
              onChange={(event) => onChange(event.target.value)}
              onBlur={handleBlur}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none ring-indigo-300 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
            />
            {isPixFraction && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-slate-500 dark:text-slate-400">
                /800
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClearAndNext}
            className="whitespace-nowrap rounded-md bg-slate-100 border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Je ne sais pas
          </button>
          {isMissing && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              ✕
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}))

export default EvaluationRow
