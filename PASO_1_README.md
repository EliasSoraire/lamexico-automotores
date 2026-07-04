# La México Automotores — Sistema de Gestión

## Paso 1 completado: Setup del proyecto + Login

### Qué incluye este paso
- Proyecto React (Vite) + Tailwind CSS
- Backend como Vercel Serverless Functions en `/api`
- Conexión a Supabase (auth + futura base para el resto de módulos)
- Pantalla de Login funcional (réplica de la captura de referencia)
- Sistema de sesión con JWT (login, verificación de sesión, logout)
- Placeholder temporal post-login (se reemplaza en el próximo paso por el layout con sidebar)

### Cómo instalarlo en tu máquina

1. Descomprimí este proyecto dentro de tu carpeta de trabajo (o reemplazá el contenido de tu repo `lamexico-automotores` ya creado en GitHub).

2. Instalá las dependencias:
   ```
   npm install
   ```

3. El archivo `.env.local` ya viene con tus credenciales reales de Supabase cargadas (URL, anon key, service role key) y un `JWT_SECRET` de prueba. **Este archivo NO se sube a git** (ya está en `.gitignore`). Para producción en Vercel vas a cargar estas mismas variables desde el panel de Vercel (te guío en el paso de deploy).

4. **Importante — activar tu usuario para poder loguearte:**
   El usuario semilla del SQL (`eliassoraire03@gmail.com`) tiene un `password_hash` de prueba (`hash_temporal`) que no sirve para loguearse. Corré esto para generar un hash real:
   ```
   node scripts/hash-password.js "TuContraseñaElegida"
   ```
   Esto te va a imprimir un `UPDATE` con el hash ya armado. Copiá ese `UPDATE` y ejecutalo en el **SQL Editor de Supabase** (Supabase → SQL Editor → pegar → Run).

5. Para probar el proyecto completo (frontend + API) necesitás usar el CLI de Vercel, porque el backend está armado como funciones serverless (no como servidor Express tradicional):
   ```
   npm install -g vercel
   vercel dev
   ```
   La primera vez te va a pedir loguearte con tu cuenta de Vercel (gratis) y "linkear" el proyecto. Aceptá las opciones por defecto.

6. Entrá a la URL que te muestre la consola (normalmente `http://localhost:3000`), deberías ver la pantalla de Login. Ingresá con el email del usuario semilla y la contraseña que elegiste en el paso 4.

7. Si el login funciona, vas a ver una pantalla temporal que dice "Login exitoso ✅" con tu nombre — eso confirma que el Paso 1 quedó funcionando de punta a punta (frontend, backend, base de datos, JWT).

### Qué probar y confirmarme
- [ ] `npm install` corre sin errores
- [ ] `vercel dev` levanta el proyecto sin errores
- [ ] La pantalla de Login se ve igual a la captura de referencia
- [ ] Podés iniciar sesión con el usuario semilla y llegás a la pantalla "Login exitoso"
- [ ] Si ponés mal la contraseña, te muestra el error correspondiente
- [ ] El botón "¿Olvidaste tu contraseña?" muestra el cartel de "Disponible próximamente"

Avisame si algo de esto falla o no se ve como esperabas, y lo ajustamos antes de pasar al siguiente paso.
