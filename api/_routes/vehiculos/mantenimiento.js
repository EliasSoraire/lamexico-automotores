import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarMantenimiento(req, res, user)
  if (req.method === 'POST') return crearMantenimiento(req, res, user)
  if (req.method === 'DELETE') return eliminarMantenimiento(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function eliminarMantenimiento(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Falta id' })

  const { error } = await supabaseAdmin.from('mantenimiento_vehiculo').delete().eq('id', id)

  if (error) {
    console.error('Error eliminando registro de mantenimiento:', error)
    return res.status(500).json({ error: 'Error al eliminar el registro' })
  }

  return res.status(200).json({ ok: true })
}

async function listarMantenimiento(req, res) {
  const { vehiculo_id } = req.query
  if (!vehiculo_id) return res.status(400).json({ error: 'Falta vehiculo_id' })

  const { data, error } = await supabaseAdmin
    .from('mantenimiento_vehiculo')
    .select('*')
    .eq('vehiculo_id', vehiculo_id)
    .order('fecha_creacion', { ascending: false })

  if (error) {
    console.error('Error listando mantenimiento:', error)
    return res.status(500).json({ error: 'Error al obtener el mantenimiento' })
  }

  return res.status(200).json({ data })
}

async function crearMantenimiento(req, res, user) {
  try {
    const { vehiculo_id, tipo_evento, litros, notas } = req.body || {}

    if (!vehiculo_id || !tipo_evento) {
      return res.status(400).json({ error: 'Vehículo y tipo de evento son obligatorios' })
    }

    if (tipo_evento === 'Carga de Combustible' && (litros === undefined || litros === null || litros === '')) {
      return res.status(400).json({ error: 'Los litros son obligatorios para una Carga de Combustible' })
    }

    const { data, error } = await supabaseAdmin
      .from('mantenimiento_vehiculo')
      .insert({
        vehiculo_id,
        tipo_evento,
        litros: litros || null,
        notas: notas || null,
        registrado_por: user.nombre_completo || user.email,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando registro de mantenimiento:', error)
      return res.status(500).json({ error: 'Error al crear el registro' })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando mantenimiento:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
