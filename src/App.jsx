import { useCallback, useMemo, useState } from 'react'
import BlockCard from './components/blocs/BlockCard'
import BlockThresholdChart from './components/charts/BlockThresholdChart'
import BlockNoteWizard from './components/dashboard/BlockNoteWizard'
import MainAnalysis from './components/dashboard/MainAnalysis'
import SummaryCards from './components/dashboard/SummaryCards'
import SummaryTable from './components/dashboard/SummaryTable'
import ValidationRules from './components/dashboard/ValidationRules'
import { initialData } from './data/initialData'
import { useIndexedDB } from './hooks/useIndexedDB'
import { useTheme } from './hooks/useTheme'
import {
  computeGeneralAverage,
  countMissingEvaluations,
  roundGrade,
} from './utils/grades'
import { computeOverallFeasibility, computeValidationStatus } from './utils/validation'

function App() {
  const { data, setData, loaded, reset } = useIndexedDB(initialData)
  const { preference, setPreference } = useTheme()
  const [activeBlockIndex, setActiveBlockIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)

  const handleGradeChange = useCallback((blockIndex, moduleIndex, evaluationName, value) => {
    setData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block, bIndex) =>
        bIndex === blockIndex
          ? {
              ...block,
              modules: block.modules.map((module, mIndex) =>
                mIndex === moduleIndex
                  ? {
                      ...module,
                      evaluations: {
                        ...module.evaluations,
                        [evaluationName]: {
                          ...module.evaluations[evaluationName],
                          grade: value,
                        },
                      },
                    }
                  : module,
              ),
            }
          : block,
      ),
    }))
  }, [setData])

  const handleActiveBlockChange = useCallback(
    (nextIndex) => {
      setActiveBlockIndex(Math.max(0, Math.min(data.blocks.length - 1, nextIndex)))
    },
    [data.blocks.length],
  )

  const handleShowResults = useCallback(() => {
    setShowResults(true)
  }, [])

  const handleBackToEdit = useCallback(() => {
    setShowResults(false)
  }, [])

  const status = useMemo(() => computeValidationStatus(data), [data])
  const feasibility = useMemo(() => computeOverallFeasibility(data), [data])

  const summaryCards = useMemo(
    () => [
      {
        label: 'Moyenne générale actuelle',
        value: `${roundGrade(computeGeneralAverage(data.blocks, data.total_credits)) ?? 'N/D'} / 20`,
      },
      { label: 'Statut global', value: status.isValidated ? 'Année validée' : 'Année non validée' },
      {
        label: 'Moyenne du bloc Programmation',
        value: `${roundGrade(status.programmingAverage) ?? 'N/D'} / 20`,
      },
      { label: 'Moyenne du bloc Maths', value: `${roundGrade(status.mathsAverage) ?? 'N/D'} / 20` },
      { label: 'Nombre de notes restantes', value: `${countMissingEvaluations(data)}` },
      { label: 'Nombre de crédits totaux', value: `${data.total_credits}` },
    ],
    [data, status],
  )

  if (!loaded) {
    return <p className="p-6 text-center text-slate-700 dark:text-slate-200">Chargement des données…</p>
  }

  if (!showResults) {
    return (
      <BlockNoteWizard
        blocks={data.blocks}
        activeBlockIndex={activeBlockIndex}
        onActiveBlockChange={handleActiveBlockChange}
        onGradeChange={handleGradeChange}
        onShowResults={handleShowResults}
      />
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Analyseur académique — L1 Informatique</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Outil de décision pour valider l’année selon les règles officielles.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="theme" className="text-sm">
                Thème
              </label>
              <select
                id="theme"
                value={preference}
                onChange={(event) => setPreference(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="system">Système</option>
              </select>
              <button
                type="button"
                onClick={handleBackToEdit}
                className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                ← Modifier les notes
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-md bg-slate-800 px-3 py-1 text-sm text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </header>

        <SummaryCards cards={summaryCards} />
        <ValidationRules rules={status.rules} />
        <SummaryTable blocks={data.blocks} />
        <MainAnalysis status={status} feasibility={feasibility} />
        <BlockThresholdChart blocks={data.blocks} />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Blocs détaillés</h2>
          {data.blocks.map((block, blockIndex) => (
            <BlockCard
              key={block.name}
              block={block}
              blockIndex={blockIndex}
              onGradeChange={handleGradeChange}
            />
          ))}
        </section>
      </div>
    </main>
  )
}

export default App
