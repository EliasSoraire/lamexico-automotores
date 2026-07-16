import { useState, useEffect, useRef } from 'react'
import { Search, X, Car } from 'lucide-react'
import { api } from '../../lib/api'

export default function BuscadorVehiculosMultiple({ seleccionados, onCambiar }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrando, setMostrando] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function cerrarAlClickearAfuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setMostrando(false)
    }
    document.addEventListener('mousedown', cerrarAlClickearAfuera)
    return () => document.removeEventListener('mousedown', cerrarAlClickearAfuera)
  }, [])

  useEffect(() => {
    if (!texto.trim()) { setResultados([]); return }
    const timeoutId = setTimeout(async () => {
      try {
        const res = await api.get(`/api/vehiculos?busqueda=${encodeURIComponent(texto)}&pageSize=10`)
        setResultados(res.data)
        setMostrando(true)
      } catch {
        // silencioso
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [texto])

  function agregar(v) {
    if (seleccionados.some((s) => s.id === v.id)) return
    onCambiar([...seleccionados, v])
    setTexto('')
    setMostrando(false)
  }

  function quitar(id) {
    onCambiar(seleccionados.filter((s) => s.id !== id))
  }

  return (
    <div>
      <div className="relative" ref={ref}>
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onFocus={() => resultados.length > 0 && setMostrando(true)}
            placeholder="Buscar por marca, modelo, ID, patente..."
            className="w-full text-sm border border-slate-400 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {mostrando && resultados.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {resultados.map((v) => (
              <button
                type="button"
                key={v.id}
                onClick={() => agregar(v)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <div className="font-medium text-slate-800">{v.marcas?.nombre} {v.modelos?.nombre}</div>
                <div className="text-xs text-slate-500">ID: {v.id} · Patente: {v.patente || '-'}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {seleccionados.length === 0 ? (
        <div className="mt-3 flex flex-col items-center justify-center py-8 text-slate-400 border border-dashed border-slate-300 rounded-lg">
          <Car size={24} className="mb-2 text-slate-300" />
          <p className="text-sm">No hay vehículos seleccionados</p>
          <p className="text-xs">Busca vehículos en stock arriba</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {seleccionados.map((v) => (
            <li key={v.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-slate-700">{v.marcas?.nombre} {v.modelos?.nombre} <span className="text-slate-400">({v.patente || `ID ${v.id}`})</span></span>
              <button type="button" onClick={() => quitar(v.id)} className="text-slate-400 hover:text-red-600">
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
