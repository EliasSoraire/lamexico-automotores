import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Ban } from 'lucide-react'
import { api } from '../../../lib/api'

function nombreCliente(c) {
  if (!c) return '—'
  return c.tipo_persona === 'Jurídica' ? c.razon_social : `${c.nombre || ''} ${c.apellido || ''}`.trim()
}

export default function FacturaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [factura, setFactura] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [anulando, setAnulando] = useState(false)
  const [confirmarAnular, setConfirmarAnular] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const res = await api.get(`/api/facturas/detalle?id=${id}`)
      setFactura(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function anular() {
    setAnulando(true)
    try {
      await api.put(`/api/facturas/detalle?id=${id}`, {})
      setConfirmarAnular(false)
      cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setAnulando(false)
    }
  }

  if (cargando) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>
  if (error && !factura) return <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
  if (!factura) return null

  const anulada = factura.estados_factura?.nombre === 'Anulada'

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          {factura.tipos_comprobante?.nombre} {factura.puntos_venta?.numero}-{factura.numero_comprobante}
        </h1>
        <div className="flex items-center gap-2">
          {!anulada && (
            <button type="button" onClick={() => setConfirmarAnular(true)} className="flex items-center gap-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-lg px-3 py-1.5 hover:bg-red-50">
              <Ban size={14} /> Anular
            </button>
          )}
          <button type="button" onClick={() => navigate('/finanzas/facturas')} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">
            Volver
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="bg-white border border-slate-400 rounded-xl p-6 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Cliente</div>
            <div className="font-medium text-slate-800">{nombreCliente(factura.clientes)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Venta asociada</div>
            <div className="font-medium text-slate-800">{factura.ventas?.numero_venta || 'Sin venta asociada'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Fecha de Emisión</div>
            <div className="font-medium text-slate-800">{factura.fecha_emision}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Estado</div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${anulada ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {factura.estados_factura?.nombre || '—'}
            </span>
          </div>
          {factura.tipo_documento && (
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Documento</div>
              <div className="font-medium text-slate-800">{factura.tipo_documento} {factura.numero_documento}</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Ítems</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Precio Unitario</th>
                <th className="px-4 py-3">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {factura.items.map((it) => (
                <tr key={it.id}>
                  <td className="px-4 py-3 text-slate-700">{it.descripcion}</td>
                  <td className="px-4 py-3 text-slate-700">{it.cantidad}</td>
                  <td className="px-4 py-3 text-slate-700">${Number(it.precio_unitario).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-slate-700">${Number(it.subtotal).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm ml-auto space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="text-slate-800">${Number(factura.subtotal).toLocaleString('es-AR')}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">IVA</span><span className="text-slate-800">${Number(factura.iva).toLocaleString('es-AR')}</span></div>
        <div className="flex justify-between font-bold border-t border-slate-200 pt-1.5"><span className="text-slate-700">Total</span><span className="text-slate-800">${Number(factura.total).toLocaleString('es-AR')}</span></div>
      </div>

      {confirmarAnular && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="font-semibold text-slate-800 mb-2">¿Anular esta factura?</h3>
            <p className="text-sm text-slate-600 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmarAnular(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button type="button" disabled={anulando} onClick={anular} className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium">
                {anulando ? 'Anulando...' : 'Sí, anular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
