import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarCanales(req, res)
  if (req.method === 'POST') return crearCanal(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function listarCanales(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)
    const busqueda = (req.query.busqueda || '').trim()

    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    let query = supabaseAdmin
      .from('canales_origen')
      .select('id, nombre, descripcion, activo', { count: 'exact' })

    if (busqueda) query = query.ilike('nombre', `%${busqueda}%`)

    query = query.order('nombre', { ascending: true }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'listando canales de origen') })
    }

    return res.status(200).json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (err) {
    console.error('Error inesperado listando canales de origen:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearCanal(req, res) {
  try {
    const { nombre, activo } = req.body || {}

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' })
    }

    const { data, error } = await supabaseAdmin
      .from('canales_origen')
      .insert({
        nombre: nombre.trim(),
        activo: activo === undefined ? true : !!activo,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un canal con ese nombre' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'creando canal de origen') })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando canal de origen:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
