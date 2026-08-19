import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarItems(req, res)
  if (req.method === 'POST') return agregarItem(req, res)
  if (req.method === 'PUT') return actualizarItem(req, res)
  if (req.method === 'DELETE') return eliminarItem(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function recalcularTotalesVenta(venta_id) {
  const { data: venta } = await supabaseAdmin.from('ventas').select('*').eq('id', venta_id).maybeSingle()
  if (!venta) return

  const { data: items } = await supabaseAdmin.from('items_venta').select('subtotal').eq('venta_id', venta_id)
  const totalItems = (items || []).reduce((acc, it) => acc + Number(it.subtotal || 0), 0)

  const totalOperacion = Number(venta.precio_vehiculo || 0) - Number(venta.descuento || 0) + totalItems
  const totalPagos =
    Number(venta.anticipo || 0) +
    Number(venta.pago_efectivo || 0) +
    Number(venta.pago_cheque || 0) +
    Number(venta.pago_tarjeta_credito || 0) +
    Number(venta.pago_tarjeta_debito || 0) +
    Number(venta.pago_transferencia || 0) +
    Number(venta.pago_plan_ahorro || 0) +
    Number(venta.importe_financiar || 0) +
    Number(venta.importe_financiacion_bancaria || 0)

  await supabaseAdmin
    .from('ventas')
    .update({ total_items: totalItems, total_operacion: totalOperacion, saldo_pendiente: totalOperacion - totalPagos, fecha_actualizacion: new Date().toISOString() })
    .eq('id', venta_id)
}

async function listarItems(req, res) {
  const { venta_id } = req.query
  if (!venta_id) return res.status(400).json({ error: 'Falta venta_id' })

  const { data, error } = await supabaseAdmin
    .from('items_venta')
    .select('*, items_catalogo(nombre, codigo)')
    .eq('venta_id', venta_id)
    .order('orden')

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'listando ítems de venta') })
  }

  return res.status(200).json({ data })
}

async function agregarItem(req, res) {
  try {
    const { venta_id, item_catalogo_id, descripcion, cantidad, precio_unitario } = req.body || {}

    if (!venta_id) return res.status(400).json({ error: 'Falta venta_id' })

    const cant = Number(cantidad) || 1
    const precio = Number(precio_unitario) || 0

    const { count } = await supabaseAdmin.from('items_venta').select('id', { count: 'exact', head: true }).eq('venta_id', venta_id)

    const { data, error } = await supabaseAdmin
      .from('items_venta')
      .insert({
        venta_id,
        item_catalogo_id: item_catalogo_id || null,
        descripcion: descripcion || null,
        cantidad: cant,
        precio_unitario: precio,
        subtotal: cant * precio,
        orden: count || 0,
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'agregando ítem a la venta') })
    }

    await recalcularTotalesVenta(venta_id)

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado agregando ítem a la venta:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function actualizarItem(req, res) {
  try {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Falta id' })

    const { cantidad, precio_unitario } = req.body || {}
    const cant = Number(cantidad) || 1
    const precio = Number(precio_unitario) || 0

    const { data: item, error } = await supabaseAdmin
      .from('items_venta')
      .update({ cantidad: cant, precio_unitario: precio, subtotal: cant * precio })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando ítem de la venta') })
    }

    await recalcularTotalesVenta(item.venta_id)

    return res.status(200).json({ data: item })
  } catch (err) {
    console.error('Error inesperado actualizando ítem de la venta:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarItem(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Falta id' })

  const { data: item } = await supabaseAdmin.from('items_venta').select('venta_id').eq('id', id).maybeSingle()

  const { error } = await supabaseAdmin.from('items_venta').delete().eq('id', id)

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'eliminando ítem de la venta') })
  }

  if (item?.venta_id) await recalcularTotalesVenta(item.venta_id)

  return res.status(200).json({ ok: true })
}
