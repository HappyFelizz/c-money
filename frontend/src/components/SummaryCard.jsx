function formatMoney(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

import { useState } from 'react'

function SummaryCard({ label, value, detail, tone, breakdown = [] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <article className={`summary-card ${tone} ${isExpanded ? 'expanded' : ''}`}>
      <div className="summary-card-header">
        <p>{label}</p>
        {breakdown.length > 0 && (
          <button
            className="expand-button"
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Ocultar gastos por categoria' : 'Mostrar gastos por categoria'}
          >
            <span aria-hidden="true">⌄</span>
          </button>
        )}
      </div>
      <strong>{formatMoney(value)}</strong>
      <span className="detail">{detail}</span>
      {isExpanded && (
        <div className="category-breakdown">
          {breakdown.map((category) => (
            <div className="category-breakdown-row" key={category.label}>
              <span><i className={`category-dot ${category.tone}`} aria-hidden="true" />{category.label}</span>
              <strong>{formatMoney(category.value)}</strong>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

export default SummaryCard
