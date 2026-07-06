import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarClasificaciones(req, res)
  if (req.method === 'POST') return crearClasificacion(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

function validarHex(hex) {
  return /^#([0-9A-Fa-f]{6})$/.test(hex)
}

async function listarClasificaciones(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)

    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    const { data, error, count } = await supabaseAdmin
      .from('clasificaciones_vehiculos')
      .select('id, nombre, descripcion, color_hex, activo', { count: 'exact' })
      .order('nombre', { ascending: true })
      .range(desde, hasta)

    if (error) {
      console.error('Error listando clasificaciones:', error)
      return res.status(500).json({ error: 'Error al obtener las clasificaciones' })
    }

    return res.status(200).json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (err) {
    console.error('Error inesperado listando clasificaciones:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearClasificacion(req, res) {
  try {
    const { nombre, descripcion, color_hex, activo } = req.body || {}

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' })
    }

    if (!color_hex || !validarHex(color_hex)) {
      return res.status(400).json({ error: 'El color no es válido (ej: #3B82F6)' })
    }

    const { data, error } = await supabaseAdmin
      .from('clasificaciones_vehiculos')
      .insert({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        color_hex: color_hex.toLowerCase(),
        activo: activo === undefined ? true : !!activo,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una clasificación con ese nombre' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'creando clasificación') })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando clasificación:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
