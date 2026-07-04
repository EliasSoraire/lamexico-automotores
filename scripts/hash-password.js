// Uso: node scripts/hash-password.js "tuContraseñaAca"
import bcrypt from 'bcryptjs'

const password = process.argv[2]

if (!password) {
  console.error('Uso: node scripts/hash-password.js "tuContraseña"')
  process.exit(1)
}

bcrypt.hash(password, 10).then((hash) => {
  console.log('\nHash generado (copialo entero):\n')
  console.log(hash)
  console.log('\nAhora corré esto en el SQL Editor de Supabase:\n')
  console.log(
    `UPDATE usuarios SET password_hash = '${hash}' WHERE email = 'eliassoraire03@gmail.com';\n`
  )
})
