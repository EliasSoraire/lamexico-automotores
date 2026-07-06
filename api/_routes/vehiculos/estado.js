import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'

const ESTADOS_VALIDOS = ['Disponible', 'En Tránsito', 'Reservado', 'En Preparación', 'De Baja']

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { id, estado } = req.body || {}

  if (!id || !estado) {
    return res.status(400).json({ error: 'Faltan id o estado' })
  }

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' })
  }

  const { data, error } = await supabaseAdmin
    .from('vehiculos')
    .update({ estado, fecha_actualizacion: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error cambiando estado del vehículo:', error)
    return res.status(500).json({ error: 'Error al cambiar el estado' })
  }

  return res.status(200).json({ data })
}
