import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import { api } from '../../../lib/api'

export default function MarcaForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    logo_url: '',
    favorita: false,
    activa: true,
  })
  const [info, setInfo] = useState(null) // creado, actualizado, total_modelos (solo edición)
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!esEdicion) return

    async function cargar() {
      try {
        const res = await api.get(`/api/marcas/detalle?id=${id}`)
        setForm({
          nombre: res.data.nombre || '',
          codigo: res.data.codigo || '',
          descripcion: res.data.descripcion || '',
          logo_url: res.data.logo_url || '',
          favorita: res.data.favorita || false,
          activa: res.data.activa,
        })
        setInfo({
          creado: res.data.fecha_creacion,
          actualizado: res.data.fecha_actualizacion,
          total_modelos: res.estadisticas.total_modelos,
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id, esEdicion])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      if (esEdicion) {
        await api.put(`/api/marcas/detalle?id=${id}`, form)
      } else {
        await api.post('/api/marcas', form)
      }
      navigate('/inventario/marcas-modelos')
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
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800">
          {esEdicion ? `Editar Marca: ${form.nombre}` : 'Nueva Marca'}
        </h1>
        <button type="button"
          onClick={() => navigate('/inventario/marcas-modelos')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50"
        >
          <ArrowLeft size={15} />
          Volver
        </button>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6 max-w-2xl">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                {esEdicion ? 'Nombre de la Marca' : 'Nombre'} <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Código</label>
              <input
                maxLength={10}
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-600 mt-1">Código único de identificación (máximo 10 caracteres)</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={3}
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              {esEdicion ? 'Logo (URL)' : 'URL del Logo'}
            </label>
            <input
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://ejemplo.com/logo.png"
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {esEdicion && <p className="text-xs text-slate-600 mt-1">URL del logo de la marca</p>}
          </div>

          {esEdicion && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={(e) => setForm({ ...form, activa: e.target.checked })}
                  className="rounded border-slate-400 text-blue-600 focus:ring-blue-500"
                />
                Marca activa
              </label>
              <p className="text-xs text-slate-600 mt-1 ml-6">
                Las marcas activas aparecerán disponibles para crear modelos y vehículos
              </p>

              {info?.total_modelos > 0 && (
                <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Atención: Esta marca tiene {info.total_modelos} modelo(s) asociado(s). Desactivarla puede
                    afectar la visibilidad de estos modelos y sus vehículos en el sistema.
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.favorita}
                onChange={(e) => setForm({ ...form, favorita: e.target.checked })}
                className="rounded border-slate-400 text-blue-600 focus:ring-blue-500"
              />
              Marca favorita (se priorizará en selectores)
            </label>
          </div>

          {esEdicion && info && (
            <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-600 font-medium text-xs mb-0.5">Creado</p>
                <p className="text-slate-600">{new Date(info.creado).toLocaleString('es-AR')}</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium text-xs mb-0.5">Última actualización</p>
                <p className="text-slate-600">{new Date(info.actualizado).toLocaleString('es-AR')}</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium text-xs mb-0.5">Total modelos</p>
                <p className="text-slate-600">{info.total_modelos}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/inventario/marcas-modelos')}
              className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50"
            >
              {esEdicion ? 'Volver al Listado' : 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2"
            >
              <Save size={15} />
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Marca' : 'Crear Marca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
