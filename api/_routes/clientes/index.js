import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarClientes(req, res)
  if (req.method === 'POST') return crearCliente(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

function aplicarFiltros(query, req) {
  const { busqueda, tipo_persona, estado_id, segmento_id, provincia } = req.query

  if (busqueda) {
    query = query.or(
      `nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,razon_social.ilike.%${busqueda}%,numero_documento.ilike.%${busqueda}%,email.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`
    )
  }
  if (tipo_persona) query = query.eq('tipo_persona', tipo_persona)
  if (estado_id) query = query.eq('estado_id', estado_id)
  if (segmento_id) query = query.eq('segmento_id', segmento_id)
  if (provincia) query = query.ilike('provincia', `%${provincia}%`)

  return query
}

async function listarClientes(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)
    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    let query = supabaseAdmin
      .from('clientes')
      .select(
        `id, tipo_persona, nombre, apellido, razon_social, numero_documento, email, telefono,
         tipos_documento(nombre), estados_cliente(nombre)`,
        { count: 'exact' }
      )

    query = aplicarFiltros(query, req)
    query = query.order('fecha_creacion', { ascending: false }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'listando clientes') })
    }

    const { count: totalGeneral } = await supabaseAdmin
      .from('clientes')
      .select('id', { count: 'exact', head: true })

    const { count: totalActivos } = await supabaseAdmin
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true)

    return res.status(200).json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      contadores: {
        total: totalGeneral || 0,
        activos: totalActivos || 0,
        con_ventas: 0, // Ventas todavía no está implementado
        con_deuda: 0, // Cuentas Corrientes todavía no está implementado
      },
    })
  } catch (err) {
    console.error('Error inesperado listando clientes:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearCliente(req, res) {
  try {
    const body = req.body || {}

    if (!body.tipo_persona || !body.segmento_id) {
      return res.status(400).json({ error: 'Tipo de Persona y Segmento son obligatorios' })
    }

    if (body.tipo_persona === 'Física' && (!body.nombre || !body.apellido)) {
      return res.status(400).json({ error: 'Nombre y Apellido son obligatorios para Persona Física' })
    }

    if (body.tipo_persona === 'Jurídica' && !body.razon_social) {
      return res.status(400).json({ error: 'Razón Social es obligatoria para Persona Jurídica' })
    }

    const payload = {
      tipo_persona: body.tipo_persona,
      nombre: body.nombre || null,
      apellido: body.apellido || null,
      razon_social: body.razon_social || null,
      actividad_principal: body.actividad_principal || null,
      condicion_iva: body.condicion_iva || null,
      fecha_nacimiento: body.fecha_nacimiento || null,
      genero_id: body.genero_id || null,
      estado_civil_id: body.estado_civil_id || null,
      profesion: body.profesion || null,
      tipo_documento_id: body.tipo_documento_id || null,
      numero_documento: body.numero_documento || null,
      estado_id: body.estado_id || null,
      email: body.email || null,
      telefono: body.telefono || null,
      telefono_movil: body.telefono_movil || null,
      direccion: body.direccion || null,
      ciudad: body.ciudad || null,
      provincia: body.provincia || null,
      codigo_postal: body.codigo_postal || null,
      segmento_id: body.segmento_id || null,
      canal_origen_id: body.canal_origen_id || null,
      observaciones: body.observaciones || null,
      acepta_marketing: !!body.acepta_marketing,
      acepta_sms: !!body.acepta_sms,
      acepta_email: !!body.acepta_email,
      activo: true,
    }

    const { data, error } = await supabaseAdmin.from('clientes').insert(payload).select().single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'creando cliente') })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando cliente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
