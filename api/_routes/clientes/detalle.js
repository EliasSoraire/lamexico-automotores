import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'Falta el parámetro id' })
  }

  if (req.method === 'GET') return verCliente(req, res, id)
  if (req.method === 'PUT') return actualizarCliente(req, res, id)
  if (req.method === 'DELETE') return eliminarCliente(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verCliente(req, res, id) {
  const { data, error } = await supabaseAdmin
    .from('clientes')
    .select(
      `*, generos(id, nombre), estados_civiles(id, nombre), tipos_documento(id, nombre),
       estados_cliente(id, nombre), segmentos_cliente(id, nombre), canales_origen(id, nombre)`
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'obteniendo cliente') })
  }
  if (!data) return res.status(404).json({ error: 'Cliente no encontrado' })

  const { data: adjuntos } = await supabaseAdmin
    .from('adjuntos_cliente')
    .select('*')
    .eq('cliente_id', id)
    .order('fecha_subida', { ascending: false })

  return res.status(200).json({ data, adjuntos: adjuntos || [] })
}

async function actualizarCliente(req, res, id) {
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
      activo: body.activo === undefined ? true : !!body.activo,
      fecha_actualizacion: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('clientes')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando cliente') })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando cliente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarCliente(req, res, id) {
  try {
    const { error } = await supabaseAdmin.from('clientes').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'eliminando cliente') })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando cliente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
