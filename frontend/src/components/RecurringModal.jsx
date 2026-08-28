import { useEffect, useRef, useState } from 'react'
import {
  createRecurringTransaction,
  getRecurringTransactions,
  removeRecurringTransaction,
  updateRecurringTransaction,
} from '../services/api'

const emptyForm = {
  description: '',
  value: '',
  type: 'fixos',
  payment_method: 'pix',
  day_of_month: '1',
}

const typeLabels = {
  fixos: 'Fixo',
  variaveis_essenciais: 'Variável essencial',
  nao_essenciais: 'Não essencial',
  assinaturas: 'Assinatura',
  eventuais: 'Eventual',
}

function RecurringModal({ isOpen, onClose, onBack, onChanged, paymentMethods }) {
  const [recurring, setRecurring] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const panelRef = useRef(null)

  async function loadRecurring() {
    try {
      setRecurring(await getRecurringTransactions())
    } catch (error) {
      setMessage(error.message)
    }
  }

  useEffect(() => {
    document.body.classList.toggle('modal-open', isOpen)

    return () => document.body.classList.remove('modal-open')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    getRecurringTransactions()
      .then(setRecurring)
      .catch((error) => setMessage(error.message))
  }, [isOpen])

  if (!isOpen) return null

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function startEdit(item) {
    panelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setEditingId(item.id)
    setFormData({
      description: item.description,
      value: String(item.value),
      type: item.type,
      payment_method: item.payment_method,
      day_of_month: String(item.day_of_month),
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      const payload = {
        ...formData,
        value: Number(formData.value),
        day_of_month: Number(formData.day_of_month),
      }
      if (editingId) await updateRecurringTransaction(editingId, payload)
      else await createRecurringTransaction(payload)
      setFormData(emptyForm)
      setEditingId(null)
      await loadRecurring()
      await onChanged()
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function handleDelete(id) {
    try {
      await removeRecurringTransaction(id)
      await loadRecurring()
      await onChanged()
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section ref={panelRef} className="modal-panel recurring-panel" role="dialog" aria-modal="true" aria-labelledby="recurring-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Automação</p>
            <h2 id="recurring-title">Contas recorrentes</h2>
          </div>
          <div className="modal-heading-actions">
            <button className="secondary-button back-button" type="button" onClick={onBack}>Voltar para configurações</button>
            <button className="close-button" type="button" onClick={onClose} aria-label="Fechar contas recorrentes">×</button>
          </div>
        </div>

        <form className="modal-form recurring-form" onSubmit={handleSubmit}>
          <label>Descrição<input name="description" value={formData.description} onChange={handleChange} placeholder="Ex: Aluguel" required /></label>
          <label>Valor<input name="value" type="number" min="0.01" step="0.01" value={formData.value} onChange={handleChange} required /></label>
          <label>Categoria<select name="type" value={formData.type} onChange={handleChange}>{Object.entries(typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Pagamento<select name="payment_method" value={formData.payment_method} onChange={handleChange}>{paymentMethods.map((method) => <option value={method.code} key={method.code}>{method.name}</option>)}</select></label>
          <label>Dia do mês<input name="day_of_month" type="number" min="1" max="31" value={formData.day_of_month} onChange={handleChange} required /></label>
          {message && <p className="form-message">{message}</p>}
          <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => { setEditingId(null); setFormData(emptyForm) }}>{editingId ? 'Cancelar edição' : 'Limpar'}</button><button className="primary-button" type="submit">{editingId ? 'Atualizar' : 'Adicionar'}</button></div>
        </form>

        <div className="recurring-list">
          {!recurring.length && <p className="status-message">Nenhuma conta recorrente cadastrada.</p>}
          {recurring.map((item) => (
            <article className="recurring-item" key={item.id}>
              <div className="recurring-info"><strong>{item.description}</strong><span>{typeLabels[item.type] || item.type} · Dia {item.day_of_month}</span></div>
              <strong className="recurring-value">R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              <div className="item-actions"><button className="text-button" type="button" onClick={() => startEdit(item)}>Editar</button><button className="delete-button" type="button" onClick={() => handleDelete(item.id)}>Excluir</button></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default RecurringModal
