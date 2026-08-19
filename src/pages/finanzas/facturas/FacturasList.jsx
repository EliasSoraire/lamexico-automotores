import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FileText, Plus, Search, Eye } from 'lucide-react'
import { api } from '../../../lib/api'
import Paginacion from '../../../components/ui/Paginacion'

function nombreCliente(c) {
  if (!c) return '—'
  return c.tipo_persona === 'Jurídica' ? c.razon_social : `${c.nombre || ''} ${c.apellido || ''}`.trim()
}

export default function FacturasList() {
  const navigate = useNavigate()
  const location = useLocation()

  const [facturas, setFacturas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [busquedaInput, setBusquedaInput] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0 })

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), busqueda })
      const res = await api.get(`/api/facturas?${params.toString()}`)
      setFacturas(res.data)
      setPaginacion({ total: res.total, totalPages: res.totalPages })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [page, pageSize, busqueda])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    if (location.state?.creada) {
      setOk('Factura creada correctamente.')
      window.history.replaceState({}, '')
      setTimeout(() => setOk(''), 3000)
    }
  }, [location.state])

  function handleBuscar(e) {
    e.preventDefault()
    setPage(1)
    setBusqueda(busquedaInput)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          Facturas
        </h1>
        <button
          type="button"
          onClick={() => navigate('/finanzas/facturas/nuevo')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          <Plus size={16} />
          Nueva Factura
        </button>
      </div>

      {ok && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{ok}</div>}
      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="bg-white border border-slate-400 rounded-xl p-4 mb-4">
        <form onSubmit={handleBuscar} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Buscar por N° de Comprobante</label>
            <input
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
              placeholder="Ej: 00000001"
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2">
            <Search size={15} />
            Buscar
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">Cargando...</td></tr>
            )}
            {!cargando && facturas.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">No hay facturas registradas.</td></tr>
            )}
            {!cargando &&
              facturas.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{f.numero_comprobante}</td>
                  <td className="px-4 py-3 text-slate-700">{nombreCliente(f.clientes)}</td>
                  <td className="px-4 py-3 text-slate-700">{f.tipos_comprobante?.nombre || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">${Number(f.total || 0).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${f.estados_factura?.nombre === 'Anulada' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {f.estados_factura?.nombre || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{f.fecha_emision}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => navigate(`/finanzas/facturas/${f.id}`)} className="text-slate-600 hover:text-blue-600" title="Ver detalle">
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
