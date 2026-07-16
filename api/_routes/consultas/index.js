import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

const ESTADOS_EN_PROCESO = ['Seguimiento', 'Contactada', 'Interesada', 'Cotizada', 'Negociación']
const ESTADOS_CERRADAS = ['Cerrada (Ganada)', 'Cerrada (Perdida)', 'Cancelada']

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarConsultas(req, res)
  if (req.method === 'POST') return crearConsulta(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

function aplicarFiltros(query, req) {
  const { busqueda, tipo_consulta_id, canal_origen_id, estado_id, prioridad_id, fecha_desde, fecha_hasta, seguimiento_desde, seguimiento_hasta } = req.query

  if (busqueda) {
    query = query.or(
      `nombre_solicitante.ilike.%${busqueda}%,apellido_solicitante.ilike.%${busqueda}%,observaciones.ilike.%${busqueda}%,numero_consulta.ilike.%${busqueda}%`
    )
  }
  if (tipo_consulta_id) query = query.eq('tipo_consulta_id', tipo_consulta_id)
  if (canal_origen_id) query = query.eq('canal_origen_id', canal_origen_id)
  if (estado_id) query = query.eq('estado_id', estado_id)
  if (prioridad_id) query = query.eq('prioridad_id', prioridad_id)
  if (fecha_desde) query = query.gte('fecha_ingreso', fecha_desde)
  if (fecha_hasta) query = query.lte('fecha_ingreso', fecha_hasta + 'T23:59:59')
  if (seguimiento_desde) query = query.gte('fecha_seguimiento', seguimiento_desde)
  if (seguimiento_hasta) query = query.lte('fecha_seguimiento', seguimiento_hasta)

  return query
}

async function listarConsultas(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)
    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    let query = supabaseAdmin
      .from('consultas')
      .select(
        `id, numero_consulta, nombre_solicitante, apellido_solicitante, fecha_ingreso, fecha_seguimiento,
         cliente_id, clientes(nombre, apellido, razon_social),
         tipos_consulta(nombre), estados_consulta(nombre), prioridades(nombre)`,
        { count: 'exact' }
      )

    query = aplicarFiltros(query, req)
    query = query.order('fecha_ingreso', { ascending: false }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'listando consultas') })
    }

    const { count: totalGeneral } = await supabaseAdmin.from('consultas').select('id', { count: 'exact', head: true })

    const contadorPorEstados = async (nombres) => {
      const { data: estados } = await supabaseAdmin.from('estados_consulta').select('id').in('nombre', nombres)
      const ids = (estados || []).map((e) => e.id)
      if (ids.length === 0) return 0
      const { count } = await supabaseAdmin
        .from('consultas')
        .select('id', { count: 'exact', head: true })
        .in('estado_id', ids)
      return count || 0
    }

    const [nuevas, enProceso, cerradas] = await Promise.all([
      contadorPorEstados(['Nueva']),
      contadorPorEstados(ESTADOS_EN_PROCESO),
      contadorPorEstados(ESTADOS_CERRADAS),
    ])

    return res.status(200).json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      contadores: { total: totalGeneral || 0, nuevas, en_proceso: enProceso, cerradas },
    })
  } catch (err) {
    console.error('Error inesperado listando consultas:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearConsulta(req, res) {
  try {
    const body = req.body || {}

    if (!body.tipo_consulta_id || !body.estado_id) {
      return res.status(400).json({ error: 'Tipo de Consulta y Estado son obligatorios' })
    }

    if (!body.cliente_id && (!body.nombre_solicitante || !body.apellido_solicitante || !body.telefono_solicitante || !body.email_solicitante)) {
      return res.status(400).json({ error: 'Completá los datos del solicitante o seleccioná un cliente registrado' })
    }

    const payload = {
      cliente_id: body.cliente_id || null,
      cliente_nuevo: !body.cliente_id,
      nombre_solicitante: body.cliente_id ? null : body.nombre_solicitante,
      apellido_solicitante: body.cliente_id ? null : body.apellido_solicitante,
      telefono_solicitante: body.cliente_id ? null : body.telefono_solicitante,
      email_solicitante: body.cliente_id ? null : body.email_solicitante,
      canal_origen_id: body.canal_origen_id || null,
      estado_id: body.estado_id,
      tipo_consulta_id: body.tipo_consulta_id,
      prioridad_id: body.prioridad_id || null,
      fecha_seguimiento: body.fecha_seguimiento || null,
      observaciones: body.observaciones || null,
      activo: true,
    }

    const { data, error } = await supabaseAdmin.from('consultas').insert(payload).select().single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'creando consulta') })
    }

    // Vehículos de interés (varios por consulta, vía tabla intermedia)
    const vehiculoIds = Array.isArray(body.vehiculo_ids) ? body.vehiculo_ids : []
    if (vehiculoIds.length > 0) {
      const filas = vehiculoIds.map((vid) => ({ consulta_id: data.id, vehiculo_id: vid }))
      await supabaseAdmin.from('consultas_vehiculos').insert(filas)
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando consulta:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
