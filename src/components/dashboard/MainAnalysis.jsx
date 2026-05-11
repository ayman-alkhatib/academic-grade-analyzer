import { memo } from 'react'
import { roundGrade } from '../../utils/grades'

const MainAnalysis = memo(function MainAnalysis({ status, feasibility }) {
  const blocking = status.failedRules.map((rule) => rule.label).join(' · ') || 'Aucun blocage'

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Ce qu’il faut pour valider l’année</h2>
      <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
        <li>
          <strong>Est-ce que l’année est validée actuellement ?</strong>{' '}
          {status.isValidated ? 'Oui, année validée.' : 'Non, année non validée.'}
        </li>
        <li>
          <strong>Quel bloc empêche la validation ?</strong> {blocking}
        </li>
        <li>
          <strong>Quelle note minimale faut-il sur les notes restantes ?</strong>{' '}
          {feasibility.generalNeed.message}
        </li>
        <li>
          <strong>Est-ce encore possible de valider l’année ?</strong>{' '}
          {feasibility.isFeasible ? 'Oui, c’est encore possible.' : 'Non, objectifs incompatibles.'}
        </li>
        <li>
          <strong>Quel objectif est le plus difficile ?</strong> {feasibility.hardestObjective}
          {feasibility.generalNeed.status === 'reachable' && (
            <> (≈ {roundGrade(Math.max(feasibility.generalNeed.neededAverage || 0, feasibility.programmingNeed.neededAverage || 0, feasibility.mathsNeed.neededAverage || 0))}/20)</>
          )}
        </li>
      </ul>
    </section>
  )
})

export default MainAnalysis
