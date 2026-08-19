import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CreditCard, CheckCircle2, Clock } from 'lucide-react'
import { api } from '../../../lib/api'

const ESTADO_COLORES = {
  Vigente: 'bg-blue-50 text-blue-700',
  Pagado: 'bg-green-50 text-green-700',
  Vencido: 'bg-red-50 text-red-700',
  Cancelado: 'bg-slate-100 text-slate-600',
}

function nombreCliente(c) {
  if (!c) return '—'
  return c.tipo_persona === 'Jurídica' ? c.razon_social : `${c.nombre || ''} ${c.apellido || ''}`.trim()
}

export default function PlanPagoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [plan, setPlan] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [guardandoCuota, setGuardandoCuota] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const res = await api.get(`/api/planes-pago/detalle?id=${id}`)
      setPlan(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function marcarPagada(cuota) {
    setGuardandoCuota(cuota.id)
    try {
      await api.put(`/api/planes-pago/cuotas?id=${cuota.id}`, {
        monto_pagado: cuota.monto,
        estado: 'Pagada',
      })
      await cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardandoCuota(null)
    }
  }

  if (cargando) {
    return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>
  }

  if (error && !plan) {
    return <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
  }

  if (!plan) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CreditCard size={20} className="text-blue-600" />
          Plan de Pago {plan.numero_plan || `#${plan.id}`}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/finanzas/planes-pago')}
          className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50"
        >
          Volver
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-400 rounded-xl p-6 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Venta</div>
            <div className="font-medium text-slate-800">{plan.ventas?.numero_venta || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Cliente</div>
            <div className="font-medium text-slate-800">{nombreCliente(plan.clientes)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Financiera</div>
            <div className="font-medium text-slate-800">{plan.financieras?.nombre || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Estado</div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLORES[plan.estados_plan_pago?.nombre] || 'bg-slate-100 text-slate-600'}`}>
              {plan.estados_plan_pago?.nombre || '—'}
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Cantidad de Cuotas</div>
            <div className="font-medium text-slate-800">{plan.cantidad_cuotas}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Valor Cuota</div>
            <div className="font-medium text-slate-800">${Number(plan.valor_cuota || 0).toLocaleString('es-AR')}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Monto Total</div>
            <div className="font-medium text-slate-800">${Number(plan.monto_total || 0).toLocaleString('es-AR')}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Tasa de Interés</div>
            <div className="font-medium text-slate-800">{plan.tasa_interes ? `${plan.tasa_interes}%` : '—'}</div>
          </div>
        </div>
        {plan.observaciones && (
          <div className="mt-4 text-sm text-slate-600 border-t border-slate-100 pt-3">{plan.observaciones}</div>
        )}
      </div>

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Cuotas</div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Vencimiento</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Pagado</th>
              <th className="px-4 py-3">Saldo</th>
              <th className="px-4 py-3">Fecha de Pago</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {plan.cuotas.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-600">Este plan no tiene cuotas generadas.</td></tr>
            )}
            {plan.cuotas.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">{c.numero_cuota}</td>
                <td className="px-4 py-3 text-slate-700">{c.fecha_vencimiento}</td>
                <td className="px-4 py-3 text-slate-700">${Number(c.monto || 0).toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-slate-700">${Number(c.monto_pagado || 0).toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-slate-700">${Number(c.saldo_pendiente ?? c.monto).toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-slate-700">{c.fecha_pago || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${c.estado === 'Pagada' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {c.estado === 'Pagada' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {c.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.estado !== 'Pagada' && (
                    <button
                      type="button"
                      disabled={guardandoCuota === c.id}
                      onClick={() => marcarPagada(c)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400"
                    >
                      {guardandoCuota === c.id ? 'Guardando...' : 'Marcar pagada'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
