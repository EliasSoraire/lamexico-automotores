import app from './_app.js'

// Vercel invoca este archivo como función serverless. Al exportar la app de
// Express directamente (que es "callable" como (req, res)), Vercel la usa
// como el handler de la función sin necesidad de app.listen().
export default app
