import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

function getStoredToken() {
  return localStorage.getItem('lma_token') || sessionStorage.getItem('lma_token')
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function verificarSesion() {
      const token = getStoredToken()
      if (!token) {
        setCargando(false)
        return
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setUsuario(data.usuario)
        } else {
          localStorage.removeItem('lma_token')
          sessionStorage.removeItem('lma_token')
        }
      } catch (err) {
        console.error('Error verificando sesión:', err)
      } finally {
        setCargando(false)
      }
    }

    verificarSesion()
  }, [])

  async function login(email, password, recordarme) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'No se pudo iniciar sesión')
    }

    if (recordarme) {
      localStorage.setItem('lma_token', data.token)
    } else {
      sessionStorage.setItem('lma_token', data.token)
    }

    setUsuario(data.usuario)
    return data.usuario
  }

  function logout() {
    localStorage.removeItem('lma_token')
    sessionStorage.removeItem('lma_token')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}

export function getAuthToken() {
  return getStoredToken()
}
