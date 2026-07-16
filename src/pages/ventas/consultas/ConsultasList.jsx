import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Eye, Pencil, Trash2, Phone, PhoneIncoming, Clock, CheckCircle2 } from 'lucide-react'
import { api } from '../../../lib/api'
import Paginacion from '../../../components/ui/Paginacion'
import ConfirmarEliminacion from '../../../components/ui/ConfirmarEliminacion'

export default function ConsultasList() {
  const navigate = useNavigate()

  const [consultas, setConsultas] = useState([])
  const [contadores, setContadores] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [tiposConsulta, setTiposConsulta] = useState([])
  const [canales, setCanales] = useState([])
  const [estados, setEstados] = useState([])
  const [prioridades, setPrioridades] = useState([])

  const [filtros, setFiltros] = useState({ busqueda: '', tipo_consulta_id: '', canal_origen_id: '', estado_id: '', prioridad_id: '', fecha_desde: '', fecha_hasta: '' })
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0 })

  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  useEffect(() => {
    api.get('/api/catalogos-consulta?tipo=tipos-consulta').then((r) => setTiposConsulta(r.data)).catch(() => {})
    api.get('/api/canales-origen?pageSize=200').then((r) => setCanales(r.data)).catch(() => {})
    api.get('/api/catalogos-consulta?tipo=estados-consulta').then((r) => setEstados(r.data)).catch(() => {})
    api.get('/api/catalogos-consulta?tipo=prioridades').then((r) => setPrioridades(r.data)).catch(() => {})
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      Object.entries(filtrosAplicados).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await api.get(`/api/consultas?${params.toString()}`)
      setConsultas(res.data)
      setPaginacion({ total: res.total, totalPages: res.totalPages })
      setContadores(res.contadores)
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
    const vacio = { busqueda: '', tipo_consulta_id: '', canal_origen_id: '', estado_id: '', prioridad_id: '', fecha_desde: '', fecha_hasta: '' }
    setFiltros(vacio)
    setFiltrosAplicados(vacio)
    setPage(1)
  }

  async function confirmarEliminar() {
    if (!aEliminar) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await api.delete(`/api/consultas/detalle?id=${aEliminar.id}`)
      setAEliminar(null)
      cargar()
    } catch (err) {
      setErrorEliminar(err.message)
    } finally {
      setEliminando(false)
    }
  }

  function nombreSolicitante(c) {
    if (c.clientes) return c.clientes.tipo_persona === 'Jurídica' ? c.clientes.razon_social : `${c.clientes.nombre || ''} ${c.clientes.apellido || ''}`.trim()
    return `${c.nombre_solicitante || ''} ${c.apellido_solicitante || ''}`.trim()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Phone size={20} className="text-blue-600" />
          Consultas
        </h1>
        <button type="button" onClick={() => navigate('/ventas/consultas/nueva')} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2">
          <Plus size={16} />
          Nueva Consulta
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <TarjetaContador icono={<Phone size={18} className="text-blue-600" />} bg="bg-blue-50" label="Total Consultas" valor={contadores.total} />
        <TarjetaContador icono={<PhoneIncoming size={18} className="text-green-600" />} bg="bg-green-50" label="Nuevas" valor={contadores.nuevas} />
        <TarjetaContador icono={<Clock size={18} className="text-amber-600" />} bg="bg-amber-50" label="En Proceso" valor={contadores.en_proceso} />
        <TarjetaContador icono={<CheckCircle2 size={18} className="text-slate-600" />} bg="bg-slate-100" label="Cerradas" valor={contadores.cerradas} />
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Filtros de Búsqueda</h3>
        <div className="mb-3">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Búsqueda General</label>
          <input value={filtros.busqueda} onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
            placeholder="Buscar por nombre, número de consulta, observaciones..."
            className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <Select label="Tipo de Consulta" value={filtros.tipo_consulta_id} onChange={(v) => setFiltros({ ...filtros, tipo_consulta_id: v })} opciones={tiposConsulta} placeholder="Todos los tipos" />
          <Select label="Canal" value={filtros.canal_origen_id} onChange={(v) => setFiltros({ ...filtros, canal_origen_id: v })} opciones={canales} placeholder="Todos los canales" />
          <Select label="Estado" value={filtros.estado_id} onChange={(v) => setFiltros({ ...filtros, estado_id: v })} opciones={estados} placeholder="Todos los estados" />
          <Select label="Prioridad" value={filtros.prioridad_id} onChange={(v) => setFiltros({ ...filtros, prioridad_id: v })} opciones={prioridades} placeholder="Todas las prioridades" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha Desde</label>
            <input type="date" value={filtros.fecha_desde} onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha Hasta</label>
            <input type="date" value={filtros.fecha_hasta} onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={limpiarFiltros} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-700 px-3 py-1.5">
            <X size={14} /> Limpiar Filtros
          </button>
          <button type="button" onClick={aplicarFiltros} className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg px-4 py-1.5">
            Aplicar filtros
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">Cargando...</td></tr>}
            {!cargando && consultas.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">No se encontraron consultas.</td></tr>}
            {!cargando && consultas.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">#{c.id}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{nombreSolicitante(c)}</td>
                <td className="px-4 py-3 text-slate-600">{c.tipos_consulta?.nombre || '-'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{c.estados_consulta?.nombre || '-'}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.prioridades?.nombre || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(c.fecha_ingreso).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <button type="button" onClick={() => navigate(`/ventas/consultas/${c.id}`)} className="hover:text-blue-600" title="Ver"><Eye size={16} /></button>
                    <button type="button" onClick={() => navigate(`/ventas/consultas/${c.id}/editar`)} className="hover:text-amber-600" title="Editar"><Pencil size={16} /></button>
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
        nombre={aEliminar ? nombreSolicitante(aEliminar) : ''}
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

function Select({ label, value, onChange, opciones, placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
        <option value="">{placeholder}</option>
        {opciones.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
      </select>
    </div>
  )
}
