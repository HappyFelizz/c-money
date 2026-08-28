const API_BASE_URL = import.meta.env.VITE_API_URL || ''

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.errors?.join('\n') || data?.error || 'Erro na comunicação com o servidor.'
    throw new Error(message)
  }

  return data
}

export function getMonthData(year, month) {
  return Promise.all([
    request(`/transactions/${year}/${month}`),
    request(`/summary/${year}/${month}`),
  ])
}

export function createTransaction(transaction) {
  return request('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  })
}

export function removeTransaction(transactionId) {
  return request(`/transactions/${transactionId}`, {
    method: 'DELETE',
  })
}

export function updateTransaction(transactionId, transaction) {
  return request(`/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify(transaction),
  })
}

export function getSalarySettings() {
  return request('/settings/salary')
}

export function saveSalarySettings(settings) {
  return request('/settings/salary', {
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

export function getRecurringTransactions() {
  return request('/recurring')
}

export function createRecurringTransaction(transaction) {
  return request('/recurring', {
    method: 'POST',
    body: JSON.stringify(transaction),
  })
}

export function removeRecurringTransaction(transactionId) {
  return request(`/recurring/${transactionId}`, {
    method: 'DELETE',
  })
}

export function updateRecurringTransaction(transactionId, transaction) {
  return request(`/recurring/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify(transaction),
  })
}

export function getSalaryMonths() {
  return request('/settings/salary/months')
}

export function updateSalaryMonth(year, month, salary) {
  return request(`/settings/salary/month/${year}/${month}`, {
    method: 'PUT',
    body: JSON.stringify({ salary }),
  })
}

export function getPaymentMethods() {
  return request('/settings/payment-methods')
}

export function createPaymentMethod(method) {
  return request('/settings/payment-methods', {
    method: 'POST',
    body: JSON.stringify(method),
  })
}

export function removePaymentMethod(code) {
  return request(`/settings/payment-methods/${code}`, {
    method: 'DELETE',
  })
}

export function updatePaymentMethod(code, closingDay) {
  return request(`/settings/payment-methods/${code}`, {
    method: 'PUT',
    body: JSON.stringify({ closing_day: closingDay }),
  })
}

export function getIncomeForMonth(year, month) {
  return request(`/income/${year}/${month}`)
}

export function createIncome(income) {
  return request('/income', {
    method: 'POST',
    body: JSON.stringify(income),
  })
}

export function removeIncome(incomeId) {
  return request(`/income/${incomeId}`, {
    method: 'DELETE',
  })
}

export function updateIncome(incomeId, income) {
  return request(`/income/${incomeId}`, {
    method: 'PUT',
    body: JSON.stringify(income),
  })
}
