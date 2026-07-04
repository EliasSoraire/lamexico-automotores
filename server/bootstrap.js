// Este archivo se asegura de cargar las variables de entorno (.env.local)
// ANTES de arrancar el servidor, de forma confiable sin importar el sistema
// operativo. Por eso usa import() dinámico en vez de un import normal:
// el import() dinámico se ejecuta en el momento en que aparece en el código
// (no se adelanta como los imports normales), así garantizamos el orden correcto.

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rutaEnv = path.resolve(__dirname, '..', '.env.local')

const resultado = config({ path: rutaEnv })

if (resultado.error) {
  console.error('⚠️  No se pudo cargar .env.local desde:', rutaEnv)
  console.error(resultado.error.message)
} else {
  console.log('✅ Variables de entorno cargadas desde .env.local')
}

await import('./dev-api-server.js')
