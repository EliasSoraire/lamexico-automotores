import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarUsuarios(req, res)
  if (req.method === 'POST') return crearUsuario(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function listarUsuarios(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre_completo, email, activo, verificado, ultimo_acceso')
      .order('nombre_completo', { ascending: true })

    if (error) {
      console.error('Error listando usuarios:', error)
      return res.status(500).json({ error: 'Error al obtener los usuarios' })
    }

    const contadores = {
      total: data.length,
      activos: data.filter((u) => u.activo).length,
      sin_verificar: data.filter((u) => !u.verificado).length,
    }

    return res.status(200).json({ data, contadores })
  } catch (err) {
    console.error('Error inesperado listando usuarios:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function crearUsuario(req, res) {
  try {
    const { nombre_completo, email, password, confirmar_password, dni, es_socio } = req.body || {}

    if (!nombre_completo || !email || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' })
    }

    if (password !== confirmar_password) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .insert({
        nombre_completo: nombre_completo.trim(),
        email: email.toLowerCase().trim(),
        password_hash,
        dni: dni?.trim() || null,
        es_socio: !!es_socio,
        activo: true,
        verificado: true,
      })
      .select('id, nombre_completo, email, activo, verificado')
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un usuario con ese correo electrónico' })
      }
      return res.status(500).json({ error: formatearErrorDb(error, 'creando usuario') })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando usuario:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
