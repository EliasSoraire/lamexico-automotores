import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Plus } from 'lucide-react'
import { api } from '../../../lib/api'
import FotosVehiculo from '../../../components/vehiculos/FotosVehiculo'

const ESTADOS = ['Disponible', 'En Tránsito', 'Reservado', 'En Preparación', 'De Baja']
const TABS = ['Básicos', 'Técnica', 'Comercial', 'Multimedia']

const FORM_VACIO = {
  condicion_id: '',
  año_modelo: '',
  año_fab: '',
  patente: '',
  marca_id: '',
  modelo_id: '',
  color_id: '',
  estado: 'Disponible',
  kilometraje: '',
  color_interior_id: '',
  numero_motor: '',
  numero_chasis: '',
  transmision_id: '',
  combustible_id: '',
  gnc: false,
  precio_compra: '',
  fecha_compra: '',
  dueno_anterior: '',
  precio_venta: '',
  precio_contado_sin_permuta: '',
  moneda_id: '',
  garantia: false,
  tipo_propiedad_id: '',
  titular_stock_id: '',
  clasificacion_id: '',
  observaciones: '',
}

export default function VehiculoForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()

  const [tab, setTab] = useState('Básicos')
  const [form, setForm] = useState(FORM_VACIO)
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Catálogos
  const [marcas, setMarcas] = useState([])
  const [modelos, setModelos] = useState([])
  const [colores, setColores] = useState([])
  const [coloresInterior, setColoresInterior] = useState([])
  const [condiciones, setCondiciones] = useState([])
  const [transmisiones, setTransmisiones] = useState([])
  const [combustibles, setCombustibles] = useState([])
  const [monedas, setMonedas] = useState([])
  const [titulares, setTitulares] = useState([])
  const [clasificaciones, setClasificaciones] = useState([])
  const [tiposPropiedad, setTiposPropiedad] = useState([])

  // Crear color al vuelo
  const [creandoColor, setCreandoColor] = useState(false)
  const [nuevoColor, setNuevoColor] = useState({ nombre: '', codigo_hex: '#000000' })

  useEffect(() => {
    Promise.all([
      api.get('/api/marcas?pageSize=200&estado=activas'),
      api.get('/api/colores?pageSize=200'),
      api.get('/api/catalogos-vehiculo?tipo=colores-interior'),
      api.get('/api/catalogos-vehiculo?tipo=condiciones'),
      api.get('/api/catalogos-vehiculo?tipo=transmisiones'),
      api.get('/api/catalogos-vehiculo?tipo=combustibles'),
      api.get('/api/monedas'),
      api.get('/api/titulares-stock?pageSize=200'),
      api.get('/api/clasificaciones?pageSize=200'),
    ]).then(([m, c, ci, cond, trans, comb, mon, tit, clas]) => {
      setMarcas(m.data)
      setColores(c.data)
      setColoresInterior(ci.data)
      setCondiciones(cond.data)
      setTransmisiones(trans.data)
      setCombustibles(comb.data)
      setMonedas(mon.data)
      setTitulares(tit.data)
      setClasificaciones(clas.data)
    }).catch((err) => setError(err.message))

    // Tipos de propiedad no tiene endpoint propio: lo resolvemos con una consulta liviana embebida
    api.get('/api/vehiculos/tipos-propiedad').then((r) => setTiposPropiedad(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!esEdicion) return
    async function cargar() {
      try {
        const res = await api.get(`/api/vehiculos/detalle?id=${id}`)
        const v = res.data
        setForm({
          condicion_id: v.condicion_id || '',
          año_modelo: v.año_modelo || '',
          año_fab: v.año_fab || '',
          patente: v.patente || '',
          marca_id: v.marca_id || '',
          modelo_id: v.modelo_id || '',
          color_id: v.color_id || '',
          estado: v.estado || 'Disponible',
          kilometraje: v.kilometraje ?? '',
          color_interior_id: v.color_interior_id || '',
          numero_motor: v.numero_motor || '',
          numero_chasis: v.numero_chasis || '',
          transmision_id: v.transmision_id || '',
          combustible_id: v.combustible_id || '',
          gnc: v.gnc || false,
          precio_compra: v.precio_compra ?? '',
          fecha_compra: v.fecha_compra || '',
          dueno_anterior: v.dueno_anterior || '',
          precio_venta: v.precio_venta ?? '',
          precio_contado_sin_permuta: v.precio_contado_sin_permuta ?? '',
          moneda_id: v.moneda_id || '',
          garantia: v.garantia || false,
          tipo_propiedad_id: v.tipo_propiedad_id || '',
          titular_stock_id: v.titular_stock_id || '',
          clasificacion_id: v.clasificacion_id || '',
          observaciones: v.observaciones || '',
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id, esEdicion])

  // Cargar modelos disponibles cuando cambia marca o año
  useEffect(() => {
    if (!form.marca_id) {
      setModelos([])
      return
    }
    const params = new URLSearchParams({ marca_id: form.marca_id, pageSize: '200' })
    if (form.año_modelo) params.set('anio', form.año_modelo)
    api.get(`/api/modelos?${params.toString()}`).then((r) => setModelos(r.data)).catch(() => {})
  }, [form.marca_id, form.año_modelo])

  const esConsignacion = tiposPropiedad.find((t) => t.id === Number(form.tipo_propiedad_id))?.nombre === 'En Consignación'

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function crearColorRapido() {
    if (!nuevoColor.nombre.trim()) return
    try {
      const res = await api.post('/api/colores', nuevoColor)
      setColores((c) => [...c, res.data])
      actualizar('color_id', res.data.id)
      setCreandoColor(false)
      setNuevoColor({ nombre: '', codigo_hex: '#000000' })
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.patente || !form.marca_id || !form.modelo_id || !form.condicion_id) {
      setError('Patente, Marca, Modelo y Condición son obligatorios')
      setTab('Básicos')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        ...form,
        año_modelo: form.año_modelo || null,
        año_fab: form.año_fab || null,
        kilometraje: form.kilometraje === '' ? 0 : Number(form.kilometraje),
        precio_compra: form.precio_compra === '' ? 0 : Number(form.precio_compra),
        precio_venta: form.precio_venta === '' ? null : Number(form.precio_venta),
        precio_contado_sin_permuta:
          form.precio_contado_sin_permuta === '' ? null : Number(form.precio_contado_sin_permuta),
        fecha_compra: form.fecha_compra || null,
        moneda_id: form.moneda_id || null,
        color_interior_id: form.color_interior_id || null,
        transmision_id: form.transmision_id || null,
        combustible_id: form.combustible_id || null,
        tipo_propiedad_id: form.tipo_propiedad_id || null,
        titular_stock_id: form.titular_stock_id || null,
        clasificacion_id: form.clasificacion_id || null,
        tipo_propiedad_es_consignacion: esConsignacion,
      }

      if (esEdicion) {
        await api.put(`/api/vehiculos/detalle?id=${id}`, payload)
        navigate(`/inventario/vehiculos/${id}`)
      } else {
        const res = await api.post('/api/vehiculos', payload)
        navigate(`/inventario/vehiculos/${res.data.id}/editar`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return <div className="text-sm text-slate-400 py-10 text-center">Cargando...</div>
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-5">
        {esEdicion ? 'Editar Vehículo' : 'Nuevo Vehículo'}
      </h1>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex gap-6 border-b border-slate-200 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {tab === 'Básicos' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Condición *" value={form.condicion_id} onChange={(v) => actualizar('condicion_id', v)} opciones={condiciones} placeholder="Seleccione" />
              <div />
              <Input label="Año Modelo" type="number" value={form.año_modelo} onChange={(v) => actualizar('año_modelo', v)} />
              <Input label="Año Fab." type="number" value={form.año_fab} onChange={(v) => actualizar('año_fab', v)} />
              <Input label="Patente *" value={form.patente} onChange={(v) => actualizar('patente', v)} placeholder="ABC-123" />
              <Select label="Marca *" value={form.marca_id} onChange={(v) => { actualizar('marca_id', v); actualizar('modelo_id', '') }} opciones={marcas} placeholder="Seleccione una marca" />
              <Select
                label="Modelo *"
                value={form.modelo_id}
                onChange={(v) => actualizar('modelo_id', v)}
                opciones={modelos}
                placeholder={form.marca_id ? 'Seleccione un modelo' : 'Primero seleccione la marca'}
                deshabilitado={!form.marca_id}
              />
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Color Exterior</label>
                <div className="flex gap-2">
                  <select
                    value={form.color_id}
                    onChange={(e) => actualizar('color_id', e.target.value)}
                    className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar color...</option>
                    {colores.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setCreandoColor(true)}
                    className="border border-slate-300 rounded-lg px-2.5 text-slate-500 hover:bg-slate-50"
                    title="Crear color nuevo"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {creandoColor && (
                  <div className="mt-2 flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-lg p-2">
                    <input type="color" value={nuevoColor.codigo_hex} onChange={(e) => setNuevoColor({ ...nuevoColor, codigo_hex: e.target.value })} className="w-8 h-8 rounded border border-slate-300" />
                    <input
                      value={nuevoColor.nombre}
                      onChange={(e) => setNuevoColor({ ...nuevoColor, nombre: e.target.value })}
                      placeholder="Nombre del color"
                      className="flex-1 text-sm border border-slate-300 rounded-lg px-2 py-1.5"
                    />
                    <button type="button" onClick={crearColorRapido} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg px-3 py-1.5">Crear</button>
                    <button type="button" onClick={() => setCreandoColor(false)} className="text-xs text-slate-500 px-2">Cancelar</button>
                  </div>
                )}
              </div>
              <Select label="Estado *" value={form.estado} onChange={(v) => actualizar('estado', v)} opciones={ESTADOS.map((e) => ({ id: e, nombre: e }))} />
              <Input label="Kilometraje *" type="number" value={form.kilometraje} onChange={(v) => actualizar('kilometraje', v)} placeholder="Requerido" />
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mt-1">
                <input type="checkbox" checked={form.gnc} onChange={(e) => actualizar('gnc', e.target.checked)} className="rounded border-slate-300 text-blue-600" />
                Equipo GNC
              </label>
            </div>
          )}

          {tab === 'Técnica' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Color Interior" value={form.color_interior_id} onChange={(v) => actualizar('color_interior_id', v)} opciones={coloresInterior} placeholder="Opcional" />
              <div />
              <Input label="Número de Motor" value={form.numero_motor} onChange={(v) => actualizar('numero_motor', v)} placeholder="Opcional" />
              <Input label="Número de Chasis" value={form.numero_chasis} onChange={(v) => actualizar('numero_chasis', v)} placeholder="Opcional" />
              <Select label="Transmisión" value={form.transmision_id} onChange={(v) => actualizar('transmision_id', v)} opciones={transmisiones} placeholder="Seleccione" />
              <Select label="Combustible" value={form.combustible_id} onChange={(v) => actualizar('combustible_id', v)} opciones={combustibles} placeholder="Seleccione" />
            </div>
          )}

          {tab === 'Comercial' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Precio de Compra" type="number" value={form.precio_compra} onChange={(v) => actualizar('precio_compra', v)} placeholder="0" />
              <Input label="Fecha de Compra" type="date" value={form.fecha_compra} onChange={(v) => actualizar('fecha_compra', v)} />
              <Input label="Dueño Anterior" value={form.dueno_anterior} onChange={(v) => actualizar('dueno_anterior', v)} />
              <Input label="Precio de Venta" type="number" value={form.precio_venta} onChange={(v) => actualizar('precio_venta', v)} placeholder="0" />
              <Input label="Precio de contado sin permuta" type="number" value={form.precio_contado_sin_permuta} onChange={(v) => actualizar('precio_contado_sin_permuta', v)} />
              <Select label="Moneda *" value={form.moneda_id} onChange={(v) => actualizar('moneda_id', v)} opciones={monedas.map((m) => ({ id: m.id, nombre: `${m.simbolo} - ${m.nombre}` }))} placeholder="Seleccione" />

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.garantia} onChange={(e) => actualizar('garantia', e.target.checked)} className="rounded border-slate-300 text-blue-600" />
                Ofrece garantía
              </label>
              <div />

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1 block">Propiedad del Vehículo</label>
                <div className="flex gap-2">
                  {tiposPropiedad.map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => actualizar('tipo_propiedad_id', tp.id)}
                      className={`flex-1 text-sm font-medium rounded-lg px-4 py-2 border ${
                        Number(form.tipo_propiedad_id) === tp.id
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tp.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Titular/es de Stock</label>
                <select
                  disabled={esConsignacion}
                  value={form.titular_stock_id}
                  onChange={(e) => actualizar('titular_stock_id', e.target.value)}
                  className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    esConsignacion ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'border-slate-300'
                  }`}
                >
                  <option value="">Buscar y agregar titular...</option>
                  {titulares.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  {esConsignacion ? 'No aplicable a consignación.' : 'Visible solo para roles autorizados.'}
                </p>
              </div>

              <Select label="Clasificación" value={form.clasificacion_id} onChange={(v) => actualizar('clasificacion_id', v)} opciones={clasificaciones} placeholder="Buscar y agregar clasificación..." />
            </div>
          )}

          {tab === 'Multimedia' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Observaciones</label>
              <textarea
                value={form.observaciones}
                onChange={(e) => actualizar('observaciones', e.target.value)}
                rows={3}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {esEdicion ? (
                <FotosVehiculo vehiculoId={id} />
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl py-10 text-center text-sm text-slate-400">
                  Guardá el vehículo primero (botón "Guardar Vehículo") para poder subir fotos.
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-6 mt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/inventario/vehiculos')}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2"
            >
              <Save size={15} />
              {guardando ? 'Guardando...' : 'Guardar Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Input({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function Select({ label, value, onChange, opciones, placeholder, deshabilitado }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>
      <select
        disabled={deshabilitado}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          deshabilitado ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'border-slate-300'
        }`}
      >
        <option value="">{placeholder || 'Seleccione'}</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>{o.nombre}</option>
        ))}
      </select>
    </div>
  )
}
