import api from './api';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('kalos_token', data.token);
  return data.user;
}

export async function register(name, email, password) {
  const { data } = await api.post('/auth/register', { name, email, password });
  localStorage.setItem('kalos_token', data.token);
  return data.user;
}

export function logout() {
  localStorage.removeItem('kalos_token');
  window.location.href = '/login';
}

export function getToken() {
  return localStorage.getItem('kalos_token');
}

export function isAuthenticated() {
  return !!getToken();
}
