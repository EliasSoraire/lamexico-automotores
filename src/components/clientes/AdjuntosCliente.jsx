import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Paperclip, Trash2, FileText, Image as ImageIcon } from 'lucide-react'
import { api } from '../../lib/api'

const AdjuntosCliente = forwardRef(function AdjuntosCliente({ clienteId }, ref) {
  const [adjuntos, setAdjuntos] = useState([])
  const [pendientes, setPendientes] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (clienteId) cargarAdjuntos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId])

  async function cargarAdjuntos() {
    try {
      const res = await api.get(`/api/clientes/adjuntos?cliente_id=${clienteId}`)
      setAdjuntos(res.data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function subirArchivo(file, idCliente) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`"${file.name}" supera los 5MB y no se subió`)
    }

    const firma = await api.post('/api/clientes/adjuntos', {
      accion: 'firmar',
      cliente_id: idCliente,
      nombre_archivo: file.name,
    })

    const subida = await fetch(firma.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })

    if (!subida.ok) throw new Error(`No se pudo subir "${file.name}"`)

    await api.post('/api/clientes/adjuntos', {
      accion: 'guardar',
      cliente_id: idCliente,
      url_archivo: firma.publicUrl,
      nombre_archivo: file.name,
      tamanio_bytes: file.size,
      tipo_archivo: file.type,
    })
  }

  useImperativeHandle(ref, () => ({
    async subirPendientes(idCliente) {
      for (const p of pendientes) {
        await subirArchivo(p.file, idCliente)
      }
    },
    tienePendientes: pendientes.length > 0,
  }))

  async function handleSeleccion(files) {
    setError('')
    if (!clienteId) {
      setPendientes((p) => [...p, ...Array.from(files).map((file) => ({ file }))])
      return
    }
    setSubiendo(true)
    try {
      for (const file of Array.from(files)) {
        await subirArchivo(file, clienteId)
      }
      await cargarAdjuntos()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendo(false)
    }
  }

  async function eliminarAdjunto(id) {
    try {
      await api.delete(`/api/clientes/adjuntos?id=${id}`)
      cargarAdjuntos()
    } catch (err) {
      setError(err.message)
    }
  }

  function quitarPendiente(index) {
    setPendientes((p) => p.filter((_, i) => i !== index))
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
        <ImageIcon size={28} className="text-slate-400" />
        <p className="text-sm text-blue-600 font-medium">
          {subiendo ? 'Subiendo...' : 'Seleccionar archivos o arrastrar y soltar'}
        </p>
        <p className="text-xs text-slate-600">Imágenes o documentos (máx. 5MB)</p>
        {!clienteId && (
          <p className="text-xs text-amber-600">Se subirán automáticamente al guardar el cliente.</p>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleSeleccion(e.target.files)}
        />
      </div>

      {adjuntos.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {adjuntos.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <a href={a.url_archivo} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline truncate">
                <FileText size={15} className="shrink-0" />
                {a.nombre_archivo}
              </a>
              <button type="button" onClick={() => eliminarAdjunto(a.id)} className="text-slate-400 hover:text-red-600 shrink-0">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {pendientes.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 border border-amber-200 rounded-lg">
          {pendientes.map((p, i) => (
            <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-slate-600 truncate">
                <Paperclip size={15} className="shrink-0" />
                {p.file.name} <span className="text-amber-600 text-xs">(pendiente)</span>
              </span>
              <button type="button" onClick={() => quitarPendiente(i)} className="text-slate-400 hover:text-red-600 shrink-0">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})

export default AdjuntosCliente
