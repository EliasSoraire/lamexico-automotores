import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'
import { generarPlanPagoSiCorresponde } from '../../_lib/generarPlanPago.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Falta el parámetro id' })

  if (req.method === 'GET') return verVenta(req, res, id)
  if (req.method === 'PUT') return actualizarVenta(req, res, id)
  if (req.method === 'DELETE') return eliminarVenta(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verVenta(req, res, id) {
  const { data, error } = await supabaseAdmin
    .from('ventas')
    .select(
      `*, clientes(id, nombre, apellido, razon_social, tipo_persona),
       usuarios(id, nombre_completo), etapas_venta(id, nombre), estados_venta!ventas_estado_id_fkey(id, nombre),
       prioridades_venta(id, nombre), monedas(id, nombre, simbolo), metodos_pago(id, nombre)`
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'obteniendo venta') })
  }
  if (!data) return res.status(404).json({ error: 'Venta no encontrada' })

  let vehiculo = null
  if (data.vehiculo_id) {
    const { data: v } = await supabaseAdmin
      .from('vehiculos')
      .select('id, patente, marcas(nombre), modelos(nombre)')
      .eq('id', data.vehiculo_id)
      .maybeSingle()
    vehiculo = v
  }

  const { data: items } = await supabaseAdmin
    .from('items_venta')
    .select('*, items_catalogo(nombre, codigo)')
    .eq('venta_id', id)
    .order('orden')

  return res.status(200).json({ data, vehiculo, items: items || [] })
}

function calcularTotales(body, totalItemsExistente) {
  const precioVehiculo = Number(body.precio_vehiculo) || 0
  const descuento = Number(body.descuento) || 0
  const totalItems = totalItemsExistente || 0
  const totalOperacion = precioVehiculo - descuento + totalItems

  const anticipo = Number(body.anticipo) || 0
  const pagoEfectivo = Number(body.pago_efectivo) || 0
  const pagoCheque = Number(body.pago_cheque) || 0
  const pagoTarjetaCredito = Number(body.pago_tarjeta_credito) || 0
  const pagoTarjetaDebito = Number(body.pago_tarjeta_debito) || 0
  const pagoTransferencia = Number(body.pago_transferencia) || 0
  const pagoPlanAhorro = Number(body.pago_plan_ahorro) || 0
  const importeFinanciar = Number(body.importe_financiar) || 0
  const importeFinanciacionBancaria = Number(body.importe_financiacion_bancaria) || 0

  const totalPagos = anticipo + pagoEfectivo + pagoCheque + pagoTarjetaCredito + pagoTarjetaDebito + pagoPlanAhorro + pagoTransferencia + importeFinanciar + importeFinanciacionBancaria
  const saldoPendiente = totalOperacion - totalPagos

  return { precioVehiculo, descuento, totalItems, totalOperacion, saldoPendiente, anticipo, pagoEfectivo, pagoCheque, pagoTarjetaCredito, pagoTarjetaDebito, pagoTransferencia, pagoPlanAhorro }
}

async function actualizarVenta(req, res, id) {
  try {
    const body = req.body || {}

    if (!body.vehiculo_id || !body.cliente_id || !body.fecha_venta || !body.moneda_id || !body.estado_id) {
      return res.status(400).json({ error: 'Vehículo, Cliente, Fecha de Venta, Moneda y Estado de la Venta son obligatorios' })
    }

    const { data: itemsActuales } = await supabaseAdmin.from('items_venta').select('subtotal').eq('venta_id', id)
    const totalItemsExistente = (itemsActuales || []).reduce((acc, it) => acc + Number(it.subtotal || 0), 0)

    const totales = calcularTotales(body, totalItemsExistente)

    const payload = {
      vehiculo_id: body.vehiculo_id,
      cliente_id: body.cliente_id,
      prioridad_id: body.prioridad_id || null,
      fecha_reserva: body.fecha_reserva || null,
      fecha_venta: body.fecha_venta,
      moneda_id: body.moneda_id,
      etapa_id: body.etapa_id || null,
      estado_id: body.estado_id,
      observaciones: body.observaciones || null,
      precio_vehiculo: totales.precioVehiculo,
      descuento: totales.descuento,
      total_items: totales.totalItems,
      total_operacion: totales.totalOperacion,
      anticipo: totales.anticipo,
      pago_efectivo: totales.pagoEfectivo,
      pago_cheque: totales.pagoCheque,
      pago_tarjeta_credito: totales.pagoTarjetaCredito,
      pago_tarjeta_debito: totales.pagoTarjetaDebito,
      pago_transferencia: totales.pagoTransferencia,
      pago_plan_ahorro: totales.pagoPlanAhorro,
      metodo_pago_id: body.metodo_pago_id || null,
      importe_financiar: body.importe_financiar || null,
      cantidad_cuotas: body.cantidad_cuotas || null,
      importe_cuota: body.importe_cuota || null,
      tasa_interes: body.tasa_interes || null,
      primera_cuota: body.primera_cuota || null,
      importe_financiacion_bancaria: body.importe_financiacion_bancaria || null,
      banco_nombre: body.banco_nombre || null,
      numero_credito: body.numero_credito || null,
      fecha_aprobacion_bancaria: body.fecha_aprobacion_bancaria || null,
      saldo_pendiente: totales.saldoPendiente,
      fecha_actualizacion: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('ventas')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando venta') })
    }

    try {
      await generarPlanPagoSiCorresponde(data.id, data.cliente_id, body)
    } catch (errPlan) {
      console.error('Error generando plan de pago al actualizar venta:', errPlan)
      // No hacemos fallar la actualización de la venta por esto
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando venta:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarVenta(req, res, id) {
  try {
    const { error } = await supabaseAdmin.from('ventas').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'eliminando venta') })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando venta:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
