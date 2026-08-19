import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarVentas(req, res)
  if (req.method === 'POST') return crearVenta(req, res, user)

  return res.status(405).json({ error: 'Método no permitido' })
}

function aplicarFiltros(query, req) {
  const { busqueda, etapa_id, estado_id, prioridad_id, metodo_pago_id, precio_desde, precio_hasta, fecha_desde, fecha_hasta } = req.query

  if (busqueda) {
    query = query.or(`numero_venta.ilike.%${busqueda}%`)
  }
  if (etapa_id) query = query.eq('etapa_id', etapa_id)
  if (estado_id) query = query.eq('estado_id', estado_id)
  if (prioridad_id) query = query.eq('prioridad_id', prioridad_id)
  if (metodo_pago_id) query = query.eq('metodo_pago_id', metodo_pago_id)
  if (precio_desde) query = query.gte('total_operacion', precio_desde)
  if (precio_hasta) query = query.lte('total_operacion', precio_hasta)
  if (fecha_desde) query = query.gte('fecha_venta', fecha_desde)
  if (fecha_hasta) query = query.lte('fecha_venta', fecha_hasta)

  return query
}

async function listarVentas(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)
    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    let query = supabaseAdmin
      .from('ventas')
      .select(
        `id, numero_venta, fecha_venta, total_operacion, vehiculo_id, cliente_id,
         clientes(nombre, apellido, razon_social),
         etapas_venta(nombre), prioridades_venta(nombre), estados_venta!ventas_estado_id_fkey(nombre), usuarios(nombre_completo)`,
        { count: 'exact' }
      )

    query = aplicarFiltros(query, req)
    query = query.order('fecha_creacion', { ascending: false }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'listando ventas') })
    }

    // Traemos el vehículo de cada venta aparte (evita mezclar joins complejos sin poder probarlos en vivo)
    const vehiculoIds = [...new Set(data.map((v) => v.vehiculo_id).filter(Boolean))]
    let vehiculosPorId = {}
    if (vehiculoIds.length > 0) {
      const { data: vehiculosData } = await supabaseAdmin
        .from('vehiculos')
        .select('id, patente, marcas(nombre), modelos(nombre)')
        .in('id', vehiculoIds)
      vehiculosPorId = Object.fromEntries((vehiculosData || []).map((v) => [v.id, v]))
    }

    const dataConVehiculo = data.map((v) => ({ ...v, vehiculo: vehiculosPorId[v.vehiculo_id] || null }))

    const { count: totalGeneral } = await supabaseAdmin.from('ventas').select('id', { count: 'exact', head: true })

    const contadorPorEstado = async (nombre) => {
      const { data: estado } = await supabaseAdmin.from('estados_venta').select('id').eq('nombre', nombre).maybeSingle()
      if (!estado) return 0
      const { count } = await supabaseAdmin.from('ventas').select('id', { count: 'exact', head: true }).eq('estado_id', estado.id)
      return count || 0
    }

    const [activas, completadas] = await Promise.all([contadorPorEstado('Activa'), contadorPorEstado('Completada')])

    const { data: completadasData } = await supabaseAdmin
      .from('ventas')
      .select('total_operacion, estado_id, estados_venta!ventas_estado_id_fkey(nombre)')
    const ingresosTotales = (completadasData || [])
      .filter((v) => v.estados_venta?.nombre === 'Completada')
      .reduce((acc, v) => acc + Number(v.total_operacion || 0), 0)

    return res.status(200).json({
      data: dataConVehiculo,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      contadores: { total: totalGeneral || 0, activas, completadas, ingresos_totales: ingresosTotales },
    })
  } catch (err) {
    console.error('Error inesperado listando ventas:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearVenta(req, res, user) {
  try {
    const body = req.body || {}

    if (!body.vehiculo_id || !body.cliente_id || !body.fecha_venta || !body.moneda_id || !body.estado_id) {
      return res.status(400).json({ error: 'Vehículo, Cliente, Fecha de Venta, Moneda y Estado de la Venta son obligatorios' })
    }

    const precioVehiculo = Number(body.precio_vehiculo) || 0
    const descuento = Number(body.descuento) || 0
    const totalOperacion = precioVehiculo - descuento

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

    const { data: etapaInicial } = await supabaseAdmin
      .from('etapas_venta')
      .select('id')
      .eq('nombre', 'Contacto Inicial')
      .maybeSingle()

    const { count: totalExistentes } = await supabaseAdmin.from('ventas').select('id', { count: 'exact', head: true })
    const numeroVenta = `V-${String((totalExistentes || 0) + 1).padStart(5, '0')}`

    const payload = {
      numero_venta: numeroVenta,
      vehiculo_id: body.vehiculo_id,
      cliente_id: body.cliente_id,
      creado_por_id: user.id,
      prioridad_id: body.prioridad_id || null,
      fecha_reserva: body.fecha_reserva || null,
      fecha_venta: body.fecha_venta,
      moneda_id: body.moneda_id,
      etapa_id: body.etapa_id || etapaInicial?.id || null,
      estado_id: body.estado_id,
      observaciones: body.observaciones || null,
      precio_vehiculo: precioVehiculo,
      descuento,
      total_items: 0,
      total_operacion: totalOperacion,
      anticipo,
      pago_efectivo: pagoEfectivo,
      pago_cheque: pagoCheque,
      pago_tarjeta_credito: pagoTarjetaCredito,
      pago_tarjeta_debito: pagoTarjetaDebito,
      pago_transferencia: pagoTransferencia,
      pago_plan_ahorro: pagoPlanAhorro,
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
      presupuesto_id: body.presupuesto_id || null,
      saldo_pendiente: saldoPendiente,
      activo: true,
    }

    const { data, error } = await supabaseAdmin.from('ventas').insert(payload).select().single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'creando venta') })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando venta:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
