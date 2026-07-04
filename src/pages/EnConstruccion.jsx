import { Construction } from 'lucide-react'

export default function EnConstruccion({ nombre }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
        <Construction size={28} className="text-amber-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800 mb-1">{nombre}</h2>
      <p className="text-sm text-slate-500 max-w-sm">
        Esta pantalla todavía no fue construida. Se arma en un próximo paso, con su propia captura de referencia.
      </p>
    </div>
  )
}
