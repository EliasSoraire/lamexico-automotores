import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarVehiculos(req, res)
  if (req.method === 'POST') return crearVehiculo(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

function aplicarFiltros(query, req) {
  const { busqueda, estado, condicion_id, titular_stock_id, gnc, clasificacion_id } = req.query

  if (busqueda) {
    query = query.or(
      `patente.ilike.%${busqueda}%,numero_motor.ilike.%${busqueda}%,numero_chasis.ilike.%${busqueda}%`
    )
  }
  if (estado) query = query.eq('estado', estado)
  if (condicion_id) query = query.eq('condicion_id', condicion_id)
  if (titular_stock_id) query = query.eq('titular_stock_id', titular_stock_id)
  if (gnc === 'true') query = query.eq('gnc', true)
  if (gnc === 'false') query = query.eq('gnc', false)
  if (clasificacion_id) query = query.eq('clasificacion_id', clasificacion_id)

  return query
}

async function listarVehiculos(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)
    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    let query = supabaseAdmin
      .from('vehiculos')
      .select(
        `id, patente, año_modelo, kilometraje, estado, precio_venta, moneda_id,
         marcas(nombre), modelos(nombre), colores(nombre, codigo_hex),
         condiciones_vehiculo(nombre), sucursales(nombre), monedas(simbolo)`,
        { count: 'exact' }
      )

    query = aplicarFiltros(query, req)
    query = query.order('fecha_creacion', { ascending: false }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      console.error('Error listando vehículos:', error)
      return res.status(500).json({ error: 'Error al obtener los vehículos' })
    }

    // Contadores por estado (sobre el total, no solo la página actual)
    const estadosAContar = ['Disponible', 'En Preparación', 'En Tránsito', 'Reservado']
    const conteos = {}
    await Promise.all(
      estadosAContar.map(async (estado) => {
        const { count: c } = await supabaseAdmin
          .from('vehiculos')
          .select('id', { count: 'exact', head: true })
          .eq('estado', estado)
        conteos[estado] = c || 0
      })
    )
    const { count: totalGeneral } = await supabaseAdmin
      .from('vehiculos')
      .select('id', { count: 'exact', head: true })

    return res.status(200).json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      contadores: {
        total: totalGeneral || 0,
        disponibles: conteos['Disponible'],
        en_preparacion: conteos['En Preparación'],
        en_transito: conteos['En Tránsito'],
        reservados: conteos['Reservado'],
      },
    })
  } catch (err) {
    console.error('Error inesperado listando vehículos:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearVehiculo(req, res) {
  try {
    const body = req.body || {}

    if (!body.patente || !body.marca_id || !body.modelo_id || !body.condicion_id) {
      return res.status(400).json({ error: 'Patente, Marca, Modelo y Condición son obligatorios' })
    }

    const anioActual = new Date().getFullYear()
    if (body.año_modelo && Number(body.año_modelo) > anioActual) {
      return res.status(400).json({ error: `El Año Modelo no puede ser mayor a ${anioActual}` })
    }
    if (body.año_fab && Number(body.año_fab) > anioActual) {
      return res.status(400).json({ error: `El Año de Fabricación no puede ser mayor a ${anioActual}` })
    }

    const payload = {
      patente: body.patente.trim().toUpperCase(),
      año_modelo: body.año_modelo || null,
      año_fab: body.año_fab || null,
      marca_id: body.marca_id,
      modelo_id: body.modelo_id,
      color_id: body.color_id || null,
      color_interior_id: body.color_interior_id || null,
      kilometraje: body.kilometraje || 0,
      gnc: !!body.gnc,
      condicion_id: body.condicion_id,
      transmision_id: body.transmision_id || null,
      combustible_id: body.combustible_id || null,
      numero_motor: body.numero_motor || null,
      numero_chasis: body.numero_chasis || null,
      estado: body.estado || 'Disponible',
      precio_compra: body.precio_compra || 0,
      fecha_compra: body.fecha_compra || null,
      dueno_anterior: body.dueno_anterior || null,
      precio_venta: body.precio_venta || null,
      precio_contado_sin_permuta: body.precio_contado_sin_permuta || null,
      moneda_id: body.moneda_id || null,
      garantia: !!body.garantia,
      tipo_propiedad_id: body.tipo_propiedad_id || null,
      titular_stock_id: body.tipo_propiedad_es_consignacion ? null : body.titular_stock_id || null,
      clasificacion_id: body.clasificacion_id || null,
      observaciones: body.observaciones || null,
    }

    const { data, error } = await supabaseAdmin.from('vehiculos').insert(payload).select().single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un vehículo con esa patente' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'crear vehículo') })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando vehículo:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
