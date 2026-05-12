import { useGradeAnalyzer } from './hooks/useGradeAnalyzer'
import { AppHeader, DashboardSection, WizardSection } from './components/GradeAnalyzerComponents'

export default function App() {
  const {
    themeToggleLabel,
    setTheme,
    blocks,
    currentStep,
    showDashboard,
    moduleResults,
    generalAverage,
    missingEvaluations,
    programmationAverage,
    mathsAverage,
    decision,
    activeBlock,
    activeBlockAverage,
    progress,
    updateGrade,
    goPrevious,
    goNext,
    resetWizard,
    returnToAnalysis,
  } = useGradeAnalyzer()

  return (
    <div className="min-h-screen">
      <AppHeader themeToggleLabel={themeToggleLabel} onToggleTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))} />

      <main className="max-w-7xl mx-auto px-4 pb-12 md:px-6">
        {!showDashboard ? (
          <WizardSection
            activeBlock={activeBlock}
            blocksLength={blocks.length}
            currentStep={currentStep}
            progress={progress}
            moduleAverages={moduleResults[currentStep]?.moduleResults ?? []}
            generalAverage={generalAverage}
            activeBlockAverage={activeBlockAverage}
            missingCount={missingEvaluations.length}
            updateGrade={updateGrade}
            onPrevious={goPrevious}
            onReturnToAnalysis={returnToAnalysis}
            onNext={goNext}
          />
        ) : (
          <DashboardSection
            blocks={blocks}
            moduleResults={moduleResults}
            decision={decision}
            generalAverage={generalAverage}
            programmationAverage={programmationAverage}
            mathsAverage={mathsAverage}
            missingEvaluations={missingEvaluations}
            onEdit={resetWizard}
          />
        )}
      </main>
    </div>
  )
}
