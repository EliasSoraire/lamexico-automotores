import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCircle, ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const TABS = ['Información de Perfil', 'Actualizar Contraseña', 'Eliminar Cuenta']

export default function Perfil() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [tab, setTab] = useState(TABS[0])

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserCircle size={22} className="text-blue-600" />
            Perfil de Usuario
          </h1>
          <p className="text-sm text-slate-600">Actualiza la información de tu perfil y tu contraseña.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50 shrink-0"
        >
          <ArrowLeft size={14} />
          Volver
        </button>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6 max-w-2xl">
        <div className="flex gap-6 border-b border-slate-200 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Información de Perfil' && <InformacionPerfil />}
        {tab === 'Actualizar Contraseña' && <ActualizarContrasena />}
        {tab === 'Eliminar Cuenta' && <EliminarCuenta onEliminada={() => { logout(); navigate('/login') }} />}
      </div>
    </div>
  )
}

function InformacionPerfil() {
  const [form, setForm] = useState({ nombre_completo: '', email: '' })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    api.get('/api/perfil')
      .then((res) => setForm({ nombre_completo: res.data.nombre_completo, email: res.data.email }))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }, [])

  async function guardar(e) {
    e.preventDefault()
    setError('')
    setOk(false)
    setGuardando(true)
    try {
      await api.put('/api/perfil', form)
      setOk(true)
      setTimeout(() => setOk(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <p className="text-sm text-slate-600">Cargando...</p>

  return (
    <div>
      <h3 className="font-semibold text-slate-800 mb-1">Información de Perfil</h3>
      <p className="text-sm text-slate-600 mb-4">Actualiza la información de tu perfil y tu dirección de correo electrónico.</p>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}
      {ok && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Perfil actualizado correctamente.
        </div>
      )}

      <form onSubmit={guardar} className="space-y-4 max-w-md">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Nombre</label>
          <input
            required
            value={form.nombre_completo}
            onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
            className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={guardando}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          <Save size={15} />
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}

function ActualizarContrasena() {
  const [form, setForm] = useState({ password_actual: '', password_nueva: '', password_confirmar: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  async function guardar(e) {
    e.preventDefault()
    setError('')
    setOk(false)

    if (form.password_nueva !== form.password_confirmar) {
      setError('La nueva contraseña y su confirmación no coinciden')
      return
    }

    setGuardando(true)
    try {
      await api.put('/api/perfil/password', form)
      setOk(true)
      setForm({ password_actual: '', password_nueva: '', password_confirmar: '' })
      setTimeout(() => setOk(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <h3 className="font-semibold text-slate-800 mb-1">Actualizar Contraseña</h3>
      <p className="text-sm text-slate-600 mb-4">Asegúrate de que tu cuenta utilice una contraseña larga y aleatoria para mantenerse segura.</p>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}
      {ok && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Contraseña actualizada correctamente.
        </div>
      )}

      <form onSubmit={guardar} className="space-y-4 max-w-md">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Contraseña Actual</label>
          <input
            required
            type="password"
            value={form.password_actual}
            onChange={(e) => setForm({ ...form, password_actual: e.target.value })}
            className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Nueva Contraseña</label>
          <input
            required
            type="password"
            value={form.password_nueva}
            onChange={(e) => setForm({ ...form, password_nueva: e.target.value })}
            className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Confirmar Contraseña</label>
          <input
            required
            type="password"
            value={form.password_confirmar}
            onChange={(e) => setForm({ ...form, password_confirmar: e.target.value })}
            className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={guardando}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          <Save size={15} />
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}

function EliminarCuenta({ onEliminada }) {
  const [confirmando, setConfirmando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')

  async function eliminar() {
    setEliminando(true)
    setError('')
    try {
      await api.delete('/api/perfil')
      onEliminada()
    } catch (err) {
      setError(err.message)
      setConfirmando(false)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div>
      <h3 className="font-semibold text-slate-800 mb-1">Eliminar Cuenta</h3>
      <p className="text-sm text-slate-600 mb-4">
        Una vez que tu cuenta sea eliminada, todos sus recursos y datos serán eliminados permanentemente.
        Antes de eliminar tu cuenta, por favor descarga cualquier dato o información que desees conservar.
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      {!confirmando ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Eliminar Cuenta
        </button>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">
              ¿Estás completamente seguro? Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={eliminando}
              className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={eliminar}
              disabled={eliminando}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium"
            >
              {eliminando ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
