import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarFacturas(req, res)
  if (req.method === 'POST') return crearFactura(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function listarFacturas(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)
    const busqueda = (req.query.busqueda || '').trim()
    const { tipo_comprobante_id, estado_id } = req.query

    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    let query = supabaseAdmin
      .from('facturas')
      .select(
        `id, numero_comprobante, fecha_emision, total,
         clientes(id, nombre, apellido, razon_social, tipo_persona),
         tipos_comprobante(id, nombre), estados_factura(id, nombre)`,
        { count: 'exact' }
      )

    if (busqueda) query = query.ilike('numero_comprobante', `%${busqueda}%`)
    if (tipo_comprobante_id) query = query.eq('tipo_comprobante_id', tipo_comprobante_id)
    if (estado_id) query = query.eq('estado_id', estado_id)

    query = query.order('fecha_creacion', { ascending: false }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'listando facturas') })
    }

    return res.status(200).json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (err) {
    console.error('Error inesperado listando facturas:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearFactura(req, res) {
  try {
    const body = req.body || {}
    const items = Array.isArray(body.items) ? body.items : []

    if (!body.tipo_comprobante_id) {
      return res.status(400).json({ error: 'El Tipo de Comprobante es obligatorio' })
    }
    if (!body.cliente_id) {
      return res.status(400).json({ error: 'El Cliente es obligatorio' })
    }
    if (!body.moneda_id) {
      return res.status(400).json({ error: 'La Moneda es obligatoria' })
    }
    if (items.length === 0) {
      return res.status(400).json({ error: 'Agregá al menos un ítem a la factura' })
    }

    const { data: puntoVenta } = await supabaseAdmin
      .from('puntos_venta')
      .select('id, numero')
      .eq('activo', true)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle()

    const { count: totalDelTipo } = await supabaseAdmin
      .from('facturas')
      .select('id', { count: 'exact', head: true })
      .eq('tipo_comprobante_id', body.tipo_comprobante_id)

    const numeroComprobante = String((totalDelTipo || 0) + 1).padStart(8, '0')

    const { data: estadoEmitida } = await supabaseAdmin
      .from('estados_factura')
      .select('id')
      .eq('nombre', 'Emitida')
      .maybeSingle()

    const subtotal = items.reduce((acc, it) => acc + (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0), 0)
    const iva = body.iva !== undefined && body.iva !== '' ? Number(body.iva) : Math.round(subtotal * 0.21 * 100) / 100
    const total = subtotal + iva

    const payload = {
      tipo_comprobante_id: body.tipo_comprobante_id,
      punto_venta_id: puntoVenta?.id || null,
      numero_comprobante: numeroComprobante,
      fecha_emision: new Date().toISOString().slice(0, 10),
      cliente_id: body.cliente_id,
      tipo_documento: body.tipo_documento || null,
      numero_documento: body.numero_documento || null,
      venta_id: body.venta_id || null,
      moneda_id: body.moneda_id,
      subtotal,
      iva,
      total,
      estado_id: estadoEmitida?.id || null,
      activo: true,
    }

    const { data: factura, error } = await supabaseAdmin.from('facturas').insert(payload).select().single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'creando factura') })
    }

    const itemsPayload = items.map((it, i) => {
      const cantidad = Number(it.cantidad) || 1
      const precioUnitario = Number(it.precio_unitario) || 0
      const subtotalItem = cantidad * precioUnitario
      return {
        factura_id: factura.id,
        descripcion: it.descripcion,
        cantidad,
        precio_unitario: precioUnitario,
        subtotal: subtotalItem,
        iva: Math.round(subtotalItem * 0.21 * 100) / 100,
        total: subtotalItem + Math.round(subtotalItem * 0.21 * 100) / 100,
        orden: i,
      }
    })

    const { error: errorItems } = await supabaseAdmin.from('items_factura').insert(itemsPayload)

    if (errorItems) {
      return res.status(500).json({ error: formatearErrorDb(errorItems, 'guardando ítems de la factura') })
    }

    return res.status(201).json({ data: factura })
  } catch (err) {
    console.error('Error inesperado creando factura:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
