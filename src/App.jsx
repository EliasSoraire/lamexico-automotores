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
import ColoresList from './pages/inventario/colores/ColoresList'
import ColorForm from './pages/inventario/colores/ColorForm'
import ClasificacionesList from './pages/inventario/clasificaciones/ClasificacionesList'
import ClasificacionForm from './pages/inventario/clasificaciones/ClasificacionForm'
import ClasificacionDetalle from './pages/inventario/clasificaciones/ClasificacionDetalle'
import TitularesStockList from './pages/configuracion/titulares-stock/TitularesStockList'
import TitularStockForm from './pages/configuracion/titulares-stock/TitularStockForm'
import VehiculosList from './pages/inventario/vehiculos/VehiculosList'
import VehiculoForm from './pages/inventario/vehiculos/VehiculoForm'
import VehiculoDetalle from './pages/inventario/vehiculos/VehiculoDetalle'
import UsuariosList from './pages/configuracion/usuarios/UsuariosList'
import UsuarioForm from './pages/configuracion/usuarios/UsuarioForm'
import UsuarioDetalle from './pages/configuracion/usuarios/UsuarioDetalle'
import ConfiguracionGeneral from './pages/configuracion/general/ConfiguracionGeneral'
import Perfil from './pages/perfil/Perfil'
import CanalesOrigenList from './pages/ventas/canales-origen/CanalesOrigenList'
import CanalOrigenForm from './pages/ventas/canales-origen/CanalOrigenForm'
import ClientesList from './pages/ventas/clientes/ClientesList'
import ClienteForm from './pages/ventas/clientes/ClienteForm'
import ClienteDetalle from './pages/ventas/clientes/ClienteDetalle'
import ConsultasList from './pages/ventas/consultas/ConsultasList'
import ConsultaForm from './pages/ventas/consultas/ConsultaForm'
import ConsultaDetalle from './pages/ventas/consultas/ConsultaDetalle'
import ItemsAdicionalesList from './pages/ventas/items-adicionales/ItemsAdicionalesList'
import ItemAdicionalForm from './pages/ventas/items-adicionales/ItemAdicionalForm'
import { menuConfig } from './config/menuConfig'

// Rutas de módulos que ya tienen pantallas propias construidas.
// El resto de los ítems del menú se generan automáticamente más abajo
// como "En construcción" o "Próximamente" según corresponda.
const RUTAS_CONSTRUIDAS = new Set([
  '/inventario/marcas-modelos',
  '/inventario/colores',
  '/inventario/clasificaciones',
  '/configuracion/titulares-stock',
  '/inventario/vehiculos',
  '/configuracion/usuarios',
  '/configuracion/general',
  '/ventas/canales-origen',
  '/ventas/clientes',
  '/ventas/consultas',
  '/ventas/items-adicionales',
])

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

            {/* Colores de Vehículo */}
            <Route path="/inventario/colores" element={<ColoresList />} />
            <Route path="/inventario/colores/nuevo" element={<ColorForm />} />
            <Route path="/inventario/colores/:id/editar" element={<ColorForm />} />

            {/* Clasificaciones de Vehículo */}
            <Route path="/inventario/clasificaciones" element={<ClasificacionesList />} />
            <Route path="/inventario/clasificaciones/nueva" element={<ClasificacionForm />} />
            <Route path="/inventario/clasificaciones/:id" element={<ClasificacionDetalle />} />
            <Route path="/inventario/clasificaciones/:id/editar" element={<ClasificacionForm />} />

            {/* Titulares de Stock */}
            <Route path="/configuracion/titulares-stock" element={<TitularesStockList />} />
            <Route path="/configuracion/titulares-stock/nuevo" element={<TitularStockForm />} />
            <Route path="/configuracion/titulares-stock/:id/editar" element={<TitularStockForm />} />

            {/* Vehículos */}
            <Route path="/inventario/vehiculos" element={<VehiculosList />} />
            <Route path="/inventario/vehiculos/nuevo" element={<VehiculoForm />} />
            <Route path="/inventario/vehiculos/:id" element={<VehiculoDetalle />} />
            <Route path="/inventario/vehiculos/:id/editar" element={<VehiculoForm />} />

            {/* Usuarios */}
            <Route path="/configuracion/usuarios" element={<UsuariosList />} />
            <Route path="/configuracion/usuarios/nuevo" element={<UsuarioForm />} />
            <Route path="/configuracion/usuarios/:id" element={<UsuarioDetalle />} />
            <Route path="/configuracion/usuarios/:id/editar" element={<UsuarioForm />} />

            {/* Configuración General */}
            <Route path="/configuracion/general" element={<ConfiguracionGeneral />} />

            {/* Mi Perfil */}
            <Route path="/perfil" element={<Perfil />} />

            {/* Canales de Origen */}
            <Route path="/ventas/canales-origen" element={<CanalesOrigenList />} />
            <Route path="/ventas/canales-origen/nuevo" element={<CanalOrigenForm />} />
            <Route path="/ventas/canales-origen/:id/editar" element={<CanalOrigenForm />} />

            {/* Clientes */}
            <Route path="/ventas/clientes" element={<ClientesList />} />
            <Route path="/ventas/clientes/nuevo" element={<ClienteForm />} />
            <Route path="/ventas/clientes/:id" element={<ClienteDetalle />} />
            <Route path="/ventas/clientes/:id/editar" element={<ClienteForm />} />

            {/* Consultas */}
            <Route path="/ventas/consultas" element={<ConsultasList />} />
            <Route path="/ventas/consultas/nueva" element={<ConsultaForm />} />
            <Route path="/ventas/consultas/:id" element={<ConsultaDetalle />} />
            <Route path="/ventas/consultas/:id/editar" element={<ConsultaForm />} />

            {/* Ítems Adicionales */}
            <Route path="/ventas/items-adicionales" element={<ItemsAdicionalesList />} />
            <Route path="/ventas/items-adicionales/nuevo" element={<ItemAdicionalForm />} />
            <Route path="/ventas/items-adicionales/:id/editar" element={<ItemAdicionalForm />} />

            {generarRutasDeModulos()}
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
