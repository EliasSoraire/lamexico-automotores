import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Landmark } from 'lucide-react'
import { api } from '../../../lib/api'

export default function FinancieraForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState({ nombre: '', activo: true })
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!esEdicion) return
    async function cargar() {
      try {
        const res = await api.get(`/api/financieras/detalle?id=${id}`)
        setForm({ nombre: res.data.nombre || '', activo: res.data.activo })
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

    if (!form.nombre.trim()) {
      setError('El nombre del Banco/Financiera es obligatorio')
      return
    }

    setGuardando(true)
    try {
      if (esEdicion) {
        await api.put(`/api/financieras/detalle?id=${id}`, form)
        navigate('/finanzas/financieras')
      } else {
        await api.post('/api/financieras', form)
        navigate('/finanzas/financieras', { state: { creado: true } })
      }
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
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Landmark size={20} className="text-blue-600" />
          {esEdicion ? 'Editar Financiera' : 'Nueva Financiera'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/finanzas/financieras')}
          className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50"
        >
          Volver
        </button>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6 max-w-2xl">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Información Básica</h2>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Nombre del Banco/Financiera <span className="text-red-500">*</span>
              </label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Estado</label>
              <select
                value={form.activo ? 'activa' : 'inactiva'}
                onChange={(e) => setForm({ ...form, activo: e.target.value === 'activa' })}
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="activa">Activa</option>
                <option value="inactiva">Inactiva</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/finanzas/financieras')}
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
              {guardando ? 'Guardando...' : 'Guardar Financiera'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
