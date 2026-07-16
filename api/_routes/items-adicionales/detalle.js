import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Falta el parámetro id' })

  if (req.method === 'GET') return verItem(req, res, id)
  if (req.method === 'PUT') return actualizarItem(req, res, id)
  if (req.method === 'DELETE') return eliminarItem(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verItem(req, res, id) {
  const { data, error } = await supabaseAdmin
    .from('items_catalogo')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'obteniendo ítem adicional') })
  }
  if (!data) return res.status(404).json({ error: 'Ítem no encontrado' })

  return res.status(200).json({ data })
}

async function actualizarItem(req, res, id) {
  try {
    const { codigo, nombre, descripcion, categoria_id, precio, moneda_id, observaciones, activo } = req.body || {}

    if (!codigo || !codigo.trim() || !nombre || !nombre.trim() || !categoria_id) {
      return res.status(400).json({ error: 'Código, Nombre y Categoría son obligatorios' })
    }

    const { data, error } = await supabaseAdmin
      .from('items_catalogo')
      .update({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        categoria_id,
        precio: precio || null,
        moneda_id: moneda_id || null,
        observaciones: observaciones || null,
        activo: !!activo,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un ítem con ese código' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando ítem adicional') })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando ítem adicional:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarItem(req, res, id) {
  try {
    const { count: usosEnPresupuestos } = await supabaseAdmin
      .from('items_presupuesto')
      .select('id', { count: 'exact', head: true })
      .eq('item_catalogo_id', id)

    if (usosEnPresupuestos > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: este ítem está usado en ${usosEnPresupuestos} presupuesto(s).`,
      })
    }

    const { error } = await supabaseAdmin.from('items_catalogo').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'eliminando ítem adicional') })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando ítem adicional:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
