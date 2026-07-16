import express from 'express'

// Handlers de la API (mismo código en desarrollo local y en producción)
import authLogin from './_routes/auth/login.js'
import authMe from './_routes/auth/me.js'
import marcasIndex from './_routes/marcas/index.js'
import marcasDetalle from './_routes/marcas/detalle.js'
import modelosIndex from './_routes/modelos/index.js'
import modelosDetalle from './_routes/modelos/detalle.js'
import coloresIndex from './_routes/colores/index.js'
import coloresDetalle from './_routes/colores/detalle.js'
import clasificacionesIndex from './_routes/clasificaciones/index.js'
import clasificacionesDetalle from './_routes/clasificaciones/detalle.js'
import titularesIndex from './_routes/titulares-stock/index.js'
import titularesDetalle from './_routes/titulares-stock/detalle.js'
import monedasIndex from './_routes/monedas/index.js'
import catalogosVehiculo from './_routes/catalogos-vehiculo/index.js'
import vehiculosIndex from './_routes/vehiculos/index.js'
import vehiculosDetalle from './_routes/vehiculos/detalle.js'
import vehiculosEstado from './_routes/vehiculos/estado.js'
import vehiculosGastos from './_routes/vehiculos/gastos.js'
import vehiculosMantenimiento from './_routes/vehiculos/mantenimiento.js'
import vehiculosFotos from './_routes/vehiculos/fotos.js'
import vehiculosTiposPropiedad from './_routes/vehiculos/tipos-propiedad.js'
import usuariosIndex from './_routes/usuarios/index.js'
import usuariosDetalle from './_routes/usuarios/detalle.js'
import dashboardIndex from './_routes/dashboard/index.js'
import configuracionGeneral from './_routes/configuracion-general/index.js'
import perfilIndex from './_routes/perfil/index.js'
import perfilPassword from './_routes/perfil/password.js'
import canalesOrigenIndex from './_routes/canales-origen/index.js'
import canalesOrigenDetalle from './_routes/canales-origen/detalle.js'
import catalogosCliente from './_routes/catalogos-cliente/index.js'
import clientesIndex from './_routes/clientes/index.js'
import clientesDetalle from './_routes/clientes/detalle.js'
import clientesAdjuntos from './_routes/clientes/adjuntos.js'
import catalogosConsulta from './_routes/catalogos-consulta/index.js'
import consultasIndex from './_routes/consultas/index.js'
import consultasDetalle from './_routes/consultas/detalle.js'
import categoriasItems from './_routes/categorias-items/index.js'
import itemsAdicionalesIndex from './_routes/items-adicionales/index.js'
import itemsAdicionalesDetalle from './_routes/items-adicionales/detalle.js'

const app = express()
app.use(express.json())

// Registro central de rutas: cada endpoint nuevo se agrega UNA sola vez acá,
// y queda disponible tanto en local (server/dev-api-server.js) como en Vercel (api/index.js).
const rutas = [
  ['/api/auth/login', authLogin],
  ['/api/auth/me', authMe],
  ['/api/marcas', marcasIndex],
  ['/api/marcas/detalle', marcasDetalle],
  ['/api/modelos', modelosIndex],
  ['/api/modelos/detalle', modelosDetalle],
  ['/api/colores', coloresIndex],
  ['/api/colores/detalle', coloresDetalle],
  ['/api/clasificaciones', clasificacionesIndex],
  ['/api/clasificaciones/detalle', clasificacionesDetalle],
  ['/api/titulares-stock', titularesIndex],
  ['/api/titulares-stock/detalle', titularesDetalle],
  ['/api/monedas', monedasIndex],
  ['/api/catalogos-vehiculo', catalogosVehiculo],
  ['/api/vehiculos', vehiculosIndex],
  ['/api/vehiculos/detalle', vehiculosDetalle],
  ['/api/vehiculos/estado', vehiculosEstado],
  ['/api/vehiculos/gastos', vehiculosGastos],
  ['/api/vehiculos/mantenimiento', vehiculosMantenimiento],
  ['/api/vehiculos/fotos', vehiculosFotos],
  ['/api/vehiculos/tipos-propiedad', vehiculosTiposPropiedad],
  ['/api/usuarios', usuariosIndex],
  ['/api/usuarios/detalle', usuariosDetalle],
  ['/api/dashboard', dashboardIndex],
  ['/api/configuracion-general', configuracionGeneral],
  ['/api/perfil', perfilIndex],
  ['/api/perfil/password', perfilPassword],
  ['/api/canales-origen', canalesOrigenIndex],
  ['/api/canales-origen/detalle', canalesOrigenDetalle],
  ['/api/catalogos-cliente', catalogosCliente],
  ['/api/clientes', clientesIndex],
  ['/api/clientes/detalle', clientesDetalle],
  ['/api/clientes/adjuntos', clientesAdjuntos],
  ['/api/catalogos-consulta', catalogosConsulta],
  ['/api/consultas', consultasIndex],
  ['/api/consultas/detalle', consultasDetalle],
  ['/api/categorias-items', categoriasItems],
  ['/api/items-adicionales', itemsAdicionalesIndex],
  ['/api/items-adicionales/detalle', itemsAdicionalesDetalle],
]

rutas.forEach(([ruta, handler]) => {
  app.all(ruta, (req, res) => handler(req, res))
})

export default app
