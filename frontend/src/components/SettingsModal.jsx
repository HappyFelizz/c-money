import { useEffect, useState } from 'react'
import { createPaymentMethod, getSalaryMonths, getSalarySettings, removePaymentMethod, saveSalarySettings, updatePaymentMethod, updateSalaryMonth } from '../services/api'

function SettingsModal({ isOpen, onClose, onSaved, onOpenRecurring, paymentMethods, onPaymentMethodsChanged }) {
  const [monthlySalary, setMonthlySalary] = useState('')
  const [closingDay, setClosingDay] = useState('4')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [salaryMonths, setSalaryMonths] = useState([])
  const [paymentName, setPaymentName] = useState('')
  const [paymentType, setPaymentType] = useState('other')
  const [paymentClosingDay, setPaymentClosingDay] = useState('4')
  const [editingPaymentCode, setEditingPaymentCode] = useState(null)

  useEffect(() => {
    document.body.classList.toggle('modal-open', isOpen)

    return () => document.body.classList.remove('modal-open')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    Promise.all([getSalarySettings(), getSalaryMonths()])
      .then(([settings, months]) => {
        setMonthlySalary(String(settings.monthly_salary ?? 0))
        setClosingDay(String(settings.credit_card_closing_day ?? 4))
        setSalaryMonths(months)
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setIsLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  async function handleSubmit(event) {
    event.preventDefault()
    const salary = Number(monthlySalary)
    const creditCardClosingDay = Number(closingDay)

    if (salary < 0 || creditCardClosingDay < 1 || creditCardClosingDay > 31) {
      setMessage('Informe valores válidos.')
      return
    }

    try {
      setIsLoading(true)
      await saveSalarySettings({ monthly_salary: salary, credit_card_closing_day: creditCardClosingDay })
      await onSaved()
      onClose()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMonthSalaryChange(year, month, value) {
    try {
      await updateSalaryMonth(year, month, Number(value))
      setSalaryMonths((current) => current.map((item) => (
        item.year === year && item.month === month ? { ...item, salary: Number(value) } : item
      )))
      await onSaved()
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function handleAddPaymentMethod() {
    try {
      if (editingPaymentCode) {
        await updatePaymentMethod(editingPaymentCode, Number(paymentClosingDay))
        onPaymentMethodsChanged((current) => current.map((method) => (
          method.code === editingPaymentCode ? { ...method, closing_day: Number(paymentClosingDay) } : method
        )))
      } else {
        const method = await createPaymentMethod({
          name: paymentName,
          method_type: paymentType,
          closing_day: paymentType === 'credit_card' ? Number(paymentClosingDay) : null,
        })
        onPaymentMethodsChanged((current) => [...current, method])
      }
      setPaymentName('')
      setPaymentClosingDay('4')
      setEditingPaymentCode(null)
    } catch (error) {
      setMessage(error.message)
    }
  }

  function startEditPaymentMethod(method) {
    setEditingPaymentCode(method.code)
    setPaymentName(method.name)
    setPaymentType(method.method_type)
    setPaymentClosingDay(String(method.closing_day ?? 4))
    setMessage('')
  }

  async function handleDeletePaymentMethod(code) {
    try {
      await removePaymentMethod(code)
      onPaymentMethodsChanged((current) => current.filter((method) => method.code !== code))
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Preferências</p>
            <h2 id="settings-title">Configurações</h2>
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Fechar configurações">×</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Salário mensal
            <input type="number" min="0" step="0.01" value={monthlySalary} onChange={(event) => setMonthlySalary(event.target.value)} />
          </label>
          <button className="secondary-button" type="button" onClick={onOpenRecurring}>Gerenciar contas recorrentes</button>
          <div className="payment-method-section">
            <p className="eyebrow">Formas de pagamento</p>
            <div className="payment-method-form">
              <input value={paymentName} onChange={(event) => setPaymentName(event.target.value)} placeholder="Ex: Cartão Santander" required />
              <select value={paymentType} onChange={(event) => setPaymentType(event.target.value)}>
                <option value="other">Outro</option>
                <option value="credit_card">Cartão de crédito</option>
              </select>
              {paymentType === 'credit_card' && <input type="number" min="1" max="31" value={paymentClosingDay} onChange={(event) => setPaymentClosingDay(event.target.value)} aria-label="Dia de fechamento" placeholder="Fechamento" />}
              <button className="text-button" type="button" onClick={handleAddPaymentMethod}>{editingPaymentCode ? 'Salvar' : 'Adicionar'}</button>
            </div>
            <div className="payment-method-list">
              {paymentMethods.map((method) => (
                <div className="payment-method-item" key={method.code}>
                  <span>{method.name}{method.method_type === 'credit_card' ? ` · Fecha dia ${method.closing_day ?? 4}` : ''}</span>
                  <span className="payment-method-actions">
                    {method.method_type === 'credit_card' && <button className="text-button" type="button" onClick={() => startEditPaymentMethod(method)}>Editar</button>}
                    {!['pix', 'cartao', 'dinheiro', 'boleto'].includes(method.code) && <button className="delete-button" type="button" onClick={() => handleDeletePaymentMethod(method.code)}>Excluir</button>}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="projection-section">
            <p className="eyebrow">Projeção</p>
            <h3>Salários mensais</h3>
            {salaryMonths.map((item) => (
              <label key={`${item.year}-${item.month}`}>
                {item.month}/{item.year}
                <div className="salary-row">
                  <input type="number" min="0" step="0.01" defaultValue={item.salary} id={`salary-${item.year}-${item.month}`} />
                  <button className="text-button" type="button" onClick={() => handleMonthSalaryChange(item.year, item.month, document.getElementById(`salary-${item.year}-${item.month}`).value)}>Salvar</button>
                </div>
              </label>
            ))}
          </div>
          <label>
            Dia de fechamento do cartão
            <input type="number" min="1" max="31" value={closingDay} onChange={(event) => setClosingDay(event.target.value)} />
          </label>
          {message && <p className="form-message">{message}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default SettingsModal
