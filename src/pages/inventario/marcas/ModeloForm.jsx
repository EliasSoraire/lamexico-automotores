import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { api } from '../../../lib/api'

export default function ModeloForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const marcaIdDesdeUrl = searchParams.get('marca_id')
  const esEdicion = !!id
  const navigate = useNavigate()

  const [marcaId, setMarcaId] = useState(marcaIdDesdeUrl || '')
  const [nombreMarca, setNombreMarca] = useState('')
  const [monedas, setMonedas] = useState([])
  const [form, setForm] = useState({
    nombre: '',
    version: '',
    anio: '',
    moneda_id: '',
    precio_lista: '',
    descripcion: '',
    activo: true,
  })
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        if (esEdicion) {
          const res = await api.get(`/api/modelos/detalle?id=${id}`)
          setForm({
            nombre: res.data.nombre || '',
            version: res.data.version || '',
            anio: res.data.anio || '',
            moneda_id: res.data.moneda_id || '',
            precio_lista: res.data.precio_lista ?? '',
            descripcion: res.data.descripcion || '',
            activo: res.data.activo,
          })
          setMarcaId(res.data.marca_id)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    async function cargarNombreMarca() {
      if (!marcaId) return
      try {
        const res = await api.get(`/api/marcas/detalle?id=${marcaId}`)
        setNombreMarca(res.data.nombre)
      } catch {
        // silencioso: si falla, simplemente no mostramos el nombre
      }
    }
    cargarNombreMarca()
  }, [marcaId])

  useEffect(() => {
    async function cargarMonedas() {
      try {
        const res = await api.get('/api/monedas')
        setMonedas(res.data)
      } catch {
        // silencioso: el selector queda vacío si falla
      }
    }
    cargarMonedas()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      const payload = {
        ...form,
        anio: form.anio === '' ? null : Number(form.anio),
        precio_lista: form.precio_lista === '' ? null : Number(form.precio_lista),
        moneda_id: form.moneda_id || null,
      }
      if (esEdicion) {
        await api.put(`/api/modelos/detalle?id=${id}`, payload)
      } else {
        await api.post('/api/modelos', { ...payload, marca_id: marcaId })
      }
      navigate(`/inventario/marcas-modelos/${marcaId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return <div className="text-sm text-slate-400 py-10 text-center">Cargando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800">
          {esEdicion ? 'Editar Modelo' : 'Crear Nuevo Modelo'}
        </h1>
        <button
          onClick={() => navigate(marcaId ? `/inventario/marcas-modelos/${marcaId}` : '/inventario/marcas-modelos')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
        >
          <ArrowLeft size={15} />
          Volver
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Marca</label>
            <input
              disabled
              value={nombreMarca}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Nombre del Modelo <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Corolla, Focus, Civic"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Versión</label>
            <input
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              placeholder="Ej: XEI 1.8, SE Plus, LX"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Año</label>
            <input
              type="number"
              value={form.anio}
              onChange={(e) => setForm({ ...form, anio: e.target.value })}
              placeholder="Ej: 2024"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Precio de Lista</label>
            <div className="flex gap-2">
              <select
                value={form.moneda_id}
                onChange={(e) => setForm({ ...form, moneda_id: e.target.value })}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
              >
                <option value="">Moneda</option>
                {monedas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.simbolo} {m.codigo}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precio_lista}
                onChange={(e) => setForm({ ...form, precio_lista: e.target.value })}
                placeholder="0.00"
                className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Equipamiento / Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={3}
              placeholder="Descripción detallada del modelo, características principales, etc."
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Modelo activo
            </label>
            <p className="text-xs text-slate-400 mt-1 ml-6">
              Los modelos activos aparecerán disponibles para crear vehículos
            </p>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => navigate(marcaId ? `/inventario/marcas-modelos/${marcaId}` : '/inventario/marcas-modelos')}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2"
            >
              <Save size={15} />
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Modelo' : 'Crear Modelo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
