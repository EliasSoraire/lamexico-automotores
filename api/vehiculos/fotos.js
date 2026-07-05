import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { requireAuth } from '../_lib/requireAuth.js'

const BUCKET = 'archivos'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarFotos(req, res)
  if (req.method === 'POST') return manejarPost(req, res)
  if (req.method === 'DELETE') return eliminarFoto(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function manejarPost(req, res) {
  const { accion } = req.body || {}
  if (accion === 'firmar') return firmarSubida(req, res)
  if (accion === 'guardar') return guardarFoto(req, res)
  return res.status(400).json({ error: 'Acción inválida' })
}

async function firmarSubida(req, res) {
  try {
    const { vehiculo_id, nombre_archivo } = req.body || {}
    if (!vehiculo_id || !nombre_archivo) {
      return res.status(400).json({ error: 'Faltan vehiculo_id o nombre_archivo' })
    }

    const extension = nombre_archivo.split('.').pop()
    const nombreUnico = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
    const path = `vehiculos/${vehiculo_id}/${nombreUnico}`

    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path)

    if (error) {
      console.error('Error generando URL firmada:', error)
      return res.status(500).json({ error: 'Error al preparar la subida del archivo' })
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    return res.status(200).json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl: publicUrlData.publicUrl,
    })
  } catch (err) {
    console.error('Error inesperado firmando subida:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function guardarFoto(req, res) {
  try {
    const { vehiculo_id, url_archivo, nombre_archivo, tamanio_bytes, es_principal, orden } =
      req.body || {}

    if (!vehiculo_id || !url_archivo) {
      return res.status(400).json({ error: 'Faltan vehiculo_id o url_archivo' })
    }

    const { data, error } = await supabaseAdmin
      .from('multimedia_vehiculo')
      .insert({
        vehiculo_id,
        tipo: 'imagen',
        url_archivo,
        nombre_archivo: nombre_archivo || null,
        tamanio_bytes: tamanio_bytes || null,
        es_principal: !!es_principal,
        orden: orden || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error guardando foto:', error)
      return res.status(500).json({ error: 'Error al guardar la foto' })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado guardando foto:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function listarFotos(req, res) {
  const { vehiculo_id } = req.query
  if (!vehiculo_id) return res.status(400).json({ error: 'Falta vehiculo_id' })

  const { data, error } = await supabaseAdmin
    .from('multimedia_vehiculo')
    .select('*')
    .eq('vehiculo_id', vehiculo_id)
    .order('orden', { ascending: true })

  if (error) {
    console.error('Error listando fotos:', error)
    return res.status(500).json({ error: 'Error al obtener las fotos' })
  }

  return res.status(200).json({ data })
}

async function eliminarFoto(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Falta id' })

  const { data: foto } = await supabaseAdmin
    .from('multimedia_vehiculo')
    .select('url_archivo')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabaseAdmin.from('multimedia_vehiculo').delete().eq('id', id)

  if (error) {
    console.error('Error eliminando foto:', error)
    return res.status(500).json({ error: 'Error al eliminar la foto' })
  }

  // Intenta borrar también el archivo físico del bucket (best-effort, no bloquea la respuesta)
  if (foto?.url_archivo) {
    try {
      const partes = foto.url_archivo.split(`${BUCKET}/`)
      if (partes[1]) {
        await supabaseAdmin.storage.from(BUCKET).remove([partes[1]])
      }
    } catch (err) {
      console.error('No se pudo eliminar el archivo físico del storage:', err)
    }
  }

  return res.status(200).json({ ok: true })
}
