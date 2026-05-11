import { memo } from 'react'
import { computeBlockAverage, roundGrade } from '../../utils/grades'

function getThreshold(blockName) {
  if (blockName.includes('Bloc Algorithmique & Programmation')) return 10
  if (blockName.includes('Bloc Maths')) return 7
  return '-'
}

const SummaryTable = memo(function SummaryTable({ blocks }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tableau récapitulatif</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500 dark:text-slate-400">
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="py-2">Bloc</th>
              <th className="py-2">Crédits</th>
              <th className="py-2">Moyenne actuelle</th>
              <th className="py-2">Seuil requis</th>
              <th className="py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => {
              const average = computeBlockAverage(block)
              const threshold = getThreshold(block.name)
              const passed = typeof threshold === 'number' ? average !== null && average >= threshold : average !== null

              return (
                <tr key={block.name} className="border-b border-slate-200 last:border-0 dark:border-slate-700">
                  <td className="py-2 pr-2">{block.name}</td>
                  <td className="py-2 pr-2">{block.credit}</td>
                  <td className="py-2 pr-2">{roundGrade(average) ?? 'N/D'}</td>
                  <td className="py-2 pr-2">{threshold}</td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        passed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {passed ? 'Correct' : 'À risque'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
})

export default SummaryTable
