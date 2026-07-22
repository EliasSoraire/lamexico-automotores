import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Falta el parámetro id' })

  if (req.method === 'GET') return verPresupuesto(req, res, id)
  if (req.method === 'PUT') return actualizarPresupuesto(req, res, id)
  if (req.method === 'DELETE') return eliminarPresupuesto(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verPresupuesto(req, res, id) {
  const { data, error } = await supabaseAdmin
    .from('presupuestos')
    .select(
      `*, clientes(id, nombre, apellido, razon_social, tipo_persona),
       usuarios(id, nombre_completo), estados_presupuesto(id, nombre), monedas(id, nombre, simbolo),
       consultas(id, numero_consulta)`
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'obteniendo presupuesto') })
  }
  if (!data) return res.status(404).json({ error: 'Presupuesto no encontrado' })

  const [{ data: items }, { data: permutas }, { data: formasPago }] = await Promise.all([
    supabaseAdmin.from('items_presupuesto').select('*, items_catalogo(nombre, codigo)').eq('presupuesto_id', id).order('orden'),
    supabaseAdmin.from('vehiculos_permuta_presupuesto').select('*, vehiculos(id, patente, marcas(nombre), modelos(nombre))').eq('presupuesto_id', id),
    supabaseAdmin.from('formas_pago_presupuesto').select('*, formas_pago_tipo(nombre), monedas(simbolo)').eq('presupuesto_id', id),
  ])

  let vehiculoStock = null
  if (data.vehiculo_stock_id) {
    const { data: v } = await supabaseAdmin
      .from('vehiculos')
      .select('id, patente, marcas(nombre), modelos(nombre)')
      .eq('id', data.vehiculo_stock_id)
      .maybeSingle()
    vehiculoStock = v
  }

  let modeloSinUnidad = null
  if (data.modelo_sin_unidad_id) {
    const { data: m } = await supabaseAdmin
      .from('modelos')
      .select('id, nombre, marcas(nombre)')
      .eq('id', data.modelo_sin_unidad_id)
      .maybeSingle()
    modeloSinUnidad = m
  }

  return res.status(200).json({
    data,
    items: items || [],
    permutas: permutas || [],
    formasPago: formasPago || [],
    vehiculoStock,
    modeloSinUnidad,
  })
}

function calcularTotales(body) {
  const items = Array.isArray(body.items) ? body.items : []
  const permutas = Array.isArray(body.permutas) ? body.permutas : []
  const formasPago = Array.isArray(body.formas_pago) ? body.formas_pago : []

  const precioBase = Number(body.precio_base) || 0
  const totalItems = items.reduce((acc, it) => acc + (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0), 0)
  const totalPermutas = permutas.reduce((acc, p) => acc + (Number(p.valor_permuta) || 0), 0)
  const saldoAPagar = precioBase + totalItems - totalPermutas
  const saldoCubierto = formasPago.reduce((acc, f) => acc + (Number(f.monto) || 0), 0)
  const faltaCubrir = saldoAPagar - saldoCubierto

  return { precioBase, totalItems, totalPermutas, saldoAPagar, saldoCubierto, faltaCubrir, items, permutas, formasPago }
}

async function actualizarPresupuesto(req, res, id) {
  try {
    const body = req.body || {}

    if (!body.fecha || !body.vencimiento || !body.moneda_id || !body.estado_id) {
      return res.status(400).json({ error: 'Fecha, Vencimiento, Moneda y Estado son obligatorios' })
    }

    const { precioBase, totalItems, totalPermutas, saldoAPagar, saldoCubierto, faltaCubrir, items, permutas, formasPago } = calcularTotales(body)

    const payload = {
      fecha: body.fecha,
      vencimiento: body.vencimiento,
      moneda_id: body.moneda_id,
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
      fecha_actualizacion: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('presupuestos')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando presupuesto') })
    }

    // Reemplaza por completo ítems, permutas y formas de pago
    if (Array.isArray(body.items)) {
      await supabaseAdmin.from('items_presupuesto').delete().eq('presupuesto_id', id)
      if (items.length > 0) {
        const filas = items.map((it, idx) => ({
          presupuesto_id: id,
          item_catalogo_id: it.item_catalogo_id || null,
          descripcion: it.descripcion || null,
          cantidad: Number(it.cantidad) || 1,
          precio_unitario: Number(it.precio_unitario) || 0,
          subtotal: (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0),
          observaciones: it.observaciones || null,
          orden: idx,
        }))
        await supabaseAdmin.from('items_presupuesto').insert(filas)
      }
    }

    if (Array.isArray(body.formas_pago)) {
      await supabaseAdmin.from('formas_pago_presupuesto').delete().eq('presupuesto_id', id)
      if (formasPago.length > 0) {
        const filas = formasPago.map((f) => ({
          presupuesto_id: id,
          tipo_forma_pago_id: f.tipo_forma_pago_id || null,
          moneda_id: f.moneda_id || body.moneda_id,
          monto: Number(f.monto) || 0,
          observaciones: f.observaciones || null,
          es_principal: !!f.es_principal,
        }))
        await supabaseAdmin.from('formas_pago_presupuesto').insert(filas)
      }
    }

    // Las permutas nuevas (con vehiculo_nuevo) se agregan; las existentes no se tocan acá
    if (Array.isArray(body.permutas)) {
      for (const p of permutas) {
        if (p.vehiculo_nuevo) {
          const { data: condicionUsado } = await supabaseAdmin
            .from('condiciones_vehiculo')
            .select('id')
            .eq('nombre', 'Usado')
            .maybeSingle()

          const { data: nuevoVehiculo, error: errorVehiculo } = await supabaseAdmin
            .from('vehiculos')
            .insert({ ...p.vehiculo_nuevo, condicion_id: p.vehiculo_nuevo.condicion_id || condicionUsado?.id || null, estado: 'En Preparación' })
            .select()
            .single()

          if (!errorVehiculo) {
            await supabaseAdmin.from('vehiculos_permuta_presupuesto').insert({
              presupuesto_id: id,
              vehiculo_id: nuevoVehiculo.id,
              valor_permuta: Number(p.valor_permuta) || 0,
              observaciones: p.observaciones || null,
            })
          }
        }
      }
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando presupuesto:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarPresupuesto(req, res, id) {
  try {
    const { error } = await supabaseAdmin.from('presupuestos').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'eliminando presupuesto') })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando presupuesto:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
