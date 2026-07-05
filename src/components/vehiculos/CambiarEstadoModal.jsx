import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function CambiarEstadoModal({ vehiculo, estados, onCancelar, onConfirmar }) {
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  if (!vehiculo) return null

  async function handleConfirmar() {
    if (!nuevoEstado) {
      setError('Elegí un estado')
      return
    }
    setGuardando(true)
    setError('')
    try {
      await onConfirmar(vehiculo, nuevoEstado)
      setNuevoEstado('')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw size={18} className="text-purple-600" />
          <h3 className="font-semibold text-slate-800">Cambiar estado</h3>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          {vehiculo.marcas?.nombre} {vehiculo.modelos?.nombre} — Patente {vehiculo.patente}
        </p>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <select
          value={nuevoEstado}
          onChange={(e) => setNuevoEstado(e.target.value)}
          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccionar nuevo estado...</option>
          {estados
            .filter((e) => e !== vehiculo.estado)
            .map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
        </select>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => { onCancelar(); setNuevoEstado(''); setError('') }}
            disabled={guardando}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={guardando}
            className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium"
          >
            {guardando ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
