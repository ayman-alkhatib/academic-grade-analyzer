import coefReal from '../data/coef_real.json'

export const STORAGE_KEY = 'l1-grade-analyzer-theme'
export const GRADES_STORAGE_KEY = 'l1-grade-analyzer-grades'

export const validationRules = { general: 10, programmation: 10, maths: 7 }

export function mapRealCoefToApp(blocksRaw) {
  return blocksRaw.map((b, bIndex) => ({
    id: `block-${bIndex}`,
    name: b.name,
    threshold: b.threshold ?? null,
    credits: b.credit ?? 0,
    modules: (b.modules || []).map((m, mIndex) => ({
      id: `block-${bIndex}-mod-${mIndex}`,
      name: m.name,
      credit: m.credit,
      evaluations: Object.entries(m.evaluations || {}).map(([evKey, ev]) => ({
        id: evKey,
        name: evKey,
        coefficient: ev.coef ?? ev.coefficient ?? 1,
        grade: ev.grade,
      })),
    })),
  }))
}

export function getEvaluationScale(evaluationId) {
  if (evaluationId === 'Certification_PIX' || evaluationId === 'Score_PIX') {
    return 800
  }

  if (evaluationId === 'S1_Campagne_1' || evaluationId === 'S1_Campagne_2' || evaluationId === 'S1_Campagne_3') {
    return 100
  }

  return 20
}

export function getEvaluationPlaceholder(evaluationId) {
  const scale = getEvaluationScale(evaluationId)

  if (scale === 800) {
    return 'ex: 545'
  }

  if (scale === 100) {
    return 'ex: 80'
  }

  return '0-20'
}

export function getEvaluationInputConfig(evaluationId) {
  const scale = getEvaluationScale(evaluationId)

  return {
    max: scale,
    min: 0,
    step: scale === 20 ? 0.25 : 1,
    placeholder: getEvaluationPlaceholder(evaluationId),
  }
}

export function parseGrade(value, evaluationId) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null
    }

    const scale = getEvaluationScale(evaluationId)

    if (scale === 20) {
      return value >= 0 && value <= 20 ? value : null
    }

    if (scale === 100) {
      return value >= 0 && value <= 100 ? (value / 100) * 20 : null
    }

    if (scale === 800) {
      return value >= 0 && value <= 800 ? (value / 800) * 20 : null
    }

    return value
  }

  const text = String(value).trim().replace(',', '.')
  if (!text) {
    return null
  }

  const scale = getEvaluationScale(evaluationId)

  if (/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(text)) {
    const [numerator, denominator] = text.split('/').map(Number)
    if (!denominator) {
      return null
    }

    if (scale !== 20) {
      return (numerator / denominator) * 20
    }

    return null
  }

  const parsed = Number(text)
  if (!Number.isFinite(parsed)) {
    return null
  }

  if (scale === 20) {
    return parsed >= 0 && parsed <= 20 ? parsed : null
  }

  if (scale === 100) {
    return parsed >= 0 && parsed <= 100 ? (parsed / 100) * 20 : null
  }

  if (scale === 800) {
    return parsed >= 0 && parsed <= 800 ? (parsed / 800) * 20 : null
  }

  return parsed
}

export function getEvaluationInputValue(evaluation) {
  if (evaluation.grade === null || evaluation.grade === undefined || evaluation.grade === '') {
    return ''
  }

  if (typeof evaluation.grade === 'number') {
    return evaluation.grade
  }

  const numericGrade = parseGrade(evaluation.grade, evaluation.id)
  return numericGrade === null ? '' : numericGrade
}

export function formatGrade(value) {
  if (value === null || value === undefined) {
    return '—'
  }

  const normalized = Math.round((value + Number.EPSILON) * 20) / 20
  return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(2).replace(/\.00$/, '')
}

export function computeKnownWeightedAverage(items, getGrade, getWeight) {
  let weighted = 0
  let weightTotal = 0

  items.forEach((item) => {
    const grade = getGrade(item)
    const weight = getWeight(item)
    if (grade !== null && grade !== '' && !Number.isNaN(Number(grade))) {
      weighted += Number(grade) * Number(weight)
      weightTotal += Number(weight)
    }
  })

  return weightTotal ? weighted / weightTotal : null
}

export function computeModuleAverage(module) {
  return computeKnownWeightedAverage(module.evaluations, (evaluation) => parseGrade(evaluation.grade, evaluation.id), (evaluation) => evaluation.coefficient)
}

export function computeBlockAverage(block) {
  return computeKnownWeightedAverage(block.modules, (module) => computeModuleAverage(module), (module) => module.credit)
}

export function computeGeneralAverage(blocks) {
  return computeKnownWeightedAverage(
    blocks.flatMap((block) => block.modules),
    (module) => computeModuleAverage(module),
    (module) => module.credit,
  )
}

export function getMissingEvaluations(blocks) {
  const missing = []
  blocks.forEach((block) => {
    block.modules.forEach((module) => {
      module.evaluations.forEach((evaluation) => {
        if (evaluation.grade === null || evaluation.grade === '') {
          missing.push({ block, module, evaluation })
        }
      })
    })
  })
  return missing
}

export function estimateNeededAverageForRemaining(target, knownContribution, remainingWeight, totalWeight) {
  if (remainingWeight <= 0) {
    return null
  }
  return (target * totalWeight - knownContribution) / remainingWeight
}

export function computeScenario(blocks) {
  let knownContribution = 0
  let remainingWeight = 0
  let totalWeight = 0

  blocks.forEach((block) => {
    block.modules.forEach((module) => {
      module.evaluations.forEach((evaluation) => {
        const normalizedWeight = module.credit * evaluation.coefficient
        totalWeight += normalizedWeight
        const grade = parseGrade(evaluation.grade, evaluation.id)
        if (grade === null) {
          remainingWeight += normalizedWeight
        } else {
          knownContribution += grade * normalizedWeight
        }
      })
    })
  })

  const bestCase = totalWeight ? (knownContribution + remainingWeight * 20) / totalWeight : null
  const worstCase = totalWeight ? knownContribution / totalWeight : null
  const needed = estimateNeededAverageForRemaining(validationRules.general, knownContribution, remainingWeight, totalWeight)

  console.log('Scenario: knownContribution=', knownContribution, 'remainingWeight=', remainingWeight, 'totalWeight=', totalWeight, 'bestCase=', bestCase)
  return { knownContribution, remainingWeight, bestCase, worstCase, needed }
}

export function getBlockStatus(block, average) {
  if (block.threshold !== null) {
    if (average === null) {
      return { color: 'var(--warning)', label: 'A completer' }
    }

    return average >= block.threshold
      ? { color: 'var(--success)', label: 'Seuil atteint' }
      : { color: 'var(--danger)', label: 'Sous le seuil' }
  }

  if (average === null) {
    return { color: 'var(--warning)', label: 'Incomplet' }
  }

  return average >= 10 ? { color: 'var(--success)', label: 'Bonne contribution' } : { color: 'var(--danger)', label: 'A renforcer' }
}

export function collectThresholdFeasibility(block) {
  let knownSum = 0
  let remainingWeight = 0
  let totalWeight = 0

  if (!block) {
    return { knownSum, remainingWeight, totalWeight, possibleMax: null }
  }

  block.modules.forEach((module) => {
    module.evaluations.forEach((evaluation) => {
      const grade = parseGrade(evaluation.grade, evaluation.id)
      const weight = module.credit * evaluation.coefficient
      totalWeight += weight

      if (grade === null) {
        remainingWeight += weight
        return
      }

      knownSum += grade * weight
    })
  })

  return {
    knownSum,
    remainingWeight,
    totalWeight,
    possibleMax: totalWeight ? (knownSum + remainingWeight * 20) / totalWeight : null,
  }
}

export function isThresholdImpossible(block, threshold) {
  const { possibleMax } = collectThresholdFeasibility(block)
  return possibleMax !== null && possibleMax < threshold
}

export function getImpossibleThresholdBlocks(blocks) {
  return blocks
    .filter((block) => block.threshold !== null && isThresholdImpossible(block, block.threshold))
    .map((block) => block.name)
}

export function getYearDecision(blocks, general, programmation, maths, scenario, hasMissing) {
  const currentValidated = general !== null && programmation !== null && maths !== null && general >= 10 && programmation >= 10 && maths >= 7

  if (scenario.bestCase !== null && scenario.bestCase < validationRules.general) {
    return {
      title: 'Validation impossible',
      tone: 'var(--danger)',
      text: 'Meme avec des notes maximales sur le reste, la moyenne generale ne peut pas atteindre 10/20.',
    }
  }

  if (programmation === null || programmation < validationRules.programmation) {
    const progState = collectThresholdFeasibility(blocks[0])
    console.log('Prog check: knownSum=', progState.knownSum, 'remainingWeight=', progState.remainingWeight, 'totalWeight=', progState.totalWeight, 'possibleMax=', progState.possibleMax)
    if (isThresholdImpossible(blocks[0], validationRules.programmation)) {
      return {
        title: 'Validation impossible',
        tone: 'var(--danger)',
        text: 'Le bloc Programmation ne peut pas atteindre le seuil requis de 10/20.',
      }
    }
  }

  if (maths === null || maths < validationRules.maths) {
    const mathsState = collectThresholdFeasibility(blocks[3])
    console.log('Maths check: knownSum=', mathsState.knownSum, 'remainingWeight=', mathsState.remainingWeight, 'totalWeight=', mathsState.totalWeight, 'possibleMax=', mathsState.possibleMax)
    if (isThresholdImpossible(blocks[3], validationRules.maths)) {
      return {
        title: 'Validation impossible',
        tone: 'var(--danger)',
        text: 'Le bloc Maths ne peut pas atteindre le seuil requis de 7/20.',
      }
    }
  }

  const blocksWithThresholdImpossible = getImpossibleThresholdBlocks(blocks)

  if (blocksWithThresholdImpossible.length > 0) {
    return {
      title: 'Validation impossible',
      tone: 'var(--danger)',
      text: `Les blocs ${blocksWithThresholdImpossible.join(', ')} ne peuvent pas atteindre leur seuil requis.`,
    }
  }

  if (currentValidated && !hasMissing) {
    return {
      title: 'Validation déjà acquise',
      tone: 'var(--success)',
      text: 'Toutes les conditions connues sont remplies et il ne reste plus de note manquante.',
    }
  }

  if (currentValidated) {
    return {
      title: 'Validation presque assurée',
      tone: 'var(--success)',
      text: 'Les seuils visibles sont deja atteints. Les notes restantes peuvent encore ameliorer ou fragiliser legerement la situation.',
    }
  }

  return {
    title: 'Validation possible',
    tone: 'var(--warning)',
    text: "L'annee reste atteignable, mais il faut surveiller les blocs a seuil et les notes encore manquantes.",
  }
}

export function serializeGrades(blocks) {
  const gradesMap = {}
  blocks.forEach((block) => {
    block.modules.forEach((module) => {
      module.evaluations.forEach((evaluation) => {
        const key = `${block.id}|${module.id}|${evaluation.id}`
        gradesMap[key] = evaluation.grade
      })
    })
  })
  return gradesMap
}

export function applyStoredGrades(blocks, gradesMap) {
  if (!gradesMap || typeof gradesMap !== 'object') return blocks

  return blocks.map((block) => ({
    ...block,
    modules: block.modules.map((module) => ({
      ...module,
      evaluations: module.evaluations.map((evaluation) => {
        const key = `${block.id}|${module.id}|${evaluation.id}`
        return gradesMap[key] !== undefined ? { ...evaluation, grade: gradesMap[key] } : evaluation
      }),
    })),
  }))
}

export const initialBlocks = mapRealCoefToApp(coefReal.blocks || [])

export const hasPreloadedGrades = initialBlocks.some((block) =>
  block.modules.some((module) => module.evaluations.some((evaluation) => evaluation.grade !== null && evaluation.grade !== '')),
)
