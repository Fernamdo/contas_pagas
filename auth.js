const AUTH_STORAGE_KEY = 'contas_pagas_auth';
const AUTH_USERNAME = 'lala';
const AUTH_PASSWORD = '11082025@laLa#';

function isAuthenticated() {
  return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

function login(username, password) {
  const ok = username === AUTH_USERNAME && password === AUTH_PASSWORD;
  if (ok) {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
  }
  return ok;
}

function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.location.href = 'login.html';
}
