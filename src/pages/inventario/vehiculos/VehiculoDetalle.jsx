import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, ArrowLeft, Plus, Trash2, Wrench, DollarSign, Image as ImageIcon } from 'lucide-react'
import { api } from '../../../lib/api'
import { EstadoBadge } from './VehiculosList'

const TIPOS_EVENTO_MANTENIMIENTO = ['Carga de Combustible', 'Cambio de Aceite', 'Service', 'Otro']
const CATEGORIAS_GASTO = ['Reacondicionamiento', 'Impuestos', 'Flete', 'Documentación', 'Otros']

export default function VehiculoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [vehiculo, setVehiculo] = useState(null)
  const [fotos, setFotos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [gastos, setGastos] = useState([])
  const [mantenimiento, setMantenimiento] = useState([])
  const [modalGasto, setModalGasto] = useState(false)
  const [monedas, setMonedas] = useState([])

  const cargarVehiculo = useCallback(async () => {
    try {
      const res = await api.get(`/api/vehiculos/detalle?id=${id}`)
      setVehiculo(res.data)
      setFotos(res.fotos)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [id])

  const cargarGastos = useCallback(async () => {
    try {
      const res = await api.get(`/api/vehiculos/gastos?vehiculo_id=${id}`)
      setGastos(res.data)
    } catch {
      // silencioso
    }
  }, [id])

  const cargarMantenimiento = useCallback(async () => {
    try {
      const res = await api.get(`/api/vehiculos/mantenimiento?vehiculo_id=${id}`)
      setMantenimiento(res.data)
    } catch {
      // silencioso
    }
  }, [id])

  useEffect(() => {
    cargarVehiculo()
    cargarGastos()
    cargarMantenimiento()
    api.get('/api/monedas').then((r) => setMonedas(r.data)).catch(() => {})
  }, [cargarVehiculo, cargarGastos, cargarMantenimiento])

  if (cargando) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>
  if (error || !vehiculo) return <div className="text-sm text-red-600 py-10 text-center">{error}</div>

  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0)
  const totalCompraGastos = Number(vehiculo.precio_compra || 0) + totalGastos

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800">
          Detalles del Vehículo ID {vehiculo.id}: {vehiculo.marcas?.nombre} {vehiculo.modelos?.nombre}
        </h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate(`/inventario/vehiculos/${id}/editar`)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-3 py-1.5">
            <Pencil size={14} /> Editar
          </button>
          <button type="button" onClick={() => navigate('/inventario/vehiculos')} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50">
            <ArrowLeft size={14} /> Volver
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Información Básica</h3>
          <dl className="space-y-2.5 text-sm">
            <Dato label="Marca" valor={vehiculo.marcas?.nombre} />
            <Dato label="Modelo" valor={vehiculo.modelos?.nombre} />
            <Dato label="Patente" valor={vehiculo.patente} />
            <Dato label="Color Exterior" valor={vehiculo.colores?.nombre} />
            <Dato label="Año del Modelo" valor={vehiculo.año_modelo} />
            <div>
              <dt className="text-blue-600 text-xs font-medium mb-1">Estado</dt>
              <dd><EstadoBadge estado={vehiculo.estado} /></dd>
            </div>
            <Dato label="Sucursal" valor={vehiculo.sucursales?.nombre} />
          </dl>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Información Comercial</h3>
          <dl className="space-y-2.5 text-sm">
            <Dato label="Precio de Venta" valor={vehiculo.precio_venta ? `${vehiculo.monedas?.simbolo || '$'}${Number(vehiculo.precio_venta).toLocaleString('es-AR')}` : 'No especificado'} destacado />
            <Dato label="Precio de contado sin permuta" valor={vehiculo.precio_contado_sin_permuta ? `${vehiculo.monedas?.simbolo || '$'}${Number(vehiculo.precio_contado_sin_permuta).toLocaleString('es-AR')}` : 'No especificado'} />
            <Dato label="Kilometraje" valor={`${vehiculo.kilometraje?.toLocaleString('es-AR') || 0} km`} />
            <Dato label="Dueño anterior" valor={vehiculo.dueno_anterior || 'No especificado'} />
            <Dato label="Fecha de Ingreso" valor={new Date(vehiculo.fecha_creacion).toLocaleString('es-AR')} />
            <Dato label="Última Actualización" valor={new Date(vehiculo.fecha_actualizacion).toLocaleString('es-AR')} />
            <Dato label="Vehículo en Consignación" valor={vehiculo.tipos_propiedad?.nombre === 'En Consignación' ? 'Sí' : 'No'} />
            <Dato label="Titular/es de Stock" valor={vehiculo.titulares_stock?.nombre || '—'} />
          </dl>
        </div>
      </div>

      {/* Control de Gastos y Rentabilidad */}
      <div className="bg-white border border-slate-400 rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            <DollarSign size={15} className="text-green-600" />
            Control de Gastos y Rentabilidad
          </h3>
          <button type="button" onClick={() => setModalGasto(true)} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg px-3 py-1.5">
            <Plus size={14} /> Agregar Gasto Manual
          </button>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-700 uppercase">
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Descripción</th>
              <th className="px-3 py-2">Categoría</th>
              <th className="px-3 py-2">Monto</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {gastos.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-600">No hay gastos registrados para este vehículo.</td></tr>
            )}
            {gastos.map((g) => (
              <tr key={g.id}>
                <td className="px-3 py-2 text-slate-600">{new Date(g.fecha).toLocaleDateString('es-AR')}</td>
                <td className="px-3 py-2 text-slate-600">{g.descripcion || '-'}</td>
                <td className="px-3 py-2 text-slate-600">{g.categoria || '-'}</td>
                <td className="px-3 py-2 text-slate-700 font-medium">{g.monedas?.simbolo || '$'}{Number(g.monto).toLocaleString('es-AR')}</td>
                <td className="px-3 py-2">
                  <button type="button"
                    onClick={async () => { await api.delete(`/api/vehiculos/gastos?id=${g.id}`); cargarGastos() }}
                    className="text-slate-600 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="border-t border-slate-100 pt-3 flex justify-end gap-8 text-sm">
          <div className="text-right">
            <p className="text-slate-700">Total de Gastos</p>
            <p className="font-semibold text-slate-800">${totalGastos.toLocaleString('es-AR')}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-700">Precio de Compra</p>
            <p className="font-semibold text-slate-800">${Number(vehiculo.precio_compra || 0).toLocaleString('es-AR')}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-600">Total Compra + Gastos</p>
            <p className="font-bold text-blue-700">${totalCompraGastos.toLocaleString('es-AR')}</p>
          </div>
        </div>
      </div>

      {/* Mantenimiento */}
      <div className="bg-white border border-slate-400 rounded-xl p-6 mb-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-4">
          <Wrench size={15} className="text-slate-700" />
          Mantenimiento del Vehículo
        </h3>

        <FormMantenimiento vehiculoId={id} onGuardado={cargarMantenimiento} />

        <div className="overflow-x-auto">
        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-700 uppercase">
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Litros</th>
              <th className="px-3 py-2">Notas</th>
              <th className="px-3 py-2">Registrado por</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mantenimiento.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-600">Sin registros de mantenimiento.</td></tr>
            )}
            {mantenimiento.map((m) => (
              <tr key={m.id}>
                <td className="px-3 py-2 text-slate-600">{new Date(m.fecha_creacion).toLocaleDateString('es-AR')}</td>
                <td className="px-3 py-2 text-slate-600">{m.tipo_evento}</td>
                <td className="px-3 py-2 text-slate-600">{m.litros || '-'}</td>
                <td className="px-3 py-2 text-slate-600">{m.notas || '-'}</td>
                <td className="px-3 py-2 text-slate-600">{m.registrado_por}</td>
                <td className="px-3 py-2">
                  <button type="button"
                    onClick={async () => { await api.delete(`/api/vehiculos/mantenimiento?id=${m.id}`); cargarMantenimiento() }}
                    className="text-slate-600 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Archivos Adjuntos */}
      <div className="bg-white border border-slate-400 rounded-xl p-6">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-4">
          <ImageIcon size={15} className="text-slate-700" />
          Archivos Adjuntos
        </h3>
        {fotos.length === 0 ? (
          <p className="text-sm text-slate-600">No hay archivos adjuntos.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {fotos.map((f) => (
              <img key={f.id} src={f.url_archivo} alt={f.nombre_archivo} className="w-full h-20 object-cover rounded-lg border border-slate-400" />
            ))}
          </div>
        )}
      </div>

      {modalGasto && (
        <ModalGasto
          vehiculoId={id}
          monedas={monedas}
          onCerrar={() => setModalGasto(false)}
          onGuardado={() => { setModalGasto(false); cargarGastos() }}
        />
      )}
    </div>
  )
}

function Dato({ label, valor, destacado }) {
  return (
    <div>
      <dt className="text-blue-600 text-xs font-medium mb-0.5">{label}</dt>
      <dd className={destacado ? 'text-green-600 font-semibold' : 'text-slate-700'}>{valor ?? '-'}</dd>
    </div>
  )
}

function FormMantenimiento({ vehiculoId, onGuardado }) {
  const [tipo, setTipo] = useState(TIPOS_EVENTO_MANTENIMIENTO[0])
  const [litros, setLitros] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function agregar() {
    setError('')
    if (tipo === 'Carga de Combustible' && !litros) {
      setError('Los litros son obligatorios para una Carga de Combustible')
      return
    }
    setGuardando(true)
    try {
      await api.post('/api/vehiculos/mantenimiento', {
        vehiculo_id: vehiculoId,
        tipo_evento: tipo,
        litros: litros === '' ? null : Number(litros),
        notas: notas || null,
      })
      setLitros('')
      setNotas('')
      onGuardado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1 block">Tipo de Evento</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
            {TIPOS_EVENTO_MANTENIMIENTO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1 block">
            Litros {tipo === 'Carga de Combustible' && <span className="text-red-500">*</span>}
          </label>
          <input type="number" value={litros} onChange={(e) => setLitros(e.target.value)} placeholder="0.00" className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1 block">Notas</label>
          <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Escriba una nota opcional..." className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
        </div>
        <div className="sm:col-span-3 flex justify-end">
          <button type="button" onClick={agregar} disabled={guardando} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2">
            {guardando ? 'Agregando...' : 'Agregar Registro'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalGasto({ vehiculoId, monedas, onCerrar, onGuardado }) {
  const [monto, setMonto] = useState('')
  const [monedaId, setMonedaId] = useState(monedas[0]?.id || '')
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function guardar() {
    if (!monto) { setError('El monto es obligatorio'); return }
    setGuardando(true)
    setError('')
    try {
      await api.post('/api/vehiculos/gastos', {
        vehiculo_id: vehiculoId,
        monto: Number(monto),
        moneda_id: monedaId || null,
        categoria: categoria || null,
        descripcion: descripcion || null,
        fecha,
      })
      onGuardado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
        <h3 className="font-semibold text-slate-800 mb-4">Agregar Gasto Manual</h3>
        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Monto</label>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Moneda</label>
            <select value={monedaId} onChange={(e) => setMonedaId(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
              {monedas.map((m) => <option key={m.id} value={m.id}>{m.simbolo} ({m.codigo})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
              <option value="">Seleccione...</option>
              {CATEGORIAS_GASTO.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Descripción</label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onCerrar} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button type="button" onClick={guardar} disabled={guardando} className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium">
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
