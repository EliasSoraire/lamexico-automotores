import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RutaProtegida from './components/RutaProtegida'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Proximamente from './pages/Proximamente'
import EnConstruccion from './pages/EnConstruccion'
import MarcasList from './pages/inventario/marcas/MarcasList'
import MarcaForm from './pages/inventario/marcas/MarcaForm'
import MarcaDetalle from './pages/inventario/marcas/MarcaDetalle'
import ModeloForm from './pages/inventario/marcas/ModeloForm'
import { menuConfig } from './config/menuConfig'

// Rutas de módulos que ya tienen pantallas propias construidas.
// El resto de los ítems del menú se generan automáticamente más abajo
// como "En construcción" o "Próximamente" según corresponda.
const RUTAS_CONSTRUIDAS = new Set(['/inventario/marcas-modelos'])

function generarRutasDeModulos() {
  const rutas = []

  menuConfig.forEach((entrada) => {
    if (entrada.tipo === 'grupo') {
      entrada.items.forEach((item) => {
        if (RUTAS_CONSTRUIDAS.has(item.path)) return // ya tiene rutas propias, se agregan aparte

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

            {/* Marcas y Modelos */}
            <Route path="/inventario/marcas-modelos" element={<MarcasList />} />
            <Route path="/inventario/marcas-modelos/nueva" element={<MarcaForm />} />
            <Route path="/inventario/marcas-modelos/:id" element={<MarcaDetalle />} />
            <Route path="/inventario/marcas-modelos/:id/editar" element={<MarcaForm />} />
            <Route path="/inventario/marcas-modelos/modelos/nuevo" element={<ModeloForm />} />
            <Route path="/inventario/marcas-modelos/modelos/:id/editar" element={<ModeloForm />} />

            {generarRutasDeModulos()}
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
