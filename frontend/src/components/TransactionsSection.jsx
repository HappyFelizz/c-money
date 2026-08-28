import { useEffect, useState } from 'react'

function formatMoney(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

const categoryTypes = {
  fixed: 'fixos',
  essential: 'variaveis_essenciais',
  subscription: 'assinaturas',
  optional: 'nao_essenciais',
}

function TransactionsSection({ transactions, monthLabel, onAddTransaction, onDeleteTransaction, onUpdateTransaction, isLoading, errorMessage, paymentMethods }) {
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    description: '',
    category: 'essential',
    categoryLabel: 'Variável essencial',
    paymentMethod: paymentMethods[0]?.code || 'pix',
    value: '',
    date: '',
  })

  function handleInputChange(event) {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!formData.description.trim() || !formData.value || !formData.date) {
      return
    }

    try {
      setFormError('')
      const payload = {
        description: formData.description.trim(),
        type: categoryTypes[formData.category],
        payment_method: formData.paymentMethod,
        value: Number(formData.value),
        date: formData.date,
      }
      if (editingId) await onUpdateTransaction(editingId, payload)
      else await onAddTransaction(payload)
    } catch (error) {
      setFormError(error.message)
      return
    }

    setFormData({
      description: '',
      category: 'essential',
      categoryLabel: 'Variável essencial',
      paymentMethod: paymentMethods[0]?.code || 'pix',
      value: '',
      date: '',
    })
    setIsFormVisible(false)
    setEditingId(null)
  }

  function startEdit(transaction) {
    const category = Object.entries(categoryTypes).find(([, type]) => type === transaction.type)?.[0] || 'essential'
    setEditingId(transaction.id)
    setFormData({
      description: transaction.description,
      category,
      paymentMethod: transaction.paymentMethodCode,
      value: String(transaction.value),
      date: transaction.sortDate,
    })
    setFormError('')
    setIsFormVisible(true)
  }

  async function handleDelete(transactionId) {
    try {
      await onDeleteTransaction(transactionId)
    } catch (error) {
      setFormError(error.message)
    }
  }

  const sortedTransactions = [...transactions].sort((first, second) => (
    first.sortDate || '').localeCompare(second.sortDate || '')
  )

  useEffect(() => {
    document.body.classList.toggle('modal-open', editingId !== null)

    return () => document.body.classList.remove('modal-open')
  }, [editingId])

  const transactionForm = (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <label>
        Descrição
        <input name="description" value={formData.description} onChange={handleInputChange} placeholder="Ex: Academia" />
      </label>
      <label>
        Valor
        <input name="value" type="number" min="0.01" step="0.01" value={formData.value} onChange={handleInputChange} placeholder="0,00" />
      </label>
      <label>
        Categoria
        <select name="category" value={formData.category} onChange={handleInputChange}>
          <option value="fixed">Fixo</option>
          <option value="essential">Variável essencial</option>
          <option value="subscription">Assinatura</option>
          <option value="optional">Não essencial</option>
        </select>
      </label>
      <label>
        Pagamento
        <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
          {paymentMethods.map((method) => <option value={method.code} key={method.code}>{method.name}</option>)}
        </select>
      </label>
      <label>
        Data
        <input name="date" type="date" value={formData.date} onChange={handleInputChange} />
      </label>
      {formError && <p className="form-message">{formError}</p>}
      <div className="modal-actions transaction-form-actions">
        <button className="secondary-button" type="button" onClick={() => { setIsFormVisible(false); setEditingId(null) }}>Cancelar</button>
        <button className="primary-button form-submit" type="submit">{editingId ? 'Atualizar conta' : 'Salvar conta'}</button>
      </div>
    </form>
  )

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{monthLabel}</p>
          <h2>Contas do mês</h2>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={() => setIsFormVisible((visible) => !visible)}
        >
          {isFormVisible ? 'Cancelar' : '+ Adicionar conta'}
        </button>
      </div>

      {isFormVisible && !editingId && transactionForm}
      {isFormVisible && editingId && (
        <div className="modal-backdrop" role="presentation" onClick={() => { setIsFormVisible(false); setEditingId(null) }}>
          <section className="modal-panel transaction-edit-panel" role="dialog" aria-modal="true" aria-labelledby="transaction-edit-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Edição</p>
                <h2 id="transaction-edit-title">Editar conta</h2>
              </div>
              <button className="close-button" type="button" onClick={() => { setIsFormVisible(false); setEditingId(null) }} aria-label="Fechar edição">×</button>
            </div>
            {transactionForm}
          </section>
        </div>
      )}

      {isLoading && <p className="status-message">Carregando contas...</p>}
      {!isLoading && errorMessage && <p className="status-message error">{errorMessage}</p>}
      {!isLoading && !errorMessage && <div className="transactions-list">
        {sortedTransactions.map((transaction) => (
          <article className="transaction-row" key={transaction.id}>
            <div className="transaction-main">
              <span className={`category-dot ${transaction.category}`} aria-hidden="true" />
              <div>
                <h3>{transaction.description}</h3>
                <p>{transaction.categoryLabel} · {transaction.paymentMethod}</p>
              </div>
            </div>
            <div className="transaction-meta">
              <strong>{formatMoney(transaction.value)}</strong>
              <span>{transaction.date}</span>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => startEdit(transaction)}
            >
              Editar
            </button>
            <button
              className="delete-button"
              type="button"
              onClick={() => handleDelete(transaction.id)}
              aria-label={`Excluir ${transaction.description}`}
            >
              Excluir
            </button>
          </article>
        ))}
        {!transactions.length && <p className="status-message">Nenhuma conta encontrada neste mês.</p>}
      </div>}
    </section>
  )
}

export default TransactionsSection
