import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { api } from '../../lib/api'

export default function BuscadorCliente({ clienteSeleccionado, onSeleccionar }) {
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
        const res = await api.get(`/api/clientes?busqueda=${encodeURIComponent(texto)}&pageSize=10`)
        setResultados(res.data)
        setMostrando(true)
      } catch {
        // silencioso
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [texto])

  function nombreCliente(c) {
    return c.tipo_persona === 'Jurídica' ? c.razon_social : `${c.nombre || ''} ${c.apellido || ''}`.trim()
  }

  if (clienteSeleccionado) {
    return (
      <div className="flex items-center justify-between border border-slate-400 rounded-lg px-3 py-2 bg-blue-50">
        <span className="text-sm text-slate-800 font-medium">{nombreCliente(clienteSeleccionado)}</span>
        <button type="button" onClick={() => onSeleccionar(null)} className="text-slate-500 hover:text-red-600">
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onFocus={() => resultados.length > 0 && setMostrando(true)}
          placeholder="Buscar cliente por nombre, empresa, documento, email..."
          className="w-full text-sm border border-slate-400 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {mostrando && resultados.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {resultados.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => { onSeleccionar(c); setTexto(''); setMostrando(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              <div className="font-medium text-slate-800">{nombreCliente(c)}</div>
              <div className="text-xs text-slate-500">{c.numero_documento || c.email || ''}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
