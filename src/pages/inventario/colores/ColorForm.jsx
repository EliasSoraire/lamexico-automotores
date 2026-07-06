import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { api } from '../../../lib/api'

const HEX_VALIDO = /^#([0-9A-Fa-f]{6})$/

export default function ColorForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '',
    codigo_hex: '#000000',
    codigo_fabrica: '',
  })
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!esEdicion) return
    async function cargar() {
      try {
        const res = await api.get(`/api/colores/detalle?id=${id}`)
        setForm({
          nombre: res.data.nombre || '',
          codigo_hex: res.data.codigo_hex || '#000000',
          codigo_fabrica: res.data.codigo_fabrica || '',
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

    if (!HEX_VALIDO.test(form.codigo_hex)) {
      setError('El código hexadecimal no es válido (ej: #FF0000)')
      return
    }

    setGuardando(true)
    try {
      if (esEdicion) {
        await api.put(`/api/colores/detalle?id=${id}`, form)
      } else {
        await api.post('/api/colores', form)
      }
      navigate('/inventario/colores')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const hexPreview = HEX_VALIDO.test(form.codigo_hex) ? form.codigo_hex : '#cccccc'

  if (cargando) {
    return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800">
          {esEdicion ? 'Editar Color de Vehículo' : 'Nuevo Color de Vehículo'}
        </h1>
        <button type="button"
          onClick={() => navigate('/inventario/colores')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50"
        >
          <ArrowLeft size={15} />
          Volver
        </button>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6 max-w-xl">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-600 uppercase mb-2 text-center">Vista Previa</p>
          <div className="flex justify-center bg-slate-50 rounded-lg py-6">
            <div
              className="w-14 h-14 rounded-md border border-slate-400"
              style={{ backgroundColor: hexPreview }}
            />
          </div>
        </div>

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
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Código Hexadecimal <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={hexPreview}
                onChange={(e) => setForm({ ...form, codigo_hex: e.target.value.toUpperCase() })}
                className="w-10 h-10 rounded border border-slate-400 cursor-pointer"
              />
              <input
                required
                value={form.codigo_hex}
                onChange={(e) => setForm({ ...form, codigo_hex: e.target.value })}
                placeholder="#000000"
                className="flex-1 text-sm border border-slate-400 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Código de Fábrica (Opcional)
            </label>
            <input
              value={form.codigo_fabrica}
              onChange={(e) => setForm({ ...form, codigo_fabrica: e.target.value })}
              placeholder="Ej: WH-001"
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/inventario/colores')}
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
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Color' : 'Crear Color'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
