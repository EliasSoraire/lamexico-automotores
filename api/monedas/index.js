import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { requireAuth } from '../_lib/requireAuth.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { data, error } = await supabaseAdmin
    .from('monedas')
    .select('id, nombre, codigo, simbolo')
    .eq('activo', true)
    .order('id', { ascending: true })

  if (error) {
    console.error('Error listando monedas:', error)
    return res.status(500).json({ error: 'Error al obtener las monedas' })
  }

  return res.status(200).json({ data })
}
