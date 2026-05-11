import {
  computeBlockAverage,
  computeGeneralAverage,
  computeNeededGradeForBlockTarget,
  computeNeededGradeForGeneralTarget,
} from './grades'

const PROGRAMMATION_BLOCK = 'Bloc Algorithmique & Programmation'
const MATHS_BLOCK = 'Bloc Maths'

export function computeValidationStatus(data) {
  const programmingBlock = data.blocks.find((block) => block.name.includes(PROGRAMMATION_BLOCK))
  const mathsBlock = data.blocks.find((block) => block.name.includes(MATHS_BLOCK))

  const generalAverage = computeGeneralAverage(data.blocks, data.total_credits)
  const programmingAverage = programmingBlock ? computeBlockAverage(programmingBlock) : null
  const mathsAverage = mathsBlock ? computeBlockAverage(mathsBlock) : null

  const rules = [
    {
      key: 'general',
      label: 'Moyenne générale >= 10/20',
      passed: generalAverage !== null && generalAverage >= 10,
      value: generalAverage,
      target: 10,
    },
    {
      key: 'programming',
      label: 'Bloc Algorithmique & Programmation >= 10/20',
      passed: programmingAverage !== null && programmingAverage >= 10,
      value: programmingAverage,
      target: 10,
    },
    {
      key: 'maths',
      label: 'Bloc Maths >= 7/20',
      passed: mathsAverage !== null && mathsAverage >= 7,
      value: mathsAverage,
      target: 7,
    },
  ]

  return {
    generalAverage,
    programmingAverage,
    mathsAverage,
    isValidated: rules.every((rule) => rule.passed),
    failedRules: rules.filter((rule) => !rule.passed),
    rules,
  }
}

export function computeOverallFeasibility(data) {
  const programmingBlock = data.blocks.find((block) => block.name.includes(PROGRAMMATION_BLOCK))
  const mathsBlock = data.blocks.find((block) => block.name.includes(MATHS_BLOCK))

  const generalNeed = computeNeededGradeForGeneralTarget(data, 10)
  const programmingNeed = programmingBlock
    ? computeNeededGradeForBlockTarget(programmingBlock, 10)
    : { status: 'impossible', neededAverage: null, message: 'Bloc introuvable' }
  const mathsNeed = mathsBlock
    ? computeNeededGradeForBlockTarget(mathsBlock, 7)
    : { status: 'impossible', neededAverage: null, message: 'Bloc introuvable' }

  const impossibleTargets = [
    ['Moyenne générale', generalNeed],
    ['Bloc programmation', programmingNeed],
    ['Bloc maths', mathsNeed],
  ].filter(([, result]) => result.status === 'impossible')

  const objectiveDifficulty = [
    { label: 'Moyenne générale', value: generalNeed.neededAverage, status: generalNeed.status },
    { label: 'Bloc programmation', value: programmingNeed.neededAverage, status: programmingNeed.status },
    { label: 'Bloc maths', value: mathsNeed.neededAverage, status: mathsNeed.status },
  ]

  const hardest = objectiveDifficulty
    .filter((item) => item.status === 'reachable' && item.value !== null)
    .sort((a, b) => b.value - a.value)[0]

  return {
    generalNeed,
    programmingNeed,
    mathsNeed,
    isFeasible: impossibleTargets.length === 0,
    impossibleTargets: impossibleTargets.map(([label]) => label),
    hardestObjective: hardest?.label ?? (impossibleTargets[0]?.[0] ?? 'Objectifs atteints'),
  }
}
