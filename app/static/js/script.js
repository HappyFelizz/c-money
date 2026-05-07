const API_BASE_URL = "http://localhost:5000";

let modalInstance = null;
let settingsModalInstance = null;
let recurringModalInstance = null;
let addRecurringModalInstance = null;
let currentTransactions = [];
let editingTransactionId = null;
let currentRecurringTransactions = [];
let editingRecurringId = null;

function getModal() {
  const modalElement = document.getElementById("modal");

  if (!modalInstance && modalElement && window.bootstrap) {
    modalInstance = new bootstrap.Modal(modalElement);
  }

  return modalInstance;
}

function getSettingsModal() {
  const settingsModalElement = document.getElementById("settingsModal");

  if (!settingsModalInstance && settingsModalElement && window.bootstrap) {
    settingsModalInstance = new bootstrap.Modal(settingsModalElement);
  }

  return settingsModalInstance;
}

async function openSettingsModal() {
  await loadSalarySettings();

  const modal = getSettingsModal();

  if (modal) {
    modal.show();
  }
}

async function saveSettings() {
  const monthlySalaryInput = document.getElementById("monthlySalaryInput");
  const creditCardClosingDayInput = document.getElementById("creditCardClosingDayInput");
  const monthlySalary = parseFloat(monthlySalaryInput?.value || "0");
  const creditCardClosingDay = parseInt(creditCardClosingDayInput?.value || "4", 10);

  if (Number.isNaN(monthlySalary) || monthlySalary < 0) {
    alert("Informe um salário válido");
    return;
  }

  if (Number.isNaN(creditCardClosingDay) || creditCardClosingDay < 1 || creditCardClosingDay > 31) {
    alert("Informe um dia de fechamento válido entre 1 e 31");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/settings/salary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        monthly_salary: monthlySalary,
        credit_card_closing_day: creditCardClosingDay
      })
    });

    const result = await response.json();

    if (!response.ok) {
      const errors = Array.isArray(result.errors)
        ? result.errors.join("\n")
        : (result.error || "Erro ao salvar configurações");

      alert(errors);
      return;
    }

    await loadSummary();
    alert("Configurações salvas com sucesso!");
    getSettingsModal()?.hide();
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com servidor");
  }
}

function setTransactionModalTitle(title) {
  const titleElement = document.getElementById("transactionModalTitle");

  if (titleElement) {
    titleElement.innerText = title;
  }
}

function openModal() {
  editingTransactionId = null;
  resetTransactionForm();
  setTransactionModalTitle("Nova Conta");

  const modal = getModal();

  if (modal) {
    modal.show();
  }
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
}

function updateCurrentMonthLabel(date = new Date()) {
  const currentMonthElement = document.getElementById("currentMonth");

  if (currentMonthElement) {
    currentMonthElement.innerText = formatMonthLabel(date);
  }
}

function getSelectedMonth() {
  const monthPicker = document.getElementById("monthPicker");

  if (monthPicker && monthPicker.value) {
    return monthPicker.value;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function setMonthPickerToCurrentMonth() {
  const monthPicker = document.getElementById("monthPicker");

  if (!monthPicker) {
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  monthPicker.value = `${year}-${month}`;
}

function normalizePaymentMethod(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatPaymentMethod(value) {
  const normalized = normalizePaymentMethod(value);
  const labels = {
    pix: "Pix",
    cartao: "Cartão",
    dinheiro: "Dinheiro"
  };

  return labels[normalized] || value || "-";
}

function formatDateBR(value) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = String(value).split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function updateSummaryCards(summary) {
  const summaryMap = {
    total_month: "totalMonth",
    salary_month: "salaryMonth",
    balance_month: "balanceMonth",
    fixos: "fixos",
    variaveis_essenciais: "variaveis",
    nao_essenciais: "nao",
    assinaturas: "assinaturas",
    eventuais: "eventuais"
  };

  // Categorias que têm contagem
  const categoryCountMap = {
    fixos: "fixos_count",
    variaveis_essenciais: "variaveis_count",
    nao_essenciais: "nao_count",
    assinaturas: "assinaturas_count",
    eventuais: "eventuais_count"
  };

  // Inicializar todos os contadores como 0
  Object.entries(categoryCountMap).forEach(([type, countElementId]) => {
    const countElement = document.getElementById(countElementId);
    if (countElement) {
      countElement.innerText = "(0)";
    }
  });

  Object.entries(summaryMap).forEach(([type, elementId]) => {
    const element = document.getElementById(elementId);

    if (element) {
      const value = summary[type];

      // Se o valor é um objeto com total e count, usar apenas o total
      if (typeof value === "object" && value !== null && value.total !== undefined) {
        element.innerText = formatMoney(value.total);

        // Atualizar contagem se existir
        const countElementId = categoryCountMap[type];
        if (countElementId) {
          const countElement = document.getElementById(countElementId);
          if (countElement) {
            countElement.innerText = `(${value.count})`;
          }
        }
      } else {
        element.innerText = formatMoney(value);
      }
    }
  });

  // Atualizar contagem do total mensal
  const totalMonthCountElement = document.getElementById("totalMonthCount");
  if (totalMonthCountElement) {
    const count = summary.total_count || 0;
    const countText = count === 1 ? "1 conta" : `${count} contas`;
    totalMonthCountElement.innerText = `(${countText})`;
  }

  const balanceElement = document.getElementById("balanceMonth");

  if (balanceElement) {
    const balance = Number(summary.balance_month || 0);
    balanceElement.classList.toggle("text-danger", balance < 0);
    balanceElement.classList.toggle("text-success", balance >= 0);
  }
}

async function loadSalarySettings() {
  const salaryInput = document.getElementById("monthlySalaryInput");
  const creditCardClosingDayInput = document.getElementById("creditCardClosingDayInput");

  if (!salaryInput || !creditCardClosingDayInput) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/settings/salary`);

    if (!response.ok) {
      throw new Error(`Falha ao carregar salário: ${response.status}`);
    }

    const data = await response.json();
    salaryInput.value = Number(data?.monthly_salary || 0);
    creditCardClosingDayInput.value = Number(data?.credit_card_closing_day || 4);
  } catch (err) {
    console.error(err);
    salaryInput.value = 0;
    creditCardClosingDayInput.value = 4;
  }
}

function renderTable(transactions) {
  const table = document.getElementById("transactionsTable");

  if (!table) {
    return;
  }

  table.innerHTML = "";

  if (!transactions.length) {
    table.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">Nenhuma transação encontrada.</td>
      </tr>
    `;
    return;
  }

  transactions.forEach((transaction) => {
    table.innerHTML += `
      <tr>
        <td>${transaction.description ?? "-"}</td>
        <td>${formatMoney(transaction.value)}</td>
        <td>${transaction.type ?? "-"}</td>
        <td>${formatPaymentMethod(transaction.payment_method ?? transaction.payment)}</td>
        <td>${formatDateBR(transaction.date)}</td>
        <td>
          <button class="btn btn-secondary btn-sm me-2" onclick="openEditModal(${transaction.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${transaction.id})">Deletar</button>
        </td>
      </tr>
    `;
  });
}

function resetTransactionForm() {
  const descriptionInput = document.getElementById("desc");
  const valueInput = document.getElementById("value");
  const typeSelect = document.getElementById("type");
  const paymentSelect = document.getElementById("payment");
  const dateInput = document.getElementById("date");

  if (descriptionInput) {
    descriptionInput.value = "";
  }

  if (valueInput) {
    valueInput.value = "";
  }

  if (typeSelect) {
    typeSelect.selectedIndex = 0;
  }

  if (paymentSelect) {
    paymentSelect.selectedIndex = 0;
  }

  if (dateInput) {
    dateInput.value = "";
  }
}

function openEditModal(transactionId) {
  const transaction = currentTransactions.find((t) => t.id === transactionId);

  if (!transaction) {
    alert("Transação não encontrada para editar");
    return;
  }

  const descriptionInput = document.getElementById("desc");
  const valueInput = document.getElementById("value");
  const typeSelect = document.getElementById("type");
  const paymentSelect = document.getElementById("payment");
  const dateInput = document.getElementById("date");

  if (descriptionInput) descriptionInput.value = transaction.description || "";
  if (valueInput) valueInput.value = transaction.value ?? "";
  if (typeSelect) typeSelect.value = transaction.type || typeSelect.options[0]?.value;
  if (paymentSelect) paymentSelect.value = formatPaymentMethod(transaction.payment_method ?? transaction.payment) || paymentSelect.options[0]?.value;
  if (dateInput) dateInput.value = transaction.date || "";

  editingTransactionId = transactionId;
  setTransactionModalTitle(transaction.description || "Editar Conta");
  getModal()?.show();
}

async function saveTransaction() {
  const description = document.getElementById("desc")?.value.trim();
  const value = parseFloat(document.getElementById("value")?.value);
  const type = document.getElementById("type")?.value;
  const paymentMethod = normalizePaymentMethod(document.getElementById("payment")?.value);
  const date = document.getElementById("date")?.value;

  const data = {
    description,
    value,
    type,
    payment_method: paymentMethod,
    date
  };

  if (!description || Number.isNaN(value) || value <= 0 || !type || !paymentMethod || !date) {
    alert("Preencha corretamente!");
    return;
  }

  try {
    const url = editingTransactionId ? `${API_BASE_URL}/transactions/${editingTransactionId}` : `${API_BASE_URL}/transactions`;
    const method = editingTransactionId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      const errors = Array.isArray(result.errors)
        ? result.errors.join("\n")
        : (result.errors || "Erro ao salvar!");

      alert(errors);
      return;
    }

    getModal()?.hide();
    resetTransactionForm();
    editingTransactionId = null;
    await loadTransactions();
    await loadSummary();
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com servidor");
  }
}

async function deleteTransaction(transactionId) {
  if (!confirm("Tem certeza que deseja deletar esta transação?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const result = await response.json();
      const error = result.error || "Erro ao deletar transação!";
      alert(error);
      return;
    }

    getModal()?.hide();
    resetTransactionForm();
    await loadTransactions();
    await loadSummary();
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com servidor");
  }
}

async function loadTransactions() {
  const selectedMonth = getSelectedMonth();
  const [year, month] = selectedMonth.split("-");

  try {
    const res = await fetch(`${API_BASE_URL}/transactions/${year}/${month}`);

    if (!res.ok) {
      throw new Error(`Falha ao carregar transações: ${res.status}`);
    }

    const data = await res.json();
    currentTransactions = Array.isArray(data) ? data : [];
    renderTable(currentTransactions);

    updateCurrentMonthLabel(new Date(`${year}-${month}-01T00:00:00`));
  } catch (err) {
    console.error(err);
    renderTable([]);
    alert("Erro ao carregar transações");
  }
}

async function loadSummary() {
  const selectedMonth = getSelectedMonth();
  const [year, month] = selectedMonth.split("-");

  try {
    const res = await fetch(`${API_BASE_URL}/summary/${year}/${month}`);

    if (!res.ok) {
      throw new Error(`Falha ao carregar resumo: ${res.status}`);
    }

    const data = await res.json();
    updateSummaryCards(data || {});
  } catch (err) {
    console.error(err);
    updateSummaryCards({});
  }
}

function initPage() {
  setMonthPickerToCurrentMonth();
  updateCurrentMonthLabel();
  loadTransactions();
  loadSummary();

  const monthPicker = document.getElementById("monthPicker");

  if (monthPicker) {
    monthPicker.addEventListener("change", () => {
      loadTransactions();
      loadSummary();
    });
  }
}

function getRecurringModal() {
  const recurringModalElement = document.getElementById("recurringModal");

  if (!recurringModalInstance && recurringModalElement && window.bootstrap) {
    recurringModalInstance = new bootstrap.Modal(recurringModalElement);
  }

  return recurringModalInstance;
}

function getAddRecurringModal() {
  const addRecurringModalElement = document.getElementById("addRecurringModal");

  if (!addRecurringModalInstance && addRecurringModalElement && window.bootstrap) {
    addRecurringModalInstance = new bootstrap.Modal(addRecurringModalElement);
  }

  return addRecurringModalInstance;
}

function openRecurringModal() {
  loadRecurringTransactions();
  const modal = getRecurringModal();

  if (modal) {
    modal.show();
  }
}

function openAddRecurringModal() {
  resetRecurringForm();
  const modal = getAddRecurringModal();

  if (modal) {
    modal.show();
  }
}

function resetRecurringForm() {
  const descInput = document.getElementById("recurringDesc");
  const valueInput = document.getElementById("recurringValue");
  const typeSelect = document.getElementById("recurringType");
  const paymentSelect = document.getElementById("recurringPayment");
  const dayInput = document.getElementById("recurringDay");

  if (descInput) descInput.value = "";
  if (valueInput) valueInput.value = "";
  if (typeSelect) typeSelect.selectedIndex = 0;
  if (paymentSelect) paymentSelect.selectedIndex = 0;
  if (dayInput) dayInput.value = "";
  editingRecurringId = null;
}

function openEditRecurringModal(recurringId) {
  const recurring = currentRecurringTransactions.find((r) => r.id === recurringId);

  if (!recurring) {
    alert("Conta recorrente não encontrada");
    return;
  }

  const descInput = document.getElementById("recurringDesc");
  const valueInput = document.getElementById("recurringValue");
  const typeSelect = document.getElementById("recurringType");
  const paymentSelect = document.getElementById("recurringPayment");
  const dayInput = document.getElementById("recurringDay");

  if (descInput) descInput.value = recurring.description || "";
  if (valueInput) valueInput.value = recurring.value ?? "";
  if (typeSelect) typeSelect.value = recurring.type || typeSelect.options[0]?.value;
  if (paymentSelect) paymentSelect.value = formatPaymentMethod(recurring.payment_method ?? recurring.payment) || paymentSelect.options[0]?.value;
  if (dayInput) dayInput.value = recurring.day_of_month || "";

  editingRecurringId = recurringId;
  getAddRecurringModal()?.show();
}

async function loadRecurringTransactions() {
  try {
    const res = await fetch(`${API_BASE_URL}/recurring`);

    if (!res.ok) {
      throw new Error("Falha ao carregar contas recorrentes");
    }

    const data = await res.json();
    currentRecurringTransactions = Array.isArray(data) ? data : [];
    renderRecurringList();
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar contas recorrentes");
  }
}

function renderRecurringList() {
  const listElement = document.getElementById("recurringList");

  if (!listElement) {
    return;
  }

  listElement.innerHTML = "";

  if (!currentRecurringTransactions.length) {
    listElement.innerHTML = "<p class=\"text-muted\">Nenhuma conta recorrente cadastrada</p>";
    return;
  }

  currentRecurringTransactions.forEach((recurring) => {
    listElement.innerHTML += `
      <div class="list-group-item list-group-item-dark d-flex justify-content-between align-items-center">
        <div>
          <strong>${recurring.description}</strong><br>
          <small class="text-muted">
            Valor: ${formatMoney(recurring.value)} | Dia: ${recurring.day_of_month} | Tipo: ${recurring.type}
          </small>
        </div>
        <div class="btn-group" role="group">
          <button class="btn btn-secondary btn-sm" onclick="openEditRecurringModal(${recurring.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteRecurringTransaction(${recurring.id})">Deletar</button>
        </div>
      </div>
    `;
  });
}

async function saveRecurringTransaction() {
  const description = document.getElementById("recurringDesc")?.value.trim();
  const value = parseFloat(document.getElementById("recurringValue")?.value);
  const type = document.getElementById("recurringType")?.value;
  const paymentMethod = normalizePaymentMethod(document.getElementById("recurringPayment")?.value);
  const dayOfMonth = parseInt(document.getElementById("recurringDay")?.value);

  const data = {
    description,
    value,
    type,
    payment_method: paymentMethod,
    day_of_month: dayOfMonth
  };

  if (!description || Number.isNaN(value) || value <= 0 || !type || !paymentMethod || Number.isNaN(dayOfMonth)) {
    alert("Preencha corretamente!");
    return;
  }

  try {
    const url = editingRecurringId ? `${API_BASE_URL}/recurring/${editingRecurringId}` : `${API_BASE_URL}/recurring`;
    const method = editingRecurringId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      const errors = Array.isArray(result.errors)
        ? result.errors.join("\n")
        : (result.errors || "Erro ao salvar!");

      alert(errors);
      return;
    }

    getModal()?.hide();
    getAddRecurringModal()?.hide();
    resetRecurringForm();
    await loadRecurringTransactions();
    await loadTransactions();
    await loadSummary();
    const successMessage = editingRecurringId ? "Conta recorrente atualizada com sucesso!" : "Conta recorrente cadastrada com sucesso!";
    editingRecurringId = null;
    alert(successMessage);
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com servidor");
  }
}

async function deleteRecurringTransaction(recurringId) {
  if (!confirm("Tem certeza que deseja deletar esta conta recorrente?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/recurring/${recurringId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const result = await response.json();
      const error = result.error || "Erro ao deletar conta recorrente!";
      alert(error);
      return;
    }

    getModal()?.hide();
    getAddRecurringModal()?.hide();
    await loadRecurringTransactions();
    await loadTransactions();
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com servidor");
  }
}

function getSalaryMonthsModal() {
  const salaryMonthsModalElement = document.getElementById("salaryMonthsModal");

  if (!window.salaryMonthsModalInstance && salaryMonthsModalElement && window.bootstrap) {
    window.salaryMonthsModalInstance = new bootstrap.Modal(salaryMonthsModalElement);
  }

  return window.salaryMonthsModalInstance;
}

async function openSalaryMonthsModal() {
  await loadSalaryMonths();
  const modal = getSalaryMonthsModal();

  if (modal) {
    modal.show();
  }
}

async function loadSalaryMonths() {
  const container = document.getElementById("salaryMonthsContainer");

  if (!container) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/settings/salary/months`);

    if (!response.ok) {
      throw new Error("Falha ao carregar salários dos meses");
    }

    const months = await response.json();
    renderSalaryMonths(months);
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p class=\"text-danger\">Erro ao carregar salários</p>";
  }
}

function renderSalaryMonths(months) {
  const container = document.getElementById("salaryMonthsContainer");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  months.forEach((month) => {
    const monthName = new Date(month.year, month.month - 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    });

    const inputId = `salaryInput_${month.year}_${month.month}`;

    container.innerHTML += `
      <div class="mb-3">
        <label class="form-label" for="${inputId}">Salário - ${monthName}</label>
        <div class="input-group">
          <input
            class="form-control"
            id="${inputId}"
            type="number"
            min="0"
            step="0.01"
            value="${month.salary}"
          >
          <button class="btn btn-success" type="button" onclick="saveSalaryMonth(${month.year}, ${month.month})">
            Salvar
          </button>
        </div>
      </div>
    `;
  });
}

async function saveSalaryMonth(year, month) {
  const inputId = `salaryInput_${year}_${month}`;
  const input = document.getElementById(inputId);

  if (!input) {
    return;
  }

  const salary = parseFloat(input.value || "0");

  if (Number.isNaN(salary) || salary < 0) {
    alert("Informe um salário válido");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/settings/salary/month/${year}/${month}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ salary })
    });

    const result = await response.json();

    if (!response.ok) {
      const errors = Array.isArray(result.errors)
        ? result.errors.join("\n")
        : (result.error || "Erro ao salvar!");

      alert(errors);
      return;
    }

    alert("Salário atualizado com sucesso!");
    await loadSalaryMonths();
    await loadSummary();
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com servidor");
  }
}

document.addEventListener("DOMContentLoaded", initPage);