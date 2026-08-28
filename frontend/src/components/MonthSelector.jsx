function MonthSelector({ value, onChange }) {
  return (
    <label className="month-control">
      <span>Mês selecionado</span>
      <input type="month" value={value} onChange={onChange} />
    </label>
  )
}

export default MonthSelector
