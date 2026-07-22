import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarPresupuestos(req, res)
  if (req.method === 'POST') return crearPresupuesto(req, res, user)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function listarPresupuestos(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)
    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1
    const { busqueda, estado_id, vendedor_id } = req.query

    let query = supabaseAdmin
      .from('presupuestos')
      .select(
        `id, numero, fecha, vencimiento, saldo_a_pagar, falta_cubrir, cliente_id,
         prospecto_nombre, prospecto_apellido, vehiculo_stock_id, modelo_sin_unidad_id,
         clientes(nombre, apellido, razon_social),
         usuarios(nombre_completo), estados_presupuesto(nombre)`,
        { count: 'exact' }
      )

    if (busqueda) {
      query = query.or(`numero.ilike.%${busqueda}%,prospecto_nombre.ilike.%${busqueda}%,prospecto_apellido.ilike.%${busqueda}%`)
    }
    if (estado_id) query = query.eq('estado_id', estado_id)
    if (vendedor_id) query = query.eq('creado_por_id', vendedor_id)

    query = query.order('fecha_creacion', { ascending: false }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'listando presupuestos') })
    }

    return res.status(200).json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (err) {
    console.error('Error inesperado listando presupuestos:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearPresupuesto(req, res, user) {
  try {
    const body = req.body || {}

    if (!body.fecha || !body.vencimiento || !body.moneda_id || !body.estado_id) {
      return res.status(400).json({ error: 'Fecha, Vencimiento, Moneda y Estado son obligatorios' })
    }

    const items = Array.isArray(body.items) ? body.items : []
    const permutas = Array.isArray(body.permutas) ? body.permutas : []
    const formasPago = Array.isArray(body.formas_pago) ? body.formas_pago : []

    const precioBase = Number(body.precio_base) || 0
    const totalItems = items.reduce((acc, it) => acc + (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0), 0)
    const totalPermutas = permutas.reduce((acc, p) => acc + (Number(p.valor_permuta) || 0), 0)
    const saldoAPagar = precioBase + totalItems - totalPermutas
    const saldoCubierto = formasPago.reduce((acc, f) => acc + (Number(f.monto) || 0), 0)
    const faltaCubrir = saldoAPagar - saldoCubierto

    const { count: totalExistentes } = await supabaseAdmin
      .from('presupuestos')
      .select('id', { count: 'exact', head: true })
    const numero = `P-${String((totalExistentes || 0) + 1).padStart(5, '0')}`

    const payloadPresupuesto = {
      numero,
      fecha: body.fecha,
      vencimiento: body.vencimiento,
      moneda_id: body.moneda_id,
      creado_por_id: user.id,
      fuente_contacto: body.fuente_contacto || null,
      consulta_id: body.consulta_id || null,
      cliente_id: body.cliente_id || null,
      prospecto_nombre: body.prospecto_nombre || null,
      prospecto_apellido: body.prospecto_apellido || null,
      prospecto_telefono: body.prospecto_telefono || null,
      prospecto_email: body.prospecto_email || null,
      vehiculo_stock_id: body.vehiculo_stock_id || null,
      modelo_sin_unidad_id: body.modelo_sin_unidad_id || null,
      precio_base: precioBase,
      total_items: totalItems,
      total_permutas: totalPermutas,
      saldo_a_pagar: saldoAPagar,
      saldo_cubierto: saldoCubierto,
      falta_cubrir: faltaCubrir,
      es_saldo_cubierto: faltaCubrir <= 0,
      estado_id: body.estado_id,
      forma_pago_indefinida: !!body.forma_pago_indefinida,
      observaciones: body.observaciones || null,
      activo: true,
    }

    const { data: presupuesto, error } = await supabaseAdmin
      .from('presupuestos')
      .insert(payloadPresupuesto)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'creando presupuesto') })
    }

    // Ítems adicionales
    if (items.length > 0) {
      const filasItems = items.map((it, idx) => ({
        presupuesto_id: presupuesto.id,
        item_catalogo_id: it.item_catalogo_id || null,
        descripcion: it.descripcion || null,
        cantidad: Number(it.cantidad) || 1,
        precio_unitario: Number(it.precio_unitario) || 0,
        subtotal: (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0),
        observaciones: it.observaciones || null,
        orden: idx,
      }))
      await supabaseAdmin.from('items_presupuesto').insert(filasItems)
    }

    // Vehículos en permuta (si vienen datos para crear un vehículo nuevo, se crea primero)
    for (const p of permutas) {
      let vehiculoId = p.vehiculo_id || null

      if (!vehiculoId && p.vehiculo_nuevo) {
        const { data: condicionUsado } = await supabaseAdmin
          .from('condiciones_vehiculo')
          .select('id')
          .eq('nombre', 'Usado')
          .maybeSingle()

        const { data: nuevoVehiculo, error: errorVehiculo } = await supabaseAdmin
          .from('vehiculos')
          .insert({
            ...p.vehiculo_nuevo,
            condicion_id: p.vehiculo_nuevo.condicion_id || condicionUsado?.id || null,
            estado: 'En Preparación',
          })
          .select()
          .single()

        if (!errorVehiculo) vehiculoId = nuevoVehiculo.id
      }

      if (vehiculoId) {
        await supabaseAdmin.from('vehiculos_permuta_presupuesto').insert({
          presupuesto_id: presupuesto.id,
          vehiculo_id: vehiculoId,
          valor_permuta: Number(p.valor_permuta) || 0,
          observaciones: p.observaciones || null,
        })
      }
    }

    // Formas de pago
    if (formasPago.length > 0) {
      const filasFormasPago = formasPago.map((f) => ({
        presupuesto_id: presupuesto.id,
        tipo_forma_pago_id: f.tipo_forma_pago_id || null,
        moneda_id: f.moneda_id || body.moneda_id,
        monto: Number(f.monto) || 0,
        observaciones: f.observaciones || null,
        es_principal: !!f.es_principal,
      }))
      await supabaseAdmin.from('formas_pago_presupuesto').insert(filasFormasPago)
    }

    return res.status(201).json({ data: presupuesto })
  } catch (err) {
    console.error('Error inesperado creando presupuesto:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
