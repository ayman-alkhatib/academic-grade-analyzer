import { memo, useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { computeBlockAverage, roundGrade } from '../../utils/grades'

const BlockThresholdChart = memo(function BlockThresholdChart({ blocks }) {
  const data = useMemo(
    () =>
      blocks.map((block) => ({
        nom: block.name.replace(/\s*\([^)]*\)$/, ''),
        moyenne: roundGrade(computeBlockAverage(block)) || 0,
        seuil: block.name.includes('Bloc Algorithmique & Programmation')
          ? 10
          : block.name.includes('Bloc Maths')
            ? 7
            : 10,
      })),
    [blocks],
  )

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Comparaison des moyennes de blocs</h2>
      <div className="mt-3 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="nom" angle={-20} textAnchor="end" height={80} interval={0} stroke="var(--chart-axis)" />
            <YAxis domain={[0, 20]} stroke="var(--chart-axis)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--chart-tooltip-bg)',
                border: '1px solid var(--chart-tooltip-border)',
                color: 'var(--chart-tooltip-text)',
              }}
            />
            <Legend />
            <ReferenceLine y={10} stroke="var(--chart-ref)" strokeDasharray="4 4" label="Seuil année 10" />
            <Bar dataKey="moyenne" fill="var(--chart-primary)" name="Moyenne actuelle" radius={[4, 4, 0, 0]} />
            <Bar dataKey="seuil" fill="var(--chart-secondary)" name="Seuil bloc" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
})

export default BlockThresholdChart
