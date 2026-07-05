// Servidor local de desarrollo: monta cada función de /api como una ruta de Express.
// Reemplaza a "vercel dev" para poder trabajar sin depender de Vercel.
// En producción (Vercel) esto NO se usa: Vercel sigue sirviendo /api directamente
// como funciones serverless, tal cual está armado.

// Las variables de entorno (.env.local) se cargan ANTES de este archivo,
// mediante el flag "-r dotenv/config" en el script de npm (ver package.json).
// Esto es necesario porque los imports de ES Modules se evalúan todos antes
// que cualquier otro código, así que dotenv.config() acá adentro llegaría tarde.

import express from 'express'

// Handlers de /api (mismo código que corre en Vercel)
import authLogin from '../api/auth/login.js'
import authMe from '../api/auth/me.js'
import marcasIndex from '../api/marcas/index.js'
import marcasDetalle from '../api/marcas/detalle.js'
import modelosIndex from '../api/modelos/index.js'
import modelosDetalle from '../api/modelos/detalle.js'
import coloresIndex from '../api/colores/index.js'
import coloresDetalle from '../api/colores/detalle.js'
import clasificacionesIndex from '../api/clasificaciones/index.js'
import clasificacionesDetalle from '../api/clasificaciones/detalle.js'
import titularesIndex from '../api/titulares-stock/index.js'
import titularesDetalle from '../api/titulares-stock/detalle.js'
import monedasIndex from '../api/monedas/index.js'
import catalogosVehiculo from '../api/catalogos-vehiculo/index.js'
import vehiculosIndex from '../api/vehiculos/index.js'
import vehiculosDetalle from '../api/vehiculos/detalle.js'
import vehiculosEstado from '../api/vehiculos/estado.js'
import vehiculosGastos from '../api/vehiculos/gastos.js'
import vehiculosMantenimiento from '../api/vehiculos/mantenimiento.js'
import vehiculosFotos from '../api/vehiculos/fotos.js'
import vehiculosTiposPropiedad from '../api/vehiculos/tipos-propiedad.js'
import usuariosIndex from '../api/usuarios/index.js'
import usuariosDetalle from '../api/usuarios/detalle.js'
import dashboardIndex from '../api/dashboard/index.js'

const app = express()
app.use(express.json())

// Cada ruta de /api se registra acá a mano. Cuando se agregue un nuevo
// endpoint en /api, hay que sumar su línea correspondiente en este archivo.
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
]

rutas.forEach(([ruta, handler]) => {
  app.all(ruta, (req, res) => handler(req, res))
})

const PORT = process.env.API_PORT || 3001

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor de API local corriendo en http://localhost:${PORT}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} ya está en uso. Cerrá cualquier otro proceso que lo esté usando e intentá de nuevo.`)
  } else {
    console.error('❌ Error al iniciar el servidor de API:', err)
  }
  process.exit(1)
})
