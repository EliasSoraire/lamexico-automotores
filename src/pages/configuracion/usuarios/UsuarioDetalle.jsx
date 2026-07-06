import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, ArrowLeft } from 'lucide-react'
import { api } from '../../../lib/api'

export default function UsuarioDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const res = await api.get(`/api/usuarios/detalle?id=${id}`)
        setUsuario(res.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id])

  if (cargando) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>
  if (error || !usuario) return <div className="text-sm text-red-600 py-10 text-center">{error}</div>

  const iniciales = usuario.nombre_completo?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Detalles del Usuario: {usuario.nombre_completo}</h1>
          <p className="text-sm text-slate-700">Información básica del usuario</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate(`/configuracion/usuarios/${id}/editar`)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-3 py-1.5">
            <Pencil size={14} /> Editar Usuario
          </button>
          <button type="button" onClick={() => navigate('/configuracion/usuarios')} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50">
            <ArrowLeft size={14} /> Volver
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6 max-w-lg">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-xl font-semibold flex items-center justify-center mb-3">
            {iniciales}
          </div>
          <p className="font-semibold text-slate-800">{usuario.nombre_completo}</p>
          <p className="text-sm text-slate-700">{usuario.email}</p>
        </div>

        <dl className="space-y-3 text-sm">
          <Fila label="Estado de la Cuenta">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${usuario.activo ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
              {usuario.activo ? 'Activo' : 'Inactivo'}
            </span>
          </Fila>
          <Fila label="Verificado" valor={usuario.verificado ? 'Sí' : 'No'} />
          <Fila label="DNI / Documento" valor={usuario.dni || '-'} />
          <Fila label="¿Es Socio?" valor={usuario.es_socio ? 'Sí' : 'No'} />
          <Fila label="Fecha de Registro" valor={new Date(usuario.fecha_creacion).toLocaleString('es-AR')} />
          <Fila label="Último Acceso" valor={usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString('es-AR') : 'Nunca'} />
        </dl>
      </div>
    </div>
  )
}

function Fila({ label, valor, children }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">
      <dt className="text-slate-700">{label}</dt>
      <dd className="text-slate-800 font-medium">{children || valor}</dd>
    </div>
  )
}
