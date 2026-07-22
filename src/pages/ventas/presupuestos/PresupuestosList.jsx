import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Eye, Pencil, Trash2, FileText } from 'lucide-react'
import { api } from '../../../lib/api'
import Paginacion from '../../../components/ui/Paginacion'
import ConfirmarEliminacion from '../../../components/ui/ConfirmarEliminacion'

export default function PresupuestosList() {
  const navigate = useNavigate()

  const [presupuestos, setPresupuestos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [estados, setEstados] = useState([])
  const [vendedores, setVendedores] = useState([])

  const [filtros, setFiltros] = useState({ busqueda: '', estado_id: '', vendedor_id: '' })
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0 })

  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  useEffect(() => {
    api.get('/api/catalogos-presupuesto?tipo=estados-presupuesto').then((r) => setEstados(r.data)).catch(() => {})
    api.get('/api/usuarios').then((r) => setVendedores(r.data)).catch(() => {})
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      Object.entries(filtrosAplicados).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await api.get(`/api/presupuestos?${params.toString()}`)
      setPresupuestos(res.data)
      setPaginacion({ total: res.total, totalPages: res.totalPages })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [page, pageSize, filtrosAplicados])

  useEffect(() => { cargar() }, [cargar])

  function aplicarFiltros() {
    setPage(1)
    setFiltrosAplicados(filtros)
  }

  function limpiarFiltros() {
    const vacio = { busqueda: '', estado_id: '', vendedor_id: '' }
    setFiltros(vacio)
    setFiltrosAplicados(vacio)
    setPage(1)
  }

  async function confirmarEliminar() {
    if (!aEliminar) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await api.delete(`/api/presupuestos/detalle?id=${aEliminar.id}`)
      setAEliminar(null)
      cargar()
    } catch (err) {
      setErrorEliminar(err.message)
    } finally {
      setEliminando(false)
    }
  }

  function nombreCliente(p) {
    if (p.clientes) return p.clientes.tipo_persona === 'Jurídica' ? p.clientes.razon_social : `${p.clientes.nombre || ''} ${p.clientes.apellido || ''}`.trim()
    return `${p.prospecto_nombre || ''} ${p.prospecto_apellido || ''}`.trim() || '-'
  }

  function formatearMonto(valor) {
    return `$${Number(valor || 0).toLocaleString('es-AR')}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          Presupuestos
        </h1>
        <button type="button" onClick={() => navigate('/ventas/presupuestos/nuevo')} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2">
          <Plus size={16} />
          Nuevo Presupuesto
        </button>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Buscar</label>
            <input value={filtros.busqueda} onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              placeholder="Cliente, patente o presupuesto..." className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Estado</label>
            <select value={filtros.estado_id} onChange={(e) => setFiltros({ ...filtros, estado_id: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
              <option value="">Todos</option>
              {estados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Vendedor</label>
            <select value={filtros.vendedor_id} onChange={(e) => setFiltros({ ...filtros, vendedor_id: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
              <option value="">Todos</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre_completo}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={limpiarFiltros} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-700 px-3 py-1.5">
            <X size={14} /> Limpiar
          </button>
          <button type="button" onClick={aplicarFiltros} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2">
            Buscar
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Saldo a Pagar</th>
              <th className="px-4 py-3">Saldo a Cubrir</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-600">Cargando...</td></tr>}
            {!cargando && presupuestos.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-600">No hay presupuestos para mostrar.</td></tr>}
            {!cargando && presupuestos.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{p.numero}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(p.fecha).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3 text-slate-600">{nombreCliente(p)}</td>
                <td className="px-4 py-3 text-slate-700 font-medium">{formatearMonto(p.saldo_a_pagar)}</td>
                <td className={`px-4 py-3 font-medium ${Number(p.falta_cubrir) > 0 ? 'text-amber-600' : 'text-green-600'}`}>{formatearMonto(p.falta_cubrir)}</td>
                <td className="px-4 py-3 text-slate-600">{p.usuarios?.nombre_completo || '-'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{p.estados_presupuesto?.nombre || '-'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <button type="button" onClick={() => navigate(`/ventas/presupuestos/${p.id}`)} className="hover:text-blue-600" title="Ver"><Eye size={16} /></button>
                    <button type="button" onClick={() => navigate(`/ventas/presupuestos/${p.id}/editar`)} className="hover:text-amber-600" title="Editar"><Pencil size={16} /></button>
                    <button type="button" onClick={() => setAEliminar(p)} className="hover:text-red-600" title="Eliminar"><Trash2 size={16} /></button>
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
        nombre={aEliminar?.numero}
        cargando={eliminando}
        error={errorEliminar}
        onCancelar={() => { setAEliminar(null); setErrorEliminar('') }}
        onConfirmar={confirmarEliminar}
      />
    </div>
  )
}
