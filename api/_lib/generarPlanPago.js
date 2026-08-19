import { supabaseAdmin } from './supabaseAdmin.js'

// Si la Venta tiene datos completos de "Financiación Propia" (importe a financiar,
// cantidad de cuotas, importe de cuota y fecha de la primera cuota) y todavía no existe
// un Plan de Pago para esa venta, genera el plan y sus cuotas reales.
// Si ya existe un plan para la venta, no lo toca (para no pisar pagos ya registrados).
export async function generarPlanPagoSiCorresponde(ventaId, clienteId, body) {
  const importeFinanciar = Number(body.importe_financiar) || 0
  const cantidadCuotas = parseInt(body.cantidad_cuotas) || 0
  const importeCuota = Number(body.importe_cuota) || 0
  const primeraCuota = body.primera_cuota

  const datosCompletos = importeFinanciar > 0 && cantidadCuotas > 0 && importeCuota > 0 && !!primeraCuota
  if (!datosCompletos) return

  const { count: planExistente } = await supabaseAdmin
    .from('planes_pago')
    .select('id', { count: 'exact', head: true })
    .eq('venta_id', ventaId)

  if (planExistente > 0) return // ya existe, no lo regeneramos

  const { data: estadoVigente } = await supabaseAdmin
    .from('estados_plan_pago')
    .select('id')
    .eq('nombre', 'Vigente')
    .maybeSingle()

  const { count: totalPlanes } = await supabaseAdmin.from('planes_pago').select('id', { count: 'exact', head: true })
  const numeroPlan = `PL-${String((totalPlanes || 0) + 1).padStart(5, '0')}`

  const montoTotal = cantidadCuotas * importeCuota

  const { data: plan, error: errorPlan } = await supabaseAdmin
    .from('planes_pago')
    .insert({
      venta_id: ventaId,
      cliente_id: clienteId,
      numero_plan: numeroPlan,
      fecha_inicio: primeraCuota,
      cantidad_cuotas: cantidadCuotas,
      valor_cuota: importeCuota,
      monto_total: montoTotal,
      tasa_interes: body.tasa_interes || 0,
      estado_id: estadoVigente?.id || null,
      activo: true,
    })
    .select()
    .single()

  if (errorPlan) {
    console.error('Error generando plan de pago desde la venta:', errorPlan)
    return
  }

  const fechaBase = new Date(`${primeraCuota}T00:00:00`)
  const cuotas = Array.from({ length: cantidadCuotas }, (_, i) => {
    const fecha = new Date(fechaBase)
    fecha.setMonth(fecha.getMonth() + i)
    return {
      plan_pago_id: plan.id,
      numero_cuota: i + 1,
      fecha_vencimiento: fecha.toISOString().slice(0, 10),
      monto: importeCuota,
      monto_pagado: 0,
      saldo_pendiente: importeCuota,
      estado: 'Pendiente',
    }
  })

  const { error: errorCuotas } = await supabaseAdmin.from('cuotas_plan_pago').insert(cuotas)
  if (errorCuotas) {
    console.error('Error generando cuotas del plan de pago:', errorCuotas)
  }
}
