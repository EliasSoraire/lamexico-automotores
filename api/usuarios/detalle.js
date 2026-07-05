import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { requireAuth } from '../_lib/requireAuth.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'Falta el parámetro id' })
  }

  if (req.method === 'GET') return verUsuario(req, res, id)
  if (req.method === 'PUT') return actualizarUsuario(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verUsuario(req, res, id) {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre_completo, email, dni, es_socio, activo, verificado, ultimo_acceso, fecha_creacion')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Error obteniendo usuario:', error)
    return res.status(500).json({ error: 'Error al obtener el usuario' })
  }
  if (!data) return res.status(404).json({ error: 'Usuario no encontrado' })

  return res.status(200).json({ data })
}

async function actualizarUsuario(req, res, id) {
  try {
    const { nombre_completo, email, password, confirmar_password, dni, es_socio, activo } = req.body || {}

    if (!nombre_completo || !email) {
      return res.status(400).json({ error: 'Nombre y correo son obligatorios' })
    }

    const payload = {
      nombre_completo: nombre_completo.trim(),
      email: email.toLowerCase().trim(),
      dni: dni?.trim() || null,
      es_socio: !!es_socio,
      activo: activo === undefined ? true : !!activo,
      fecha_actualizacion: new Date().toISOString(),
    }

    // La contraseña es opcional al editar: solo se actualiza si se escribió una nueva
    if (password) {
      if (password !== confirmar_password) {
        return res.status(400).json({ error: 'Las contraseñas no coinciden' })
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
      }
      payload.password_hash = await bcrypt.hash(password, 10)
    }

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .update(payload)
      .eq('id', id)
      .select('id, nombre_completo, email, activo, verificado')
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un usuario con ese correo electrónico' })
      }
      console.error('Error actualizando usuario:', error)
      return res.status(500).json({ error: 'Error al actualizar el usuario' })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando usuario:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
