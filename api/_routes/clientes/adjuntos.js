import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

const BUCKET = 'archivos'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarAdjuntos(req, res)
  if (req.method === 'POST') return manejarPost(req, res)
  if (req.method === 'DELETE') return eliminarAdjunto(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function manejarPost(req, res) {
  const { accion } = req.body || {}
  if (accion === 'firmar') return firmarSubida(req, res)
  if (accion === 'guardar') return guardarAdjunto(req, res)
  return res.status(400).json({ error: 'Acción inválida' })
}

async function firmarSubida(req, res) {
  try {
    const { cliente_id, nombre_archivo } = req.body || {}
    if (!cliente_id || !nombre_archivo) {
      return res.status(400).json({ error: 'Faltan cliente_id o nombre_archivo' })
    }

    const extension = nombre_archivo.split('.').pop()
    const nombreUnico = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
    const path = `clientes/${cliente_id}/${nombreUnico}`

    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'firmando subida de adjunto') })
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    return res.status(200).json({ signedUrl: data.signedUrl, publicUrl: publicUrlData.publicUrl })
  } catch (err) {
    console.error('Error inesperado firmando adjunto:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function guardarAdjunto(req, res) {
  try {
    const { cliente_id, url_archivo, nombre_archivo, tamanio_bytes, tipo_archivo } = req.body || {}

    if (!cliente_id || !url_archivo) {
      return res.status(400).json({ error: 'Faltan cliente_id o url_archivo' })
    }

    const { data, error } = await supabaseAdmin
      .from('adjuntos_cliente')
      .insert({
        cliente_id,
        url_archivo,
        nombre_archivo: nombre_archivo || null,
        tamanio_bytes: tamanio_bytes || null,
        tipo_archivo: tipo_archivo || null,
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'guardando adjunto') })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado guardando adjunto:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function listarAdjuntos(req, res) {
  const { cliente_id } = req.query
  if (!cliente_id) return res.status(400).json({ error: 'Falta cliente_id' })

  const { data, error } = await supabaseAdmin
    .from('adjuntos_cliente')
    .select('*')
    .eq('cliente_id', cliente_id)
    .order('fecha_subida', { ascending: false })

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'listando adjuntos') })
  }

  return res.status(200).json({ data })
}

async function eliminarAdjunto(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Falta id' })

  const { data: adjunto } = await supabaseAdmin
    .from('adjuntos_cliente')
    .select('url_archivo')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabaseAdmin.from('adjuntos_cliente').delete().eq('id', id)

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'eliminando adjunto') })
  }

  if (adjunto?.url_archivo) {
    try {
      const partes = adjunto.url_archivo.split(`${BUCKET}/`)
      if (partes[1]) await supabaseAdmin.storage.from(BUCKET).remove([partes[1]])
    } catch (err) {
      console.error('No se pudo eliminar el archivo físico del storage:', err)
    }
  }

  return res.status(200).json({ ok: true })
}
