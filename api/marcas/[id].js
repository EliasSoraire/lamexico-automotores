import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { requireAuth } from '../_lib/requireAuth.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query

  if (req.method === 'GET') return verMarca(req, res, id)
  if (req.method === 'PUT') return actualizarMarca(req, res, id)
  if (req.method === 'DELETE') return eliminarMarca(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verMarca(req, res, id) {
  try {
    const { data: marca, error } = await supabaseAdmin
      .from('marcas')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error obteniendo marca:', error)
      return res.status(500).json({ error: 'Error al obtener la marca' })
    }

    if (!marca) {
      return res.status(404).json({ error: 'Marca no encontrada' })
    }

    const [{ count: totalModelos }, { count: modelosActivos }, { count: vehiculosStock }] =
      await Promise.all([
        supabaseAdmin
          .from('modelos')
          .select('id', { count: 'exact', head: true })
          .eq('marca_id', id),
        supabaseAdmin
          .from('modelos')
          .select('id', { count: 'exact', head: true })
          .eq('marca_id', id)
          .eq('activo', true),
        supabaseAdmin
          .from('vehiculos')
          .select('id', { count: 'exact', head: true })
          .eq('marca_id', id),
      ])

    // Vehículos vendidos: primero obtenemos los IDs de vehículos de esta marca,
    // después contamos cuántos de esos IDs tienen una venta asociada.
    const { data: vehiculosDeMarca } = await supabaseAdmin
      .from('vehiculos')
      .select('id')
      .eq('marca_id', id)

    const idsVehiculos = (vehiculosDeMarca || []).map((v) => v.id)

    let vehiculosVendidos = 0
    if (idsVehiculos.length > 0) {
      const { count } = await supabaseAdmin
        .from('ventas')
        .select('id', { count: 'exact', head: true })
        .in('vehiculo_id', idsVehiculos)
      vehiculosVendidos = count || 0
    }

    return res.status(200).json({
      data: marca,
      estadisticas: {
        total_modelos: totalModelos || 0,
        modelos_activos: modelosActivos || 0,
        vehiculos_en_stock: vehiculosStock || 0,
        vehiculos_vendidos: vehiculosVendidos || 0,
      },
    })
  } catch (err) {
    console.error('Error inesperado obteniendo marca:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function actualizarMarca(req, res, id) {
  try {
    const { nombre, codigo, descripcion, logo_url, favorita, activa } = req.body || {}

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la marca es obligatorio' })
    }

    if (codigo && codigo.length > 10) {
      return res.status(400).json({ error: 'El código no puede superar los 10 caracteres' })
    }

    const { data, error } = await supabaseAdmin
      .from('marcas')
      .update({
        nombre: nombre.trim(),
        codigo: codigo?.trim() || null,
        descripcion: descripcion?.trim() || null,
        logo_url: logo_url?.trim() || null,
        favorita: !!favorita,
        activa: !!activa,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una marca con ese código' })
      }
      console.error('Error actualizando marca:', error)
      return res.status(500).json({ error: 'Error al actualizar la marca' })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando marca:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarMarca(req, res, id) {
  try {
    const { count: totalModelos } = await supabaseAdmin
      .from('modelos')
      .select('id', { count: 'exact', head: true })
      .eq('marca_id', id)

    if (totalModelos > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: esta marca tiene ${totalModelos} modelo(s) asociado(s). Eliminalos primero o desactivá la marca.`,
      })
    }

    const { error } = await supabaseAdmin.from('marcas').delete().eq('id', id)

    if (error) {
      console.error('Error eliminando marca:', error)
      return res.status(500).json({ error: 'Error al eliminar la marca' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando marca:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
