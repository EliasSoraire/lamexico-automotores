import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { requireAuth } from '../_lib/requireAuth.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'Falta el parámetro id' })
  }

  if (req.method === 'GET') return verTitular(req, res, id)
  if (req.method === 'PUT') return actualizarTitular(req, res, id)
  if (req.method === 'DELETE') return eliminarTitular(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verTitular(req, res, id) {
  const { data, error } = await supabaseAdmin
    .from('titulares_stock')
    .select('id, nombre, activo')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Error obteniendo titular de stock:', error)
    return res.status(500).json({ error: 'Error al obtener el titular de stock' })
  }
  if (!data) return res.status(404).json({ error: 'Titular de stock no encontrado' })

  return res.status(200).json({ data })
}

async function actualizarTitular(req, res, id) {
  try {
    const { nombre, activo } = req.body || {}

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre / razón social es obligatorio' })
    }

    const { data, error } = await supabaseAdmin
      .from('titulares_stock')
      .update({
        nombre: nombre.trim(),
        activo: !!activo,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando titular de stock:', error)
      return res.status(500).json({ error: 'Error al actualizar el titular de stock' })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando titular de stock:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarTitular(req, res, id) {
  try {
    const { count: vehiculosConEsteTitular } = await supabaseAdmin
      .from('vehiculos')
      .select('id', { count: 'exact', head: true })
      .eq('titular_stock_id', id)

    if (vehiculosConEsteTitular > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: hay ${vehiculosConEsteTitular} vehículo(s) con este titular.`,
      })
    }

    const { error } = await supabaseAdmin.from('titulares_stock').delete().eq('id', id)

    if (error) {
      console.error('Error eliminando titular de stock:', error)
      return res.status(500).json({ error: 'Error al eliminar el titular de stock' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando titular de stock:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
