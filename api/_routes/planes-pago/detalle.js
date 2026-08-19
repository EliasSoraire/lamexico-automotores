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

  if (req.method === 'GET') return verPlanPago(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verPlanPago(req, res, id) {
  const { data: plan, error } = await supabaseAdmin
    .from('planes_pago')
    .select(
      `*, ventas(id, numero_venta), clientes(id, nombre, apellido, razon_social, tipo_persona, telefono, email),
       financieras(id, nombre), estados_plan_pago(id, nombre), tipos_tasa(id, nombre)`
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'obteniendo plan de pago') })
  }
  if (!plan) return res.status(404).json({ error: 'Plan de pago no encontrado' })

  const { data: cuotas, error: errorCuotas } = await supabaseAdmin
    .from('cuotas_plan_pago')
    .select('*')
    .eq('plan_pago_id', id)
    .order('numero_cuota', { ascending: true })

  if (errorCuotas) {
    return res.status(500).json({ error: formatearErrorDb(errorCuotas, 'obteniendo cuotas del plan') })
  }

  return res.status(200).json({ data: { ...plan, cuotas: cuotas || [] } })
}
