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

  if (req.method === 'GET') return verColor(req, res, id)
  if (req.method === 'PUT') return actualizarColor(req, res, id)
  if (req.method === 'DELETE') return eliminarColor(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

function validarHex(hex) {
  return /^#([0-9A-Fa-f]{6})$/.test(hex)
}

async function verColor(req, res, id) {
  const { data, error } = await supabaseAdmin.from('colores').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('Error obteniendo color:', error)
    return res.status(500).json({ error: 'Error al obtener el color' })
  }
  if (!data) return res.status(404).json({ error: 'Color no encontrado' })

  return res.status(200).json({ data })
}

async function actualizarColor(req, res, id) {
  try {
    const { nombre, codigo_hex, codigo_fabrica } = req.body || {}

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' })
    }

    if (!codigo_hex || !validarHex(codigo_hex)) {
      return res.status(400).json({ error: 'El código hexadecimal no es válido (ej: #FF0000)' })
    }

    const { data, error } = await supabaseAdmin
      .from('colores')
      .update({
        nombre: nombre.trim(),
        codigo_hex: codigo_hex.toUpperCase(),
        codigo_fabrica: codigo_fabrica?.trim() || null,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un color con ese nombre' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando color') })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando color:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarColor(req, res, id) {
  try {
    const { count: vehiculosConEsteColor } = await supabaseAdmin
      .from('vehiculos')
      .select('id', { count: 'exact', head: true })
      .eq('color_id', id)

    if (vehiculosConEsteColor > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: hay ${vehiculosConEsteColor} vehículo(s) usando este color.`,
      })
    }

    const { error } = await supabaseAdmin.from('colores').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'eliminando color') })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando color:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
