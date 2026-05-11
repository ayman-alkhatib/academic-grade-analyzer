import { parseFractionGrade } from './pix'

export function normalizeGrade(value) {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const cleaned = value.trim()
    if (!cleaned || cleaned.toLowerCase() === 'null') return null
    if (cleaned.includes('/')) return parseFractionGrade(cleaned)

    const parsed = Number(cleaned.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function getEvaluationGrade(evaluation) {
  return normalizeGrade(evaluation?.grade)
}

export function roundGrade(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  return Math.round(value * 100) / 100
}

export function computeModuleAverage(module) {
  let weightedSum = 0
  let usedCoef = 0

  Object.values(module.evaluations).forEach((evaluation) => {
    const grade = getEvaluationGrade(evaluation)
    const coef = Number(evaluation.coef) || 0
    if (grade === null || coef <= 0) return

    weightedSum += grade * coef
    usedCoef += coef
  })

  if (usedCoef === 0) return null
  return weightedSum / usedCoef
}

export function computeBlockAverage(block) {
  let weightedSum = 0
  let usedCredits = 0

  block.modules.forEach((module) => {
    const moduleAverage = computeModuleAverage(module)
    const credit = Number(module.credit) || 0
    if (moduleAverage === null || credit <= 0) return

    weightedSum += moduleAverage * credit
    usedCredits += credit
  })

  if (usedCredits === 0) return null
  return weightedSum / usedCredits
}

export function computeGeneralAverage(blocks, totalCredits = 60) {
  let weightedSum = 0

  blocks.forEach((block) => {
    block.modules.forEach((module) => {
      const moduleAverage = computeModuleAverage(module)
      const credit = Number(module.credit) || 0
      if (moduleAverage === null || credit <= 0) return
      weightedSum += moduleAverage * credit
    })
  })

  if (totalCredits <= 0) return null
  return weightedSum / totalCredits
}

function collectAggregates(modules) {
  let knownWeighted = 0
  let missingWeight = 0
  let totalWeight = 0

  modules.forEach((module) => {
    const credit = Number(module.credit) || 0
    if (credit <= 0) return

    Object.values(module.evaluations).forEach((evaluation) => {
      const coef = Number(evaluation.coef) || 0
      if (coef <= 0) return

      const weight = credit * coef
      const grade = normalizeGrade(evaluation.grade)
      totalWeight += weight
      if (grade === null) {
        missingWeight += weight
      } else {
        knownWeighted += grade * weight
      }
    })
  })

  return { knownWeighted, missingWeight, totalWeight }
}

function computeNeededGrade(target, aggregates) {
  const { knownWeighted, missingWeight, totalWeight } = aggregates
  if (totalWeight <= 0) {
    return { status: 'impossible', neededAverage: null, message: 'Aucune donnée exploitable' }
  }

  const currentWithZeros = knownWeighted / totalWeight
  if (missingWeight === 0) {
    if (currentWithZeros >= target) {
      return { status: 'reached', neededAverage: 0, message: 'Objectif déjà atteint' }
    }

    return {
      status: 'impossible',
      neededAverage: null,
      message: 'Validation impossible même avec 20/20 sur les notes restantes',
    }
  }

  const required = (target * totalWeight - knownWeighted) / missingWeight
  if (required <= 0) {
    return { status: 'reached', neededAverage: 0, message: 'Objectif déjà atteint' }
  }

  if (required > 20) {
    return {
      status: 'impossible',
      neededAverage: required,
      message: 'Validation impossible même avec 20/20 sur les notes restantes',
    }
  }

  return {
    status: 'reachable',
    neededAverage: required,
    message: `Il faut au moins ${roundGrade(required)}/20 de moyenne sur les notes restantes`,
  }
}

export function computeNeededGradeForGeneralTarget(data, target = 10) {
  const modules = data.blocks.flatMap((block) => block.modules)
  return computeNeededGrade(target, collectAggregates(modules))
}

export function computeNeededGradeForBlockTarget(block, target) {
  return computeNeededGrade(target, collectAggregates(block.modules))
}

export function countMissingEvaluations(data) {
  return data.blocks.reduce(
    (total, block) =>
      total +
      block.modules.reduce(
        (moduleTotal, module) =>
          moduleTotal +
          Object.values(module.evaluations).filter((evaluation) => normalizeGrade(evaluation.grade) === null)
            .length,
        0,
      ),
    0,
  )
}
