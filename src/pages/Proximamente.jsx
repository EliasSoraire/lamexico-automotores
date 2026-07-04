import { Clock } from 'lucide-react'

export default function Proximamente({ nombre }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <Clock size={28} className="text-blue-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Disponible próximamente</h2>
      <p className="text-sm text-slate-500 max-w-sm">
        El módulo <strong>{nombre}</strong> va a estar disponible en la próxima entrega.
      </p>
    </div>
  )
}
