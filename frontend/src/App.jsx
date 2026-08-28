import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import MonthSelector from './components/MonthSelector'
import SummaryCard from './components/SummaryCard'
import TransactionsSection from './components/TransactionsSection'
import SettingsModal from './components/SettingsModal'
import RecurringModal from './components/RecurringModal'
import IncomeModal from './components/IncomeModal'
import {
  createTransaction,
  createIncome,
  getIncomeForMonth,
  getMonthData,
  getPaymentMethods,
  removeIncome,
  updateIncome,
  removeTransaction,
  updateTransaction,
} from './services/api'

const categoryLabels = {
  fixos: ['fixed', 'Fixo'],
  variaveis_essenciais: ['essential', 'Variável essencial'],
  nao_essenciais: ['optional', 'Não essencial'],
  assinaturas: ['subscription', 'Assinatura'],
  eventuais: ['optional', 'Eventual'],
}

function mapTransaction(transaction, paymentMethods) {
  const [category, categoryLabel] = categoryLabels[transaction.type] || ['optional', transaction.type]
  const [year, month, day] = transaction.date.split('-')

  return {
    id: transaction.id,
    description: transaction.description,
    type: transaction.type,
    category,
    categoryLabel,
    paymentMethod: paymentMethods.find((method) => method.code === transaction.payment_method)?.name || transaction.payment_method,
    paymentMethodCode: transaction.payment_method,
    value: Number(transaction.value),
    date: `${day}/${month}/${year}`,
    sortDate: transaction.date,
  }
}

function App() {
  const [selectedMonth, setSelectedMonth] = useState('2026-08')
  const [transactions, setTransactions] = useState([])
  const [monthlySalary, setMonthlySalary] = useState(0)
  const [additionalIncome, setAdditionalIncome] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [paymentMethods, setPaymentMethods] = useState([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isRecurringOpen, setIsRecurringOpen] = useState(false)
  const [isIncomeOpen, setIsIncomeOpen] = useState(false)

  const monthLabel = new Date(`${selectedMonth}-02T00:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  useEffect(() => {
    async function loadMonthData() {
      const [year, month] = selectedMonth.split('-')
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [[transactionsData, summaryData], methods, income] = await Promise.all([
          getMonthData(year, month),
          getPaymentMethods(),
          getIncomeForMonth(year, month),
        ])

        setPaymentMethods(methods)
        setTransactions(transactionsData.map((transaction) => mapTransaction(transaction, methods)))
        setAdditionalIncome(income)
        setMonthlySalary(Number(summaryData.salary_month || 0))
      } catch (error) {
        console.error(error)
        setErrorMessage('Não foi possível conectar ao servidor Flask.')
        setTransactions([])
        setMonthlySalary(0)
        setAdditionalIncome([])
      } finally {
        setIsLoading(false)
      }
    }

    loadMonthData()
  }, [selectedMonth])

  const totalSpent = transactions.reduce(
    (total, transaction) => total + transaction.value,
    0,
  )
  const extraIncomeTotal = additionalIncome.reduce((total, income) => total + Number(income.value), 0)
  const totalSalary = monthlySalary + extraIncomeTotal
  const balance = totalSalary - totalSpent
  const spentPercentage = totalSalary > 0
    ? Math.round((totalSpent / totalSalary) * 100)
    : 0
  const breakdown = [
    { label: 'Fixos', type: 'fixos', tone: 'fixed' },
    { label: 'Variáveis essenciais', type: 'variaveis_essenciais', tone: 'essential' },
    { label: 'Não essenciais', type: 'nao_essenciais', tone: 'optional' },
    { label: 'Assinaturas', type: 'assinaturas', tone: 'subscription' },
    { label: 'Eventuais', type: 'eventuais', tone: 'optional' },
  ].map((category) => ({
    ...category,
    value: transactions
      .filter((transaction) => transaction.type === category.type)
      .reduce((total, transaction) => total + transaction.value, 0),
  }))
  const summaryCards = [
    { label: 'Total gasto', value: totalSpent, detail: `${transactions.length} contas`, tone: 'amber', breakdown },
    { label: 'Salário do mês', value: totalSalary, detail: `${monthLabel} · R$ ${monthlySalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} fixos`, tone: 'blue', breakdown: [{ label: 'Salário fixo', value: monthlySalary, tone: 'fixed' }, ...additionalIncome.map((income) => ({ label: income.description, value: Number(income.value), tone: 'essential' }))] },
    { label: 'Saldo disponível', value: balance, detail: `${Math.max(0, 100 - spentPercentage)}% do salário`, tone: 'green' },
  ]

  async function addTransaction(transaction) {
    await createTransaction(transaction)
    const [year, month] = selectedMonth.split('-')
    const [transactionsData, summaryData] = await getMonthData(year, month)
    setTransactions(transactionsData.map((item) => mapTransaction(item, paymentMethods)))
    setMonthlySalary(Number(summaryData.salary_month || 0))
  }

  async function deleteTransaction(transactionId) {
    await removeTransaction(transactionId)
    setTransactions((currentTransactions) => currentTransactions.filter(
      (transaction) => transaction.id !== transactionId,
    ))
  }

  async function editTransaction(transactionId, transaction) {
    await updateTransaction(transactionId, transaction)
    const [year, month] = selectedMonth.split('-')
    const [transactionsData, summaryData] = await getMonthData(year, month)
    setTransactions(transactionsData.map((item) => mapTransaction(item, paymentMethods)))
    setMonthlySalary(Number(summaryData.salary_month || 0))
  }

  async function addIncome(income) {
    await createIncome(income)
    const [year, month] = selectedMonth.split('-')
    setAdditionalIncome(await getIncomeForMonth(year, month))
  }

  async function deleteIncome(incomeId) {
    await removeIncome(incomeId)
    setAdditionalIncome((current) => current.filter((income) => income.id !== incomeId))
  }

  async function editIncome(incomeId, income) {
    await updateIncome(incomeId, income)
    const [year, month] = selectedMonth.split('-')
    setAdditionalIncome(await getIncomeForMonth(year, month))
  }

  return (
    <main className="app-shell">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} onOpenIncome={() => setIsIncomeOpen(true)} />

      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1>Seu dinheiro, sob controle.</h1>
          <p className="subtitle">Acompanhe seus gastos e tome decisões com mais clareza.</p>
        </div>
        <MonthSelector value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
      </section>

      <section className="summary-grid" aria-label="Resumo financeiro">
        {summaryCards.map((card) => (
          <SummaryCard {...card} key={card.label} />
        ))}
      </section>

      <TransactionsSection
        transactions={transactions}
        monthLabel={monthLabel}
        onAddTransaction={addTransaction}
        onDeleteTransaction={deleteTransaction}
        onUpdateTransaction={editTransaction}
        paymentMethods={paymentMethods}
        isLoading={isLoading}
        errorMessage={errorMessage}
        additionalIncome={additionalIncome}
        onAddIncome={addIncome}
        onDeleteIncome={deleteIncome}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenRecurring={() => {
          setIsSettingsOpen(false)
          setIsRecurringOpen(true)
        }}
        onSaved={async () => {
          const [year, month] = selectedMonth.split('-')
          const [, summaryData] = await getMonthData(year, month)
          setMonthlySalary(Number(summaryData.salary_month || 0))
        }}
        paymentMethods={paymentMethods}
        onPaymentMethodsChanged={setPaymentMethods}
      />
      <RecurringModal
        isOpen={isRecurringOpen}
        onClose={() => setIsRecurringOpen(false)}
        paymentMethods={paymentMethods}
        onBack={() => {
          setIsRecurringOpen(false)
          setIsSettingsOpen(true)
        }}
        onChanged={async () => {
          const [year, month] = selectedMonth.split('-')
          const [transactionsData, summaryData] = await getMonthData(year, month)
          setTransactions(transactionsData.map((item) => mapTransaction(item, paymentMethods)))
          setMonthlySalary(Number(summaryData.salary_month || 0))
        }}
      />
      <IncomeModal
        isOpen={isIncomeOpen}
        onClose={() => setIsIncomeOpen(false)}
        selectedMonth={selectedMonth}
        incomes={additionalIncome}
        onAddIncome={addIncome}
        onDeleteIncome={deleteIncome}
        onUpdateIncome={editIncome}
      />
    </main>
  )
}

export default App
