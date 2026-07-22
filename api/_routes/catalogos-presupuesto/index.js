import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

const TABLAS_PERMITIDAS = {
  'estados-presupuesto': 'estados_presupuesto',
  'formas-pago-tipo': 'formas_pago_tipo',
}

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { tipo } = req.query
  const tabla = TABLAS_PERMITIDAS[tipo]

  if (!tabla) {
    return res.status(400).json({ error: 'Tipo de catálogo inválido' })
  }

  const { data, error } = await supabaseAdmin
    .from(tabla)
    .select('id, nombre')
    .eq('activo', true)
    .order('id', { ascending: true })

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, `listando ${tabla}`) })
  }

  return res.status(200).json({ data })
}
