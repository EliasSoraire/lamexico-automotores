import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function MainLayout() {
  const [colapsado, setColapsado] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar colapsado={colapsado} onToggleColapsado={() => setColapsado(!colapsado)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
