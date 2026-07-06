import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'Falta el parámetro id' })
  }

  if (req.method === 'GET') return verClasificacion(req, res, id)
  if (req.method === 'PUT') return actualizarClasificacion(req, res, id)
  if (req.method === 'DELETE') return eliminarClasificacion(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

function validarHex(hex) {
  return /^#([0-9A-Fa-f]{6})$/.test(hex)
}

async function verClasificacion(req, res, id) {
  try {
    const { data: clasificacion, error } = await supabaseAdmin
      .from('clasificaciones_vehiculos')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error obteniendo clasificación:', error)
      return res.status(500).json({ error: 'Error al obtener la clasificación' })
    }
    if (!clasificacion) {
      return res.status(404).json({ error: 'Clasificación no encontrada' })
    }

    const { data: vehiculos, count } = await supabaseAdmin
      .from('vehiculos')
      .select('id, patente, marca_id, modelo_id', { count: 'exact' })
      .eq('clasificacion_id', id)
      .limit(20)

    return res.status(200).json({
      data: clasificacion,
      vehiculos: vehiculos || [],
      total_vehiculos: count || 0,
    })
  } catch (err) {
    console.error('Error inesperado obteniendo clasificación:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function actualizarClasificacion(req, res, id) {
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
      .update({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        color_hex: color_hex.toLowerCase(),
        activo: !!activo,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una clasificación con ese nombre' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando clasificación') })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando clasificación:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarClasificacion(req, res, id) {
  try {
    const { count: vehiculosConEstaClasificacion } = await supabaseAdmin
      .from('vehiculos')
      .select('id', { count: 'exact', head: true })
      .eq('clasificacion_id', id)

    if (vehiculosConEstaClasificacion > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: hay ${vehiculosConEstaClasificacion} vehículo(s) con esta clasificación.`,
      })
    }

    const { error } = await supabaseAdmin.from('clasificaciones_vehiculos').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'eliminando clasificación') })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando clasificación:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
