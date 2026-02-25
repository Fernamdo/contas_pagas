if (typeof requireAuth === 'function') {
  requireAuth();
}

const contaForm = document.getElementById('contaForm');
const contasBody = document.getElementById('contasBody');
const totalValue = document.getElementById('totalValue');
const totalItens = document.getElementById('totalItens');
const feedback = document.getElementById('feedback');
const clearAllButton = document.getElementById('clearAll');
const logoutButton = document.getElementById('logoutButton');

let contas = [];

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function showFeedback(message = '') {
  feedback.textContent = message;
}

function renderEmptyState() {
  contasBody.innerHTML = '<tr><td class="empty-row" colspan="5">Nenhuma conta cadastrada.</td></tr>';
}

function createCell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

function renderContas() {
  contasBody.innerHTML = '';

  if (contas.length === 0) {
    renderEmptyState();
    return;
  }

  contas.forEach((conta) => {
    const tr = document.createElement('tr');
    tr.appendChild(createCell(conta.descricao_da_conta));
    tr.appendChild(createCell(formatCurrency(conta.valor)));
    tr.appendChild(createCell(formatDate(conta.dt_pagamento)));
    tr.appendChild(createCell(conta.observacao || '-'));

    const actionsCell = document.createElement('td');
    actionsCell.className = 'actions-cell';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete';
    deleteButton.textContent = 'Excluir';
    deleteButton.addEventListener('click', async () => {
      const response = await fetch(`/api/contas/${conta.id}`, { method: 'DELETE' });
      if (!response.ok) {
        showFeedback('Falha ao excluir conta no banco de dados.');
        return;
      }
      await loadContas();
      showFeedback('Conta removida com sucesso.');
    });

    actionsCell.appendChild(deleteButton);
    tr.appendChild(actionsCell);
    contasBody.appendChild(tr);
  });
}

function updateTotal() {
  const total = contas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0);
  const quantidade = contas.length;
  const plural = quantidade === 1 ? 'conta cadastrada' : 'contas cadastradas';

  totalValue.textContent = formatCurrency(total);
  totalItens.textContent = `${quantidade} ${plural}`;
}

function parseContaFromForm() {
  const formData = new FormData(contaForm);
  const conta = {
    DESCRICAO_DA_CONTA: (formData.get('DESCRICAO_DA_CONTA') || '').toString().trim(),
    VALOR: Number(formData.get('VALOR')),
    DT_PAGAMENTO: (formData.get('DT_PAGAMENTO') || '').toString(),
    OBSERVACAO: (formData.get('OBSERVACAO') || '').toString().trim(),
  };

  if (!conta.DESCRICAO_DA_CONTA) {
    return { error: 'Informe a descrição da conta.' };
  }

  if (Number.isNaN(conta.VALOR) || conta.VALOR <= 0) {
    return { error: 'Informe um valor maior que zero.' };
  }

  if (!conta.DT_PAGAMENTO) {
    return { error: 'Informe a data de pagamento.' };
  }

  return { conta };
}

async function loadContas() {
  const response = await fetch('/api/contas');
  if (!response.ok) {
    contas = [];
    renderContas();
    updateTotal();
    showFeedback('Falha ao carregar contas do banco de dados.');
    return;
  }

  const payload = await response.json();
  contas = Array.isArray(payload.contas) ? payload.contas : [];
  renderContas();
  updateTotal();
}

contaForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const { conta, error } = parseContaFromForm();

  if (error) {
    showFeedback(error);
    return;
  }

  const response = await fetch('/api/contas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conta),
  });

  if (!response.ok) {
    showFeedback('Falha ao salvar conta no banco de dados.');
    return;
  }

  contaForm.reset();
  await loadContas();
  showFeedback('Conta cadastrada com sucesso no SQLite.');
});

if (logoutButton && typeof logout === 'function') {
  logoutButton.addEventListener('click', () => {
    logout();
  });
}

clearAllButton.addEventListener('click', async () => {
  if (contas.length === 0) {
    showFeedback('Não há contas para limpar.');
    return;
  }

  const response = await fetch('/api/contas', { method: 'DELETE' });
  if (!response.ok) {
    showFeedback('Falha ao limpar contas no banco de dados.');
    return;
  }

  await loadContas();
  showFeedback('Todas as contas foram removidas.');
});

loadContas();
