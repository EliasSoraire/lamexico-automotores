import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, X, ArrowLeft, Trash2 } from 'lucide-react'
import { api } from '../../../lib/api'
import BuscadorCliente from '../../../components/consultas/BuscadorCliente'

const TIPOS_DOCUMENTO = ['DNI', 'CUIT', 'CUIL', 'Pasaporte', 'Otro']

export default function FacturaForm() {
  const navigate = useNavigate()

  const [tipoComprobanteId, setTipoComprobanteId] = useState('')
  const [tiposComprobante, setTiposComprobante] = useState([])
  const [puntoVenta, setPuntoVenta] = useState(null)

  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [tipoDocumento, setTipoDocumento] = useState('')
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [monedaId, setMonedaId] = useState('')
  const [monedas, setMonedas] = useState([])

  const [items, setItems] = useState([])
  const [nuevoItem, setNuevoItem] = useState({ descripcion: '', cantidad: 1, precio_unitario: '' })
  const [ivaManual, setIvaManual] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/api/catalogos-finanzas?tipo=tipos-comprobante'),
      api.get('/api/catalogos-finanzas?tipo=puntos-venta'),
      api.get('/api/monedas'),
    ]).then(([tipos, puntos, mon]) => {
      setTiposComprobante(tipos.data)
      setPuntoVenta(puntos.data[0] || null)
      setMonedas(mon.data)
      const ars = mon.data.find((m) => m.codigo === 'ARS')
      if (ars) setMonedaId(ars.id)
    }).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (clienteSeleccionado && !numeroDocumento) {
      setNumeroDocumento(clienteSeleccionado.numero_documento || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteSeleccionado])

  const subtotal = items.reduce((acc, it) => acc + (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0), 0)
  const iva = ivaManual !== '' ? Number(ivaManual) : Math.round(subtotal * 0.21 * 100) / 100
  const total = subtotal + iva

  function agregarItem() {
    if (!nuevoItem.descripcion.trim() || !nuevoItem.precio_unitario) return
    setItems((prev) => [...prev, { ...nuevoItem, cantidad: Number(nuevoItem.cantidad) || 1, precio_unitario: Number(nuevoItem.precio_unitario) }])
    setNuevoItem({ descripcion: '', cantidad: 1, precio_unitario: '' })
  }

  function quitarItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!tipoComprobanteId) { setError('Seleccioná el Tipo de Comprobante'); return }
    if (!clienteSeleccionado) { setError('Seleccioná el Cliente'); return }
    if (!monedaId) { setError('Seleccioná la Moneda'); return }
    if (items.length === 0) { setError('Agregá al menos un ítem a la factura'); return }

    setGuardando(true)
    try {
      await api.post('/api/facturas', {
        tipo_comprobante_id: tipoComprobanteId,
        venta_id: ventaSeleccionada?.id || null,
        cliente_id: clienteSeleccionado.id,
        tipo_documento: tipoDocumento || null,
        numero_documento: numeroDocumento || null,
        moneda_id: monedaId,
        items,
        iva: ivaManual !== '' ? ivaManual : undefined,
      })
      navigate('/finanzas/facturas', { state: { creada: true } })
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          Nueva Factura
        </h1>
        <button type="button" onClick={() => navigate('/finanzas/facturas')} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50">
          <ArrowLeft size={14} /> Volver
        </button>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6 max-w-4xl">
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Tipo de Comprobante *</label>
              <select value={tipoComprobanteId} onChange={(e) => setTipoComprobanteId(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
                <option value="">Seleccionar tipo</option>
                {tiposComprobante.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Punto de Venta</label>
              <input disabled value={puntoVenta?.numero || ''} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 bg-slate-50 text-slate-600" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Número de Comprobante</label>
              <input disabled value="Se asigna al guardar" className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Venta (opcional)</label>
              <BuscadorVenta ventaSeleccionada={ventaSeleccionada} onSeleccionar={async (v) => {
                setVentaSeleccionada(v)
                if (v) {
                  try {
                    const res = await api.get(`/api/ventas/detalle?id=${v.id}`)
                    if (res.data?.clientes) setClienteSeleccionado(res.data.clientes)
                    if (res.data?.moneda_id) setMonedaId(res.data.moneda_id)
                  } catch { /* silencioso */ }
                }
              }} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Cliente *</label>
              <BuscadorCliente clienteSeleccionado={clienteSeleccionado} onSeleccionar={setClienteSeleccionado} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Tipo de Documento</label>
              <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
                <option value="">Seleccionar...</option>
                {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Número de Documento</label>
              <input value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} placeholder="Ej: 12345678" className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Moneda *</label>
              <select value={monedaId} onChange={(e) => setMonedaId(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
                <option value="">Seleccionar</option>
                {monedas.map((m) => <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>)}
              </select>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Ítems de la Factura</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end mb-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Descripción</label>
                <input value={nuevoItem.descripcion} onChange={(e) => setNuevoItem({ ...nuevoItem, descripcion: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Cantidad</label>
                <input type="number" value={nuevoItem.cantidad} onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Precio Unitario</label>
                <input type="number" value={nuevoItem.precio_unitario} onChange={(e) => setNuevoItem({ ...nuevoItem, precio_unitario: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
              </div>
            </div>
            <button type="button" onClick={agregarItem} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-1.5 mb-3">
              <Plus size={14} /> Agregar Item
            </button>

            {items.length > 0 && (
              <div className="space-y-1.5">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2">
                    <span className="text-slate-700">{it.descripcion} — {it.cantidad} x ${Number(it.precio_unitario).toLocaleString('es-AR')}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-800">${(it.cantidad * it.precio_unitario).toLocaleString('es-AR')}</span>
                      <button type="button" onClick={() => quitarItem(idx)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Subtotal</label>
              <input disabled value={`$${subtotal.toLocaleString('es-AR')}`} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 bg-slate-50 text-slate-600" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">IVA 21%</label>
              <input type="number" value={ivaManual} onChange={(e) => setIvaManual(e.target.value)} placeholder={String(Math.round(subtotal * 0.21 * 100) / 100)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Total</label>
              <input disabled value={`$${total.toLocaleString('es-AR')}`} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 bg-slate-50 text-slate-800 font-semibold" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => navigate('/finanzas/facturas')} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2">
              {guardando ? 'Creando...' : 'Crear Factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BuscadorVenta({ ventaSeleccionada, onSeleccionar }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrando, setMostrando] = useState(false)

  useEffect(() => {
    if (!texto.trim()) { setResultados([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/api/ventas?busqueda=${encodeURIComponent(texto)}&pageSize=10`)
        setResultados(res.data)
        setMostrando(true)
      } catch { /* silencioso */ }
    }, 300)
    return () => clearTimeout(t)
  }, [texto])

  if (ventaSeleccionada) {
    return (
      <div className="flex items-center justify-between border border-slate-400 rounded-lg px-3 py-2 bg-blue-50">
        <span className="text-sm text-slate-800 font-medium">{ventaSeleccionada.numero_venta}</span>
        <button type="button" onClick={() => onSeleccionar(null)} className="text-slate-500 hover:text-red-600"><X size={16} /></button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onFocus={() => resultados.length > 0 && setMostrando(true)}
        placeholder="Sin venta asociada"
        className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2"
      />
      {mostrando && resultados.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {resultados.map((v) => (
            <button type="button" key={v.id} onClick={() => { onSeleccionar(v); setTexto(''); setMostrando(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0">
              <div className="font-medium text-slate-800">{v.numero_venta}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
