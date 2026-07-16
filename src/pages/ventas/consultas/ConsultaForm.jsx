import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import { api } from '../../../lib/api'
import BuscadorCliente from '../../../components/consultas/BuscadorCliente'
import BuscadorVehiculosMultiple from '../../../components/consultas/BuscadorVehiculosMultiple'

export default function ConsultaForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()

  const [modoRegistrado, setModoRegistrado] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [vehiculosSeleccionados, setVehiculosSeleccionados] = useState([])

  const [form, setForm] = useState({
    nombre_solicitante: '',
    apellido_solicitante: '',
    telefono_solicitante: '',
    email_solicitante: '',
    canal_origen_id: '',
    tipo_consulta_id: '',
    prioridad_id: '',
    estado_id: '',
    fecha_seguimiento: '',
    observaciones: '',
  })

  const [tiposConsulta, setTiposConsulta] = useState([])
  const [canales, setCanales] = useState([])
  const [estados, setEstados] = useState([])
  const [prioridades, setPrioridades] = useState([])

  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/api/catalogos-consulta?tipo=tipos-consulta'),
      api.get('/api/canales-origen?pageSize=200'),
      api.get('/api/catalogos-consulta?tipo=estados-consulta'),
      api.get('/api/catalogos-consulta?tipo=prioridades'),
    ]).then(([tc, canalesRes, est, prio]) => {
      setTiposConsulta(tc.data)
      setCanales(canalesRes.data)
      setEstados(est.data)
      setPrioridades(prio.data)
      if (!esEdicion) {
        const nueva = est.data.find((e) => e.nombre === 'Nueva')
        const media = prio.data.find((p) => p.nombre === 'Media')
        setForm((f) => ({ ...f, estado_id: nueva?.id || '', prioridad_id: media?.id || '' }))
      }
    }).catch((err) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!esEdicion) return
    async function cargar() {
      try {
        const res = await api.get(`/api/consultas/detalle?id=${id}`)
        const c = res.data
        setModoRegistrado(!!c.cliente_id)
        setClienteSeleccionado(c.clientes || null)
        setForm({
          nombre_solicitante: c.nombre_solicitante || '',
          apellido_solicitante: c.apellido_solicitante || '',
          telefono_solicitante: c.telefono_solicitante || '',
          email_solicitante: c.email_solicitante || '',
          canal_origen_id: c.canal_origen_id || '',
          tipo_consulta_id: c.tipo_consulta_id || '',
          prioridad_id: c.prioridad_id || '',
          estado_id: c.estado_id || '',
          fecha_seguimiento: c.fecha_seguimiento || '',
          observaciones: c.observaciones || '',
        })
        setVehiculosSeleccionados((res.vehiculos || []).map((rv) => rv.vehiculos).filter(Boolean))
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id, esEdicion])

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function validar() {
    if (modoRegistrado && !clienteSeleccionado) return 'Seleccioná un cliente registrado (sección Información del Solicitante)'
    if (!modoRegistrado && (!form.nombre_solicitante || !form.apellido_solicitante || !form.telefono_solicitante || !form.email_solicitante)) {
      return 'Nombre, Apellido, Teléfono y Email son obligatorios (sección Información del Solicitante)'
    }
    if (!form.tipo_consulta_id) return 'El Tipo de Consulta es obligatorio'
    if (!form.estado_id) return 'El Estado es obligatorio'
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const mensaje = validar()
    if (mensaje) { setError(mensaje); return }
    setConfirmando(true)
  }

  async function guardarConfirmado() {
    if (guardando) return
    setConfirmando(false)
    setGuardando(true)
    setError('')
    try {
      const payload = {
        ...form,
        cliente_id: modoRegistrado ? clienteSeleccionado?.id : null,
        vehiculo_ids: vehiculosSeleccionados.map((v) => v.id),
      }
      if (esEdicion) {
        await api.put(`/api/consultas/detalle?id=${id}`, payload)
      } else {
        await api.post('/api/consultas', payload)
      }
      navigate('/ventas/consultas')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800">{esEdicion ? 'Editar Consulta' : 'Nueva Consulta'}</h1>
        <button type="button" onClick={() => navigate('/ventas/consultas')} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50">
          <ArrowLeft size={14} /> Volver
        </button>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6 max-w-3xl">
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Información del Solicitante</h3>
              <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm font-medium">
                <button type="button" onClick={() => setModoRegistrado(true)}
                  className={`px-3 py-1.5 ${modoRegistrado ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}>
                  Registrado
                </button>
                <button type="button" onClick={() => setModoRegistrado(false)}
                  className={`px-3 py-1.5 ${!modoRegistrado ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}>
                  Nuevo / Sin Registrar
                </button>
              </div>
            </div>

            {modoRegistrado ? (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Cliente *</label>
                <BuscadorCliente clienteSeleccionado={clienteSeleccionado} onSeleccionar={setClienteSeleccionado} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nombre *" value={form.nombre_solicitante} onChange={(v) => actualizar('nombre_solicitante', v)} placeholder="Juan" />
                <Input label="Apellido *" value={form.apellido_solicitante} onChange={(v) => actualizar('apellido_solicitante', v)} placeholder="Pérez" />
                <Input label="Teléfono *" value={form.telefono_solicitante} onChange={(v) => actualizar('telefono_solicitante', v)} placeholder="Ej: +54 9 11..." />
                <Input label="Email *" type="email" value={form.email_solicitante} onChange={(v) => actualizar('email_solicitante', v)} placeholder="correo@ejemplo.com" />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Vehículos de Interés</h3>
            <BuscadorVehiculosMultiple seleccionados={vehiculosSeleccionados} onCambiar={setVehiculosSeleccionados} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Tipo de Consulta *" value={form.tipo_consulta_id} onChange={(v) => actualizar('tipo_consulta_id', v)} opciones={tiposConsulta} />
            <Select label="Canal" value={form.canal_origen_id} onChange={(v) => actualizar('canal_origen_id', v)} opciones={canales} placeholder="Seleccionar canal" />
            <Select label="Prioridad" value={form.prioridad_id} onChange={(v) => actualizar('prioridad_id', v)} opciones={prioridades} />
            <Select label="Estado *" value={form.estado_id} onChange={(v) => actualizar('estado_id', v)} opciones={estados} />
            <Input label="Fecha de Seguimiento" type="date" value={form.fecha_seguimiento} onChange={(v) => actualizar('fecha_seguimiento', v)} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Observaciones</label>
            <textarea value={form.observaciones} onChange={(e) => actualizar('observaciones', e.target.value)} rows={3}
              placeholder="Detalles adicionales sobre la consulta..."
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/ventas/consultas')} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2">
              <Save size={15} />
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Consulta' : 'Crear Consulta'}
            </button>
          </div>
        </form>
      </div>

      {confirmando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="font-semibold text-slate-800 mb-2">{esEdicion ? '¿Guardar los cambios?' : '¿Confirmás crear esta consulta?'}</h3>
            <p className="text-sm text-slate-600 mb-5">Revisá que los datos cargados sean correctos antes de continuar.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmando(false)} disabled={guardando} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button type="button" onClick={guardarConfirmado} disabled={guardando} className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium">
                {guardando ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Input({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

function Select({ label, value, onChange, opciones, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">{placeholder || 'Seleccionar...'}</option>
        {opciones.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
      </select>
    </div>
  )
}
