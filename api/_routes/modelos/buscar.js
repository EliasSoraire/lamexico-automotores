import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const busqueda = (req.query.busqueda || '').trim()
  if (!busqueda) return res.status(200).json({ data: [] })

  const { data, error } = await supabaseAdmin
    .from('modelos')
    .select('id, nombre, version, marca_id, marcas(nombre)')
    .ilike('nombre', `%${busqueda}%`)
    .eq('activo', true)
    .limit(10)

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'buscando modelos') })
  }

  return res.status(200).json({ data })
}
