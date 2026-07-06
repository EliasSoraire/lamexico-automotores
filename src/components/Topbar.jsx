import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Building2, Menu, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { menuConfig } from '../config/menuConfig'

function useNombrePantalla() {
  const location = useLocation()

  if (location.pathname === '/dashboard') return 'Dashboard'

  for (const entrada of menuConfig) {
    if (entrada.tipo === 'grupo') {
      const item = entrada.items.find((it) => location.pathname.startsWith(it.path))
      if (item) return item.nombre
    }
  }
  return ''
}

export default function Topbar({ onAbrirMenuMobil }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const nombrePantalla = useNombrePantalla()

  const inicial = usuario?.nombre_completo?.charAt(0)?.toUpperCase() || 'U'

  return (
    <header className="h-16 bg-white border-b border-slate-400 flex items-center justify-between px-3 sm:px-6 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onAbrirMenuMobil}
          className="md:hidden text-slate-700 hover:text-slate-900 p-1.5 -ml-1.5 shrink-0"
          title="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <div className="text-sm text-slate-700 truncate">
          <span className="text-slate-600">Dashboard</span>
          {nombrePantalla && nombrePantalla !== 'Dashboard' && (
            <>
              <span className="mx-1.5 text-slate-700">/</span>
              <span className="text-slate-700 font-medium">{nombrePantalla}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-600">
          <Building2 size={16} className="text-slate-600" />
          La México Automotores
        </div>

        <button type="button" className="relative text-slate-600 hover:text-slate-600">
          <Bell size={19} />
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
            0
          </span>
        </button>

        <div className="relative">
          <button type="button"
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">
              {inicial}
            </div>
            <span className="hidden sm:block text-sm text-slate-700 font-medium">
              {usuario?.nombre_completo}
            </span>
            <ChevronDown size={15} className="text-slate-600" />
          </button>

          {menuAbierto && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuAbierto(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-400 rounded-lg shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800 truncate">{usuario?.nombre_completo}</p>
                  <p className="text-xs text-slate-600 truncate">{usuario?.email}</p>
                </div>
                <button type="button"
                  onClick={() => { setMenuAbierto(false); navigate('/perfil') }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <User size={15} />
                  Mi Perfil
                </button>
                <button type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={15} />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
