import { getAuthToken } from '../context/AuthContext'

async function apiFetch(path, options = {}) {
  const token = getAuthToken()

  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  // Intentamos parsear como JSON siempre, sin depender del header content-type
  // (algunos entornos de desarrollo local no lo devuelven de forma consistente).
  let data = null
  try {
    const texto = await res.text()
    data = texto ? JSON.parse(texto) : null
  } catch (err) {
    data = null
  }

  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status}: no se pudo completar la solicitud`)
  }

  if (data === null) {
    throw new Error('La respuesta del servidor no tuvo el formato esperado')
  }

  return data
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
}
