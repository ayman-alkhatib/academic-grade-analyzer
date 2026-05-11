import { memo } from 'react'
import { roundGrade } from '../../utils/grades'

const ValidationRules = memo(function ValidationRules({ rules }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Règles de validation (toujours actives)</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {rules.map((rule) => (
          <li key={rule.key} className="flex items-center justify-between gap-2">
            <span className="text-slate-700 dark:text-slate-200">{rule.label}</span>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                rule.passed
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
              }`}
            >
              {roundGrade(rule.value) ?? 'N/D'} / 20
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
})

export default ValidationRules
