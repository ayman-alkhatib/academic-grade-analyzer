import { useEffect, useMemo, useState } from 'react'
import {
  GRADES_STORAGE_KEY,
  STORAGE_KEY,
  applyStoredGrades,
  computeBlockAverage,
  computeGeneralAverage,
  computeModuleAverage,
  computeScenario,
  getEvaluationInputConfig,
  getEvaluationInputValue,
  getEvaluationScale,
  getMissingEvaluations,
  getYearDecision,
  hasPreloadedGrades,
  initialBlocks,
  serializeGrades,
} from '../utils/gradeAnalyzer'

export function useGradeAnalyzer() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) ?? 'light')
  const [blocks, setBlocks] = useState(() => {
    try {
      const storedGrades = localStorage.getItem(GRADES_STORAGE_KEY)
      if (storedGrades) {
        const gradesMap = JSON.parse(storedGrades)
        return applyStoredGrades(initialBlocks, gradesMap)
      }
    } catch (error) {
      console.warn('Failed to load saved grades:', error)
    }

    return initialBlocks
  })
  const [currentStep, setCurrentStep] = useState(0)
  const [showDashboard, setShowDashboard] = useState(() => {
    const hasSavedGrades = !!localStorage.getItem(GRADES_STORAGE_KEY)
    return hasSavedGrades || hasPreloadedGrades
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    const gradesMap = serializeGrades(blocks)
    localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(gradesMap))
  }, [blocks])

  const moduleResults = useMemo(
    () =>
      blocks.map((block) => ({
        average: computeBlockAverage(block),
        moduleResults: block.modules.map((module) => computeModuleAverage(module)),
      })),
    [blocks],
  )

  const generalAverage = useMemo(() => computeGeneralAverage(blocks), [blocks])
  const missingEvaluations = useMemo(() => getMissingEvaluations(blocks), [blocks])
  const scenario = useMemo(() => computeScenario(blocks), [blocks])
  const programmationAverage = moduleResults[0]?.average ?? null
  const mathsAverage = moduleResults[3]?.average ?? null
  const decision = useMemo(
    () => getYearDecision(blocks, generalAverage, programmationAverage, mathsAverage, scenario, missingEvaluations.length > 0),
    [blocks, generalAverage, programmationAverage, mathsAverage, scenario, missingEvaluations.length],
  )

  const activeBlock = blocks[currentStep]
  const activeBlockAverage = moduleResults[currentStep]?.average ?? null
  const progress = ((currentStep + 1) / blocks.length) * 100

  const updateGrade = (blockIndex, moduleIndex, evaluationIndex, nextValue) => {
    setBlocks((current) =>
      current.map((block, currentBlockIndex) => {
        if (currentBlockIndex !== blockIndex) {
          return block
        }

        return {
          ...block,
          modules: block.modules.map((module, currentModuleIndex) => {
            if (currentModuleIndex !== moduleIndex) {
              return module
            }

            return {
              ...module,
              evaluations: module.evaluations.map((evaluation, currentEvaluationIndex) => {
                if (currentEvaluationIndex !== evaluationIndex) {
                  return evaluation
                }

                return {
                  ...evaluation,
                  grade: nextValue,
                }
              }),
            }
          }),
        }
      }),
    )
  }

  const goPrevious = () => setCurrentStep((step) => Math.max(0, step - 1))

  const goNext = () => {
    if (currentStep < blocks.length - 1) {
      setCurrentStep((step) => step + 1)
      return
    }

    setShowDashboard(true)
  }

  const resetWizard = () => {
    setCurrentStep(0)
    setShowDashboard(false)
  }

  const returnToAnalysis = () => {
    setShowDashboard(true)
  }

  const themeToggleLabel = theme === 'dark' ? 'Mode clair' : 'Mode sombre'

  return {
    theme,
    setTheme,
    themeToggleLabel,
    blocks,
    currentStep,
    showDashboard,
    moduleResults,
    generalAverage,
    missingEvaluations,
    scenario,
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
    getEvaluationInputConfig,
    getEvaluationInputValue,
    getEvaluationScale,
  }
}
