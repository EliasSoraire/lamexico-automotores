import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Image as ImageIcon, Trash2, Star } from 'lucide-react'
import { api } from '../../lib/api'

const FotosVehiculo = forwardRef(function FotosVehiculo({ vehiculoId }, ref) {
  const [fotos, setFotos] = useState([])
  const [pendientes, setPendientes] = useState([]) // { file, previewUrl } - solo cuando vehiculoId es null todavía
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (vehiculoId) cargarFotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculoId])

  async function cargarFotos() {
    try {
      const res = await api.get(`/api/vehiculos/fotos?vehiculo_id=${vehiculoId}`)
      setFotos(res.data)
    } catch (err) {
      setError(err.message)
    }
  }

  function seleccionarArchivos(files) {
    const nuevos = Array.from(files).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
    setPendientes((p) => [...p, ...nuevos])
  }

  function quitarPendiente(index) {
    setPendientes((p) => p.filter((_, i) => i !== index))
  }

  async function subirArchivo(file, idVehiculo, esPrincipal, orden) {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`"${file.name}" supera los 10MB y no se subió`)
    }

    const firma = await api.post('/api/vehiculos/fotos', {
      accion: 'firmar',
      vehiculo_id: idVehiculo,
      nombre_archivo: file.name,
    })

    const subida = await fetch(firma.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })

    if (!subida.ok) throw new Error(`No se pudo subir "${file.name}"`)

    await api.post('/api/vehiculos/fotos', {
      accion: 'guardar',
      vehiculo_id: idVehiculo,
      url_archivo: firma.publicUrl,
      nombre_archivo: file.name,
      tamanio_bytes: file.size,
      es_principal: esPrincipal,
      orden,
    })
  }

  // Se llama desde el formulario padre una vez que el vehículo ya tiene ID
  // (recién creado), para subir las fotos que se seleccionaron antes de guardar.
  useImperativeHandle(ref, () => ({
    async subirPendientes(idVehiculo) {
      for (let i = 0; i < pendientes.length; i++) {
        await subirArchivo(pendientes[i].file, idVehiculo, i === 0, i)
      }
    },
    tienePendientes: pendientes.length > 0,
  }))

  async function handleSeleccion(files) {
    setError('')
    if (!vehiculoId) {
      seleccionarArchivos(files)
      return
    }
    setSubiendo(true)
    try {
      for (const file of Array.from(files)) {
        await subirArchivo(file, vehiculoId, fotos.length === 0, fotos.length)
      }
      await cargarFotos()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendo(false)
    }
  }

  async function eliminarFoto(id) {
    try {
      await api.delete(`/api/vehiculos/fotos?id=${id}`)
      cargarFotos()
    } catch (err) {
      setError(err.message)
    }
  }

  async function marcarPrincipal(foto) {
    try {
      await api.post('/api/vehiculos/fotos', {
        accion: 'guardar',
        vehiculo_id: vehiculoId,
        url_archivo: foto.url_archivo,
        nombre_archivo: foto.nombre_archivo,
        es_principal: true,
        orden: 0,
      })
      cargarFotos()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleSeleccion(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-400 rounded-xl py-10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50"
      >
        <ImageIcon size={28} className="text-slate-700" />
        <p className="text-sm text-blue-600 font-medium">
          {subiendo ? 'Subiendo...' : 'Seleccionar archivos o arrastrar y soltar'}
        </p>
        <p className="text-xs text-slate-600">Imágenes hasta 10MB c/u. Máximo 30 imágenes por vehículo.</p>
        {!vehiculoId && (
          <p className="text-xs text-amber-600">Se subirán automáticamente al guardar el vehículo.</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleSeleccion(e.target.files)}
        />
      </div>

      {/* Fotos ya subidas (modo edición) */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {fotos.map((foto) => (
            <div key={foto.id} className="relative group border border-slate-400 rounded-lg overflow-hidden">
              <img src={foto.url_archivo} alt={foto.nombre_archivo} className="w-full h-28 object-cover" />
              {foto.es_principal && (
                <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star size={10} /> Principal
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!foto.es_principal && (
                  <button type="button" onClick={() => marcarPrincipal(foto)} className="bg-white/90 rounded-full p-1.5 hover:bg-white" title="Marcar como principal">
                    <Star size={14} className="text-blue-600" />
                  </button>
                )}
                <button type="button" onClick={() => eliminarFoto(foto.id)} className="bg-white/90 rounded-full p-1.5 hover:bg-white" title="Eliminar">
                  <Trash2 size={14} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fotos pendientes (modo creación, antes de guardar) */}
      {pendientes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {pendientes.map((p, i) => (
            <div key={i} className="relative group border border-amber-200 rounded-lg overflow-hidden">
              <img src={p.previewUrl} alt={p.file.name} className="w-full h-28 object-cover" />
              <span className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">Pendiente</span>
              <button type="button"
                onClick={() => quitarPendiente(i)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Quitar"
              >
                <Trash2 size={16} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

export default FotosVehiculo
