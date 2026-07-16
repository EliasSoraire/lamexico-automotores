import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

const TABLAS_PERMITIDAS = {
  generos: 'generos',
  'estados-civiles': 'estados_civiles',
  'tipos-documento': 'tipos_documento',
  'estados-cliente': 'estados_cliente',
  segmentos: 'segmentos_cliente',
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
