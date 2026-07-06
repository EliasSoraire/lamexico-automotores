import { useState, useMemo, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Warehouse, ShoppingCart, DollarSign, Package,
  Landmark, FileText, Settings, ChevronDown, Search, ChevronLeft, Clock,
} from 'lucide-react'
import { menuConfig } from '../config/menuConfig'

const ICONOS = {
  LayoutDashboard, Warehouse, ShoppingCart, DollarSign, Package, Landmark, FileText, Settings,
}

export default function Sidebar({ colapsado, onToggleColapsado }) {
  const location = useLocation()
  const [busqueda, setBusqueda] = useState('')

  // Grupo abierto automáticamente si la ruta actual pertenece a ese grupo
  const grupoActivoInicial = useMemo(() => {
    const grupo = menuConfig.find(
      (g) => g.tipo === 'grupo' && g.items.some((it) => location.pathname.startsWith(it.path))
    )
    return grupo ? grupo.nombre : null
  }, [location.pathname])

  const [grupoAbierto, setGrupoAbierto] = useState(grupoActivoInicial)

  // Al navegar a cualquier pantalla, se limpia el buscador y vuelve al sidebar normal
  useEffect(() => {
    setBusqueda('')
  }, [location.pathname])

  const menuFiltrado = useMemo(() => {
    if (!busqueda.trim()) return menuConfig

    const texto = busqueda.toLowerCase()
    return menuConfig
      .map((entrada) => {
        if (entrada.tipo === 'item') {
          return entrada.nombre.toLowerCase().includes(texto) ? entrada : null
        }
        const itemsFiltrados = entrada.items.filter((it) =>
          it.nombre.toLowerCase().includes(texto)
        )
        if (itemsFiltrados.length === 0) return null
        return { ...entrada, items: itemsFiltrados }
      })
      .filter(Boolean)
  }, [busqueda])

  function toggleGrupo(nombre) {
    setGrupoAbierto((actual) => (actual === nombre ? null : nombre))
  }

  return (
    <aside
      className={`h-screen sticky top-0 bg-white border-r border-slate-400 flex flex-col transition-all ${
        colapsado ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 shrink-0">
        {!colapsado && (
          <span className="font-bold text-slate-800 text-sm leading-tight">
            La Mexico<br />Automotores
          </span>
        )}
        <button type="button"
          onClick={onToggleColapsado}
          className="text-slate-600 hover:text-slate-600 p-1"
          title={colapsado ? 'Expandir menú' : 'Colapsar menú'}
        >
          <ChevronLeft size={18} className={`transition-transform ${colapsado ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {!colapsado && (
        <div className="px-3 pt-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full text-sm bg-slate-50 border border-slate-400 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {menuFiltrado.map((entrada) => {
          if (entrada.tipo === 'item') {
            return (
              <NavLink
                key={entrada.path}
                to={entrada.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <LayoutDashboard size={17} className="shrink-0" />
                {!colapsado && entrada.nombre}
              </NavLink>
            )
          }

          const Icono = ICONOS[entrada.icono]
          const abierto = grupoAbierto === entrada.nombre || busqueda.trim() !== ''
          const grupoContieneActivo = entrada.items.some((it) => location.pathname.startsWith(it.path))

          return (
            <div key={entrada.nombre}>
              <button type="button"
                onClick={() => toggleGrupo(entrada.nombre)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  grupoContieneActivo ? 'text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icono size={17} className="shrink-0" />
                  {!colapsado && entrada.nombre}
                </span>
                {!colapsado && (
                  <ChevronDown
                    size={15}
                    className={`transition-transform ${abierto ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {!colapsado && abierto && (
                <div className="ml-6 mt-1 space-y-0.5 border-l border-slate-100 pl-3">
                  {entrada.items.map((it) => (
                    <NavLink
                      key={it.path}
                      to={it.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`
                      }
                    >
                      {it.nombre}
                      {it.proximamente && (
                        <Clock size={12} className="text-slate-700 shrink-0" />
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
