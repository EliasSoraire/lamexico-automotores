import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Trash2, Tag } from 'lucide-react'
import { api } from '../../../lib/api'
import Paginacion from '../../../components/ui/Paginacion'
import ConfirmarEliminacion from '../../../components/ui/ConfirmarEliminacion'

export default function MarcasList() {
  const navigate = useNavigate()

  const [marcas, setMarcas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [busquedaInput, setBusquedaInput] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('activas')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)

  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0 })
  const [marcaAEliminar, setMarcaAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargarMarcas = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        estado,
        busqueda,
      })
      const res = await api.get(`/api/marcas?${params.toString()}`)
      setMarcas(res.data)
      setPaginacion({ total: res.total, totalPages: res.totalPages })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [page, pageSize, estado, busqueda])

  useEffect(() => {
    cargarMarcas()
  }, [cargarMarcas])

  function handleBuscar(e) {
    e.preventDefault()
    setPage(1)
    setBusqueda(busquedaInput)
  }

  async function confirmarEliminar() {
    if (!marcaAEliminar) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await api.delete(`/api/marcas/${marcaAEliminar.id}`)
      setMarcaAEliminar(null)
      cargarMarcas()
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
          <Tag size={20} className="text-blue-600" />
          Marcas y Modelos
        </h1>
        <button
          onClick={() => navigate('/inventario/marcas-modelos/nueva')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          <Plus size={16} />
          Nueva Marca
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <form onSubmit={handleBuscar} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Buscar Marca</label>
            <div className="relative">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={busquedaInput}
                onChange={(e) => setBusquedaInput(e.target.value)}
                placeholder="Buscar por nombre o código de marca..."
                className="w-full text-sm border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Estado</label>
            <select
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value)
                setPage(1)
              }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="activas">Solo activas</option>
              <option value="inactivas">Solo inactivas</option>
              <option value="todas">Todas</option>
            </select>
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            <Search size={15} />
            Buscar
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Modelos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}

            {!cargando && marcas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No se encontraron marcas.
                </td>
              </tr>
            )}

            {!cargando &&
              marcas.map((marca) => (
                <tr key={marca.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{marca.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{marca.codigo || '-'}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/inventario/marcas-modelos/${marca.id}`}
                      className="text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    >
                      {marca.cantidad_modelos} modelos
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        marca.activa
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {marca.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Link
                        to={`/inventario/marcas-modelos/${marca.id}`}
                        className="hover:text-blue-600"
                        title="Ver"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to={`/inventario/marcas-modelos/${marca.id}/editar`}
                        className="hover:text-amber-600"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => setMarcaAEliminar(marca)}
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
        abierto={!!marcaAEliminar}
        nombre={marcaAEliminar?.nombre}
        cargando={eliminando}
        error={errorEliminar}
        onCancelar={() => {
          setMarcaAEliminar(null)
          setErrorEliminar('')
        }}
        onConfirmar={confirmarEliminar}
      />
    </div>
  )
}
