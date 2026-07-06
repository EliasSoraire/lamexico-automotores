import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarModelos(req, res)
  if (req.method === 'POST') return crearModelo(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function listarModelos(req, res) {
  try {
    const { marca_id } = req.query
    if (!marca_id) {
      return res.status(400).json({ error: 'Falta marca_id' })
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 200)
    const busqueda = (req.query.busqueda || '').trim()
    const estado = req.query.estado || 'activos'
    const anio = req.query.anio

    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    let query = supabaseAdmin
      .from('modelos')
      .select(
        'id, nombre, version, anio, precio_lista, moneda_id, activo, monedas(simbolo), vehiculos:vehiculos(count)',
        { count: 'exact' }
      )
      .eq('marca_id', marca_id)

    if (estado === 'activos') query = query.eq('activo', true)
    if (estado === 'inactivos') query = query.eq('activo', false)
    if (busqueda) query = query.ilike('nombre', `%${busqueda}%`)
    if (anio) query = query.eq('anio', anio)

    query = query.order('nombre', { ascending: true }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      console.error('Error listando modelos:', error)
      return res.status(500).json({ error: 'Error al obtener los modelos' })
    }

    const modelos = data.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      version: m.version,
      anio: m.anio,
      precio_lista: m.precio_lista,
      moneda_id: m.moneda_id,
      simbolo_moneda: m.monedas?.simbolo || '',
      activo: m.activo,
      cantidad_vehiculos: m.vehiculos?.[0]?.count || 0,
    }))

    return res.status(200).json({
      data: modelos,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (err) {
    console.error('Error inesperado listando modelos:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearModelo(req, res) {
  try {
    const { marca_id, nombre, version, anio, precio_lista, moneda_id, descripcion } = req.body || {}

    if (!marca_id || !nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'Marca y nombre del modelo son obligatorios' })
    }

    const { data, error } = await supabaseAdmin
      .from('modelos')
      .insert({
        marca_id,
        nombre: nombre.trim(),
        version: version?.trim() || null,
        anio: anio || null,
        precio_lista: precio_lista || null,
        moneda_id: moneda_id || null,
        descripcion: descripcion?.trim() || null,
        activo: true,
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'creando modelo') })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando modelo:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
