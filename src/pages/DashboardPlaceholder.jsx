import { useAuth } from '../context/AuthContext'

export default function DashboardPlaceholder() {
  const { usuario, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 max-w-sm w-full">
        <h1 className="text-lg font-semibold text-slate-800 mb-2">Login exitoso ✅</h1>
        <p className="text-sm text-slate-500 mb-1">
          Sesión iniciada como <strong>{usuario?.nombre_completo}</strong>
        </p>
        <p className="text-xs text-slate-400 mb-6">{usuario?.email}</p>
        <p className="text-xs text-slate-400 mb-4">
          Esta pantalla es temporal. En el próximo paso construimos el layout con el sidebar completo.
        </p>
        <button
          onClick={logout}
          className="text-sm text-red-600 hover:underline"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
