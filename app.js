const contaForm = document.getElementById('contaForm');
const contasBody = document.getElementById('contasBody');
const totalValue = document.getElementById('totalValue');
const totalItens = document.getElementById('totalItens');
const feedback = document.getElementById('feedback');
const clearAllButton = document.getElementById('clearAll');

const STORAGE_KEY = 'contas_pagas_itens';

const contas = loadContas();

function loadContas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (conta) =>
        typeof conta.DESCRICAO_DA_CONTA === 'string' &&
        typeof conta.DT_PAGAMENTO === 'string' &&
        typeof conta.OBSERVACAO === 'string' &&
        typeof conta.VALOR === 'number' &&
        !Number.isNaN(conta.VALOR) &&
        conta.VALOR >= 0
    );
  } catch {
    return [];
  }
}

function saveContas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contas));
}

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

  contas.forEach((conta, index) => {
    const tr = document.createElement('tr');
    tr.appendChild(createCell(conta.DESCRICAO_DA_CONTA));
    tr.appendChild(createCell(formatCurrency(conta.VALOR)));
    tr.appendChild(createCell(formatDate(conta.DT_PAGAMENTO)));
    tr.appendChild(createCell(conta.OBSERVACAO || '-'));

    const actionsCell = document.createElement('td');
    actionsCell.className = 'actions-cell';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete';
    deleteButton.textContent = 'Excluir';
    deleteButton.addEventListener('click', () => {
      contas.splice(index, 1);
      saveContas();
      renderContas();
      updateTotal();
      showFeedback('Conta removida com sucesso.');
    });

    actionsCell.appendChild(deleteButton);
    tr.appendChild(actionsCell);
    contasBody.appendChild(tr);
  });
}

function updateTotal() {
  const total = contas.reduce((acc, conta) => acc + conta.VALOR, 0);
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

contaForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const { conta, error } = parseContaFromForm();

  if (error) {
    showFeedback(error);
    return;
  }

  contas.push(conta);
  saveContas();
  renderContas();
  updateTotal();
  contaForm.reset();
  showFeedback('Conta cadastrada com sucesso.');
});

clearAllButton.addEventListener('click', () => {
  if (contas.length === 0) {
    showFeedback('Não há contas para limpar.');
    return;
  }

  contas.splice(0, contas.length);
  saveContas();
  renderContas();
  updateTotal();
  showFeedback('Todas as contas foram removidas.');
});

renderContas();
updateTotal();
