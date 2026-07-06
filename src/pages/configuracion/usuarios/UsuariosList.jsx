import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Users, UserCheck, UserX } from 'lucide-react'
import { api } from '../../../lib/api'

export default function UsuariosList() {
  const navigate = useNavigate()

  const [usuarios, setUsuarios] = useState([])
  const [contadores, setContadores] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const res = await api.get('/api/usuarios')
      setUsuarios(res.data)
      setContadores(res.contadores)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users size={20} className="text-blue-600" />
          Gestión de Usuarios
        </h1>
        <button type="button"
          onClick={() => navigate('/configuracion/usuarios/nuevo')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          <Plus size={16} />
          Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <TarjetaContador icono={<Users size={18} className="text-blue-600" />} bg="bg-blue-50" label="Total Usuarios" valor={contadores.total} />
        <TarjetaContador icono={<UserCheck size={18} className="text-green-600" />} bg="bg-green-50" label="Usuarios Activos" valor={contadores.activos} />
        <TarjetaContador icono={<UserX size={18} className="text-amber-600" />} bg="bg-amber-50" label="Sin Verificar" valor={contadores.sin_verificar} />
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-700 uppercase">
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Último Acceso</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-600">Cargando...</td></tr>
            )}
            {!cargando && usuarios.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-600">No hay usuarios registrados.</td></tr>
            )}
            {!cargando &&
              usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                        {u.nombre_completo?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{u.nombre_completo}</p>
                        <p className="text-xs text-slate-600">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.activo ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-AR') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <button type="button" onClick={() => navigate(`/configuracion/usuarios/${u.id}`)} className="hover:text-blue-600" title="Ver">
                        <Eye size={16} />
                      </button>
                      <button type="button" onClick={() => navigate(`/configuracion/usuarios/${u.id}/editar`)} className="hover:text-amber-600" title="Editar">
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TarjetaContador({ icono, bg, label, valor }) {
  return (
    <div className="bg-white border border-slate-400 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icono}</div>
      <div>
        <p className="text-xs text-slate-700">{label}</p>
        <p className="text-lg font-bold text-slate-800">{valor ?? 0}</p>
      </div>
    </div>
  )
}
