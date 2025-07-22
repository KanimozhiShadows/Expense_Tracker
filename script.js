const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const date = document.getElementById('date');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

form.addEventListener('submit', addTransaction);

function generateID() {
  return Math.floor(Math.random() * 100000000);
}

function addTransaction(e) {
  e.preventDefault();
  if (text.value.trim() === '' || amount.value.trim() === '' || date.value.trim() === '') {
    alert('Please fill in all fields');
    return;
  }

  const transaction = {
    id: generateID(),
    text: text.value,
    amount: +amount.value,
    date: date.value
  };

  transactions.push(transaction);
  updateLocalStorage();
  init();
  form.reset();
}

function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? '-' : '+';
  const item = document.createElement('li');

  item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');
  item.innerHTML = `
    ${transaction.text} (${transaction.date}) <span>${sign}₹${Math.abs(transaction.amount)}</span>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
  `;

  list.appendChild(item);
}

function updateValues() {
  const amounts = transactions.map(t => t.amount);
  const total = amounts.reduce((acc, val) => acc + val, 0).toFixed(2);
  const income = amounts.filter(val => val > 0).reduce((acc, val) => acc + val, 0).toFixed(2);
  const expense = amounts.filter(val => val < 0).reduce((acc, val) => acc + val, 0).toFixed(2);

  balance.innerText = `₹${total}`;
  money_plus.innerText = `+₹${income}`;
  money_minus.innerText = `-₹${Math.abs(expense)}`;
}

function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  updateLocalStorage();
  init();
}

function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function filterType(type) {
  let filtered = [];
  if (type === 'income') {
    filtered = transactions.filter(t => t.amount > 0);
  } else if (type === 'expense') {
    filtered = transactions.filter(t => t.amount < 0);
  } else {
    filtered = [...transactions];
  }
  list.innerHTML = '';
  filtered.forEach(addTransactionDOM);
}

function updateMonthlySummary() {
  const summary = {};
  transactions.forEach(t => {
    const month = t.date ? t.date.slice(0, 7) : 'No Date';
    if (!summary[month]) summary[month] = 0;
    summary[month] += t.amount;
  });

  const container = document.getElementById('monthly-summary');
  container.innerHTML = '';
  Object.entries(summary).forEach(([month, amount]) => {
    const li = document.createElement('li');
    li.textContent = `${month}: ₹${amount.toFixed(2)}`;
    container.appendChild(li);
  });
}

function renderChart() {
  const ctx = document.getElementById('expenseChart').getContext('2d');
  const income = transactions.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter(t => t.amount < 0).reduce((a, b) => a + b.amount, 0) * -1;

  if (window.pieChart) window.pieChart.destroy();
  window.pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['green', 'red']
      }]
    },
    options: {
      responsive: true
    }
  });
}

function exportToExcel() {
  const data = transactions.map(t => ({
    Date: t.date,
    Description: t.text,
    Income: t.amount >= 0 ? t.amount : '',
    Expense: t.amount < 0 ? Math.abs(t.amount) : ''
  }));

  data.push({
    Date: '',
    Description: 'Total',
    Income: data.reduce((sum, row) => sum + (Number(row.Income) || 0), 0),
    Expense: data.reduce((sum, row) => sum + (Number(row.Expense) || 0), 0)
  });

  const ws = XLSX.utils.json_to_sheet(data, {
    header: ["Date", "Description", "Income", "Expense"]
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  XLSX.writeFile(wb, "expense_tracker.xlsx");
}

function init() {
  list.innerHTML = '';
  transactions.forEach(addTransactionDOM);
  updateValues();
  updateMonthlySummary();
  renderChart();
}

init();
