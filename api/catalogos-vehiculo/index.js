import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { requireAuth } from '../_lib/requireAuth.js'

const TABLAS_PERMITIDAS = {
  condiciones: { tabla: 'condiciones_vehiculo', tieneActivo: true },
  transmisiones: { tabla: 'transmisiones', tieneActivo: true },
  combustibles: { tabla: 'combustibles', tieneActivo: true },
  'colores-interior': { tabla: 'colores_interior', tieneActivo: false },
}

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { tipo } = req.query
  const config = TABLAS_PERMITIDAS[tipo]

  if (!config) {
    return res.status(400).json({ error: 'Tipo de catálogo inválido' })
  }

  let query = supabaseAdmin.from(config.tabla).select('id, nombre')
  if (config.tieneActivo) query = query.eq('activo', true)
  query = query.order('id', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error(`Error listando ${config.tabla}:`, error)
    return res.status(500).json({ error: 'Error al obtener el catálogo' })
  }

  return res.status(200).json({ data })
}
