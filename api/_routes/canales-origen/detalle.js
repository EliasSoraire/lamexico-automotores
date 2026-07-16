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

  if (req.method === 'GET') return verCanal(req, res, id)
  if (req.method === 'PUT') return actualizarCanal(req, res, id)
  if (req.method === 'DELETE') return eliminarCanal(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verCanal(req, res, id) {
  const { data, error } = await supabaseAdmin
    .from('canales_origen')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'obteniendo canal de origen') })
  }
  if (!data) return res.status(404).json({ error: 'Canal de origen no encontrado' })

  return res.status(200).json({ data })
}

async function actualizarCanal(req, res, id) {
  try {
    const { nombre, activo } = req.body || {}

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' })
    }

    const { data, error } = await supabaseAdmin
      .from('canales_origen')
      .update({
        nombre: nombre.trim(),
        activo: !!activo,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un canal con ese nombre' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando canal de origen') })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando canal de origen:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarCanal(req, res, id) {
  try {
    const { count: consultasConEsteCanal } = await supabaseAdmin
      .from('consultas')
      .select('id', { count: 'exact', head: true })
      .eq('canal_origen_id', id)

    if (consultasConEsteCanal > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: hay ${consultasConEsteCanal} consulta(s) usando este canal.`,
      })
    }

    const { count: clientesConEsteCanal } = await supabaseAdmin
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('canal_origen_id', id)

    if (clientesConEsteCanal > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: hay ${clientesConEsteCanal} cliente(s) usando este canal.`,
      })
    }

    const { error } = await supabaseAdmin.from('canales_origen').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'eliminando canal de origen') })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando canal de origen:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
