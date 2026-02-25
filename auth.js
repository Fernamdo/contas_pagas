const AUTH_STORAGE_KEY = 'contas_pagas_auth_user';

function isAuthenticated() {
  return Boolean(localStorage.getItem(AUTH_STORAGE_KEY));
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

async function login(username, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: username, senha: password }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    return { ok: false, message: payload.message || 'Usuário ou senha inválidos.' };
  }

  localStorage.setItem(AUTH_STORAGE_KEY, payload.usuario || username);
  return { ok: true };
}

function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.location.href = 'login.html';
}
