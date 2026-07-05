import { supabaseAdmin } from '../_lib/supabaseAdmin.js'
import { requireAuth } from '../_lib/requireAuth.js'

export default async function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()
    const en7dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const hoy = ahora.toISOString().slice(0, 10)

    const [
      vehiculosDisponibles,
      clientesActivos,
      ventasDelMes,
      consultasNuevas,
      estadosVehiculos,
      ventasPorMes,
      cuotasPorVencer,
      legajos,
      movimientosCaja,
      auditoria,
    ] = await Promise.all([
      contar('vehiculos', (q) => q.eq('estado', 'Disponible')),
      contar('clientes', (q) => q.eq('activo', true)),
      contar('ventas', (q) => q.gte('fecha_venta', inicioMes.slice(0, 10))),
      contar('consultas', (q) => q.gte('fecha_ingreso', inicioMes)),
      obtenerEstadosVehiculos(),
      obtenerVentasPorMes(ahora),
      contar('cuotas_plan_pago', (q) => q.eq('estado', 'Pendiente').gte('fecha_vencimiento', hoy).lte('fecha_vencimiento', en7dias)),
      obtenerResumenLegajos(),
      obtenerResumenFinanciero(inicioMes),
      obtenerActividadReciente(),
    ])

    return res.status(200).json({
      vehiculos_disponibles: vehiculosDisponibles,
      clientes_activos: clientesActivos,
      ventas_del_mes: ventasDelMes,
      consultas_nuevas: consultasNuevas,
      estados_vehiculos: estadosVehiculos,
      ventas_por_mes: ventasPorMes,
      cuotas_por_vencer: cuotasPorVencer,
      resumen_gestoria: legajos,
      resumen_financiero: movimientosCaja,
      actividad_reciente: auditoria,
    })
  } catch (err) {
    console.error('Error inesperado armando el dashboard:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function contar(tabla, filtro) {
  let query = supabaseAdmin.from(tabla).select('id', { count: 'exact', head: true })
  query = filtro(query)
  const { count } = await query
  return count || 0
}

async function obtenerEstadosVehiculos() {
  const ESTADOS = ['Disponible', 'En Tránsito', 'Reservado', 'En Preparación', 'De Baja']
  const resultados = await Promise.all(
    ESTADOS.map(async (estado) => {
      const { count } = await supabaseAdmin
        .from('vehiculos')
        .select('id', { count: 'exact', head: true })
        .eq('estado', estado)
      return { estado, cantidad: count || 0 }
    })
  )
  return resultados
}

async function obtenerVentasPorMes(ahora) {
  const inicioAnio = new Date(ahora.getFullYear(), 0, 1).toISOString().slice(0, 10)
  const { data } = await supabaseAdmin
    .from('ventas')
    .select('fecha_venta')
    .gte('fecha_venta', inicioAnio)

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const conteo = meses.map((nombre) => ({ mes: nombre, cantidad: 0 }))

  ;(data || []).forEach((v) => {
    const mesIndex = new Date(v.fecha_venta).getMonth()
    conteo[mesIndex].cantidad += 1
  })

  return conteo
}

async function obtenerResumenLegajos() {
  const { count: activos } = await supabaseAdmin
    .from('legajos')
    .select('id', { count: 'exact', head: true })
    .eq('activo', true)

  const { count: requierenAtencion } = await supabaseAdmin
    .from('legajos')
    .select('id', { count: 'exact', head: true })
    .eq('activo', true)
    .gt('cantidad_documentos_pendientes', 0)

  return { activos: activos || 0, requieren_atencion: requierenAtencion || 0 }
}

async function obtenerResumenFinanciero(inicioMes) {
  const { data } = await supabaseAdmin
    .from('movimientos_caja')
    .select('importe, tipos_movimiento_caja(signo)')
    .gte('fecha_movimiento', inicioMes.slice(0, 10))

  let ingresos = 0
  let egresos = 0
  ;(data || []).forEach((m) => {
    const signo = m.tipos_movimiento_caja?.signo ?? 1
    if (signo >= 0) ingresos += Number(m.importe)
    else egresos += Number(m.importe)
  })

  return { ingresos, egresos, balance: ingresos - egresos }
}

async function obtenerActividadReciente() {
  const { data } = await supabaseAdmin
    .from('auditoria')
    .select('id, descripcion, accion_nombre, modulo_nombre, fecha_hora')
    .order('fecha_hora', { ascending: false })
    .limit(5)

  return data || []
}
