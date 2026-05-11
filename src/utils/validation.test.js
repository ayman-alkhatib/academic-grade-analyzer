import { describe, expect, it } from 'vitest'
import { initialData } from '../data/initialData'
import { computeOverallFeasibility, computeValidationStatus } from './validation'

describe('utils/validation', () => {
  it('détecte correctement une année validée quand toutes les notes sont suffisantes', () => {
    const data = structuredClone(initialData)
    data.blocks.forEach((block) => {
      block.modules.forEach((module) => {
        Object.values(module.evaluations).forEach((evaluation) => {
          evaluation.grade = evaluation.grade && typeof evaluation.grade === 'string' && evaluation.grade.includes('/')
            ? '800/800'
            : 12
        })
      })
    })

    const status = computeValidationStatus(data)
    expect(status.isValidated).toBe(true)
  })

  it('identifie les objectifs impossibles si les notes restantes ne suffisent pas', () => {
    const data = structuredClone(initialData)
    data.blocks.forEach((block) => {
      block.modules.forEach((module) => {
        Object.values(module.evaluations).forEach((evaluation) => {
          evaluation.grade = 0
        })
      })
    })

    const feasibility = computeOverallFeasibility(data)
    expect(feasibility.isFeasible).toBe(false)
    expect(feasibility.impossibleTargets.length).toBeGreaterThan(0)
  })
})
