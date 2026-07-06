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

  if (req.method === 'GET') return verVehiculo(req, res, id)
  if (req.method === 'PUT') return actualizarVehiculo(req, res, id)
  if (req.method === 'DELETE') return eliminarVehiculo(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verVehiculo(req, res, id) {
  const { data, error } = await supabaseAdmin
    .from('vehiculos')
    .select(
      `*, marcas(id, nombre), modelos(id, nombre), colores(id, nombre, codigo_hex),
       colores_interior(id, nombre), condiciones_vehiculo(id, nombre),
       transmisiones(id, nombre), combustibles(id, nombre), monedas(id, nombre, simbolo),
       tipos_propiedad(id, nombre), titulares_stock(id, nombre), clasificaciones_vehiculos(id, nombre, color_hex),
       sucursales(id, nombre)`
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Error obteniendo vehículo:', error)
    return res.status(500).json({ error: 'Error al obtener el vehículo' })
  }
  if (!data) return res.status(404).json({ error: 'Vehículo no encontrado' })

  const { data: fotos } = await supabaseAdmin
    .from('multimedia_vehiculo')
    .select('*')
    .eq('vehiculo_id', id)
    .order('orden', { ascending: true })

  return res.status(200).json({ data, fotos: fotos || [] })
}

async function actualizarVehiculo(req, res, id) {
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
      fecha_actualizacion: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('vehiculos')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un vehículo con esa patente' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizar vehículo') })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando vehículo:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarVehiculo(req, res, id) {
  try {
    const { error } = await supabaseAdmin.from('vehiculos').delete().eq('id', id)

    if (error) {
      console.error('Error eliminando vehículo:', error)
      return res.status(500).json({ error: 'Error al eliminar el vehículo' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando vehículo:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
