import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarItems(req, res)
  if (req.method === 'POST') return crearItem(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function listarItems(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)
    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1
    const { busqueda, categoria_id, estado } = req.query

    let query = supabaseAdmin
      .from('items_catalogo')
      .select('id, codigo, nombre, precio, activo, categorias_items(nombre), monedas(simbolo)', { count: 'exact' })

    if (busqueda) {
      query = query.or(`nombre.ilike.%${busqueda}%,codigo.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%`)
    }
    if (categoria_id) query = query.eq('categoria_id', categoria_id)
    if (estado === 'activo') query = query.eq('activo', true)
    if (estado === 'inactivo') query = query.eq('activo', false)

    query = query.order('nombre', { ascending: true }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'listando ítems adicionales') })
    }

    return res.status(200).json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (err) {
    console.error('Error inesperado listando ítems adicionales:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearItem(req, res) {
  try {
    const { codigo, nombre, descripcion, categoria_id, precio, moneda_id, observaciones, activo } = req.body || {}

    if (!codigo || !codigo.trim() || !nombre || !nombre.trim() || !categoria_id) {
      return res.status(400).json({ error: 'Código, Nombre y Categoría son obligatorios' })
    }

    const { data, error } = await supabaseAdmin
      .from('items_catalogo')
      .insert({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        categoria_id,
        precio: precio || null,
        moneda_id: moneda_id || null,
        observaciones: observaciones || null,
        activo: activo === undefined ? true : !!activo,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un ítem con ese código' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'creando ítem adicional') })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando ítem adicional:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
