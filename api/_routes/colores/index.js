import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarColores(req, res)
  if (req.method === 'POST') return crearColor(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

function validarHex(hex) {
  return /^#([0-9A-Fa-f]{6})$/.test(hex)
}

async function listarColores(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)
    const busqueda = (req.query.busqueda || '').trim()

    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    let query = supabaseAdmin
      .from('colores')
      .select('id, nombre, codigo_hex, codigo_fabrica', { count: 'exact' })

    if (busqueda) {
      query = query.ilike('nombre', `%${busqueda}%`)
    }

    query = query.order('nombre', { ascending: true }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      console.error('Error listando colores:', error)
      return res.status(500).json({ error: 'Error al obtener los colores' })
    }

    return res.status(200).json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (err) {
    console.error('Error inesperado listando colores:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearColor(req, res) {
  try {
    const { nombre, codigo_hex, codigo_fabrica } = req.body || {}

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' })
    }

    if (!codigo_hex || !validarHex(codigo_hex)) {
      return res.status(400).json({ error: 'El código hexadecimal no es válido (ej: #FF0000)' })
    }

    const { data, error } = await supabaseAdmin
      .from('colores')
      .insert({
        nombre: nombre.trim(),
        codigo_hex: codigo_hex.toUpperCase(),
        codigo_fabrica: codigo_fabrica?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un color con ese nombre' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'creando color') })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando color:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
