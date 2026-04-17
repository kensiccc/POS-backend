const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function buildHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function apiFetch(path, token, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: buildHeaders(token),
      ...options,
    });

    const text = await response.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      // Keep data empty for non-JSON responses
    }

    if (!response.ok) {
      throw new Error(data?.error || response.statusText || 'Request failed');
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Cannot reach the server. Please check your network connection or try again later.');
    }
    throw error;
  }
}

export async function login(email, password) {
  return apiFetch('/api/auth/login', null, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe(token) {
  return apiFetch('/api/auth/me', token, { method: 'GET' });
}

export async function fetchProducts(token) {
  return apiFetch('/api/products', token, { method: 'GET' });
}

export async function fetchOrders(token, query = '') {
  return apiFetch(`/api/orders${query}`, token, { method: 'GET' });
}

export async function createOrder(token, payload) {
  return apiFetch('/api/orders', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(token, id, payload) {
  return apiFetch(`/api/products/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function createProduct(token, payload) {
  return apiFetch('/api/products', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(token, id) {
  return apiFetch(`/api/products/${id}`, token, {
    method: 'DELETE',
  });
}

export async function updateStock(token, id, payload) {
  return apiFetch(`/api/products/${id}/stock`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchAnalytics(token, path) {
  return apiFetch(`/api/analytics/${path}`, token, { method: 'GET' });
}

export async function fetchLowStock(token) {
  return apiFetch('/api/products/low-stock', token, { method: 'GET' });
}
