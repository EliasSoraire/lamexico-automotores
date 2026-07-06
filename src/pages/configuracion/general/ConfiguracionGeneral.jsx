import { useState, useEffect, useRef } from 'react'
import { Image as ImageIcon, Info, AlertTriangle, Save } from 'lucide-react'
import { api } from '../../../lib/api'

export default function ConfiguracionGeneral() {
  const [form, setForm] = useState({
    logo_url: '',
    restringir_por_vendedor: false,
    antiguedad_maxima_anios: '',
    kilometraje_maximo: '',
    margen_ganancia_sugerido: '',
    dias_vigencia_reservas: '',
    moneda_default_id: '',
  })
  const [monedas, setMonedas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [error, setError] = useState('')
  const [guardadoOk, setGuardadoOk] = useState(false)
  const inputLogoRef = useRef(null)

  useEffect(() => {
    Promise.all([api.get('/api/configuracion-general'), api.get('/api/monedas')])
      .then(([config, mon]) => {
        setMonedas(mon.data)
        setForm({
          logo_url: config.data.logo_url || '',
          restringir_por_vendedor: config.data.restringir_por_vendedor || false,
          antiguedad_maxima_anios: config.data.antiguedad_maxima_anios ?? '',
          kilometraje_maximo: config.data.kilometraje_maximo ?? '',
          margen_ganancia_sugerido: config.data.margen_ganancia_sugerido ?? '',
          dias_vigencia_reservas: config.data.dias_vigencia_reservas ?? '',
          moneda_default_id: config.data.moneda_default_id || '',
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }, [])

  async function subirLogo(file) {
    if (!file) return
    setSubiendoLogo(true)
    setError('')
    try {
      const firma = await api.post('/api/configuracion-general', {
        accion: 'firmar-logo',
        nombre_archivo: file.name,
      })
      // Nota: el backend interpreta accion='firmar-logo' vía este mismo POST
      const subida = await fetch(firma.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!subida.ok) throw new Error('No se pudo subir el logo')

      setForm((f) => ({ ...f, logo_url: firma.publicUrl }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendoLogo(false)
    }
  }

  async function guardar() {
    setGuardando(true)
    setError('')
    setGuardadoOk(false)
    try {
      await api.put('/api/configuracion-general', form)
      setGuardadoOk(true)
      setTimeout(() => setGuardadoOk(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>

  return (
    <div className="pb-20">
      <h1 className="text-xl font-bold text-slate-800 mb-5">Configuración General</h1>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="space-y-4 max-w-3xl">
        {/* Identidad Visual */}
        <div className="bg-white border border-slate-400 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 mb-1">Identidad Visual</h3>
          <p className="text-sm text-slate-700 mb-4">Logo principal del sistema y comprobantes.</p>

          <label className="text-sm font-medium text-slate-700 mb-2 block">Logo (PNG, JPG, SVG máx. 5MB)</label>
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-lg border border-slate-400 bg-slate-50 flex items-center justify-center overflow-hidden">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-slate-600 text-center px-1">Sin logo</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => inputLogoRef.current?.click()}
              disabled={subiendoLogo}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2"
            >
              {subiendoLogo ? 'Subiendo...' : 'Seleccionar archivo'}
            </button>
            <span className="text-sm text-slate-600">Ningún archivo seleccionado</span>
            <input
              ref={inputLogoRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={(e) => subirLogo(e.target.files[0])}
            />
          </div>
        </div>

        {/* Privacidad y visibilidad de consultas */}
        <div className="bg-white border border-slate-400 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 mb-1">Privacidad y visibilidad de consultas</h3>
          <p className="text-sm text-slate-700 mb-4">Controla si los vendedores solo ven las consultas donde figuran como vendedor asignado.</p>

          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4">
            <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              Si está activado, los usuarios con rol Vendedor solo verán y podrán actuar sobre sus propias consultas.
              Administradores y Gerentes conservan visibilidad completa. Las consultas sin vendedor asignado no serán
              visibles para vendedores hasta que un supervisor las asigne.
            </p>
          </div>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={form.restringir_por_vendedor}
              onChange={(e) => setForm({ ...form, restringir_por_vendedor: e.target.checked })}
              className="mt-0.5 rounded border-slate-400 text-blue-600"
            />
            <span>
              <span className="text-sm font-medium text-slate-700 block">Restringir por vendedor asignado</span>
              <span className="text-xs text-slate-600">
                Activar esta opción limitará la visibilidad de consultas para usuarios con rol Vendedor.
              </span>
            </span>
          </label>
        </div>

        {/* Restricciones de Inventario */}
        <div className="bg-white border border-slate-400 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 mb-1">Restricciones de Inventario (Solo Propios)</h3>
          <p className="text-sm text-slate-700 mb-4">Límites de antigüedad y kilometraje permitidos para ingresar un vehículo.</p>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Los vehículos propios que superen estos límites mostrarán una advertencia en el formulario de carga
              (no bloquean el guardado, ya que en esta versión hay un solo rol administrador).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Antigüedad Máxima del Vehículo (Años)</label>
              <input
                type="number"
                value={form.antiguedad_maxima_anios}
                onChange={(e) => setForm({ ...form, antiguedad_maxima_anios: e.target.value })}
                placeholder="ej. 10"
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-600 mt-1">Años máximos desde el año del modelo respecto al año actual. Dejar vacío para sin límite.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Kilometraje Máximo Permitido</label>
              <input
                type="number"
                value={form.kilometraje_maximo}
                onChange={(e) => setForm({ ...form, kilometraje_maximo: e.target.value })}
                placeholder="ej. 200000"
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-600 mt-1">Kilometraje máximo aceptado. Dejar vacío para sin límite.</p>
            </div>
          </div>
        </div>

        {/* Reglas Comerciales */}
        <div className="bg-white border border-slate-400 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 mb-1">Reglas Comerciales</h3>
          <p className="text-sm text-slate-700 mb-4">Rendimiento esperado, plazos de operaciones y moneda por defecto en formularios.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Margen de Ganancia Sugerido (%)</label>
              <input
                type="number"
                value={form.margen_ganancia_sugerido}
                onChange={(e) => setForm({ ...form, margen_ganancia_sugerido: e.target.value })}
                placeholder="ej. 20"
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-600 mt-1">Se usará para sugerir el precio de venta al cargar un vehículo propio al inventario.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Días de Vigencia de Reservas</label>
              <input
                type="number"
                value={form.dias_vigencia_reservas}
                onChange={(e) => setForm({ ...form, dias_vigencia_reservas: e.target.value })}
                placeholder="ej. 3"
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-600 mt-1">Días desde la fecha de reserva hasta el vencimiento. Genera notificaciones preventivas.</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Moneda por Defecto</label>
            <select
              value={form.moneda_default_id}
              onChange={(e) => setForm({ ...form, moneda_default_id: e.target.value })}
              className="w-full sm:w-1/2 text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Seleccionar —</option>
              {monedas.map((m) => (
                <option key={m.id} value={m.id}>{m.simbolo} - {m.nombre} ({m.codigo})</option>
              ))}
            </select>
            <p className="text-xs text-slate-600 mt-1">Moneda a preseleccionar en formularios de ventas, pagos e ingresos de inventario.</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6">
        {guardadoOk && (
          <span className="mr-3 text-sm text-green-600 font-medium">Guardado ✓</span>
        )}
        <button type="button"
          onClick={guardar}
          disabled={guardando}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg px-5 py-3 shadow-lg"
        >
          <Save size={15} />
          {guardando ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  )
}
