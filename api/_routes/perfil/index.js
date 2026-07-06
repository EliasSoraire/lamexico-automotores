import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return verPerfil(req, res, user)
  if (req.method === 'PUT') return actualizarPerfil(req, res, user)
  if (req.method === 'DELETE') return eliminarCuenta(req, res, user)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verPerfil(req, res, user) {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre_completo, email')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'obteniendo perfil') })
  }
  if (!data) return res.status(404).json({ error: 'Usuario no encontrado' })

  return res.status(200).json({ data })
}

async function actualizarPerfil(req, res, user) {
  try {
    const { nombre_completo, email } = req.body || {}

    if (!nombre_completo || !email) {
      return res.status(400).json({ error: 'Nombre y correo son obligatorios' })
    }

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .update({
        nombre_completo: nombre_completo.trim(),
        email: email.toLowerCase().trim(),
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id, nombre_completo, email')
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un usuario con ese correo electrónico' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando perfil') })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando perfil:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarCuenta(req, res, user) {
  try {
    const { count: totalUsuariosActivos } = await supabaseAdmin
      .from('usuarios')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true)

    if (totalUsuariosActivos <= 1) {
      return res.status(409).json({
        error: 'No podés eliminar tu cuenta porque es la única cuenta activa del sistema. Creá otro usuario administrador antes de eliminar esta.',
      })
    }

    const { error } = await supabaseAdmin.from('usuarios').delete().eq('id', user.id)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'eliminando cuenta') })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando cuenta:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
