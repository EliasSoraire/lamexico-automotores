import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Plus, AlertTriangle } from 'lucide-react'
import { api } from '../../../lib/api'
import FotosVehiculo from '../../../components/vehiculos/FotosVehiculo'
import ModalCrearRapido from '../../../components/ui/ModalCrearRapido'

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
  const [confirmando, setConfirmando] = useState(false)
  const fotosRef = useRef(null)

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
  const [configGeneral, setConfigGeneral] = useState(null)

  // Modal genérico de creación rápida (Marca, Modelo, Color, Color Interior,
  // Condición, Transmisión, Combustible, Titular de Stock, Clasificación)
  const [modalCrear, setModalCrear] = useState(null)

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

      // Moneda por defecto: Peso Argentino, solo al crear (no pisa lo ya cargado al editar)
      if (!esEdicion) {
        const ars = mon.data.find((m) => m.codigo === 'ARS')
        if (ars) setForm((f) => (f.moneda_id ? f : { ...f, moneda_id: ars.id }))
      }
    }).catch((err) => setError(err.message))

    // Tipos de propiedad no tiene endpoint propio: lo resolvemos con una consulta liviana embebida
    api.get('/api/vehiculos/tipos-propiedad').then((r) => setTiposPropiedad(r.data)).catch(() => {})
    api.get('/api/configuracion-general').then((r) => setConfigGeneral(r.data)).catch(() => {})
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

  const alertaInventario = (() => {
    if (esConsignacion || !configGeneral) return null
    const motivos = []
    const anioActual = new Date().getFullYear()

    if (configGeneral.antiguedad_maxima_anios && form.año_modelo) {
      const antiguedad = anioActual - Number(form.año_modelo)
      if (antiguedad > configGeneral.antiguedad_maxima_anios) {
        motivos.push(`la antigüedad (${antiguedad} años) supera el máximo permitido (${configGeneral.antiguedad_maxima_anios} años)`)
      }
    }
    if (configGeneral.kilometraje_maximo && form.kilometraje) {
      if (Number(form.kilometraje) > configGeneral.kilometraje_maximo) {
        motivos.push(`el kilometraje (${Number(form.kilometraje).toLocaleString('es-AR')} km) supera el máximo permitido (${Number(configGeneral.kilometraje_maximo).toLocaleString('es-AR')} km)`)
      }
    }
    return motivos.length > 0 ? motivos : null
  })()

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  const anioActual = new Date().getFullYear()

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.patente || !form.marca_id || !form.modelo_id || !form.condicion_id) {
      setError('Patente, Marca, Modelo y Condición son obligatorios')
      setTab('Básicos')
      return
    }

    if (form.año_modelo && Number(form.año_modelo) > anioActual) {
      setError(`El Año Modelo no puede ser mayor a ${anioActual}`)
      setTab('Básicos')
      return
    }
    if (form.año_fab && Number(form.año_fab) > anioActual) {
      setError(`El Año de Fabricación no puede ser mayor a ${anioActual}`)
      setTab('Básicos')
      return
    }

    setConfirmando(true)
  }

  async function guardarConfirmado() {
    if (guardando) return // evita doble ejecución si se llega a clickear más de una vez
    setConfirmando(false)
    setGuardando(true)
    setError('')
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
      } else {
        const res = await api.post('/api/vehiculos', payload)
        // Si se seleccionaron fotos antes de guardar, se suben ahora que el vehículo ya tiene ID
        if (fotosRef.current?.tienePendientes) {
          await fotosRef.current.subirPendientes(res.data.id)
        }
      }
      navigate('/inventario/vehiculos')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-5">
        {esEdicion ? 'Editar Vehículo' : 'Nuevo Vehículo'}
      </h1>

      <div className="bg-white border border-slate-400 rounded-xl p-6">
        <div className="flex gap-6 border-b border-slate-400 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-700 hover:text-slate-700'
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
              {alertaInventario && (
                <div className="sm:col-span-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Atención: este vehículo supera los límites configurados en Configuración General — {alertaInventario.join('; ')}.
                  </p>
                </div>
              )}
              <Select label="Condición *" value={form.condicion_id} onChange={(v) => actualizar('condicion_id', v)} opciones={condiciones} placeholder="Seleccione" onCrear={() => setModalCrear('condicion')} />
              <div />
              <Input label="Año Modelo" type="number" value={form.año_modelo} onChange={(v) => actualizar('año_modelo', v)} max={anioActual} />
              <Input label="Año Fab." type="number" value={form.año_fab} onChange={(v) => actualizar('año_fab', v)} max={anioActual} />
              <Input label="Patente *" value={form.patente} onChange={(v) => actualizar('patente', v)} placeholder="ABC-123" />
              <Select label="Marca *" value={form.marca_id} onChange={(v) => { actualizar('marca_id', v); actualizar('modelo_id', '') }} opciones={marcas} placeholder="Seleccione una marca" onCrear={() => setModalCrear('marca')} />
              <Select
                label="Modelo *"
                value={form.modelo_id}
                onChange={(v) => actualizar('modelo_id', v)}
                opciones={modelos}
                placeholder={form.marca_id ? 'Seleccione un modelo' : 'Primero seleccione la marca'}
                deshabilitado={!form.marca_id}
                onCrear={form.marca_id ? () => setModalCrear('modelo') : undefined}
              />
              <Select label="Color Exterior" value={form.color_id} onChange={(v) => actualizar('color_id', v)} opciones={colores} placeholder="Seleccionar color..." onCrear={() => setModalCrear('colorExterior')} />
              <Select label="Estado *" value={form.estado} onChange={(v) => actualizar('estado', v)} opciones={ESTADOS.map((e) => ({ id: e, nombre: e }))} />
              <Input label="Kilometraje *" type="number" value={form.kilometraje} onChange={(v) => actualizar('kilometraje', v)} placeholder="Requerido" />
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mt-1">
                <input type="checkbox" checked={form.gnc} onChange={(e) => actualizar('gnc', e.target.checked)} className="rounded border-slate-400 text-blue-600" />
                Equipo GNC
              </label>
            </div>
          )}

          {tab === 'Técnica' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Color Interior" value={form.color_interior_id} onChange={(v) => actualizar('color_interior_id', v)} opciones={coloresInterior} placeholder="Opcional" onCrear={() => setModalCrear('colorInterior')} />
              <div />
              <Input label="Número de Motor" value={form.numero_motor} onChange={(v) => actualizar('numero_motor', v)} placeholder="Opcional" />
              <Input label="Número de Chasis" value={form.numero_chasis} onChange={(v) => actualizar('numero_chasis', v)} placeholder="Opcional" />
              <Select label="Transmisión" value={form.transmision_id} onChange={(v) => actualizar('transmision_id', v)} opciones={transmisiones} placeholder="Seleccione" onCrear={() => setModalCrear('transmision')} />
              <Select label="Combustible" value={form.combustible_id} onChange={(v) => actualizar('combustible_id', v)} opciones={combustibles} placeholder="Seleccione" onCrear={() => setModalCrear('combustible')} />
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
                <input type="checkbox" checked={form.garantia} onChange={(e) => actualizar('garantia', e.target.checked)} className="rounded border-slate-400 text-blue-600" />
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
                          : 'border-slate-400 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tp.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Titular/es de Stock</label>
                <div className="flex gap-2">
                  <select
                    disabled={esConsignacion}
                    value={form.titular_stock_id}
                    onChange={(e) => actualizar('titular_stock_id', e.target.value)}
                    className={`flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      esConsignacion ? 'bg-slate-100 text-slate-600 border-slate-400 cursor-not-allowed' : 'border-slate-400'
                    }`}
                  >
                    <option value="">Buscar y agregar titular...</option>
                    {titulares.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={esConsignacion}
                    onClick={() => setModalCrear('titular')}
                    className="border border-slate-400 rounded-lg px-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Crear titular nuevo"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {esConsignacion ? 'No aplicable a consignación.' : 'Visible solo para roles autorizados.'}
                </p>
              </div>

              <Select label="Clasificación" value={form.clasificacion_id} onChange={(v) => actualizar('clasificacion_id', v)} opciones={clasificaciones} placeholder="Buscar y agregar clasificación..." onCrear={() => setModalCrear('clasificacion')} />
            </div>
          )}

          {tab === 'Multimedia' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Observaciones</label>
              <textarea
                value={form.observaciones}
                onChange={(e) => actualizar('observaciones', e.target.value)}
                rows={3}
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {esEdicion ? (
                <FotosVehiculo ref={fotosRef} vehiculoId={id} />
              ) : (
                <FotosVehiculo ref={fotosRef} vehiculoId={null} />
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-6 mt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/inventario/vehiculos')}
              className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50"
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

      <ModalCrearRapido
        abierto={modalCrear === 'marca'}
        titulo="Nueva Marca"
        campos={[{ key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true }]}
        onCrear={async (datos) => {
          const res = await api.post('/api/marcas', { nombre: datos.nombre })
          return res.data
        }}
        onCreado={(nueva) => {
          setMarcas((m) => [...m, nueva])
          actualizar('marca_id', nueva.id)
          actualizar('modelo_id', '')
        }}
        onCerrar={() => setModalCrear(null)}
      />

      <ModalCrearRapido
        abierto={modalCrear === 'modelo'}
        titulo="Nuevo Modelo"
        campos={[
          { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true },
          { key: 'version', label: 'Versión', tipo: 'texto', requerido: false },
          { key: 'anio', label: 'Año', tipo: 'numero', requerido: false },
        ]}
        onCrear={async (datos) => {
          const res = await api.post('/api/modelos', {
            marca_id: form.marca_id,
            nombre: datos.nombre,
            version: datos.version || null,
            anio: datos.anio || null,
          })
          return res.data
        }}
        onCreado={(nuevo) => {
          setModelos((m) => [...m, nuevo])
          actualizar('modelo_id', nuevo.id)
        }}
        onCerrar={() => setModalCrear(null)}
      />

      <ModalCrearRapido
        abierto={modalCrear === 'colorExterior'}
        titulo="Nuevo Color"
        campos={[
          { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true },
          { key: 'codigo_hex', label: 'Color', tipo: 'color', requerido: true, valorDefecto: '#000000' },
        ]}
        onCrear={async (datos) => {
          const res = await api.post('/api/colores', { nombre: datos.nombre, codigo_hex: datos.codigo_hex })
          return res.data
        }}
        onCreado={(nuevo) => {
          setColores((c) => [...c, nuevo])
          actualizar('color_id', nuevo.id)
        }}
        onCerrar={() => setModalCrear(null)}
      />

      <ModalCrearRapido
        abierto={modalCrear === 'colorInterior'}
        titulo="Nuevo Color Interior"
        campos={[
          { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true },
          { key: 'codigo_hex', label: 'Color', tipo: 'color', requerido: false, valorDefecto: '#000000' },
        ]}
        onCrear={async (datos) => {
          const res = await api.post('/api/catalogos-vehiculo?tipo=colores-interior', datos)
          return res.data
        }}
        onCreado={(nuevo) => {
          setColoresInterior((c) => [...c, nuevo])
          actualizar('color_interior_id', nuevo.id)
        }}
        onCerrar={() => setModalCrear(null)}
      />

      <ModalCrearRapido
        abierto={modalCrear === 'condicion'}
        titulo="Nueva Condición"
        campos={[{ key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true }]}
        onCrear={async (datos) => {
          const res = await api.post('/api/catalogos-vehiculo?tipo=condiciones', datos)
          return res.data
        }}
        onCreado={(nueva) => {
          setCondiciones((c) => [...c, nueva])
          actualizar('condicion_id', nueva.id)
        }}
        onCerrar={() => setModalCrear(null)}
      />

      <ModalCrearRapido
        abierto={modalCrear === 'transmision'}
        titulo="Nueva Transmisión"
        campos={[{ key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true }]}
        onCrear={async (datos) => {
          const res = await api.post('/api/catalogos-vehiculo?tipo=transmisiones', datos)
          return res.data
        }}
        onCreado={(nueva) => {
          setTransmisiones((t) => [...t, nueva])
          actualizar('transmision_id', nueva.id)
        }}
        onCerrar={() => setModalCrear(null)}
      />

      <ModalCrearRapido
        abierto={modalCrear === 'combustible'}
        titulo="Nuevo Combustible"
        campos={[{ key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true }]}
        onCrear={async (datos) => {
          const res = await api.post('/api/catalogos-vehiculo?tipo=combustibles', datos)
          return res.data
        }}
        onCreado={(nuevo) => {
          setCombustibles((c) => [...c, nuevo])
          actualizar('combustible_id', nuevo.id)
        }}
        onCerrar={() => setModalCrear(null)}
      />

      <ModalCrearRapido
        abierto={modalCrear === 'titular'}
        titulo="Nuevo Titular de Stock"
        campos={[{ key: 'nombre', label: 'Nombre / Razón Social', tipo: 'texto', requerido: true }]}
        onCrear={async (datos) => {
          const res = await api.post('/api/titulares-stock', { nombre: datos.nombre, activo: true })
          return res.data
        }}
        onCreado={(nuevo) => {
          setTitulares((t) => [...t, nuevo])
          actualizar('titular_stock_id', nuevo.id)
        }}
        onCerrar={() => setModalCrear(null)}
      />

      <ModalCrearRapido
        abierto={modalCrear === 'clasificacion'}
        titulo="Nueva Clasificación"
        campos={[
          { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true },
          { key: 'color_hex', label: 'Color', tipo: 'color', requerido: true, valorDefecto: '#3B82F6' },
        ]}
        onCrear={async (datos) => {
          const res = await api.post('/api/clasificaciones', {
            nombre: datos.nombre,
            color_hex: datos.color_hex,
            activo: true,
          })
          return res.data
        }}
        onCreado={(nueva) => {
          setClasificaciones((c) => [...c, nueva])
          actualizar('clasificacion_id', nueva.id)
        }}
        onCerrar={() => setModalCrear(null)}
      />

      {confirmando && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="font-semibold text-slate-800 mb-2">
              {esEdicion ? '¿Guardar los cambios?' : '¿Confirmás guardar este vehículo?'}
            </h3>
            <p className="text-sm text-slate-700 mb-5">
              Revisá que los datos cargados sean correctos antes de continuar.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button"
                onClick={() => setConfirmando(false)}
                disabled={guardando}
                className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button type="button"
                onClick={guardarConfirmado}
                disabled={guardando}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium"
              >
                {guardando ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Input({ label, type = 'text', value, onChange, placeholder, max }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        max={max}
        className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function Select({ label, value, onChange, opciones, placeholder, deshabilitado, onCrear }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>
      <div className="flex gap-2">
        <select
          disabled={deshabilitado}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            deshabilitado ? 'bg-slate-100 text-slate-600 border-slate-400 cursor-not-allowed' : 'border-slate-400'
          }`}
        >
          <option value="">{placeholder || 'Seleccione'}</option>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>{o.nombre}</option>
          ))}
        </select>
        {onCrear && (
          <button
            type="button"
            onClick={onCrear}
            disabled={deshabilitado}
            className="border border-slate-400 rounded-lg px-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Crear nuevo"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
