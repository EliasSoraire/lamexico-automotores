import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { data, error } = await supabaseAdmin
    .from('categorias_items')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'listando categorías de ítems') })
  }

  return res.status(200).json({ data })
}
