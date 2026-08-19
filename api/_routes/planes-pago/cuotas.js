import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'Falta el parámetro id (id de la cuota)' })
  }

  if (req.method === 'PUT') return registrarPagoCuota(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function registrarPagoCuota(req, res, id) {
  try {
    const { monto_pagado, fecha_pago, estado, observaciones } = req.body || {}

    const { data: cuotaActual, error: errorGet } = await supabaseAdmin
      .from('cuotas_plan_pago')
      .select('id, monto, plan_pago_id')
      .eq('id', id)
      .maybeSingle()

    if (errorGet) {
      return res.status(500).json({ error: formatearErrorDb(errorGet, 'obteniendo cuota') })
    }
    if (!cuotaActual) return res.status(404).json({ error: 'Cuota no encontrada' })

    const nuevoMontoPagado = monto_pagado !== undefined ? Number(monto_pagado) : cuotaActual.monto
    const nuevoSaldoPendiente = Math.max(Number(cuotaActual.monto) - nuevoMontoPagado, 0)
    const nuevoEstado = estado || (nuevoSaldoPendiente <= 0 ? 'Pagada' : 'Pendiente')

    const { data, error } = await supabaseAdmin
      .from('cuotas_plan_pago')
      .update({
        monto_pagado: nuevoMontoPagado,
        saldo_pendiente: nuevoSaldoPendiente,
        fecha_pago: fecha_pago || new Date().toISOString().slice(0, 10),
        estado: nuevoEstado,
        observaciones: observaciones !== undefined ? observaciones : undefined,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'registrando pago de cuota') })
    }

    // Si todas las cuotas del plan quedaron pagadas, marcamos el plan como Pagado
    const { data: cuotasPlan } = await supabaseAdmin
      .from('cuotas_plan_pago')
      .select('estado')
      .eq('plan_pago_id', cuotaActual.plan_pago_id)

    if (cuotasPlan && cuotasPlan.length > 0 && cuotasPlan.every((c) => c.estado === 'Pagada')) {
      const { data: estadoPagado } = await supabaseAdmin
        .from('estados_plan_pago')
        .select('id')
        .eq('nombre', 'Pagado')
        .maybeSingle()

      if (estadoPagado) {
        await supabaseAdmin
          .from('planes_pago')
          .update({ estado_id: estadoPagado.id, fecha_actualizacion: new Date().toISOString() })
          .eq('id', cuotaActual.plan_pago_id)
      }
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado registrando pago de cuota:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
