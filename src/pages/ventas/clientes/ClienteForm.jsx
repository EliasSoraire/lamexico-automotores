import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, User, Phone, MapPin, TrendingUp, Settings, Paperclip } from 'lucide-react'
import { api } from '../../../lib/api'
import AdjuntosCliente from '../../../components/clientes/AdjuntosCliente'

const TABS = ['Datos Básicos', 'Contacto', 'Dirección', 'Comercial', 'Preferencias', 'Adjuntos']
const CONDICIONES_IVA = ['Responsable Inscripto', 'Monotributista', 'Exento', 'Consumidor Final', 'No Responsable']

const FORM_VACIO = {
  tipo_persona: 'Física',
  nombre: '',
  apellido: '',
  razon_social: '',
  actividad_principal: '',
  condicion_iva: '',
  fecha_nacimiento: '',
  genero_id: '',
  estado_civil_id: '',
  profesion: '',
  tipo_documento_id: '',
  numero_documento: '',
  estado_id: '',
  email: '',
  telefono: '',
  telefono_movil: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigo_postal: '',
  segmento_id: '',
  canal_origen_id: '',
  observaciones: '',
  acepta_marketing: false,
  acepta_sms: false,
  acepta_email: false,
}

export default function ClienteForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()
  const adjuntosRef = useRef(null)

  const [tab, setTab] = useState('Datos Básicos')
  const [form, setForm] = useState(FORM_VACIO)
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  const [generos, setGeneros] = useState([])
  const [estadosCiviles, setEstadosCiviles] = useState([])
  const [tiposDocumento, setTiposDocumento] = useState([])
  const [estadosCliente, setEstadosCliente] = useState([])
  const [segmentos, setSegmentos] = useState([])
  const [canalesOrigen, setCanalesOrigen] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/api/catalogos-cliente?tipo=generos'),
      api.get('/api/catalogos-cliente?tipo=estados-civiles'),
      api.get('/api/catalogos-cliente?tipo=tipos-documento'),
      api.get('/api/catalogos-cliente?tipo=estados-cliente'),
      api.get('/api/catalogos-cliente?tipo=segmentos'),
      api.get('/api/canales-origen?pageSize=200'),
    ]).then(([g, ec, td, est, seg, canales]) => {
      setGeneros(g.data)
      setEstadosCiviles(ec.data)
      setTiposDocumento(td.data)
      setEstadosCliente(est.data)
      setSegmentos(seg.data)
      setCanalesOrigen(canales.data)
      if (!esEdicion) {
        const activo = est.data.find((e) => e.nombre === 'Activo')
        if (activo) setForm((f) => ({ ...f, estado_id: activo.id }))
      }
    }).catch((err) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!esEdicion) return
    async function cargar() {
      try {
        const res = await api.get(`/api/clientes/detalle?id=${id}`)
        const c = res.data
        setForm({
          tipo_persona: c.tipo_persona || 'Física',
          nombre: c.nombre || '',
          apellido: c.apellido || '',
          razon_social: c.razon_social || '',
          actividad_principal: c.actividad_principal || '',
          condicion_iva: c.condicion_iva || '',
          fecha_nacimiento: c.fecha_nacimiento || '',
          genero_id: c.genero_id || '',
          estado_civil_id: c.estado_civil_id || '',
          profesion: c.profesion || '',
          tipo_documento_id: c.tipo_documento_id || '',
          numero_documento: c.numero_documento || '',
          estado_id: c.estado_id || '',
          email: c.email || '',
          telefono: c.telefono || '',
          telefono_movil: c.telefono_movil || '',
          direccion: c.direccion || '',
          ciudad: c.ciudad || '',
          provincia: c.provincia || '',
          codigo_postal: c.codigo_postal || '',
          segmento_id: c.segmento_id || '',
          canal_origen_id: c.canal_origen_id || '',
          observaciones: c.observaciones || '',
          acepta_marketing: c.acepta_marketing || false,
          acepta_sms: c.acepta_sms || false,
          acepta_email: c.acepta_email || false,
        })
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
    // El orden de estos chequeos respeta el orden de las pestañas (Datos Básicos primero, Comercial después)
    if (form.tipo_persona === 'Física' && (!form.nombre || !form.apellido)) {
      return 'Nombre y Apellido son obligatorios para Persona Física (pestaña Datos Básicos)'
    }
    if (form.tipo_persona === 'Jurídica' && !form.razon_social) {
      return 'Razón Social es obligatoria para Persona Jurídica (pestaña Datos Básicos)'
    }
    if (!form.segmento_id) return 'El Segmento es obligatorio (pestaña Comercial)'
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const mensajeError = validar()
    if (mensajeError) {
      setError(mensajeError)
      if (mensajeError.includes('Comercial')) {
        setTab('Comercial')
      } else {
        setTab('Datos Básicos')
      }
      return
    }
    setConfirmando(true)
  }

  async function guardarConfirmado() {
    if (guardando) return
    setConfirmando(false)
    setGuardando(true)
    setError('')
    try {
      if (esEdicion) {
        await api.put(`/api/clientes/detalle?id=${id}`, form)
      } else {
        const res = await api.post('/api/clientes', form)
        if (adjuntosRef.current?.tienePendientes) {
          await adjuntosRef.current.subirPendientes(res.data.id)
        }
      }
      navigate('/ventas/clientes')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>

  const esJuridica = form.tipo_persona === 'Jurídica'

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-1">{esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}</h1>
      <p className="text-sm text-slate-600 mb-5">Complete la información del cliente utilizando el sistema de pestañas</p>

      <div className="bg-white border border-slate-400 rounded-xl p-6">
        <div className="flex gap-6 border-b border-slate-200 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-700'
              }`}>
              {t === 'Datos Básicos' && <User size={14} />}
              {t === 'Contacto' && <Phone size={14} />}
              {t === 'Dirección' && <MapPin size={14} />}
              {t === 'Comercial' && <TrendingUp size={14} />}
              {t === 'Preferencias' && <Settings size={14} />}
              {t === 'Adjuntos' && <Paperclip size={14} />}
              {t}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          {tab === 'Datos Básicos' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Tipo de Persona *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm text-slate-700">
                    <input type="radio" checked={!esJuridica} onChange={() => actualizar('tipo_persona', 'Física')} /> Física
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-slate-700">
                    <input type="radio" checked={esJuridica} onChange={() => actualizar('tipo_persona', 'Jurídica')} /> Jurídica
                  </label>
                </div>
              </div>

              {!esJuridica ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nombre *" value={form.nombre} onChange={(v) => actualizar('nombre', v)} />
                  <Input label="Apellido *" value={form.apellido} onChange={(v) => actualizar('apellido', v)} />
                </div>
              ) : (
                <Input label="Razón Social *" value={form.razon_social} onChange={(v) => actualizar('razon_social', v)} />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!esJuridica ? (
                  <>
                    <Input label="Fecha de Nacimiento" type="date" value={form.fecha_nacimiento} onChange={(v) => actualizar('fecha_nacimiento', v)} />
                    <Select label="Género" value={form.genero_id} onChange={(v) => actualizar('genero_id', v)} opciones={generos} />
                    <Select label="Estado Civil" value={form.estado_civil_id} onChange={(v) => actualizar('estado_civil_id', v)} opciones={estadosCiviles} />
                    <Input label="Profesión" value={form.profesion} onChange={(v) => actualizar('profesion', v)} />
                  </>
                ) : (
                  <>
                    <Select label="Condición de IVA" value={form.condicion_iva} onChange={(v) => actualizar('condicion_iva', v)} opciones={CONDICIONES_IVA.map((c) => ({ id: c, nombre: c }))} />
                    <Input label="Actividad Principal" value={form.actividad_principal} onChange={(v) => actualizar('actividad_principal', v)} placeholder="Ej: Comercio minorista de vehículos" />
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Tipo de Documento" value={form.tipo_documento_id} onChange={(v) => actualizar('tipo_documento_id', v)} opciones={tiposDocumento} />
                <Input label="Número de Documento" value={form.numero_documento} onChange={(v) => actualizar('numero_documento', v)} placeholder="Sin puntos ni guiones" />
              </div>

              <Select label="Estado *" value={form.estado_id} onChange={(v) => actualizar('estado_id', v)} opciones={estadosCliente} />
              <p className="text-xs text-slate-600 -mt-2">Selecciona el estado actual del cliente en el sistema</p>
            </div>
          )}

          {tab === 'Contacto' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Correo Electrónico" type="email" value={form.email} onChange={(v) => actualizar('email', v)} placeholder="ejemplo@correo.com" />
              <Input label="Teléfono" value={form.telefono} onChange={(v) => actualizar('telefono', v)} placeholder="Ej: +54 11 1234-5678" />
              <Input label="Teléfono Móvil" value={form.telefono_movil} onChange={(v) => actualizar('telefono_movil', v)} placeholder="Ej: +54 9 11 1234-5678" />
            </div>
          )}

          {tab === 'Dirección' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Dirección" value={form.direccion} onChange={(v) => actualizar('direccion', v)} placeholder="Calle, número, piso, departamento" />
              </div>
              <Input label="Ciudad" value={form.ciudad} onChange={(v) => actualizar('ciudad', v)} />
              <Input label="Provincia" value={form.provincia} onChange={(v) => actualizar('provincia', v)} />
              <Input label="Código Postal" value={form.codigo_postal} onChange={(v) => actualizar('codigo_postal', v)} />
            </div>
          )}

          {tab === 'Comercial' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Segmento *" value={form.segmento_id} onChange={(v) => actualizar('segmento_id', v)} opciones={segmentos} />
              <Select label="Origen de Contacto" value={form.canal_origen_id} onChange={(v) => actualizar('canal_origen_id', v)} opciones={canalesOrigen} placeholder="Seleccionar..." />
            </div>
          )}

          {tab === 'Preferencias' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Observaciones</label>
              <textarea value={form.observaciones} onChange={(e) => actualizar('observaciones', e.target.value)} rows={3}
                placeholder="Información adicional sobre el cliente..."
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={form.acepta_marketing} onChange={(e) => actualizar('acepta_marketing', e.target.checked)} className="rounded border-slate-400 text-blue-600" />
                  Acepta recibir comunicaciones de marketing
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={form.acepta_sms} onChange={(e) => actualizar('acepta_sms', e.target.checked)} className="rounded border-slate-400 text-blue-600" />
                  Acepta recibir notificaciones por SMS
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={form.acepta_email} onChange={(e) => actualizar('acepta_email', e.target.checked)} className="rounded border-slate-400 text-blue-600" />
                  Acepta recibir correos electrónicos
                </label>
              </div>
            </div>
          )}

          {tab === 'Adjuntos' && (
            <AdjuntosCliente ref={adjuntosRef} clienteId={esEdicion ? id : null} />
          )}

          <div className="flex justify-end gap-2 pt-6 mt-6 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/ventas/clientes')} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2">
              <Save size={15} />
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Cliente' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>

      {confirmando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="font-semibold text-slate-800 mb-2">
              {esEdicion ? '¿Guardar los cambios?' : '¿Confirmás crear este cliente?'}
            </h3>
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
