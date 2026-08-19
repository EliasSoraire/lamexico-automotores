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

  if (req.method === 'GET') return verCuenta(req, res, id)
  if (req.method === 'PUT') return actualizarCuenta(req, res, id)
  if (req.method === 'DELETE') return eliminarCuenta(req, res, id)

  return res.status(405).json({ error: 'Método no permitido' })
}

async function verCuenta(req, res, id) {
  const { data: cuenta, error } = await supabaseAdmin
    .from('cuentas_corrientes')
    .select(
      `*, clientes(id, nombre, apellido, razon_social, tipo_persona, telefono, email),
       monedas(id, codigo, simbolo), tipos_cuenta_corriente(id, nombre), estados_saldo_cuenta(id, nombre)`
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: formatearErrorDb(error, 'obteniendo cuenta corriente') })
  }
  if (!cuenta) return res.status(404).json({ error: 'Cuenta corriente no encontrada' })

  const { data: movimientos, error: errorMov } = await supabaseAdmin
    .from('movimientos_cuenta_corriente')
    .select('*')
    .eq('cuenta_corriente_id', id)
    .order('fecha_movimiento', { ascending: false })

  if (errorMov) {
    return res.status(500).json({ error: formatearErrorDb(errorMov, 'obteniendo movimientos de la cuenta') })
  }

  return res.status(200).json({ data: { ...cuenta, movimientos: movimientos || [] } })
}

async function actualizarCuenta(req, res, id) {
  try {
    const { limite_credito, observaciones, activa } = req.body || {}

    const payload = {
      limite_credito: limite_credito !== undefined ? Number(limite_credito) || 0 : undefined,
      observaciones: observaciones !== undefined ? observaciones : undefined,
      fecha_actualizacion: new Date().toISOString(),
    }

    if (activa !== undefined) {
      payload.activa = !!activa
      payload.fecha_cierre = activa ? null : new Date().toISOString().slice(0, 10)
    }

    const { data, error } = await supabaseAdmin
      .from('cuentas_corrientes')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'actualizando cuenta corriente') })
    }

    return res.status(200).json({ data })
  } catch (err) {
    console.error('Error inesperado actualizando cuenta corriente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function eliminarCuenta(req, res, id) {
  try {
    const { data: cuenta } = await supabaseAdmin
      .from('cuentas_corrientes')
      .select('saldo_actual')
      .eq('id', id)
      .maybeSingle()

    if (cuenta && Number(cuenta.saldo_actual) !== 0) {
      return res.status(409).json({ error: 'No se puede eliminar: la cuenta tiene saldo distinto de cero.' })
    }

    const { count: movimientosExistentes } = await supabaseAdmin
      .from('movimientos_cuenta_corriente')
      .select('id', { count: 'exact', head: true })
      .eq('cuenta_corriente_id', id)

    if (movimientosExistentes > 0) {
      return res.status(409).json({ error: `No se puede eliminar: hay ${movimientosExistentes} movimiento(s) registrados en esta cuenta.` })
    }

    const { error } = await supabaseAdmin.from('cuentas_corrientes').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'eliminando cuenta corriente') })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error inesperado eliminando cuenta corriente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
