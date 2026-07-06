import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Eye, Pencil, Trash2, RefreshCw, Car, CheckCircle2, Wrench, Truck, Bookmark } from 'lucide-react'
import { api } from '../../../lib/api'
import Paginacion from '../../../components/ui/Paginacion'
import ConfirmarEliminacion from '../../../components/ui/ConfirmarEliminacion'
import CambiarEstadoModal from '../../../components/vehiculos/CambiarEstadoModal'

const ESTADOS = ['Disponible', 'En Tránsito', 'Reservado', 'En Preparación', 'De Baja']

export default function VehiculosList() {
  const navigate = useNavigate()

  const [vehiculos, setVehiculos] = useState([])
  const [contadores, setContadores] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [filtros, setFiltros] = useState({ busqueda: '', estado: '', condicion_id: '', gnc: '', titular_stock_id: '', clasificacion_id: '' })
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros)
  const [condiciones, setCondiciones] = useState([])
  const [titulares, setTitulares] = useState([])
  const [clasificaciones, setClasificaciones] = useState([])

  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0 })

  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')
  const [aCambiarEstado, setACambiarEstado] = useState(null)

  useEffect(() => {
    api.get('/api/catalogos-vehiculo?tipo=condiciones').then((r) => setCondiciones(r.data)).catch(() => {})
    api.get('/api/titulares-stock?pageSize=200').then((r) => setTitulares(r.data)).catch(() => {})
    api.get('/api/clasificaciones?pageSize=200').then((r) => setClasificaciones(r.data)).catch(() => {})
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      Object.entries(filtrosAplicados).forEach(([k, v]) => {
        if (v) params.set(k, v)
      })
      const res = await api.get(`/api/vehiculos?${params.toString()}`)
      setVehiculos(res.data)
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
    const vacio = { busqueda: '', estado: '', condicion_id: '', gnc: '', titular_stock_id: '', clasificacion_id: '' }
    setFiltros(vacio)
    setFiltrosAplicados(vacio)
    setPage(1)
  }

  async function confirmarEliminar() {
    if (!aEliminar) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await api.delete(`/api/vehiculos/detalle?id=${aEliminar.id}`)
      setAEliminar(null)
      cargar()
    } catch (err) {
      setErrorEliminar(err.message)
    } finally {
      setEliminando(false)
    }
  }

  async function cambiarEstado(vehiculo, nuevoEstado) {
    await api.put('/api/vehiculos/estado', { id: vehiculo.id, estado: nuevoEstado })
    setACambiarEstado(null)
    cargar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Car size={20} className="text-blue-600" />
          Gestión de Vehículos
        </h1>
        <button type="button"
          onClick={() => navigate('/inventario/vehiculos/nuevo')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          <Plus size={16} />
          Nuevo Vehículo
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-400 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Búsqueda</label>
            <input
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              placeholder="Patente, motor, chasis..."
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Condición</label>
            <select
              value={filtros.condicion_id}
              onChange={(e) => setFiltros({ ...filtros, condicion_id: e.target.value })}
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las condiciones</option>
              {condiciones.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Titular de Stock</label>
            <select
              value={filtros.titular_stock_id}
              onChange={(e) => setFiltros({ ...filtros, titular_stock_id: e.target.value })}
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los titulares</option>
              {titulares.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Equipo GNC</label>
            <select
              value={filtros.gnc}
              onChange={(e) => setFiltros({ ...filtros, gnc: e.target.value })}
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Con GNC</option>
              <option value="false">Sin GNC</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Clasificación</label>
            <select
              value={filtros.clasificacion_id}
              onChange={(e) => setFiltros({ ...filtros, clasificacion_id: e.target.value })}
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las clasificaciones</option>
              {clasificaciones.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button"
            onClick={limpiarFiltros}
            className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-700 px-3 py-1.5"
          >
            <X size={14} />
            Limpiar
          </button>
          <button type="button"
            onClick={aplicarFiltros}
            className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg px-4 py-1.5"
          >
            Aplicar filtros
          </button>
        </div>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
        <TarjetaContador icono={<Car size={18} className="text-slate-600" />} bg="bg-slate-100" label="Total" valor={contadores.total} />
        <TarjetaContador icono={<CheckCircle2 size={18} className="text-green-600" />} bg="bg-green-50" label="Disponibles" valor={contadores.disponibles} />
        <TarjetaContador icono={<Wrench size={18} className="text-amber-600" />} bg="bg-amber-50" label="En Preparación" valor={contadores.en_preparacion} />
        <TarjetaContador icono={<Truck size={18} className="text-blue-600" />} bg="bg-blue-50" label="En Tránsito" valor={contadores.en_transito} />
        <TarjetaContador icono={<Bookmark size={18} className="text-purple-600" />} bg="bg-purple-50" label="Reservados" valor={contadores.reservados} />
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-700 uppercase">
              <th className="px-4 py-3">Vehículo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Condición</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-600">Cargando...</td></tr>
            )}
            {!cargando && vehiculos.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-600">No se encontraron vehículos.</td></tr>
            )}
            {!cargando &&
              vehiculos.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {v.marcas?.nombre} {v.modelos?.nombre}
                    </div>
                    <div className="text-xs text-slate-600">
                      ID: {v.id} · {v.año_modelo} · {v.colores?.nombre} · {v.kilometraje?.toLocaleString('es-AR')} km
                    </div>
                    <div className="text-xs text-slate-600">Patente: {v.patente}</div>
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={v.estado} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{v.condiciones_vehiculo?.nombre || '-'}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {v.precio_venta
                      ? `${v.monedas?.simbolo || '$'}${Number(v.precio_venta).toLocaleString('es-AR')}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <button type="button" onClick={() => navigate(`/inventario/vehiculos/${v.id}`)} className="hover:text-blue-600" title="Ver">
                        <Eye size={16} />
                      </button>
                      <button type="button" onClick={() => navigate(`/inventario/vehiculos/${v.id}/editar`)} className="hover:text-amber-600" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => setACambiarEstado(v)} className="hover:text-purple-600" title="Cambiar estado">
                        <RefreshCw size={16} />
                      </button>
                      <button type="button" onClick={() => setAEliminar(v)} className="hover:text-red-600" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
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
        nombre={aEliminar ? `${aEliminar.marcas?.nombre} ${aEliminar.modelos?.nombre} (${aEliminar.patente})` : ''}
        cargando={eliminando}
        error={errorEliminar}
        onCancelar={() => { setAEliminar(null); setErrorEliminar('') }}
        onConfirmar={confirmarEliminar}
      />

      <CambiarEstadoModal
        vehiculo={aCambiarEstado}
        estados={ESTADOS}
        onCancelar={() => setACambiarEstado(null)}
        onConfirmar={cambiarEstado}
      />
    </div>
  )
}

function TarjetaContador({ icono, bg, label, valor }) {
  return (
    <div className="bg-white border border-slate-400 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icono}</div>
      <div>
        <p className="text-xs text-slate-700">{label}</p>
        <p className="text-lg font-bold text-slate-800">{valor ?? 0}</p>
      </div>
    </div>
  )
}

const ESTADO_COLORES = {
  'Disponible': 'bg-green-50 text-green-700',
  'En Tránsito': 'bg-blue-50 text-blue-700',
  'Reservado': 'bg-amber-50 text-amber-700',
  'En Preparación': 'bg-orange-50 text-orange-700',
  'De Baja': 'bg-slate-100 text-slate-700',
}

export function EstadoBadge({ estado }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLORES[estado] || 'bg-slate-100 text-slate-700'}`}>
      {estado}
    </span>
  )
}
