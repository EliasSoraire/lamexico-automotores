import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, Users, Truck, User, TrendingUp, Search, X, Eye, Inbox, Plus } from 'lucide-react'
import { api } from '../../../lib/api'
import Paginacion from '../../../components/ui/Paginacion'
import BuscadorCliente from '../../../components/consultas/BuscadorCliente'

const ESTADO_COLORES = {
  'Saldo a Favor': 'bg-green-50 text-green-700',
  'Saldo Deudor': 'bg-red-50 text-red-700',
  'Saldo Cero': 'bg-slate-100 text-slate-600',
}

function nombreCliente(c) {
  if (!c) return '—'
  return c.tipo_persona === 'Jurídica' ? c.razon_social : `${c.nombre || ''} ${c.apellido || ''}`.trim()
}

export default function CuentasCorrientesList() {
  const navigate = useNavigate()

  const [cuentas, setCuentas] = useState([])
  const [contadores, setContadores] = useState({ clientes: 0, proveedores: 0, socios: 0, total_activas: 0 })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [tiposCuenta, setTiposCuenta] = useState([])
  const [monedas, setMonedas] = useState([])
  const [estadosSaldo, setEstadosSaldo] = useState([])

  const [filtros, setFiltros] = useState({ tipo_cuenta_id: '', moneda_id: '', estado_saldo_id: '', busqueda: '' })
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0 })

  const [mostrarModal, setMostrarModal] = useState(false)

  useEffect(() => {
    api.get('/api/catalogos-finanzas?tipo=tipos-cuenta-corriente').then((r) => setTiposCuenta(r.data)).catch(() => {})
    api.get('/api/catalogos-finanzas?tipo=estados-saldo-cuenta').then((r) => setEstadosSaldo(r.data)).catch(() => {})
    api.get('/api/monedas').then((r) => setMonedas(r.data)).catch(() => {})
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (filtrosAplicados.tipo_cuenta_id) params.set('tipo_cuenta_id', filtrosAplicados.tipo_cuenta_id)
      if (filtrosAplicados.moneda_id) params.set('moneda_id', filtrosAplicados.moneda_id)
      if (filtrosAplicados.estado_saldo_id) params.set('estado_saldo_id', filtrosAplicados.estado_saldo_id)
      if (filtrosAplicados.busqueda) params.set('busqueda', filtrosAplicados.busqueda)

      const res = await api.get(`/api/cuentas-corrientes?${params.toString()}`)
      setCuentas(res.data)
      setContadores(res.contadores)
      setPaginacion({ total: res.total, totalPages: res.totalPages })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [page, pageSize, filtrosAplicados])

  useEffect(() => {
    cargar()
  }, [cargar])

  function buscar(e) {
    e.preventDefault()
    setPage(1)
    setFiltrosAplicados(filtros)
  }

  function limpiar() {
    const vacio = { tipo_cuenta_id: '', moneda_id: '', estado_saldo_id: '', busqueda: '' }
    setFiltros(vacio)
    setFiltrosAplicados(vacio)
    setPage(1)
  }

  function filtrarPorTipo(nombreTipo) {
    const tipo = tiposCuenta.find((t) => t.nombre === nombreTipo)
    if (!tipo) return
    const nuevo = { ...filtros, tipo_cuenta_id: String(tipo.id) }
    setFiltros(nuevo)
    setFiltrosAplicados(nuevo)
    setPage(1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet size={20} className="text-blue-600" />
          Cuentas Corrientes
        </h1>
        <button
          type="button"
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          <Plus size={16} />
          Nueva Cuenta Corriente
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-5">Gestión de cuentas corrientes de clientes, proveedores y socios</p>

      {ok && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{ok}</div>
      )}
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <button type="button" onClick={() => filtrarPorTipo('Cliente')} className="text-left bg-white border border-slate-400 rounded-xl p-4 hover:border-blue-400">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 rounded-lg p-2"><Users size={18} /></div>
            <div>
              <div className="text-xs text-slate-500">Clientes</div>
              <div className="text-lg font-bold text-slate-800">{contadores.clientes}</div>
            </div>
          </div>
        </button>
        <div className="bg-white border border-slate-300 rounded-xl p-4 opacity-60" title="Todavía no hay pantalla de Proveedores">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 text-green-600 rounded-lg p-2"><Truck size={18} /></div>
            <div>
              <div className="text-xs text-slate-500">Proveedores</div>
              <div className="text-lg font-bold text-slate-800">{contadores.proveedores}</div>
              <div className="text-[10px] text-slate-400">Próximamente</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-300 rounded-xl p-4 opacity-60" title="Todavía no hay pantalla de Socios">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 text-purple-600 rounded-lg p-2"><User size={18} /></div>
            <div>
              <div className="text-xs text-slate-500">Socios</div>
              <div className="text-lg font-bold text-slate-800">{contadores.socios}</div>
              <div className="text-[10px] text-slate-400">Próximamente</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-400 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 text-amber-600 rounded-lg p-2"><TrendingUp size={18} /></div>
            <div>
              <div className="text-xs text-slate-500">Total Activas</div>
              <div className="text-lg font-bold text-slate-800">{contadores.total_activas}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-4 mb-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Filtros</h2>
        <form onSubmit={buscar}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo de Cuenta</label>
              <select
                value={filtros.tipo_cuenta_id}
                onChange={(e) => setFiltros({ ...filtros, tipo_cuenta_id: e.target.value })}
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {tiposCuenta.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.nombre !== 'Cliente'}>
                    {t.nombre}{t.nombre !== 'Cliente' ? ' (Próximamente)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Moneda</label>
              <select
                value={filtros.moneda_id}
                onChange={(e) => setFiltros({ ...filtros, moneda_id: e.target.value })}
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {monedas.map((m) => (
                  <option key={m.id} value={m.id}>{m.codigo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Estado de Saldo</label>
              <select
                value={filtros.estado_saldo_id}
                onChange={(e) => setFiltros({ ...filtros, estado_saldo_id: e.target.value })}
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {estadosSaldo.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Buscar por Nombre</label>
            <input
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              placeholder="Buscar cliente, proveedor o socio..."
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2">
              <Search size={15} />
              Buscar
            </button>
            <button type="button" onClick={limpiar} className="flex items-center gap-1.5 border border-slate-400 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-lg px-4 py-2">
              <X size={15} />
              Limpiar
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        {!cargando && cuentas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox size={32} className="text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No se encontraron cuentas corrientes</p>
            <p className="text-sm text-slate-400">No hay cuentas corrientes que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
                    <th className="px-4 py-3">N° Cuenta</th>
                    <th className="px-4 py-3">Entidad</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Moneda</th>
                    <th className="px-4 py-3">Saldo Actual</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cargando && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">Cargando...</td></tr>
                  )}
                  {!cargando && cuentas.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{c.numero_cuenta}</td>
                      <td className="px-4 py-3 text-slate-700">{nombreCliente(c.clientes)}</td>
                      <td className="px-4 py-3 text-slate-700">{c.tipos_cuenta_corriente?.nombre || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{c.monedas?.codigo || '—'}</td>
                      <td className={`px-4 py-3 font-medium ${Number(c.saldo_actual) < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        {c.monedas?.simbolo || '$'}{Number(c.saldo_actual || 0).toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLORES[c.estados_saldo_cuenta?.nombre] || 'bg-slate-100 text-slate-600'}`}>
                          {c.estados_saldo_cuenta?.nombre || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => navigate(`/finanzas/cuentas-corrientes/${c.id}`)} className="text-slate-600 hover:text-blue-600" title="Ver detalle y movimientos">
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
          </>
        )}
      </div>

      {mostrarModal && (
        <ModalNuevaCuenta
          monedas={monedas}
          onCerrar={() => setMostrarModal(false)}
          onCreada={() => {
            setMostrarModal(false)
            setOk('Cuenta corriente creada correctamente.')
            setTimeout(() => setOk(''), 3000)
            cargar()
          }}
        />
      )}
    </div>
  )
}

function ModalNuevaCuenta({ monedas, onCerrar, onCreada }) {
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [monedaId, setMonedaId] = useState('')
  const [limiteCredito, setLimiteCredito] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const ars = monedas.find((m) => m.codigo === 'ARS')
    if (ars) setMonedaId(ars.id)
  }, [monedas])

  async function handleCrear(e) {
    e.preventDefault()
    setError('')
    if (!clienteSeleccionado) { setError('Seleccioná el cliente'); return }
    if (!monedaId) { setError('Seleccioná la moneda'); return }

    setGuardando(true)
    try {
      await api.post('/api/cuentas-corrientes', {
        cliente_id: clienteSeleccionado.id,
        moneda_id: monedaId,
        limite_credito: limiteCredito || null,
      })
      onCreada()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Plus size={16} className="text-blue-600" />
            Nueva Cuenta Corriente
          </h3>
          <button type="button" onClick={onCerrar} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <form onSubmit={handleCrear} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Tipo de entidad *</label>
            <select disabled value="Cliente" className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 bg-slate-50 text-slate-600">
              <option>Cliente</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">Proveedor y Socio van a habilitarse cuando tengan su propia pantalla.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Entidad *</label>
            <BuscadorCliente clienteSeleccionado={clienteSeleccionado} onSeleccionar={setClienteSeleccionado} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Moneda *</label>
            <select value={monedaId} onChange={(e) => setMonedaId(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
              <option value="">Seleccionar</option>
              {monedas.map((m) => <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Límite de crédito (opcional)</label>
            <input
              type="number"
              value={limiteCredito}
              onChange={(e) => setLimiteCredito(e.target.value)}
              placeholder="Sin límite"
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCerrar} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2">
              {guardando ? 'Creando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
