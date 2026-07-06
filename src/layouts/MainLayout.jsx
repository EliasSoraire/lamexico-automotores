import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function MainLayout() {
  const [colapsado, setColapsado] = useState(false) // solo aplica en escritorio
  const [menuMobilAbierto, setMenuMobilAbierto] = useState(false) // panel deslizante en mobile
  const location = useLocation()

  // Al navegar a cualquier pantalla, se cierra el menú mobile automáticamente
  useEffect(() => {
    setMenuMobilAbierto(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        colapsado={colapsado}
        onToggleColapsado={() => setColapsado(!colapsado)}
        menuMobilAbierto={menuMobilAbierto}
        onCerrarMobil={() => setMenuMobilAbierto(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onAbrirMenuMobil={() => setMenuMobilAbierto(true)} />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
