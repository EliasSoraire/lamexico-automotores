import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Falta el parámetro id' })

  if (req.method === 'GET') return verConsulta(req, res, id)
  if (req.method === 'PUT') return actualizarConsulta(req, res, id)
  if (req.method === 'DELETE') return eliminarConsulta(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verConsulta(req, res, id) {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select(
      `*, clientes(id, nombre, apellido, razon_social, tipo_persona),
       tipos_consulta(id, nombre), estados_consulta(id, nombre), prioridades(id, nombre), canales_origen(id, nombre)`
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'obteniendo consulta') })
  }
  if (!data) return res.status(404).json({ error: 'Consulta no encontrada' })

  const { data: vehiculosVinculados } = await supabaseAdmin
    .from('consultas_vehiculos')
    .select('id, vehiculo_id, vehiculos(id, patente, marcas(nombre), modelos(nombre))')
    .eq('consulta_id', id)

  return res.status(200).json({ data, vehiculos: vehiculosVinculados || [] })
}

async function actualizarConsulta(req, res, id) {
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
      fecha_actualizacion: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('consultas')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando consulta') })
    }

    // Reemplaza por completo la lista de vehículos de interés
    if (Array.isArray(body.vehiculo_ids)) {
      await supabaseAdmin.from('consultas_vehiculos').delete().eq('consulta_id', id)
      if (body.vehiculo_ids.length > 0) {
        const filas = body.vehiculo_ids.map((vid) => ({ consulta_id: id, vehiculo_id: vid }))
        await supabaseAdmin.from('consultas_vehiculos').insert(filas)
      }
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando consulta:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarConsulta(req, res, id) {
  try {
    const { error } = await supabaseAdmin.from('consultas').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'eliminando consulta') })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando consulta:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
