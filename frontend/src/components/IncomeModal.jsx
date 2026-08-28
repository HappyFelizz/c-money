import { useEffect, useState } from 'react'

function formatMoney(value) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function IncomeModal({ isOpen, onClose, selectedMonth, incomes, onAddIncome, onDeleteIncome, onUpdateIncome }) {
  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(`${selectedMonth}-01`)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    document.body.classList.toggle('modal-open', isOpen)
    return () => document.body.classList.remove('modal-open')
  }, [isOpen])

  if (!isOpen) return null

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      setMessage('')
      if (editingId) await onUpdateIncome(editingId, { description, value: Number(value), date })
      else await onAddIncome({ description, value: Number(value), date })
      setDescription('')
      setValue('')
      setDate(`${selectedMonth}-01`)
      setEditingId(null)
    } catch (error) {
      setMessage(error.message)
    }
  }

  function startEdit(income) {
    setEditingId(income.id)
    setDescription(income.description)
    setValue(String(income.value))
    setDate(income.date)
    setMessage('')
  }

  async function handleDelete(incomeId) {
    try {
      await onDeleteIncome(incomeId)
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-panel income-modal-panel" role="dialog" aria-modal="true" aria-labelledby="income-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Dinheiro recebido</p>
            <h2 id="income-title">Entradas extras</h2>
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Fechar entradas extras">×</button>
        </div>
        <form className="modal-form income-modal-form" onSubmit={handleSubmit}>
          <label>Descrição<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex: Freelance" required /></label>
          <label>Valor<input type="number" min="0.01" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} placeholder="R$ 0,00" required /></label>
          <label>Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
          {message && <p className="form-message">{message}</p>}
          <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Fechar</button><button className="primary-button" type="submit">{editingId ? 'Salvar alteração' : 'Adicionar entrada'}</button></div>
        </form>
        <div className="income-modal-list">
          <p className="eyebrow">Entradas de {selectedMonth.replace('-', '/')}</p>
          {!incomes.length && <p className="status-message">Nenhuma entrada extra cadastrada.</p>}
          {incomes.map((income) => (
            <div className="income-item" key={income.id}>
              <span>{income.description} · {new Date(`${income.date}T00:00:00`).toLocaleDateString('pt-BR')}</span>
              <span className="income-item-actions"><strong>{formatMoney(income.value)}</strong><button className="text-button" type="button" onClick={() => startEdit(income)}>Editar</button><button className="delete-button" type="button" onClick={() => handleDelete(income.id)}>Excluir</button></span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default IncomeModal
