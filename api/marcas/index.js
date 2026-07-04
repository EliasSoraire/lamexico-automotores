import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { requireAuth } from '../_lib/requireAuth.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') {
    return listarMarcas(req, res)
  }

  if (req.method === 'POST') {
    return crearMarca(req, res)
  }

  return res.status(405).json({ error: 'Método no permitido' })
}

async function listarMarcas(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)
    const busqueda = (req.query.busqueda || '').trim()
    const estado = req.query.estado || 'activas' // activas | inactivas | todas

    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    let query = supabaseAdmin
      .from('marcas')
      .select(
        'id, nombre, codigo, activa, favorita, modelos:modelos(count)',
        { count: 'exact' }
      )

    if (estado === 'activas') query = query.eq('activa', true)
    if (estado === 'inactivas') query = query.eq('activa', false)

    if (busqueda) {
      query = query.or(`nombre.ilike.%${busqueda}%,codigo.ilike.%${busqueda}%`)
    }

    query = query.order('nombre', { ascending: true }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      console.error('Error listando marcas:', error)
      return res.status(500).json({ error: 'Error al obtener las marcas' })
    }

    const marcas = data.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      codigo: m.codigo,
      activa: m.activa,
      favorita: m.favorita,
      cantidad_modelos: m.modelos?.[0]?.count || 0,
    }))

    return res.status(200).json({
      data: marcas,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (err) {
    console.error('Error inesperado listando marcas:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearMarca(req, res) {
  try {
    const { nombre, codigo, descripcion, logo_url, favorita } = req.body || {}

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la marca es obligatorio' })
    }

    if (codigo && codigo.length > 10) {
      return res.status(400).json({ error: 'El código no puede superar los 10 caracteres' })
    }

    const { data, error } = await supabaseAdmin
      .from('marcas')
      .insert({
        nombre: nombre.trim(),
        codigo: codigo?.trim() || null,
        descripcion: descripcion?.trim() || null,
        logo_url: logo_url?.trim() || null,
        favorita: !!favorita,
        activa: true,
        es_vehiculos: true,
        es_repuestos: false,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una marca con ese código' })
      }
      console.error('Error creando marca:', error)
      return res.status(500).json({ error: 'Error al crear la marca' })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando marca:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
