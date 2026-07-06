import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'
import { api } from '../../../lib/api'

const HEX_VALIDO = /^#([0-9A-Fa-f]{6})$/

export default function ClasificacionForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    color_hex: '#3B82F6',
    activo: true,
  })
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!esEdicion) return
    async function cargar() {
      try {
        const res = await api.get(`/api/clasificaciones/detalle?id=${id}`)
        setForm({
          nombre: res.data.nombre || '',
          descripcion: res.data.descripcion || '',
          color_hex: res.data.color_hex || '#3B82F6',
          activo: res.data.activo,
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

    if (!HEX_VALIDO.test(form.color_hex)) {
      setError('El color no es válido (ej: #3B82F6)')
      return
    }

    setGuardando(true)
    try {
      if (esEdicion) {
        await api.put(`/api/clasificaciones/detalle?id=${id}`, form)
      } else {
        await api.post('/api/clasificaciones', form)
      }
      navigate('/inventario/clasificaciones')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const hexPreview = HEX_VALIDO.test(form.color_hex) ? form.color_hex : '#cccccc'

  if (cargando) {
    return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-5">
        {esEdicion ? `Editar Clasificación: ${form.nombre}` : 'Nueva Clasificación de Vehículo'}
      </h1>

      <div className="bg-white border border-slate-400 rounded-xl p-6 max-w-2xl">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Color <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={hexPreview}
                  onChange={(e) => setForm({ ...form, color_hex: e.target.value })}
                  className="w-10 h-10 rounded border border-slate-400 cursor-pointer"
                />
                <input
                  required
                  value={form.color_hex}
                  onChange={(e) => setForm({ ...form, color_hex: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1 text-sm border border-slate-400 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-slate-600 mt-1">Seleccione un color para la clasificación.</p>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 pb-6">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                className="rounded border-slate-400 text-blue-600 focus:ring-blue-500"
              />
              Activo
            </label>
          </div>

          <div className="flex justify-end items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/inventario/clasificaciones')}
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
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
