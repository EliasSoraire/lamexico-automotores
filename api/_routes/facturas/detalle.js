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

  if (req.method === 'GET') return verFactura(req, res, id)
  if (req.method === 'PUT') return anularFactura(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verFactura(req, res, id) {
  const { data: factura, error } = await supabaseAdmin
    .from('facturas')
    .select(
      `*, clientes(id, nombre, apellido, razon_social, tipo_persona, telefono, email),
       tipos_comprobante(id, nombre), estados_factura(id, nombre), monedas(id, codigo, simbolo),
       puntos_venta(id, numero), ventas(id, numero_venta)`
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'obteniendo factura') })
  }
  if (!factura) return res.status(404).json({ error: 'Factura no encontrada' })

  const { data: items, error: errorItems } = await supabaseAdmin
    .from('items_factura')
    .select('*')
    .eq('factura_id', id)
    .order('orden', { ascending: true })

  if (errorItems) {
    return res.status(500).json({ error: formatearErrorDb(errorItems, 'obteniendo ítems de la factura') })
  }

  return res.status(200).json({ data: { ...factura, items: items || [] } })
}

// Las facturas no se editan una vez emitidas: la única acción posible es anularlas.
async function anularFactura(req, res, id) {
  try {
    const { data: estadoAnulada } = await supabaseAdmin
      .from('estados_factura')
      .select('id')
      .eq('nombre', 'Anulada')
      .maybeSingle()

    if (!estadoAnulada) {
      return res.status(500).json({ error: 'No se encontró el estado "Anulada" en el catálogo' })
    }

    const { data, error } = await supabaseAdmin
      .from('facturas')
      .update({ estado_id: estadoAnulada.id, fecha_actualizacion: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'anulando factura') })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado anulando factura:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
