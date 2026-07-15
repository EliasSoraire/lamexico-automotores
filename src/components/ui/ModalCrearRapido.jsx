import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

/**
 * campos: array de { key, label, tipo: 'texto'|'numero'|'color', requerido, placeholder, valorDefecto }
 * onCrear: async (datos) => entidadCreada   (hace la llamada a la API)
 * onCreado: (entidadCreada) => void          (el padre decide qué hacer, ej. seleccionarla)
 */
export default function ModalCrearRapido({ abierto, titulo, campos, onCrear, onCreado, onCerrar }) {
  const [form, setForm] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (abierto) {
      const inicial = {}
      campos.forEach((c) => {
        inicial[c.key] = c.valorDefecto ?? ''
      })
      setForm(inicial)
      setError('')
    }
  }, [abierto]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!abierto) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    for (const c of campos) {
      if (c.requerido && !form[c.key]) {
        setError(`El campo "${c.label}" es obligatorio`)
        return
      }
    }

    setGuardando(true)
    try {
      const creado = await onCrear(form)
      onCreado(creado)
      onCerrar()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-1.5">
          <Plus size={16} className="text-blue-600" />
          {titulo}
        </h3>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {campos.map((c) => (
            <div key={c.key}>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                {c.label} {c.requerido && <span className="text-red-500">*</span>}
              </label>

              {c.tipo === 'color' ? (
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form[c.key] || '#000000'}
                    onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                    className="w-10 h-10 rounded border border-slate-400 cursor-pointer"
                  />
                  <input
                    value={form[c.key] || ''}
                    onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                    placeholder="#000000"
                    className="flex-1 text-sm border border-slate-400 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <input
                  type={c.tipo === 'numero' ? 'number' : 'text'}
                  value={form[c.key] || ''}
                  onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                  placeholder={c.placeholder || ''}
                  className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium"
            >
              {guardando ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
