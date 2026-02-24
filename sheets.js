const APPS_SCRIPT_WEB_APP_URL = localStorage.getItem('contas_pagas_gas_url') || '';

async function postToSheets(payload) {
  if (!APPS_SCRIPT_WEB_APP_URL) {
    return { ok: false, skipped: true, message: 'URL do Apps Script não configurada.' };
  }

  try {
    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { ok: false, message: `Falha HTTP ${response.status}` };
    }

    const data = await response.json().catch(() => ({}));
    return { ok: true, data };
  } catch (error) {
    return { ok: false, message: error?.message || 'Erro ao enviar para planilha.' };
  }
}

function saveContaToSheets(conta) {
  return postToSheets({
    type: 'conta',
    data: conta,
    timestamp: new Date().toISOString(),
  });
}

function saveLoginToSheets(loginData) {
  return postToSheets({
    type: 'login',
    data: loginData,
    timestamp: new Date().toISOString(),
  });
}
