import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Filter, X, Pencil, Trash2, Palette } from 'lucide-react'
import { api } from '../../../lib/api'
import Paginacion from '../../../components/ui/Paginacion'
import ConfirmarEliminacion from '../../../components/ui/ConfirmarEliminacion'

export default function ColoresList() {
  const navigate = useNavigate()

  const [colores, setColores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [busquedaInput, setBusquedaInput] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0 })

  const [colorAEliminar, setColorAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargarColores = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        busqueda,
      })
      const res = await api.get(`/api/colores?${params.toString()}`)
      setColores(res.data)
      setPaginacion({ total: res.total, totalPages: res.totalPages })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [page, pageSize, busqueda])

  useEffect(() => {
    cargarColores()
  }, [cargarColores])

  function handleFiltrar(e) {
    e.preventDefault()
    setPage(1)
    setBusqueda(busquedaInput)
  }

  function handleLimpiar() {
    setBusquedaInput('')
    setBusqueda('')
    setPage(1)
  }

  async function confirmarEliminar() {
    if (!colorAEliminar) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await api.delete(`/api/colores/detalle?id=${colorAEliminar.id}`)
      setColorAEliminar(null)
      cargarColores()
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
          <Palette size={20} className="text-blue-600" />
          Colores de Vehículos
        </h1>
        <button type="button"
          onClick={() => navigate('/inventario/colores/nuevo')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          <Plus size={16} />
          Nuevo Color
        </button>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Filtros</h3>
        <form onSubmit={handleFiltrar} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="text-xs font-medium text-slate-700 mb-1 block">Búsqueda</label>
            <input
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
              placeholder="Nombre"
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            <Filter size={14} />
            Filtrar
          </button>
          <button
            type="button"
            onClick={handleLimpiar}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg px-4 py-2"
          >
            <X size={14} />
            Limpiar
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-700 uppercase">
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Código Hex</th>
              <th className="px-4 py-3">Código de Fábrica</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-600">
                  Cargando...
                </td>
              </tr>
            )}
            {!cargando && colores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-600">
                  No se encontraron colores.
                </td>
              </tr>
            )}
            {!cargando &&
              colores.map((color) => (
                <tr key={color.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div
                      className="w-7 h-7 rounded border border-slate-400"
                      style={{ backgroundColor: color.codigo_hex }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{color.nombre}</td>
                  <td className="px-4 py-3 text-slate-700 font-mono text-xs">{color.codigo_hex}</td>
                  <td className="px-4 py-3 text-slate-700">{color.codigo_fabrica || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <button type="button"
                        onClick={() => navigate(`/inventario/colores/${color.id}/editar`)}
                        className="hover:text-amber-600"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button type="button"
                        onClick={() => setColorAEliminar(color)}
                        className="hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="px-4">
          <Paginacion
            page={page}
            totalPages={paginacion.totalPages}
            total={paginacion.total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>

      <ConfirmarEliminacion
        abierto={!!colorAEliminar}
        nombre={colorAEliminar?.nombre}
        cargando={eliminando}
        error={errorEliminar}
        onCancelar={() => {
          setColorAEliminar(null)
          setErrorEliminar('')
        }}
        onConfirmar={confirmarEliminar}
      />
    </div>
  )
}
