import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { requireAuth } from '../_lib/requireAuth.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarTitulares(req, res)
  if (req.method === 'POST') return crearTitular(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function listarTitulares(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)

    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    const { data, error, count } = await supabaseAdmin
      .from('titulares_stock')
      .select('id, nombre, activo', { count: 'exact' })
      .order('nombre', { ascending: true })
      .range(desde, hasta)

    if (error) {
      console.error('Error listando titulares de stock:', error)
      return res.status(500).json({ error: 'Error al obtener los titulares de stock' })
    }

    return res.status(200).json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (err) {
    console.error('Error inesperado listando titulares de stock:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearTitular(req, res) {
  try {
    const { nombre, activo } = req.body || {}

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre / razón social es obligatorio' })
    }

    const { data, error } = await supabaseAdmin
      .from('titulares_stock')
      .insert({
        nombre: nombre.trim(),
        activo: activo === undefined ? true : !!activo,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando titular de stock:', error)
      return res.status(500).json({ error: 'Error al crear el titular de stock' })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando titular de stock:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
