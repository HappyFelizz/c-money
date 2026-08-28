function Header({ onOpenSettings, onOpenIncome }) {
  return (
    <header className="topbar">
      <div className="brand-mark" aria-hidden="true">C</div>
      <div>
        <p className="eyebrow">Controle financeiro</p>
        <strong className="brand-name">C-Money</strong>
      </div>
      <div className="header-actions">
        <button className="income-button" type="button" onClick={onOpenIncome}>+ Entrada</button>
        <button className="settings-button" type="button" onClick={onOpenSettings} aria-label="Abrir configurações">
          <span aria-hidden="true">⚙</span>
          Configurações
        </button>
      </div>
    </header>
  )
}

export default Header
