import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Search, Eye, Trash2, Car, CheckCircle2, Warehouse, TrendingUp } from 'lucide-react'
import { api } from '../../../lib/api'
import Paginacion from '../../../components/ui/Paginacion'
import ConfirmarEliminacion from '../../../components/ui/ConfirmarEliminacion'

export default function MarcaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [marca, setMarca] = useState(null)
  const [stats, setStats] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modelos, setModelos] = useState([])
  const [cargandoModelos, setCargandoModelos] = useState(true)
  const [busquedaInput, setBusquedaInput] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [estadoModelo, setEstadoModelo] = useState('activos')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0 })

  const [modeloAEliminar, setModeloAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargarMarca = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const res = await api.get(`/api/marcas/detalle?id=${id}`)
      setMarca(res.data)
      setStats(res.estadisticas)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [id])

  const cargarModelos = useCallback(async () => {
    setCargandoModelos(true)
    try {
      const params = new URLSearchParams({
        marca_id: id,
        page: String(page),
        pageSize: String(pageSize),
        estado: estadoModelo,
        busqueda,
      })
      const res = await api.get(`/api/modelos?${params.toString()}`)
      setModelos(res.data)
      setPaginacion({ total: res.total, totalPages: res.totalPages })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargandoModelos(false)
    }
  }, [id, page, pageSize, estadoModelo, busqueda])

  useEffect(() => {
    cargarMarca()
  }, [cargarMarca])

  useEffect(() => {
    cargarModelos()
  }, [cargarModelos])

  function handleBuscar(e) {
    e.preventDefault()
    setPage(1)
    setBusqueda(busquedaInput)
  }

  async function confirmarEliminarModelo() {
    if (!modeloAEliminar) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await api.delete(`/api/modelos/detalle?id=${modeloAEliminar.id}`)
      setModeloAEliminar(null)
      cargarModelos()
      cargarMarca()
    } catch (err) {
      setErrorEliminar(err.message)
    } finally {
      setEliminando(false)
    }
  }

  if (cargando) {
    return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>
  }

  if (error && !marca) {
    return <div className="text-sm text-red-600 py-10 text-center">{error}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800">Detalles de Marca: {marca.nombre}</h1>
        <div className="flex gap-2">
          <button type="button"
            onClick={() => navigate(`/inventario/marcas-modelos/${id}/editar`)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-3 py-1.5"
          >
            <Pencil size={14} />
            Editar
          </button>
          <button type="button"
            onClick={() => navigate('/inventario/marcas-modelos')}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50"
          >
            <ArrowLeft size={14} />
            Volver
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Información Básica</h3>
          <dl className="space-y-2.5 text-sm">
            <div>
              <dt className="text-blue-600 text-xs font-medium">Nombre</dt>
              <dd className="text-slate-700">{marca.nombre}</dd>
            </div>
            <div>
              <dt className="text-blue-600 text-xs font-medium">Código</dt>
              <dd className="text-slate-700">{marca.codigo || '-'}</dd>
            </div>
            <div>
              <dt className="text-blue-600 text-xs font-medium">Estado</dt>
              <dd>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    marca.activa ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {marca.activa ? 'Activa' : 'Inactiva'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-blue-600 text-xs font-medium">Fecha de Creación</dt>
              <dd className="text-slate-700">{new Date(marca.fecha_creacion).toLocaleString('es-AR')}</dd>
            </div>
            <div>
              <dt className="text-blue-600 text-xs font-medium">Última Actualización</dt>
              <dd className="text-slate-700">{new Date(marca.fecha_actualizacion).toLocaleString('es-AR')}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Detalles Adicionales</h3>
          <dt className="text-blue-600 text-xs font-medium">Descripción</dt>
          <dd className="text-sm text-slate-700 mt-1">{marca.descripcion || 'Sin descripción'}</dd>
        </div>
      </div>

      <div className="mb-2">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Estadísticas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <TarjetaStat
            icono={<Car size={18} className="text-blue-600" />}
            bg="bg-blue-50"
            label="Total Modelos"
            valor={stats.total_modelos}
          />
          <TarjetaStat
            icono={<CheckCircle2 size={18} className="text-green-600" />}
            bg="bg-green-50"
            label="Modelos Activos"
            valor={stats.modelos_activos}
          />
          <TarjetaStat
            icono={<Warehouse size={18} className="text-amber-600" />}
            bg="bg-amber-50"
            label="Vehículos en Stock"
            valor={stats.vehiculos_en_stock}
          />
          <TarjetaStat
            icono={<TrendingUp size={18} className="text-purple-600" />}
            bg="bg-purple-50"
            label="Vehículos Vendidos"
            valor={stats.vehiculos_vendidos}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Modelos de {marca.nombre}</h3>
          <button type="button"
            onClick={() => navigate(`/inventario/marcas-modelos/modelos/nuevo?marca_id=${id}`)}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-1.5"
          >
            <Plus size={15} />
            Nuevo Modelo
          </button>
        </div>

        <form onSubmit={handleBuscar} className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-medium text-slate-700 mb-1 block">Buscar Modelo</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                value={busquedaInput}
                onChange={(e) => setBusquedaInput(e.target.value)}
                placeholder="Buscar por nombre de modelo..."
                className="w-full text-sm border border-slate-400 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Estado</label>
            <select
              value={estadoModelo}
              onChange={(e) => {
                setEstadoModelo(e.target.value)
                setPage(1)
              }}
              className="text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="activos">Solo activos</option>
              <option value="inactivos">Solo inactivos</option>
              <option value="todos">Todos</option>
            </select>
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            <Search size={14} />
            Buscar
          </button>
        </form>

        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-700 uppercase">
              <th className="px-3 py-2.5">Modelo</th>
              <th className="px-3 py-2.5">Versión</th>
              <th className="px-3 py-2.5">Precio Lista</th>
              <th className="px-3 py-2.5">Vehículos</th>
              <th className="px-3 py-2.5">Estado</th>
              <th className="px-3 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargandoModelos && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-600">
                  Cargando...
                </td>
              </tr>
            )}
            {!cargandoModelos && modelos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-600">
                  Esta marca todavía no tiene modelos cargados.
                </td>
              </tr>
            )}
            {!cargandoModelos &&
              modelos.map((modelo) => (
                <tr key={modelo.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-medium text-slate-700">{modelo.nombre}</td>
                  <td className="px-3 py-2.5 text-slate-700">{modelo.version || '-'}</td>
                  <td className="px-3 py-2.5 text-slate-700">
                    {modelo.precio_lista
                      ? `${modelo.simbolo_moneda || ''}${Number(modelo.precio_lista).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{modelo.cantidad_vehiculos}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        modelo.activo ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {modelo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Link
                        to={`/inventario/marcas-modelos/modelos/${modelo.id}/editar`}
                        className="hover:text-amber-600"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button type="button"
                        onClick={() => setModeloAEliminar(modelo)}
                        className="hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>

        <Paginacion
          page={page}
          totalPages={paginacion.totalPages}
          total={paginacion.total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      <ConfirmarEliminacion
        abierto={!!modeloAEliminar}
        nombre={modeloAEliminar?.nombre}
        cargando={eliminando}
        error={errorEliminar}
        onCancelar={() => {
          setModeloAEliminar(null)
          setErrorEliminar('')
        }}
        onConfirmar={confirmarEliminarModelo}
      />
    </div>
  )
}

function TarjetaStat({ icono, bg, label, valor }) {
  return (
    <div className="bg-white border border-slate-400 rounded-xl p-4">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>{icono}</div>
      <p className="text-xs text-slate-700">{label}</p>
      <p className="text-xl font-bold text-slate-800">{valor}</p>
    </div>
  )
}
