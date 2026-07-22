import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Falta el parámetro id' })

  const { error } = await supabaseAdmin.from('vehiculos_permuta_presupuesto').delete().eq('id', id)

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'eliminando permuta') })
  }

  return res.status(200).json({ ok: true })
}
