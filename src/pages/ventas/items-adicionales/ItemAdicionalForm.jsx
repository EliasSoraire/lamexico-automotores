import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'
import { api } from '../../../lib/api'

export default function ItemAdicionalForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState({
    codigo: '', nombre: '', descripcion: '', categoria_id: '', precio: '', moneda_id: '', observaciones: '', activo: true,
  })
  const [categorias, setCategorias] = useState([])
  const [monedas, setMonedas] = useState([])
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/categorias-items').then((r) => setCategorias(r.data)).catch(() => {})
    api.get('/api/monedas').then((r) => setMonedas(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!esEdicion) return
    async function cargar() {
      try {
        const res = await api.get(`/api/items-adicionales/detalle?id=${id}`)
        setForm({
          codigo: res.data.codigo || '',
          nombre: res.data.nombre || '',
          descripcion: res.data.descripcion || '',
          categoria_id: res.data.categoria_id || '',
          precio: res.data.precio ?? '',
          moneda_id: res.data.moneda_id || '',
          observaciones: res.data.observaciones || '',
          activo: res.data.activo,
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id, esEdicion])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      const payload = { ...form, precio: form.precio === '' ? null : Number(form.precio), moneda_id: form.moneda_id || null }
      if (esEdicion) {
        await api.put(`/api/items-adicionales/detalle?id=${id}`, payload)
      } else {
        await api.post('/api/items-adicionales', payload)
      }
      navigate('/ventas/items-adicionales')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-5">{esEdicion ? 'Editar Ítem Adicional' : 'Nuevo Ítem Adicional'}</h1>

      <div className="bg-white border border-slate-400 rounded-xl p-6 max-w-2xl">
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Código *</label>
              <input required value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Nombre *</label>
              <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2}
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Categoría *</label>
            <select required value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar categoría</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Precio (opcional)</label>
              <input type="number" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })}
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-slate-600 mt-1">Puede dejarlo vacío si el precio se definirá al momento de la venta.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Moneda (opcional)</label>
              <select value={form.moneda_id} onChange={(e) => setForm({ ...form, moneda_id: e.target.value })}
                className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar moneda</option>
                {monedas.map((m) => <option key={m.id} value={m.id}>{m.simbolo} - {m.nombre}</option>)}
              </select>
              <p className="text-xs text-slate-600 mt-1">Si se deja vacío, se usará la moneda de la venta cuando se agregue el ítem.</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Observaciones</label>
            <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} rows={2}
              className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="rounded border-slate-400 text-blue-600" />
            Activo
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => navigate('/ventas/items-adicionales')} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={guardando} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2">
              <Save size={15} />
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Ítem' : 'Crear Ítem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
