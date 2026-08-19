import { supabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { requireAuth } from '../../_lib/requireAuth.js'
import { formatearErrorDb } from '../../_lib/formatearErrorDb.js'

// Por ahora solo se soporta tipo de entidad "Cliente" (Proveedores y Socios todavía
// no tienen pantalla propia en el sistema). El resto del modelo ya soporta los 3 tipos,
// así que cuando se agreguen Proveedores/Socios alcanza con sumar sus buscadores.

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') return listarCuentas(req, res)
  if (req.method === 'POST') return crearCuenta(req, res)

  return res.status(405).json({ error: 'Método no permitido' })
}

function calcularEstadoSaldoNombre(saldo) {
  if (Number(saldo) > 0) return 'Saldo a Favor'
  if (Number(saldo) < 0) return 'Saldo Deudor'
  return 'Saldo Cero'
}

async function obtenerEstadoSaldoId(nombre) {
  const { data } = await supabaseAdmin.from('estados_saldo_cuenta').select('id').eq('nombre', nombre).maybeSingle()
  return data?.id || null
}

async function listarCuentas(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), 100)
    const busqueda = (req.query.busqueda || '').trim()
    const { tipo_cuenta_id, moneda_id, estado_saldo_id } = req.query

    const desde = (page - 1) * pageSize
    const hasta = desde + pageSize - 1

    let clienteIdsFiltro = null
    if (busqueda) {
      const { data: clientesMatch } = await supabaseAdmin
        .from('clientes')
        .select('id')
        .or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,razon_social.ilike.%${busqueda}%`)
      clienteIdsFiltro = (clientesMatch || []).map((c) => c.id)
      if (clienteIdsFiltro.length === 0) {
        return res.status(200).json({ data: [], total: 0, page, pageSize, totalPages: 0, contadores: await obtenerContadores() })
      }
    }

    let query = supabaseAdmin
      .from('cuentas_corrientes')
      .select(
        `id, numero_cuenta, saldo_actual, limite_credito, activa, fecha_apertura,
         clientes(id, nombre, apellido, razon_social, tipo_persona),
         monedas(id, codigo, simbolo), tipos_cuenta_corriente(id, nombre), estados_saldo_cuenta(id, nombre)`,
        { count: 'exact' }
      )

    if (clienteIdsFiltro) query = query.in('cliente_id', clienteIdsFiltro)
    if (tipo_cuenta_id) query = query.eq('tipo_cuenta_id', tipo_cuenta_id)
    if (moneda_id) query = query.eq('moneda_id', moneda_id)
    if (estado_saldo_id) query = query.eq('estado_saldo_id', estado_saldo_id)

    query = query.order('fecha_creacion', { ascending: false }).range(desde, hasta)

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'listando cuentas corrientes') })
    }

    return res.status(200).json({
      data,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      contadores: await obtenerContadores(),
    })
  } catch (err) {
    console.error('Error inesperado listando cuentas corrientes:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function obtenerContadores() {
  const contarPorTipo = async (nombreTipo) => {
    const { data: tipo } = await supabaseAdmin.from('tipos_cuenta_corriente').select('id').eq('nombre', nombreTipo).maybeSingle()
    if (!tipo) return 0
    const { count } = await supabaseAdmin.from('cuentas_corrientes').select('id', { count: 'exact', head: true }).eq('tipo_cuenta_id', tipo.id)
    return count || 0
  }

  const [clientes, proveedores, socios] = await Promise.all([
    contarPorTipo('Cliente'),
    contarPorTipo('Proveedor'),
    contarPorTipo('Socio'),
  ])

  const { count: totalActivas } = await supabaseAdmin.from('cuentas_corrientes').select('id', { count: 'exact', head: true }).eq('activa', true)

  return { clientes, proveedores, socios, total_activas: totalActivas || 0 }
}

async function crearCuenta(req, res) {
  try {
    const { cliente_id, moneda_id, limite_credito } = req.body || {}

    if (!cliente_id) {
      return res.status(400).json({ error: 'La Entidad (Cliente) es obligatoria' })
    }
    if (!moneda_id) {
      return res.status(400).json({ error: 'La Moneda es obligatoria' })
    }

    const { count: yaExiste } = await supabaseAdmin
      .from('cuentas_corrientes')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', cliente_id)
      .eq('moneda_id', moneda_id)

    if (yaExiste > 0) {
      return res.status(409).json({ error: 'Este cliente ya tiene una cuenta corriente en esa moneda' })
    }

    const { data: tipoCliente } = await supabaseAdmin.from('tipos_cuenta_corriente').select('id').eq('nombre', 'Cliente').maybeSingle()
    const estadoSaldoCeroId = await obtenerEstadoSaldoId('Saldo Cero')

    const { count: totalExistentes } = await supabaseAdmin.from('cuentas_corrientes').select('id', { count: 'exact', head: true })
    const numeroCuenta = `CC-${String((totalExistentes || 0) + 1).padStart(5, '0')}`

    const payload = {
      cliente_id,
      tipo_cuenta_id: tipoCliente?.id || null,
      moneda_id,
      numero_cuenta: numeroCuenta,
      saldo_inicial: 0,
      saldo_actual: 0,
      saldo_disponible: limite_credito ? Number(limite_credito) : 0,
      limite_credito: limite_credito ? Number(limite_credito) : 0,
      activa: true,
      estado_saldo_id: estadoSaldoCeroId,
      fecha_apertura: new Date().toISOString().slice(0, 10),
    }

    const { data, error } = await supabaseAdmin.from('cuentas_corrientes').insert(payload).select().single()

    if (error) {
      return res.status(500).json({ error: formatearErrorDb(error, 'creando cuenta corriente') })
    }

    return res.status(201).json({ data })
  } catch (err) {
    console.error('Error inesperado creando cuenta corriente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export { calcularEstadoSaldoNombre, obtenerEstadoSaldoId }
