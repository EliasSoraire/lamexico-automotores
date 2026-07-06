import { AlertTriangle } from 'lucide-react'

export default function ConfirmarEliminacion({ abierto, nombre, onCancelar, onConfirmar, cargando, error }) {
  if (!abierto) return null

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Eliminar {nombre ? `"${nombre}"` : ''}</h3>
            <p className="text-sm text-slate-700 mt-1">
              ¿Estás seguro de que deseas eliminar? Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium"
          >
            {cargando ? 'Eliminando...' : 'Confirmar Eliminación'}
          </button>
        </div>
      </div>
    </div>
  )
}
