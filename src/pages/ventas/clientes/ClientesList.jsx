import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Eye, Pencil, Trash2, Users, UserCheck, ShoppingCart, AlertTriangle } from 'lucide-react'
import { api } from '../../../lib/api'
import Paginacion from '../../../components/ui/Paginacion'
import ConfirmarEliminacion from '../../../components/ui/ConfirmarEliminacion'

export default function ClientesList() {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState([])
  const [contadores, setContadores] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [estadosCliente, setEstadosCliente] = useState([])
  const [segmentos, setSegmentos] = useState([])

  const [filtros, setFiltros] = useState({ busqueda: '', tipo_persona: '', estado_id: '', segmento_id: '', provincia: '' })
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0 })

  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  useEffect(() => {
    api.get('/api/catalogos-cliente?tipo=estados-cliente').then((r) => setEstadosCliente(r.data)).catch(() => {})
    api.get('/api/catalogos-cliente?tipo=segmentos').then((r) => setSegmentos(r.data)).catch(() => {})
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      Object.entries(filtrosAplicados).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await api.get(`/api/clientes?${params.toString()}`)
      setClientes(res.data)
      setPaginacion({ total: res.total, totalPages: res.totalPages })
      setContadores(res.contadores)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [page, pageSize, filtrosAplicados])

  useEffect(() => {
    cargar()
  }, [cargar])

  function aplicarFiltros() {
    setPage(1)
    setFiltrosAplicados(filtros)
  }

  function limpiarFiltros() {
    const vacio = { busqueda: '', tipo_persona: '', estado_id: '', segmento_id: '', provincia: '' }
    setFiltros(vacio)
    setFiltrosAplicados(vacio)
    setPage(1)
  }

  async function confirmarEliminar() {
    if (!aEliminar) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await api.delete(`/api/clientes/detalle?id=${aEliminar.id}`)
      setAEliminar(null)
      cargar()
    } catch (err) {
      setErrorEliminar(err.message)
    } finally {
      setEliminando(false)
    }
  }

  function nombreCliente(c) {
    return c.tipo_persona === 'Jurídica' ? c.razon_social : `${c.nombre || ''} ${c.apellido || ''}`.trim()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users size={20} className="text-blue-600" />
          Gestión de Clientes
        </h1>
        <button type="button" onClick={() => navigate('/ventas/clientes/nuevo')} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2">
          <Plus size={16} />
          Nuevo Cliente
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <TarjetaContador icono={<Users size={18} className="text-blue-600" />} bg="bg-blue-50" label="Total Clientes" valor={contadores.total} />
        <TarjetaContador icono={<UserCheck size={18} className="text-green-600" />} bg="bg-green-50" label="Activos" valor={contadores.activos} />
        <TarjetaContador icono={<ShoppingCart size={18} className="text-purple-600" />} bg="bg-purple-50" label="Con Ventas" valor={contadores.con_ventas} />
        <TarjetaContador icono={<AlertTriangle size={18} className="text-amber-600" />} bg="bg-amber-50" label="Con Deuda" valor={contadores.con_deuda} />
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Filtros de Búsqueda</h3>
        <div className="mb-3">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Búsqueda General</label>
          <input
            value={filtros.busqueda}
            onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
            placeholder="Buscar por nombre, documento, email, teléfono..."
            className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo de Persona</label>
            <select value={filtros.tipo_persona} onChange={(e) => setFiltros({ ...filtros, tipo_persona: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
              <option value="">Todos los tipos</option>
              <option value="Física">Física</option>
              <option value="Jurídica">Jurídica</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Estado</label>
            <select value={filtros.estado_id} onChange={(e) => setFiltros({ ...filtros, estado_id: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
              <option value="">Todos los estados</option>
              {estadosCliente.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Segmento</label>
            <select value={filtros.segmento_id} onChange={(e) => setFiltros({ ...filtros, segmento_id: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
              <option value="">Todos los segmentos</option>
              {segmentos.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Provincia</label>
            <input value={filtros.provincia} onChange={(e) => setFiltros({ ...filtros, provincia: e.target.value })} placeholder="Provincia" className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={limpiarFiltros} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-700 px-3 py-1.5">
            <X size={14} />
            Limpiar Filtros
          </button>
          <button type="button" onClick={aplicarFiltros} className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg px-4 py-1.5">
            Aplicar filtros
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">Cargando...</td></tr>}
            {!cargando && clientes.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">No se encontraron clientes.</td></tr>}
            {!cargando && clientes.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">#{c.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{nombreCliente(c)}</div>
                  <div className="text-xs text-slate-600">{c.email || '-'}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{c.tipo_persona}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.numero_documento || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{c.telefono || c.telefono_movil || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.estados_cliente?.nombre === 'Activo' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {c.estados_cliente?.nombre || '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <button type="button" onClick={() => navigate(`/ventas/clientes/${c.id}`)} className="hover:text-blue-600" title="Ver"><Eye size={16} /></button>
                    <button type="button" onClick={() => navigate(`/ventas/clientes/${c.id}/editar`)} className="hover:text-amber-600" title="Editar"><Pencil size={16} /></button>
                    <button type="button" onClick={() => setAEliminar(c)} className="hover:text-red-600" title="Eliminar"><Trash2 size={16} /></button>
                  </div>
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

      <ConfirmarEliminacion
        abierto={!!aEliminar}
        nombre={aEliminar ? nombreCliente(aEliminar) : ''}
        cargando={eliminando}
        error={errorEliminar}
        onCancelar={() => { setAEliminar(null); setErrorEliminar('') }}
        onConfirmar={confirmarEliminar}
      />
    </div>
  )
}

function TarjetaContador({ icono, bg, label, valor }) {
  return (
    <div className="bg-white border border-slate-400 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icono}</div>
      <div>
        <p className="text-xs text-slate-600">{label}</p>
        <p className="text-lg font-bold text-slate-800">{valor ?? 0}</p>
      </div>
    </div>
  )
}
