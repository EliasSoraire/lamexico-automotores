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

  if (req.method === 'GET') return verFinanciera(req, res, id)
  if (req.method === 'PUT') return actualizarFinanciera(req, res, id)
  if (req.method === 'DELETE') return eliminarFinanciera(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verFinanciera(req, res, id) {
  const { data, error } = await supabaseAdmin
    .from('financieras')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'obteniendo financiera') })
  }
  if (!data) return res.status(404).json({ error: 'Financiera no encontrada' })

  return res.status(200).json({ data })
}

async function actualizarFinanciera(req, res, id) {
  try {
    const { nombre, activo } = req.body || {}

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del Banco/Financiera es obligatorio' })
    }

    const { data, error } = await supabaseAdmin
      .from('financieras')
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
        return res.status(409).json({ error: 'Ya existe una financiera con ese nombre' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando financiera') })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando financiera:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarFinanciera(req, res, id) {
  try {
    const { count: planesConEstaFinanciera } = await supabaseAdmin
      .from('planes_pago')
      .select('id', { count: 'exact', head: true })
      .eq('financiera_id', id)

    if (planesConEstaFinanciera > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: hay ${planesConEstaFinanciera} plan(es) de pago usando esta financiera.`,
      })
    }

    const { error } = await supabaseAdmin.from('financieras').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'eliminando financiera') })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando financiera:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
