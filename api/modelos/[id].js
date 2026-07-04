import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { requireAuth } from '../_lib/requireAuth.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query

  if (req.method === 'GET') return verModelo(req, res, id)
  if (req.method === 'PUT') return actualizarModelo(req, res, id)
  if (req.method === 'DELETE') return eliminarModelo(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verModelo(req, res, id) {
  const { data, error } = await supabaseAdmin.from('modelos').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('Error obteniendo modelo:', error)
    return res.status(500).json({ error: 'Error al obtener el modelo' })
  }
  if (!data) return res.status(404).json({ error: 'Modelo no encontrado' })

  return res.status(200).json({ data })
}

async function actualizarModelo(req, res, id) {
  try {
    const { nombre, activo, version, precio_lista, moneda_id, descripcion } = req.body || {}

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del modelo es obligatorio' })
    }

    const { data, error } = await supabaseAdmin
      .from('modelos')
      .update({
        nombre: nombre.trim(),
        activo: !!activo,
        version: version?.trim() || null,
        precio_lista: precio_lista || null,
        moneda_id: moneda_id || null,
        descripcion: descripcion?.trim() || null,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando modelo:', error)
      return res.status(500).json({ error: 'Error al actualizar el modelo' })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando modelo:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarModelo(req, res, id) {
  try {
    const { count: totalVehiculos } = await supabaseAdmin
      .from('vehiculos')
      .select('id', { count: 'exact', head: true })
      .eq('modelo_id', id)

    if (totalVehiculos > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: este modelo tiene ${totalVehiculos} vehículo(s) asociado(s).`,
      })
    }

    const { error } = await supabaseAdmin.from('modelos').delete().eq('id', id)

    if (error) {
      console.error('Error eliminando modelo:', error)
      return res.status(500).json({ error: 'Error al eliminar el modelo' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando modelo:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
