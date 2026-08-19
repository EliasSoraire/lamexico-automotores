import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Eye } from 'lucide-react'
import { api } from '../../../lib/api'
import Paginacion from '../../../components/ui/Paginacion'

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

export default function PlanesPagoList() {
  const navigate = useNavigate()

  const [planes, setPlanes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [busquedaInput, setBusquedaInput] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [estadoId, setEstadoId] = useState('')
  const [estados, setEstados] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0 })

  useEffect(() => {
    api.get('/api/catalogos-finanzas?tipo=estados-plan-pago').then((r) => setEstados(r.data)).catch(() => {})
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), busqueda })
      if (estadoId) params.set('estado_id', estadoId)
      const res = await api.get(`/api/planes-pago?${params.toString()}`)
      setPlanes(res.data)
      setPaginacion({ total: res.total, totalPages: res.totalPages })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [page, pageSize, busqueda, estadoId])

  useEffect(() => {
    cargar()
  }, [cargar])

  function handleBuscar(e) {
    e.preventDefault()
    setPage(1)
    setBusqueda(busquedaInput)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CreditCard size={20} className="text-blue-600" />
          Planes de Pago
        </h1>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-400 rounded-xl p-4 mb-4">
        <form onSubmit={handleBuscar} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Buscar por N° de Plan</label>
            <input
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
              placeholder="Ej: PL-00001"
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="min-w-[180px]">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Estado</label>
            <select
              value={estadoId}
              onChange={(e) => { setPage(1); setEstadoId(e.target.value) }}
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {estados.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
              <th className="px-4 py-3">Venta</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Cuotas</th>
              <th className="px-4 py-3">Valor Cuota</th>
              <th className="px-4 py-3">Tasa</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">Cargando...</td></tr>
            )}
            {!cargando && planes.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">No hay planes de pago registrados.</td></tr>
            )}
            {!cargando &&
              planes.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.ventas?.numero_venta || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{nombreCliente(p.clientes)}</td>
                  <td className="px-4 py-3 text-slate-700">{p.cantidad_cuotas}</td>
                  <td className="px-4 py-3 text-slate-700">${Number(p.valor_cuota || 0).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-slate-700">{p.tasa_interes ? `${p.tasa_interes}%` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLORES[p.estados_plan_pago?.nombre] || 'bg-slate-100 text-slate-600'}`}>
                      {p.estados_plan_pago?.nombre || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => navigate(`/finanzas/planes-pago/${p.id}`)} className="text-slate-600 hover:text-blue-600" title="Ver detalle y cuotas">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>

        <div className="px-4">
          <Paginacion page={page} totalPages={paginacion.totalPages} total={paginacion.total} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}
