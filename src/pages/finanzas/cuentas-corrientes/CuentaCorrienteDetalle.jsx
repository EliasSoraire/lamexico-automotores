import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Wallet, Save } from 'lucide-react'
import { api } from '../../../lib/api'

const ESTADO_COLORES = {
  'Saldo a Favor': 'bg-green-50 text-green-700',
  'Saldo Deudor': 'bg-red-50 text-red-700',
  'Saldo Cero': 'bg-slate-100 text-slate-600',
}

function nombreCliente(c) {
  if (!c) return '—'
  return c.tipo_persona === 'Jurídica' ? c.razon_social : `${c.nombre || ''} ${c.apellido || ''}`.trim()
}

export default function CuentaCorrienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [cuenta, setCuenta] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [limiteCredito, setLimiteCredito] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const res = await api.get(`/api/cuentas-corrientes/detalle?id=${id}`)
      setCuenta(res.data)
      setLimiteCredito(res.data.limite_credito ?? '')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function guardarLimite() {
    setGuardando(true)
    setError('')
    try {
      await api.put(`/api/cuentas-corrientes/detalle?id=${id}`, { limite_credito: limiteCredito || 0 })
      setOk('Límite de crédito actualizado.')
      setTimeout(() => setOk(''), 3000)
      cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>
  if (error && !cuenta) return <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
  if (!cuenta) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet size={20} className="text-blue-600" />
          Cuenta Corriente {cuenta.numero_cuenta}
        </h1>
        <button type="button" onClick={() => navigate('/finanzas/cuentas-corrientes')} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">
          Volver
        </button>
      </div>

      {ok && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{ok}</div>}
      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="bg-white border border-slate-400 rounded-xl p-6 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-5">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Entidad</div>
            <div className="font-medium text-slate-800">{nombreCliente(cuenta.clientes)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Tipo</div>
            <div className="font-medium text-slate-800">{cuenta.tipos_cuenta_corriente?.nombre || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Moneda</div>
            <div className="font-medium text-slate-800">{cuenta.monedas?.codigo || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Estado de Saldo</div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLORES[cuenta.estados_saldo_cuenta?.nombre] || 'bg-slate-100 text-slate-600'}`}>
              {cuenta.estados_saldo_cuenta?.nombre || '—'}
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Saldo Actual</div>
            <div className={`font-bold ${Number(cuenta.saldo_actual) < 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {cuenta.monedas?.simbolo || '$'}{Number(cuenta.saldo_actual || 0).toLocaleString('es-AR')}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Saldo Disponible</div>
            <div className="font-medium text-slate-800">{cuenta.monedas?.simbolo || '$'}{Number(cuenta.saldo_disponible || 0).toLocaleString('es-AR')}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Fecha de Apertura</div>
            <div className="font-medium text-slate-800">{cuenta.fecha_apertura}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Estado</div>
            <div className="font-medium text-slate-800">{cuenta.activa ? 'Abierta' : 'Cerrada'}</div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex items-end gap-3">
          <div className="max-w-xs">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Límite de crédito</label>
            <input
              type="number"
              value={limiteCredito}
              onChange={(e) => setLimiteCredito(e.target.value)}
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2"
            />
          </div>
          <button type="button" disabled={guardando} onClick={guardarLimite} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2">
            <Save size={15} />
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Movimientos</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Saldo Anterior</th>
                <th className="px-4 py-3">Saldo Nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cuenta.movimientos.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-600">Esta cuenta todavía no tiene movimientos registrados.</td></tr>
              )}
              {cuenta.movimientos.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{m.fecha_movimiento}</td>
                  <td className="px-4 py-3 text-slate-700">{m.concepto}</td>
                  <td className={`px-4 py-3 font-medium ${Number(m.monto) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {cuenta.monedas?.simbolo || '$'}{Number(m.monto || 0).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{cuenta.monedas?.simbolo || '$'}{Number(m.saldo_anterior || 0).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-slate-700">{cuenta.monedas?.simbolo || '$'}{Number(m.saldo_nuevo || 0).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
