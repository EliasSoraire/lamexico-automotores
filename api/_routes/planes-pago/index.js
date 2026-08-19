import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

// Este módulo es de solo consulta: los planes de pago se generan automáticamente
// desde Gestión de Ventas (Financiación Propia), no se crean acá.

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarPlanesPago(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function listarPlanesPago(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)
    const busqueda = (req.query.busqueda || '').trim()
    const estado_id = req.query.estado_id

    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    let query = supabaseAdmin
      .from('planes_pago')
      .select(
        `id, numero_plan, fecha_inicio, cantidad_cuotas, valor_cuota, monto_total, tasa_interes,
         ventas(id, numero_venta), clientes(id, nombre, apellido, razon_social, tipo_persona),
         financieras(id, nombre), estados_plan_pago(id, nombre)`,
        { count: 'exact' }
      )

    if (busqueda) query = query.ilike('numero_plan', `%${busqueda}%`)
    if (estado_id) query = query.eq('estado_id', estado_id)

    query = query.order('fecha_creacion', { ascending: false }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'listando planes de pago') })
    }

    return res.status(200).json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (err) {
    console.error('Error inesperado listando planes de pago:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
