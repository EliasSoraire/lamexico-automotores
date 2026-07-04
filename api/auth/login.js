import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { signToken } from '../_lib/jwt.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' })
  }

  try {
    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre_completo, email, password_hash, activo')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (error) {
      console.error('Error consultando usuario:', error)
      return res.status(500).json({ error: 'Error interno al validar credenciales' })
    }

    if (!usuario) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario inactivo. Contactá al administrador.' })
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash)

    if (!passwordValida) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
    }

    await supabaseAdmin
      .from('usuarios')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', usuario.id)

    const token = signToken({
      id: usuario.id,
      email: usuario.email,
      nombre_completo: usuario.nombre_completo,
    })

    return res.status(200).json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
      },
    })
  } catch (err) {
    console.error('Error inesperado en login:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
