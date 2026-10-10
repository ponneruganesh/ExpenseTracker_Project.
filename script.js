const STORAGE_KEY = "expenseTrackerTransactions";
const form = document.getElementById("transactionForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const transactionList = document.getElementById("transactionList");

let transactions = loadTransactions();

function localDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}
dateInput.value = localDateString();

function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

function render() {
  const income = transactions
    .filter(item => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions
    .filter(item => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  document.getElementById("totalIncome").textContent = money(income);
  document.getElementById("totalExpenses").textContent = money(expenses);
  document.getElementById("balance").textContent = money(income - expenses);

  if (transactions.length === 0) {
    transactionList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">↗</div>
        <h3>No transactions yet</h3>
        <p>Add your first income or expense to get started.</p>
      </div>`;
    return;
  }

  const sorted = [...transactions].sort((a, b) =>
    b.date.localeCompare(a.date) || b.id - a.id
  );

  transactionList.innerHTML = sorted.map(item => {
    const isIncome = item.type === "income";
    const symbol = isIncome ? "+" : "−";
    const icon = isIncome ? "↙" : "↗";
    const signClass = isIncome ? "positive" : "negative";
    return `
      <article class="transaction">
        <div class="transaction-icon">${icon}</div>
        <div class="transaction-info">
          <h3>${escapeHTML(item.description)}</h3>
          <p>${escapeHTML(item.category)} · ${escapeHTML(item.date)}</p>
        </div>
        <div class="transaction-right">
          <div class="transaction-amount ${signClass}">${symbol}${money(item.amount)}</div>
          <button class="delete-button" type="button" data-delete="${item.id}" aria-label="Delete ${escapeHTML(item.description)}">Delete</button>
        </div>
      </article>`;
  }).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);

  if (!description || !Number.isFinite(amount) || amount <= 0 || !dateInput.value) {
    alert("Please enter a description, a valid amount, and a date.");
    return;
  }

  transactions.push({
    id: Date.now(),
    description,
    amount,
    type: typeInput.value,
    category: categoryInput.value,
    date: dateInput.value
  });

  saveTransactions();
  render();
  form.reset();
  dateInput.value = localDateString();
  typeInput.value = "expense";
  categoryInput.value = "Food";
  descriptionInput.focus();
});

transactionList.addEventListener("click", event => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  const id = Number(button.dataset.delete);
  transactions = transactions.filter(item => item.id !== id);
  saveTransactions();
  render();
});

document.getElementById("clearAll").addEventListener("click", () => {
  if (!transactions.length) return;
  if (confirm("Delete all transactions? This cannot be undone.")) {
    transactions = [];
    saveTransactions();
    render();
  }
});

render();
