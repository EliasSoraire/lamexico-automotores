import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, ArrowLeft, Car } from 'lucide-react'
import { api } from '../../../lib/api'

export default function ConsultaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [consulta, setConsulta] = useState(null)
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/api/consultas/detalle?id=${id}`)
      .then((res) => { setConsulta(res.data); setVehiculos(res.vehiculos) })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }, [id])

  if (cargando) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>
  if (error || !consulta) return <div className="text-sm text-red-600 py-10 text-center">{error}</div>

  const nombre = consulta.clientes
    ? (consulta.clientes.tipo_persona === 'Jurídica' ? consulta.clientes.razon_social : `${consulta.clientes.nombre || ''} ${consulta.clientes.apellido || ''}`.trim())
    : `${consulta.nombre_solicitante || ''} ${consulta.apellido_solicitante || ''}`.trim()

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800">Consulta de: {nombre}</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate(`/ventas/consultas/${id}/editar`)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-3 py-1.5">
            <Pencil size={14} /> Editar
          </button>
          <button type="button" onClick={() => navigate('/ventas/consultas')} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50">
            <ArrowLeft size={14} /> Volver
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
        <div className="space-y-2.5 text-sm">
          <Dato label="Solicitante" valor={nombre} />
          <Dato label="Teléfono" valor={consulta.telefono_solicitante} />
          <Dato label="Email" valor={consulta.email_solicitante} />
          <Dato label="Tipo de Consulta" valor={consulta.tipos_consulta?.nombre} />
          <Dato label="Canal" valor={consulta.canales_origen?.nombre} />
        </div>
        <div className="space-y-2.5 text-sm">
          <Dato label="Estado" valor={consulta.estados_consulta?.nombre} />
          <Dato label="Prioridad" valor={consulta.prioridades?.nombre} />
          <Dato label="Fecha de Ingreso" valor={new Date(consulta.fecha_ingreso).toLocaleString('es-AR')} />
          <Dato label="Fecha de Seguimiento" valor={consulta.fecha_seguimiento ? new Date(consulta.fecha_seguimiento).toLocaleDateString('es-AR') : null} />
          <Dato label="Observaciones" valor={consulta.observaciones} />
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-3">
          <Car size={15} className="text-slate-600" /> Vehículos de Interés
        </h3>
        {vehiculos.length === 0 ? (
          <p className="text-sm text-slate-600">No hay vehículos vinculados.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {vehiculos.map((rv) => (
              <li key={rv.id} className="py-2 text-slate-700">
                {rv.vehiculos?.marcas?.nombre} {rv.vehiculos?.modelos?.nombre} — Patente: {rv.vehiculos?.patente || '-'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Dato({ label, valor }) {
  return (
    <div>
      <dt className="text-blue-600 text-xs font-medium mb-0.5">{label}</dt>
      <dd className="text-slate-700">{valor || '-'}</dd>
    </div>
  )
}
