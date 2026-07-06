import { getUserFromRequest } from '../../_lib/jwt.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const user = getUserFromRequest(req)

  if (!user) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' })
  }

  return res.status(200).json({ usuario: user })
}
