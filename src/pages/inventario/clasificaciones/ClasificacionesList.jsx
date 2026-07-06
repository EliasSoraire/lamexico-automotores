import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2, Tags } from 'lucide-react'
import { api } from '../../../lib/api'
import Paginacion from '../../../components/ui/Paginacion'
import ConfirmarEliminacion from '../../../components/ui/ConfirmarEliminacion'

export default function ClasificacionesList() {
  const navigate = useNavigate()

  const [clasificaciones, setClasificaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0 })

  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      const res = await api.get(`/api/clasificaciones?${params.toString()}`)
      setClasificaciones(res.data)
      setPaginacion({ total: res.total, totalPages: res.totalPages })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function confirmarEliminar() {
    if (!aEliminar) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await api.delete(`/api/clasificaciones/detalle?id=${aEliminar.id}`)
      setAEliminar(null)
      cargar()
    } catch (err) {
      setErrorEliminar(err.message)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Tags size={20} className="text-blue-600" />
          Clasificaciones de Vehículos
        </h1>
        <button type="button"
          onClick={() => navigate('/inventario/clasificaciones/nueva')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          <Plus size={16} />
          Nueva Clasificación
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-700 uppercase">
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-600">
                  Cargando...
                </td>
              </tr>
            )}
            {!cargando && clasificaciones.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-600">
                  No hay clasificaciones registradas.
                </td>
              </tr>
            )}
            {!cargando &&
              clasificaciones.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div
                      className="w-6 h-6 rounded-full border border-slate-400"
                      style={{ backgroundColor: c.color_hex }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{c.nombre}</td>
                  <td className="px-4 py-3 text-slate-700">{c.descripcion || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.activo ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <button type="button"
                        onClick={() => navigate(`/inventario/clasificaciones/${c.id}`)}
                        className="hover:text-blue-600"
                        title="Ver"
                      >
                        <Eye size={16} />
                      </button>
                      <button type="button"
                        onClick={() => navigate(`/inventario/clasificaciones/${c.id}/editar`)}
                        className="hover:text-amber-600"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button type="button"
                        onClick={() => setAEliminar(c)}
                        className="hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>

        <div className="px-4">
          <Paginacion
            page={page}
            totalPages={paginacion.totalPages}
            total={paginacion.total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>

      <ConfirmarEliminacion
        abierto={!!aEliminar}
        nombre={aEliminar?.nombre}
        cargando={eliminando}
        error={errorEliminar}
        onCancelar={() => {
          setAEliminar(null)
          setErrorEliminar('')
        }}
        onConfirmar={confirmarEliminar}
      />
    </div>
  )
}
