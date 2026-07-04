import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RutaProtegida from './components/RutaProtegida'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Proximamente from './pages/Proximamente'
import EnConstruccion from './pages/EnConstruccion'
import { menuConfig } from './config/menuConfig'

// Genera automáticamente una <Route> por cada ítem del menú (grupos e ítems sueltos),
// evitando tener que escribirlas todas a mano y que se desincronicen del sidebar.
function generarRutasDeModulos() {
  const rutas = []

  menuConfig.forEach((entrada) => {
    if (entrada.tipo === 'grupo') {
      entrada.items.forEach((item) => {
        rutas.push(
          <Route
            key={item.path}
            path={item.path}
            element={
              item.proximamente ? (
                <Proximamente nombre={item.nombre} />
              ) : (
                <EnConstruccion nombre={item.nombre} />
              )
            }
          />
        )
      })
    }
  })

  return rutas
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RutaProtegida>
                <MainLayout />
              </RutaProtegida>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            {generarRutasDeModulos()}
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
