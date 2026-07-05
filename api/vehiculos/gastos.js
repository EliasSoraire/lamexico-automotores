import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { requireAuth } from '../_lib/requireAuth.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarGastos(req, res)
  if (req.method === 'POST') return crearGasto(req, res)
  if (req.method === 'DELETE') return eliminarGasto(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function listarGastos(req, res) {
  const { vehiculo_id } = req.query
  if (!vehiculo_id) return res.status(400).json({ error: 'Falta vehiculo_id' })

  const { data, error } = await supabaseAdmin
    .from('gastos_vehiculo')
    .select('*, monedas(simbolo)')
    .eq('vehiculo_id', vehiculo_id)
    .order('fecha', { ascending: false })

  if (error) {
    console.error('Error listando gastos:', error)
    return res.status(500).json({ error: 'Error al obtener los gastos' })
  }

  return res.status(200).json({ data })
}

async function crearGasto(req, res) {
  try {
    const { vehiculo_id, monto, moneda_id, categoria, descripcion, fecha, adjunto_url, adjunto_nombre } =
      req.body || {}

    if (!vehiculo_id || !monto || !fecha) {
      return res.status(400).json({ error: 'Vehículo, monto y fecha son obligatorios' })
    }

    const { data, error } = await supabaseAdmin
      .from('gastos_vehiculo')
      .insert({
        vehiculo_id,
        monto,
        moneda_id: moneda_id || null,
        categoria: categoria || null,
        descripcion: descripcion || null,
        fecha,
        adjunto_url: adjunto_url || null,
        adjunto_nombre: adjunto_nombre || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando gasto:', error)
      return res.status(500).json({ error: 'Error al crear el gasto' })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando gasto:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarGasto(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Falta id' })

  const { error } = await supabaseAdmin.from('gastos_vehiculo').delete().eq('id', id)

  if (error) {
    console.error('Error eliminando gasto:', error)
    return res.status(500).json({ error: 'Error al eliminar el gasto' })
  }

  return res.status(200).json({ ok: true })
}
