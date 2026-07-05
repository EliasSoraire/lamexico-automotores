import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { requireAuth } from '../_lib/requireAuth.js'

const BUCKET = 'archivos'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return obtenerConfiguracion(req, res)
  if (req.method === 'PUT') return actualizarConfiguracion(req, res)
  if (req.method === 'POST') return firmarSubidaLogo(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function obtenerFilaBase() {
  const { data } = await supabaseAdmin
    .from('configuracion_general')
    .select('*')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (data) return data

  // No existe ninguna fila todavía: buscamos el ARS para dejarlo como moneda por defecto
  const { data: ars } = await supabaseAdmin
    .from('monedas')
    .select('id')
    .eq('codigo', 'ARS')
    .maybeSingle()

  const { data: creada } = await supabaseAdmin
    .from('configuracion_general')
    .insert({ moneda_default_id: ars?.id || null, activo: true })
    .select()
    .single()

  return creada
}

async function obtenerConfiguracion(req, res) {
  try {
    const data = await obtenerFilaBase()
    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error obteniendo configuración general:', err)
    return res.status(500).json({ error: 'Error al obtener la configuración' })
  }
}

async function actualizarConfiguracion(req, res) {
  try {
    const base = await obtenerFilaBase()
    const {
      logo_url,
      logo_nombre_archivo,
      logo_tamanio_bytes,
      restringir_por_vendedor,
      antiguedad_maxima_anios,
      kilometraje_maximo,
      margen_ganancia_sugerido,
      dias_vigencia_reservas,
      moneda_default_id,
    } = req.body || {}

    const payload = {
      restringir_por_vendedor: !!restringir_por_vendedor,
      antiguedad_maxima_anios: antiguedad_maxima_anios === '' || antiguedad_maxima_anios == null ? null : Number(antiguedad_maxima_anios),
      kilometraje_maximo: kilometraje_maximo === '' || kilometraje_maximo == null ? null : Number(kilometraje_maximo),
      margen_ganancia_sugerido: margen_ganancia_sugerido === '' || margen_ganancia_sugerido == null ? null : Number(margen_ganancia_sugerido),
      dias_vigencia_reservas: dias_vigencia_reservas === '' || dias_vigencia_reservas == null ? null : Number(dias_vigencia_reservas),
      moneda_default_id: moneda_default_id || null,
      fecha_actualizacion: new Date().toISOString(),
    }

    if (logo_url) {
      payload.logo_url = logo_url
      payload.logo_nombre_archivo = logo_nombre_archivo || null
      payload.logo_tamanio_bytes = logo_tamanio_bytes || null
      payload.logo_fecha_actualizacion = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('configuracion_general')
      .update(payload)
      .eq('id', base.id)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando configuración general:', error)
      return res.status(500).json({ error: 'Error al guardar la configuración' })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando configuración general:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function firmarSubidaLogo(req, res) {
  try {
    const { nombre_archivo } = req.body || {}
    if (!nombre_archivo) {
      return res.status(400).json({ error: 'Falta nombre_archivo' })
    }

    const extension = nombre_archivo.split('.').pop()
    const path = `logo/logo-${Date.now()}.${extension}`

    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path)

    if (error) {
      console.error('Error generando URL firmada del logo:', error)
      return res.status(500).json({ error: 'Error al preparar la subida del logo' })
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    return res.status(200).json({ signedUrl: data.signedUrl, publicUrl: publicUrlData.publicUrl })
  } catch (err) {
    console.error('Error inesperado firmando subida de logo:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
