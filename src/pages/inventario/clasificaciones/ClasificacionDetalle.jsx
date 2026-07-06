import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, ArrowLeft, Car, Info } from 'lucide-react'
import { api } from '../../../lib/api'

export default function ClasificacionDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [clasificacion, setClasificacion] = useState(null)
  const [vehiculos, setVehiculos] = useState([])
  const [totalVehiculos, setTotalVehiculos] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const res = await api.get(`/api/clasificaciones/detalle?id=${id}`)
        setClasificacion(res.data)
        setVehiculos(res.vehiculos)
        setTotalVehiculos(res.total_vehiculos)
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id])

  if (cargando) {
    return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>
  }

  if (error || !clasificacion) {
    return <div className="text-sm text-red-600 py-10 text-center">{error}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800">Clasificación: {clasificacion.nombre}</h1>
        <div className="flex gap-2">
          <button type="button"
            onClick={() => navigate(`/inventario/clasificaciones/${id}/editar`)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-3 py-1.5"
          >
            <Pencil size={14} />
            Editar
          </button>
          <button type="button"
            onClick={() => navigate('/inventario/clasificaciones')}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50"
          >
            <ArrowLeft size={14} />
            Volver
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6 mb-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-4">
          <Info size={15} className="text-blue-600" />
          Información de la Clasificación
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            <div>
              <p className="text-blue-600 text-xs font-medium mb-0.5">Nombre</p>
              <p className="text-slate-700">{clasificacion.nombre}</p>
            </div>
            <div>
              <p className="text-blue-600 text-xs font-medium mb-1">Estado</p>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  clasificacion.activo ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {clasificacion.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-blue-600 text-xs font-medium mb-1">Color</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full border border-slate-400"
                  style={{ backgroundColor: clasificacion.color_hex }}
                />
                <span className="text-slate-600 font-mono text-xs">{clasificacion.color_hex}</span>
              </div>
            </div>
            <div>
              <p className="text-blue-600 text-xs font-medium mb-0.5">Fecha de Creación</p>
              <p className="text-slate-700">
                {new Date(clasificacion.fecha_creacion).toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-4">
          <Car size={15} className="text-slate-700" />
          Vehículos con esta Clasificación ({totalVehiculos})
        </h3>

        {vehiculos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-600">
            <Car size={28} className="mb-2 text-slate-700" />
            <p className="text-sm">No hay vehículos con esta clasificación asignada.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {vehiculos.map((v) => (
              <li key={v.id} className="py-2 text-slate-600">
                {v.patente || `Vehículo #${v.id}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
