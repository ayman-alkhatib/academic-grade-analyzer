import { describe, expect, it } from 'vitest'
import { initialData } from '../data/initialData'
import {
  computeModuleAverage,
  computeNeededGradeForGeneralTarget,
  normalizeGrade,
} from './grades'

describe('utils/grades', () => {
  it('parse correctement les fractions PIX', () => {
    expect(normalizeGrade('401/800')).toBeCloseTo(10.025, 3)
    expect(normalizeGrade('null/800')).toBeNull()
  })

  it('calcule la moyenne pondérée du module', () => {
    const module = {
      credit: 3,
      evaluations: {
        CC: { grade: 10, coef: 1 },
        CT: { grade: 14, coef: 3 },
      },
    }

    expect(computeModuleAverage(module)).toBeCloseTo(13, 5)
  })

  it('retourne un objectif atteignable quand il reste des notes', () => {
    const data = structuredClone(initialData)
    data.blocks[0].modules[0].evaluations.CT.grade = 12

    const result = computeNeededGradeForGeneralTarget(data, 10)

    expect(['reachable', 'reached']).toContain(result.status)
    expect(result.message).toMatch(/Objectif déjà atteint|Il faut au moins/)
  })
})
