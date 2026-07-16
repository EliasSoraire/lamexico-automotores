import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Search, Pencil, Trash2, PackagePlus } from 'lucide-react'
import { api } from '../../../lib/api'
import Paginacion from '../../../components/ui/Paginacion'
import ConfirmarEliminacion from '../../../components/ui/ConfirmarEliminacion'

export default function ItemsAdicionalesList() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [filtros, setFiltros] = useState({ busqueda: '', categoria_id: '', estado: '' })
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0 })

  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  useEffect(() => {
    api.get('/api/categorias-items').then((r) => setCategorias(r.data)).catch(() => {})
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      Object.entries(filtrosAplicados).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await api.get(`/api/items-adicionales?${params.toString()}`)
      setItems(res.data)
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
    const vacio = { busqueda: '', categoria_id: '', estado: '' }
    setFiltros(vacio)
    setFiltrosAplicados(vacio)
    setPage(1)
  }

  async function confirmarEliminar() {
    if (!aEliminar) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await api.delete(`/api/items-adicionales/detalle?id=${aEliminar.id}`)
      setAEliminar(null)
      cargar()
    } catch (err) {
      setErrorEliminar(err.message)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <PackagePlus size={20} className="text-blue-600" />
          Ítems Adicionales
        </h1>
        <button type="button" onClick={() => navigate('/ventas/items-adicionales/nuevo')} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2">
          <Plus size={16} />
          Nuevo Ítem
        </button>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Buscar</label>
            <input value={filtros.busqueda} onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              placeholder="Nombre, código o descripción" className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Categoría</label>
            <select value={filtros.categoria_id} onChange={(e) => setFiltros({ ...filtros, categoria_id: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
              <option value="">Todas las categorías</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Estado</label>
            <select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={limpiarFiltros} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-700 px-3 py-1.5">
            <X size={14} /> Limpiar
          </button>
          <button type="button" onClick={aplicarFiltros} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2">
            <Search size={14} /> Filtrar
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-600">Cargando...</td></tr>}
            {!cargando && items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-600">No hay ítems adicionales registrados</td></tr>}
            {!cargando && items.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{it.codigo}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{it.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{it.categorias_items?.nombre || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{it.precio ? `${it.monedas?.simbolo || '$'}${Number(it.precio).toLocaleString('es-AR')}` : '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${it.activo ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {it.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <button type="button" onClick={() => navigate(`/ventas/items-adicionales/${it.id}/editar`)} className="hover:text-amber-600" title="Editar"><Pencil size={16} /></button>
                    <button type="button" onClick={() => setAEliminar(it)} className="hover:text-red-600" title="Eliminar"><Trash2 size={16} /></button>
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
        nombre={aEliminar?.nombre}
        cargando={eliminando}
        error={errorEliminar}
        onCancelar={() => { setAEliminar(null); setErrorEliminar('') }}
        onConfirmar={confirmarEliminar}
      />
    </div>
  )
}
