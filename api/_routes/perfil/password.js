import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { password_actual, password_nueva, password_confirmar } = req.body || {}

    if (!password_actual || !password_nueva || !password_confirmar) {
      return res.status(400).json({ error: 'Completá la contraseña actual y la nueva (dos veces)' })
    }

    if (password_nueva !== password_confirmar) {
      return res.status(400).json({ error: 'La nueva contraseña y su confirmación no coinciden' })
    }

    if (password_nueva.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' })
    }

    const { data: usuario, error: errorBusqueda } = await supabaseAdmin
      .from('usuarios')
      .select('id, password_hash')
      .eq('id', user.id)
      .maybeSingle()

    if (errorBusqueda || !usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const passwordValida = await bcrypt.compare(password_actual, usuario.password_hash)
    if (!passwordValida) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' })
    }

    const nuevoHash = await bcrypt.hash(password_nueva, 10)

    const { error } = await supabaseAdmin
      .from('usuarios')
      .update({ password_hash: nuevoHash, fecha_actualizacion: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando contraseña') })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado actualizando contraseña:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
