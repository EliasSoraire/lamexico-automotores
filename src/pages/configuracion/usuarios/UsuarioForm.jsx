import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { api } from '../../../lib/api'

export default function UsuarioForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    confirmar_password: '',
    dni: '',
    es_socio: false,
    activo: true,
  })
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!esEdicion) return
    async function cargar() {
      try {
        const res = await api.get(`/api/usuarios/detalle?id=${id}`)
        setForm({
          nombre_completo: res.data.nombre_completo || '',
          email: res.data.email || '',
          password: '',
          confirmar_password: '',
          dni: res.data.dni || '',
          es_socio: res.data.es_socio || false,
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
    setGuardando(true)
    try {
      if (esEdicion) {
        await api.put(`/api/usuarios/detalle?id=${id}`, form)
      } else {
        await api.post('/api/usuarios', form)
      }
      navigate('/configuracion/usuarios')
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
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {esEdicion ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h1>
          {!esEdicion && <p className="text-sm text-slate-500">Crea un nuevo usuario y asigna sus datos inmediatamente</p>}
        </div>
        <button
          onClick={() => navigate('/configuracion/usuarios')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
        >
          <ArrowLeft size={15} />
          Volver
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Información del Usuario</h3>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.nombre_completo}
                onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Contraseña {!esEdicion && <span className="text-red-500">*</span>}
              </label>
              <input
                required={!esEdicion}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={esEdicion ? 'Dejar en blanco para no cambiarla' : ''}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Confirmar Contraseña {!esEdicion && <span className="text-red-500">*</span>}
              </label>
              <input
                required={!esEdicion || !!form.password}
                type="password"
                value={form.confirmar_password}
                onChange={(e) => setForm({ ...form, confirmar_password: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">DNI / Documento (Opcional)</label>
              <input
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.es_socio}
                  onChange={(e) => setForm({ ...form, es_socio: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                ¿Es Socio?
              </label>
              {esEdicion && (
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  Activo
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/configuracion/usuarios')}
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
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
