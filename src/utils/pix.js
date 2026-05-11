export function parseFractionGrade(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().replace(',', '.')
  const match = normalized.match(/^([\d.]+|null)\s*\/\s*([\d.]+)$/i)
  if (!match) return null
  if (match[1].toLowerCase() === 'null') return null

  const score = Number(match[1])
  const maxScore = Number(match[2])
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
    return null
  }

  return convertPixScoreTo20(score, maxScore)
}

export function convertPixScoreTo20(score, maxScore) {
  const numericScore = Number(score)
  const numericMax = Number(maxScore)
  if (!Number.isFinite(numericScore) || !Number.isFinite(numericMax) || numericMax <= 0) {
    return null
  }

  return (numericScore / numericMax) * 20
}
