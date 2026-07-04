import { getUserFromRequest } from './jwt.js'

// Devuelve el usuario si el token es válido, o responde 401 y devuelve null.
export function requireAuth(req, res) {
  const user = getUserFromRequest(req)
  if (!user) {
    res.status(401).json({ error: 'No autorizado. Iniciá sesión nuevamente.' })
    return null
  }
  return user
}
