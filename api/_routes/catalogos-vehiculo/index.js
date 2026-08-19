import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

const TABLAS_PERMITIDAS = {
  condiciones: { tabla: 'condiciones_vehiculo', tieneActivo: true, tieneColor: false },
  transmisiones: { tabla: 'transmisiones', tieneActivo: true, tieneColor: false },
  combustibles: { tabla: 'combustibles', tieneActivo: true, tieneColor: false },
  'colores-interior': { tabla: 'colores_interior', tieneActivo: false, tieneColor: true },
  'tipos-vehiculo': { tabla: 'tipos_vehiculo', tieneActivo: true, tieneColor: false },
}

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  const { tipo } = req.query
  const config = TABLAS_PERMITIDAS[tipo]

  if (!config) {
    return res.status(400).json({ error: 'Tipo de catálogo inválido' })
  }

  if (req.method === 'GET') return listar(req, res, config)
  if (req.method === 'POST') return crear(req, res, config)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function listar(req, res, config) {
  const columnas = config.tieneColor ? 'id, nombre, codigo_hex' : 'id, nombre'
  let query = supabaseAdmin.from(config.tabla).select(columnas)
  if (config.tieneActivo) query = query.eq('activo', true)
  query = query.order('id', { ascending: true })

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, `listando ${config.tabla}`) })
  }

  return res.status(200).json({ data })
}

async function crear(req, res, config) {
  try {
    const { nombre, codigo_hex } = req.body || {}

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' })
    }

    const payload = { nombre: nombre.trim() }
    if (config.tieneActivo) payload.activo = true
    if (config.tieneColor && codigo_hex) payload.codigo_hex = codigo_hex.toUpperCase()

    const { data, error } = await supabaseAdmin
      .from(config.tabla)
      .insert(payload)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, `creando en ${config.tabla}`) })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando catálogo:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
