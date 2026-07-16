import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, ArrowLeft, Paperclip } from 'lucide-react'
import { api } from '../../../lib/api'

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [adjuntos, setAdjuntos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/api/clientes/detalle?id=${id}`)
      .then((res) => { setCliente(res.data); setAdjuntos(res.adjuntos) })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }, [id])

  if (cargando) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>
  if (error || !cliente) return <div className="text-sm text-red-600 py-10 text-center">{error}</div>

  const nombre = cliente.tipo_persona === 'Jurídica' ? cliente.razon_social : `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim()

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800">Detalle del Cliente: {nombre}</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate(`/ventas/clientes/${id}/editar`)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-3 py-1.5">
            <Pencil size={14} /> Editar
          </button>
          <button type="button" onClick={() => navigate('/ventas/clientes')} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50">
            <ArrowLeft size={14} /> Volver
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
        <div className="space-y-2.5 text-sm">
          <Dato label="Tipo de Persona" valor={cliente.tipo_persona} />
          <Dato label="Documento" valor={`${cliente.tipos_documento?.nombre || ''} ${cliente.numero_documento || ''}`} />
          <Dato label="Email" valor={cliente.email} />
          <Dato label="Teléfono" valor={cliente.telefono || cliente.telefono_movil} />
          <Dato label="Dirección" valor={[cliente.direccion, cliente.ciudad, cliente.provincia].filter(Boolean).join(', ')} />
        </div>
        <div className="space-y-2.5 text-sm">
          <Dato label="Segmento" valor={cliente.segmentos_cliente?.nombre} />
          <Dato label="Origen de Contacto" valor={cliente.canales_origen?.nombre} />
          <Dato label="Estado" valor={cliente.estados_cliente?.nombre} />
          <Dato label="Observaciones" valor={cliente.observaciones} />
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-3">
          <Paperclip size={15} className="text-slate-600" /> Adjuntos
        </h3>
        {adjuntos.length === 0 ? (
          <p className="text-sm text-slate-600">No hay archivos adjuntos.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {adjuntos.map((a) => (
              <li key={a.id} className="py-2">
                <a href={a.url_archivo} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{a.nombre_archivo}</a>
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
