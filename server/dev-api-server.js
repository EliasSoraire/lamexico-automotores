// Servidor local de desarrollo: reutiliza la misma app de Express que se
// despliega en Vercel (api/_app.js), para que el comportamiento sea idéntico
// en local y en producción. Acá simplemente la ponemos a escuchar en un puerto.

import app from '../api/_app.js'

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
