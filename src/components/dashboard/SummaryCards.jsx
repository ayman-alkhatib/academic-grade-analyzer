import { memo } from 'react'

const SummaryCards = memo(function SummaryCards({ cards }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">{card.label}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
        </article>
      ))}
    </section>
  )
})

export default SummaryCards
