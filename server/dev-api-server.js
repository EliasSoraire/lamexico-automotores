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
import monedasIndex from '../api/monedas/index.js'

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
  ['/api/monedas', monedasIndex],
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
