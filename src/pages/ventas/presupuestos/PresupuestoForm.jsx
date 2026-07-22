import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Search, X, Plus } from 'lucide-react'
import { api } from '../../../lib/api'
import { useAuth } from '../../../context/AuthContext'
import BuscadorCliente from '../../../components/consultas/BuscadorCliente'
import ModalCrearRapido from '../../../components/ui/ModalCrearRapido'

export default function PresupuestoForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()
  const { usuario } = useAuth()

  // Condiciones del presupuesto
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [vencimiento, setVencimiento] = useState('')
  const [monedaId, setMonedaId] = useState('')
  const [monedas, setMonedas] = useState([])

  // Fuente del contacto
  const [fuenteContacto, setFuenteContacto] = useState('consulta') // 'consulta' | 'cliente' | 'prospecto'
  const [consultaSeleccionada, setConsultaSeleccionada] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [prospecto, setProspecto] = useState({ nombre: '', apellido: '', telefono: '', email: '' })

  // Unidad cotizada
  const [vehiculoStock, setVehiculoStock] = useState(null)
  const [modeloSinUnidad, setModeloSinUnidad] = useState(null)

  // Estructura económica
  const [precioBase, setPrecioBase] = useState(0)
  const [items, setItems] = useState([])

  // Permutas y forma de pago (se completan en la Parte 5)
  const [permutas, setPermutas] = useState([])
  const [formasPago, setFormasPago] = useState([])
  const [formaPagoIndefinida, setFormaPagoIndefinida] = useState(false)
  const [observaciones, setObservaciones] = useState('')

  const [mostrarBuscarVehiculoPermuta, setMostrarBuscarVehiculoPermuta] = useState(false)
  const [mostrarCrearVehiculoPermuta, setMostrarCrearVehiculoPermuta] = useState(false)
  const [mostrarAgregarFormaPago, setMostrarAgregarFormaPago] = useState(false)

  const [estadoBorradorId, setEstadoBorradorId] = useState('')
  const [mostrarSelectorItem, setMostrarSelectorItem] = useState(false)
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/api/monedas'),
      api.get('/api/catalogos-presupuesto?tipo=estados-presupuesto'),
    ]).then(([mon, est]) => {
      setMonedas(mon.data)
      const ars = mon.data.find((m) => m.codigo === 'ARS')
      if (ars && !esEdicion) setMonedaId(ars.id)
      const borrador = est.data.find((e) => e.nombre === 'Borrador')
      if (borrador) setEstadoBorradorId(borrador.id)
    }).catch((err) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!esEdicion) {
      setCargando(false)
      return
    }
    // La carga completa de un presupuesto existente (con ítems, permutas y forma de pago)
    // se termina de conectar en la Parte 5, cuando esas secciones ya existan en el formulario.
    async function cargar() {
      try {
        const res = await api.get(`/api/presupuestos/detalle?id=${id}`)
        const p = res.data
        setFecha(p.fecha)
        setVencimiento(p.vencimiento)
        setMonedaId(p.moneda_id)
        if (p.cliente_id) {
          setFuenteContacto('cliente')
          setClienteSeleccionado(p.clientes)
        } else if (p.prospecto_nombre) {
          setFuenteContacto('prospecto')
          setProspecto({
            nombre: p.prospecto_nombre || '',
            apellido: p.prospecto_apellido || '',
            telefono: p.prospecto_telefono || '',
            email: p.prospecto_email || '',
          })
        }
        if (res.vehiculoStock) setVehiculoStock(res.vehiculoStock)
        if (res.modeloSinUnidad) setModeloSinUnidad(res.modeloSinUnidad)
        setPrecioBase(p.precio_base || 0)
        setItems((res.items || []).map((it) => ({
          item_catalogo_id: it.item_catalogo_id,
          descripcion: it.descripcion || it.items_catalogo?.nombre || '',
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
        })))
        setPermutas((res.permutas || []).map((rp) => ({
          tipo: 'existente',
          vehiculo_id: rp.vehiculo_id,
          etiqueta: `${rp.vehiculos?.marcas?.nombre || ''} ${rp.vehiculos?.modelos?.nombre || ''} (${rp.vehiculos?.patente || `ID ${rp.vehiculo_id}`})`,
          valor_permuta: rp.valor_permuta,
        })))
        setFormasPago((res.formasPago || []).map((fp) => ({
          tipo_forma_pago_id: fp.tipo_forma_pago_id,
          etiqueta: fp.formas_pago_tipo?.nombre || '',
          moneda_id: fp.moneda_id,
          monto: fp.monto,
          observaciones: fp.observaciones,
          es_principal: fp.es_principal,
        })))
        setFormaPagoIndefinida(!!p.forma_pago_indefinida)
        setObservaciones(p.observaciones || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id, esEdicion])

  const totalItems = items.reduce((acc, it) => acc + (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0), 0)
  const totalPermutas = permutas.reduce((acc, p) => acc + (Number(p.valor_permuta) || 0), 0)
  const saldoAPagar = Number(precioBase) + totalItems - totalPermutas
  const saldoCubierto = formasPago.reduce((acc, f) => acc + (Number(f.monto) || 0), 0)
  const faltaCubrir = saldoAPagar - saldoCubierto

  function agregarPermutaExistente(vehiculo) {
    setPermutas((prev) => [...prev, { tipo: 'existente', vehiculo_id: vehiculo.id, etiqueta: `${vehiculo.marcas?.nombre} ${vehiculo.modelos?.nombre} (${vehiculo.patente || `ID ${vehiculo.id}`})`, valor_permuta: 0 }])
    setMostrarBuscarVehiculoPermuta(false)
  }

  function agregarPermutaNueva(datosVehiculo, valorPermuta) {
    setPermutas((prev) => [...prev, { tipo: 'nuevo', vehiculo_nuevo: datosVehiculo, etiqueta: `${datosVehiculo._marcaNombre} ${datosVehiculo._modeloNombre} (${datosVehiculo.patente || 'sin patente'})`, valor_permuta: valorPermuta }])
    setMostrarCrearVehiculoPermuta(false)
  }

  function actualizarValorPermuta(idx, valor) {
    setPermutas((prev) => prev.map((p, i) => (i === idx ? { ...p, valor_permuta: Number(valor) || 0 } : p)))
  }

  function quitarPermuta(idx) {
    setPermutas((prev) => prev.filter((_, i) => i !== idx))
  }

  function agregarFormaPago(datos) {
    setFormasPago((prev) => [...prev, datos])
    setMostrarAgregarFormaPago(false)
  }

  function quitarFormaPago(idx) {
    setFormasPago((prev) => prev.filter((_, i) => i !== idx))
  }

  function limpiarDatosVehiculoNuevo(datos) {
    const { _marcaNombre, _modeloNombre, ...resto } = datos
    return resto
  }

  function actualizarItem(idx, campo, valor) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)))
  }

  function quitarItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function validar() {
    if (!fecha || !vencimiento || !monedaId) return 'Fecha, Vencimiento y Moneda son obligatorios (Condiciones del presupuesto)'
    if (fuenteContacto === 'consulta' && !consultaSeleccionada) return 'Seleccioná una Consulta (Fuente del contacto)'
    if (fuenteContacto === 'cliente' && !clienteSeleccionado) return 'Seleccioná un Cliente (Fuente del contacto)'
    if (fuenteContacto === 'prospecto' && (!prospecto.nombre || !prospecto.apellido)) return 'Nombre y Apellido del prospecto son obligatorios (Fuente del contacto)'
    return null
  }

  async function handleGuardar() {
    setError('')
    const mensaje = validar()
    if (mensaje) { setError(mensaje); return }

    setGuardando(true)
    try {
      const payload = {
        fecha,
        vencimiento,
        moneda_id: monedaId,
        estado_id: estadoBorradorId,
        fuente_contacto: fuenteContacto,
        consulta_id: fuenteContacto === 'consulta' ? consultaSeleccionada?.id : null,
        cliente_id: fuenteContacto === 'cliente' ? clienteSeleccionado?.id : null,
        prospecto_nombre: fuenteContacto === 'prospecto' ? prospecto.nombre : null,
        prospecto_apellido: fuenteContacto === 'prospecto' ? prospecto.apellido : null,
        prospecto_telefono: fuenteContacto === 'prospecto' ? prospecto.telefono : null,
        prospecto_email: fuenteContacto === 'prospecto' ? prospecto.email : null,
        vehiculo_stock_id: vehiculoStock?.id || null,
        modelo_sin_unidad_id: modeloSinUnidad?.id || null,
        precio_base: precioBase,
        items: items.map((it) => ({
          item_catalogo_id: it.item_catalogo_id,
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
        })),
        permutas: permutas.map((p) => ({
          vehiculo_id: p.tipo === 'existente' ? p.vehiculo_id : null,
          vehiculo_nuevo: p.tipo === 'nuevo' ? limpiarDatosVehiculoNuevo(p.vehiculo_nuevo) : null,
          valor_permuta: p.valor_permuta,
        })),
        formas_pago: formasPago.map((f) => ({
          tipo_forma_pago_id: f.tipo_forma_pago_id,
          moneda_id: f.moneda_id || monedaId,
          monto: f.monto,
          observaciones: f.observaciones,
          es_principal: f.es_principal,
        })),
        forma_pago_indefinida: formaPagoIndefinida,
        observaciones,
      }

      if (esEdicion) {
        await api.put(`/api/presupuestos/detalle?id=${id}`, payload)
      } else {
        await api.post('/api/presupuestos', payload)
      }
      navigate('/ventas/presupuestos')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800">{esEdicion ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</h1>
        <button type="button" onClick={() => navigate('/ventas/presupuestos')} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50">
          <ArrowLeft size={14} /> Volver
        </button>
      </div>

      <div className="max-w-3xl space-y-4">
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        {/* Condiciones del presupuesto */}
        <div className="bg-white border border-slate-400 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Condiciones del presupuesto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Fecha *</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Vencimiento *</label>
              <input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Moneda *</label>
              <select value={monedaId} onChange={(e) => setMonedaId(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
                <option value="">Seleccionar</option>
                {monedas.map((m) => <option key={m.id} value={m.id}>{m.codigo} ({m.simbolo})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Vendedor *</label>
              <input disabled value={usuario?.nombre_completo || ''} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 bg-slate-50 text-slate-600" />
            </div>
          </div>
        </div>

        {/* Fuente del contacto */}
        <div className="bg-white border border-slate-400 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Fuente del contacto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            {[
              { valor: 'consulta', etiqueta: 'Consulta existente' },
              { valor: 'cliente', etiqueta: 'Cliente existente' },
              { valor: 'prospecto', etiqueta: 'Prospecto nuevo' },
            ].map((op) => (
              <button
                key={op.valor}
                type="button"
                onClick={() => setFuenteContacto(op.valor)}
                className={`text-sm font-medium rounded-lg px-4 py-2 ${
                  fuenteContacto === op.valor ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {op.etiqueta}
              </button>
            ))}
          </div>

          {fuenteContacto === 'consulta' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Consulta *</label>
              <BuscadorConsulta consultaSeleccionada={consultaSeleccionada} onSeleccionar={setConsultaSeleccionada} />
            </div>
          )}

          {fuenteContacto === 'cliente' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Cliente *</label>
              <BuscadorCliente clienteSeleccionado={clienteSeleccionado} onSeleccionar={setClienteSeleccionado} />
            </div>
          )}

          {fuenteContacto === 'prospecto' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Nombre *</label>
                <input value={prospecto.nombre} onChange={(e) => setProspecto({ ...prospecto, nombre: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Apellido *</label>
                <input value={prospecto.apellido} onChange={(e) => setProspecto({ ...prospecto, apellido: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Teléfono</label>
                <input value={prospecto.telefono} onChange={(e) => setProspecto({ ...prospecto, telefono: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
                <input type="email" value={prospecto.email} onChange={(e) => setProspecto({ ...prospecto, email: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
              </div>
            </div>
          )}
        </div>

        {/* Unidad cotizada */}
        <div className="bg-white border border-slate-400 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Unidad cotizada</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Vehículo de stock</label>
              <BuscadorVehiculoStock
                vehiculoSeleccionado={vehiculoStock}
                onSeleccionar={(v) => { setVehiculoStock(v); if (v) setModeloSinUnidad(null) }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Modelo sin unidad</label>
              <BuscadorModeloSinUnidad
                modeloSeleccionado={modeloSinUnidad}
                onSeleccionar={(m) => { setModeloSinUnidad(m); if (m) setVehiculoStock(null) }}
              />
            </div>
          </div>
        </div>
        {/* Estructura económica */}
        <div className="bg-white border border-slate-400 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Estructura económica</h3>

          <div className="mb-5">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Precio base *</label>
            <div className="flex">
              <span className="flex items-center px-3 border border-r-0 border-slate-400 rounded-l-lg bg-slate-50 text-slate-600 text-sm">$</span>
              <input
                type="number"
                value={precioBase}
                onChange={(e) => setPrecioBase(e.target.value === '' ? 0 : Number(e.target.value))}
                className="flex-1 text-sm border border-slate-400 rounded-r-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Ítems adicionales</p>
              <p className="text-xs text-slate-500">Gastos, accesorios, gestoría o cualquier cargo que sume al presupuesto.</p>
            </div>
            <button type="button" onClick={() => setMostrarSelectorItem(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-3 py-1.5">
              <Plus size={15} /> Agregar item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="border border-dashed border-slate-300 rounded-lg py-6 text-center text-sm text-slate-500">
              No hay items adicionales cargados.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {items.map((it, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-3 px-3 py-2">
                  <span className="flex-1 min-w-[140px] text-sm text-slate-800">{it.descripcion}</span>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-slate-500">Cant.</label>
                    <input type="number" min="1" value={it.cantidad}
                      onChange={(e) => actualizarItem(idx, 'cantidad', Number(e.target.value) || 1)}
                      className="w-16 text-sm border border-slate-300 rounded-md px-2 py-1" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-slate-500">Precio unit.</label>
                    <input type="number" min="0" value={it.precio_unitario}
                      onChange={(e) => actualizarItem(idx, 'precio_unitario', Number(e.target.value) || 0)}
                      className="w-24 text-sm border border-slate-300 rounded-md px-2 py-1" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-24 text-right">
                    ${(it.cantidad * it.precio_unitario).toLocaleString('es-AR')}
                  </span>
                  <button type="button" onClick={() => quitarItem(idx)} className="text-slate-400 hover:text-red-600">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehículos en parte de pago */}
        <div className="bg-white border border-slate-400 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-slate-800">Vehículos en parte de pago</h3>
              <p className="text-xs text-slate-500">Seleccioná o creá el vehículo que ingresa como permuta.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMostrarBuscarVehiculoPermuta(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-3 py-1.5">
                <Plus size={15} /> Agregar vehículo
              </button>
              <button type="button" onClick={() => setMostrarCrearVehiculoPermuta(true)} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-1.5">
                <Plus size={15} /> Crear Vehículo de Permuta
              </button>
            </div>
          </div>

          {permutas.length === 0 ? (
            <div className="border border-dashed border-slate-300 rounded-lg py-6 text-center text-sm text-slate-500">
              No hay vehículos en parte de pago cargados.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {permutas.map((p, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-3 px-3 py-2">
                  <span className="flex-1 min-w-[160px] text-sm text-slate-800">
                    {p.etiqueta} {p.tipo === 'nuevo' && <span className="text-xs text-amber-600">(nuevo, se crea al guardar)</span>}
                  </span>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-slate-500">Valor</label>
                    <input type="number" min="0" value={p.valor_permuta}
                      onChange={(e) => actualizarValorPermuta(idx, e.target.value)}
                      className="w-28 text-sm border border-slate-300 rounded-md px-2 py-1" />
                  </div>
                  <button type="button" onClick={() => quitarPermuta(idx)} className="text-slate-400 hover:text-red-600">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forma de pago */}
        <div className="bg-white border border-slate-400 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-slate-800">Forma de pago</h3>
              <p className="text-xs text-slate-500">Desglosá cómo el cliente cubrirá el saldo. Si falta cubrir, el presupuesto igual se puede guardar.</p>
            </div>
            <button type="button" onClick={() => setMostrarAgregarFormaPago(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-3 py-1.5">
              <Plus size={15} /> Agregar forma de pago
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center">
            <div>
              <p className="text-xs text-green-700">Saldo a Pagar</p>
              <p className="font-bold text-green-800">${saldoAPagar.toLocaleString('es-AR')}</p>
            </div>
            <div>
              <p className="text-xs text-green-700">Cubierto</p>
              <p className="font-bold text-green-800">${saldoCubierto.toLocaleString('es-AR')}</p>
            </div>
            <div>
              <p className="text-xs text-green-700">Falta Cubrir</p>
              <p className="font-bold text-green-800">${faltaCubrir.toLocaleString('es-AR')}</p>
            </div>
          </div>

          <label className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <input type="checkbox" checked={formaPagoIndefinida} onChange={(e) => setFormaPagoIndefinida(e.target.checked)} className="mt-0.5 rounded border-slate-400 text-blue-600" />
            <span>
              <span className="text-sm font-medium text-amber-800 block">Forma de pago indefinida por el cliente</span>
              <span className="text-xs text-amber-700">Permite generar la venta aunque falte definir cómo se cubrirá el saldo. Si el presupuesto es aprobado y se genera la venta, se abrirá en edición para completar las formas de pago.</span>
            </span>
          </label>

          {formasPago.length === 0 ? (
            <div className="border border-dashed border-slate-300 rounded-lg py-6 text-center text-sm text-slate-500">
              No hay formas de pago cargadas.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {formasPago.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-slate-800">{f.etiqueta} {f.es_principal && <span className="text-xs text-blue-600">(principal)</span>}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">${Number(f.monto).toLocaleString('es-AR')}</span>
                    <button type="button" onClick={() => quitarFormaPago(idx)} className="text-slate-400 hover:text-red-600"><X size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observaciones */}
        <div className="bg-white border border-slate-400 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Observaciones</h3>
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3}
            placeholder="Notas comerciales del presupuesto..."
            className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
        </div>
      </div>

      {mostrarSelectorItem && (
        <SelectorItemAdicional
          onSeleccionar={(item) => {
            setItems((prev) => [...prev, { item_catalogo_id: item.id, descripcion: item.nombre, cantidad: 1, precio_unitario: Number(item.precio) || 0 }])
            setMostrarSelectorItem(false)
          }}
          onCerrar={() => setMostrarSelectorItem(false)}
        />
      )}

      {mostrarBuscarVehiculoPermuta && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Agregar Vehículo en Permuta</h3>
              <button type="button" onClick={() => setMostrarBuscarVehiculoPermuta(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <BuscadorVehiculoStock vehiculoSeleccionado={null} onSeleccionar={agregarPermutaExistente} />
          </div>
        </div>
      )}

      {mostrarCrearVehiculoPermuta && (
        <CrearVehiculoPermutaModal
          onCrear={agregarPermutaNueva}
          onCerrar={() => setMostrarCrearVehiculoPermuta(false)}
        />
      )}

      {mostrarAgregarFormaPago && (
        <AgregarFormaPagoModal
          monedaPresupuestoId={monedaId}
          onAgregar={agregarFormaPago}
          onCerrar={() => setMostrarAgregarFormaPago(false)}
        />
      )}

      {/* Barra inferior con totales */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-300 px-6 py-3 flex flex-wrap items-center justify-between gap-3 z-30">
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-xs text-slate-500">Precio Base</p>
            <p className="font-semibold text-slate-800">${Number(precioBase).toLocaleString('es-AR')}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Ítems</p>
            <p className="font-semibold text-slate-800">+ ${totalItems.toLocaleString('es-AR')}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Permutas</p>
            <p className="font-semibold text-slate-800">- ${totalPermutas.toLocaleString('es-AR')}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1">
            <p className="text-xs text-green-700">Saldo a Pagar</p>
            <p className="font-bold text-green-800">${saldoAPagar.toLocaleString('es-AR')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/ventas/presupuestos')} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button type="button" onClick={handleGuardar} disabled={guardando} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2">
            <Save size={15} />
            {guardando ? 'Guardando...' : esEdicion ? 'Actualizar presupuesto' : 'Crear presupuesto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Buscadores ---

function CrearVehiculoPermutaModal({ onCrear, onCerrar }) {
  const [marcas, setMarcas] = useState([])
  const [modelos, setModelos] = useState([])
  const [colores, setColores] = useState([])
  const [form, setForm] = useState({ patente: '', marca_id: '', modelo_id: '', color_id: '', año_modelo: '', kilometraje: '' })
  const [valorPermuta, setValorPermuta] = useState('')
  const [error, setError] = useState('')
  const [modalCrear, setModalCrear] = useState(null) // null | 'marca' | 'modelo' | 'color'

  useEffect(() => {
    api.get('/api/marcas?pageSize=200&estado=activas').then((r) => setMarcas(r.data)).catch(() => {})
    api.get('/api/colores?pageSize=200').then((r) => setColores(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.marca_id) { setModelos([]); return }
    api.get(`/api/modelos?marca_id=${form.marca_id}&pageSize=200`).then((r) => setModelos(r.data)).catch(() => {})
  }, [form.marca_id])

  function confirmar() {
    setError('')
    if (!form.marca_id || !form.modelo_id) {
      setError('Marca y Modelo son obligatorios')
      return
    }
    const marca = marcas.find((m) => m.id === Number(form.marca_id))
    const modelo = modelos.find((m) => m.id === Number(form.modelo_id))
    onCrear({
      patente: form.patente || null,
      marca_id: form.marca_id,
      modelo_id: form.modelo_id,
      color_id: form.color_id || null,
      año_modelo: form.año_modelo || null,
      kilometraje: form.kilometraje || 0,
      _marcaNombre: marca?.nombre || '',
      _modeloNombre: modelo?.nombre || '',
    }, Number(valorPermuta) || 0)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Crear Vehículo de Permuta</h3>
          <button type="button" onClick={onCerrar} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          Este vehículo se va a crear en tu inventario de Vehículos (con estado "En Preparación") recién cuando guardes el presupuesto.
        </p>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Marca *</label>
              <div className="flex gap-2">
                <select value={form.marca_id} onChange={(e) => setForm({ ...form, marca_id: e.target.value, modelo_id: '' })} className="flex-1 text-sm border border-slate-400 rounded-lg px-3 py-2">
                  <option value="">Seleccionar</option>
                  {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
                <button type="button" onClick={() => setModalCrear('marca')} className="border border-slate-400 rounded-lg px-2.5 text-slate-600 hover:bg-slate-50" title="Crear marca nueva">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Modelo *</label>
              <div className="flex gap-2">
                <select disabled={!form.marca_id} value={form.modelo_id} onChange={(e) => setForm({ ...form, modelo_id: e.target.value })} className="flex-1 text-sm border border-slate-400 rounded-lg px-3 py-2 disabled:bg-slate-100">
                  <option value="">Seleccionar</option>
                  {modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
                <button type="button" disabled={!form.marca_id} onClick={() => setModalCrear('modelo')} className="border border-slate-400 rounded-lg px-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" title="Crear modelo nuevo">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Patente</label>
              <input value={form.patente} onChange={(e) => setForm({ ...form, patente: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Color</label>
              <div className="flex gap-2">
                <select value={form.color_id} onChange={(e) => setForm({ ...form, color_id: e.target.value })} className="flex-1 text-sm border border-slate-400 rounded-lg px-3 py-2">
                  <option value="">Seleccionar</option>
                  {colores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <button type="button" onClick={() => setModalCrear('color')} className="border border-slate-400 rounded-lg px-2.5 text-slate-600 hover:bg-slate-50" title="Crear color nuevo">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Año Modelo</label>
              <input type="number" value={form.año_modelo} onChange={(e) => setForm({ ...form, año_modelo: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Kilometraje</label>
              <input type="number" value={form.kilometraje} onChange={(e) => setForm({ ...form, kilometraje: e.target.value })} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Valor de Permuta</label>
            <input type="number" value={valorPermuta} onChange={(e) => setValorPermuta(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onCerrar} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button type="button" onClick={confirmar} className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium">Agregar</button>
        </div>
      </div>

      <ModalCrearRapido
        abierto={modalCrear === 'marca'}
        titulo="Nueva Marca"
        campos={[{ key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true }]}
        onCrear={async (datos) => {
          const res = await api.post('/api/marcas', { nombre: datos.nombre })
          return res.data
        }}
        onCreado={(nueva) => {
          setMarcas((m) => [...m, nueva])
          setForm((f) => ({ ...f, marca_id: nueva.id, modelo_id: '' }))
        }}
        onCerrar={() => setModalCrear(null)}
      />

      <ModalCrearRapido
        abierto={modalCrear === 'modelo'}
        titulo="Nuevo Modelo"
        campos={[
          { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true },
          { key: 'version', label: 'Versión', tipo: 'texto', requerido: false },
          { key: 'anio', label: 'Año', tipo: 'numero', requerido: false },
        ]}
        onCrear={async (datos) => {
          const res = await api.post('/api/modelos', {
            marca_id: form.marca_id,
            nombre: datos.nombre,
            version: datos.version || null,
            anio: datos.anio || null,
          })
          return res.data
        }}
        onCreado={(nuevo) => {
          setModelos((m) => [...m, nuevo])
          setForm((f) => ({ ...f, modelo_id: nuevo.id }))
        }}
        onCerrar={() => setModalCrear(null)}
      />

      <ModalCrearRapido
        abierto={modalCrear === 'color'}
        titulo="Nuevo Color"
        campos={[
          { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true },
          { key: 'codigo_hex', label: 'Color', tipo: 'color', requerido: true, valorDefecto: '#000000' },
        ]}
        onCrear={async (datos) => {
          const res = await api.post('/api/colores', { nombre: datos.nombre, codigo_hex: datos.codigo_hex })
          return res.data
        }}
        onCreado={(nuevo) => {
          setColores((c) => [...c, nuevo])
          setForm((f) => ({ ...f, color_id: nuevo.id }))
        }}
        onCerrar={() => setModalCrear(null)}
      />
    </div>
  )
}

function AgregarFormaPagoModal({ monedaPresupuestoId, onAgregar, onCerrar }) {
  const [tipos, setTipos] = useState([])
  const [tipoFormaPagoId, setTipoFormaPagoId] = useState('')
  const [monto, setMonto] = useState('')
  const [observacionesForma, setObservacionesForma] = useState('')
  const [esPrincipal, setEsPrincipal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/catalogos-presupuesto?tipo=formas-pago-tipo').then((r) => setTipos(r.data)).catch(() => {})
  }, [])

  function confirmar() {
    setError('')
    if (!tipoFormaPagoId || !monto) {
      setError('Tipo de Forma de Pago y Monto son obligatorios')
      return
    }
    const tipo = tipos.find((t) => t.id === Number(tipoFormaPagoId))
    onAgregar({
      tipo_forma_pago_id: tipoFormaPagoId,
      etiqueta: tipo?.nombre || '',
      moneda_id: monedaPresupuestoId,
      monto: Number(monto),
      observaciones: observacionesForma || null,
      es_principal: esPrincipal,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Agregar Forma de Pago</h3>
          <button type="button" onClick={onCerrar} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Tipo de Forma de Pago *</label>
            <select value={tipoFormaPagoId} onChange={(e) => setTipoFormaPagoId(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
              <option value="">Seleccionar</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Monto *</label>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Observaciones</label>
            <input value={observacionesForma} onChange={(e) => setObservacionesForma(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={esPrincipal} onChange={(e) => setEsPrincipal(e.target.checked)} className="rounded border-slate-400 text-blue-600" />
            Es la forma de pago principal
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onCerrar} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button type="button" onClick={confirmar} className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">Agregar</button>
        </div>
      </div>
    </div>
  )
}

function BuscadorConsulta({ consultaSeleccionada, onSeleccionar }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrando, setMostrando] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function cerrar(e) { if (ref.current && !ref.current.contains(e.target)) setMostrando(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  useEffect(() => {
    if (!texto.trim()) { setResultados([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/api/consultas?busqueda=${encodeURIComponent(texto)}&pageSize=10`)
        setResultados(res.data)
        setMostrando(true)
      } catch { /* silencioso */ }
    }, 300)
    return () => clearTimeout(t)
  }, [texto])

  if (consultaSeleccionada) {
    return (
      <div className="flex items-center justify-between border border-slate-400 rounded-lg px-3 py-2 bg-blue-50">
        <span className="text-sm text-slate-800 font-medium">Consulta #{consultaSeleccionada.id} {consultaSeleccionada.numero_consulta ? `(${consultaSeleccionada.numero_consulta})` : ''}</span>
        <button type="button" onClick={() => onSeleccionar(null)} className="text-slate-500 hover:text-red-600"><X size={16} /></button>
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={texto} onChange={(e) => setTexto(e.target.value)} onFocus={() => resultados.length > 0 && setMostrando(true)}
          placeholder="Buscar consulta por cliente, teléfono o número..."
          className="w-full text-sm border border-slate-400 rounded-lg pl-8 pr-3 py-2" />
      </div>
      {mostrando && resultados.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {resultados.map((c) => (
            <button type="button" key={c.id} onClick={() => { onSeleccionar(c); setTexto(''); setMostrando(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0">
              <div className="font-medium text-slate-800">
                {c.clientes ? (c.clientes.tipo_persona === 'Jurídica' ? c.clientes.razon_social : `${c.clientes.nombre || ''} ${c.clientes.apellido || ''}`) : `${c.nombre_solicitante || ''} ${c.apellido_solicitante || ''}`}
              </div>
              <div className="text-xs text-slate-500">Consulta #{c.id}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BuscadorVehiculoStock({ vehiculoSeleccionado, onSeleccionar }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrando, setMostrando] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function cerrar(e) { if (ref.current && !ref.current.contains(e.target)) setMostrando(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  useEffect(() => {
    if (!texto.trim()) { setResultados([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/api/vehiculos?busqueda=${encodeURIComponent(texto)}&pageSize=10`)
        setResultados(res.data)
        setMostrando(true)
      } catch { /* silencioso */ }
    }, 300)
    return () => clearTimeout(t)
  }, [texto])

  if (vehiculoSeleccionado) {
    return (
      <div className="flex items-center justify-between border border-slate-400 rounded-lg px-3 py-2 bg-blue-50">
        <span className="text-sm text-slate-800 font-medium">{vehiculoSeleccionado.marcas?.nombre} {vehiculoSeleccionado.modelos?.nombre} ({vehiculoSeleccionado.patente || `ID ${vehiculoSeleccionado.id}`})</span>
        <button type="button" onClick={() => onSeleccionar(null)} className="text-slate-500 hover:text-red-600"><X size={16} /></button>
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={texto} onChange={(e) => setTexto(e.target.value)} onFocus={() => resultados.length > 0 && setMostrando(true)}
          placeholder="Buscar por marca o modelo..." className="w-full text-sm border border-slate-400 rounded-lg pl-8 pr-3 py-2" />
      </div>
      {mostrando && resultados.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {resultados.map((v) => (
            <button type="button" key={v.id} onClick={() => { onSeleccionar(v); setTexto(''); setMostrando(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0">
              <div className="font-medium text-slate-800">{v.marcas?.nombre} {v.modelos?.nombre}</div>
              <div className="text-xs text-slate-500">ID: {v.id} · Patente: {v.patente || '-'}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SelectorItemAdicional({ onSeleccionar, onCerrar }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const t = setTimeout(async () => {
      setCargando(true)
      try {
        const params = new URLSearchParams({ pageSize: '15', estado: 'activo' })
        if (texto.trim()) params.set('busqueda', texto)
        const res = await api.get(`/api/items-adicionales?${params.toString()}`)
        setResultados(res.data)
      } catch { /* silencioso */ } finally {
        setCargando(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [texto])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Agregar Ítem Adicional</h3>
          <button type="button" onClick={onCerrar} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full text-sm border border-slate-400 rounded-lg pl-8 pr-3 py-2"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto flex-1 -mx-2 px-2">
          {cargando && <p className="text-sm text-slate-500 text-center py-4">Buscando...</p>}
          {!cargando && resultados.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No se encontraron ítems.</p>}
          {!cargando && resultados.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => onSeleccionar(item)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">{item.nombre}</span>
                <span className="text-sm text-slate-600">{item.precio ? `$${Number(item.precio).toLocaleString('es-AR')}` : 'Sin precio'}</span>
              </div>
              <div className="text-xs text-slate-500">{item.codigo} · {item.categorias_items?.nombre}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function BuscadorModeloSinUnidad({ modeloSeleccionado, onSeleccionar }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrando, setMostrando] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function cerrar(e) { if (ref.current && !ref.current.contains(e.target)) setMostrando(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  useEffect(() => {
    if (!texto.trim()) { setResultados([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/api/modelos/buscar?busqueda=${encodeURIComponent(texto)}`)
        setResultados(res.data)
        setMostrando(true)
      } catch { /* silencioso */ }
    }, 300)
    return () => clearTimeout(t)
  }, [texto])

  if (modeloSeleccionado) {
    return (
      <div className="flex items-center justify-between border border-slate-400 rounded-lg px-3 py-2 bg-blue-50">
        <span className="text-sm text-slate-800 font-medium">{modeloSeleccionado.marcas?.nombre} {modeloSeleccionado.nombre}</span>
        <button type="button" onClick={() => onSeleccionar(null)} className="text-slate-500 hover:text-red-600"><X size={16} /></button>
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={texto} onChange={(e) => setTexto(e.target.value)} onFocus={() => resultados.length > 0 && setMostrando(true)}
          placeholder="Buscar por marca o modelo..." className="w-full text-sm border border-slate-400 rounded-lg pl-8 pr-3 py-2" />
      </div>
      {mostrando && resultados.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {resultados.map((m) => (
            <button type="button" key={m.id} onClick={() => { onSeleccionar(m); setTexto(''); setMostrando(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0">
              <div className="font-medium text-slate-800">{m.marcas?.nombre} {m.nombre}</div>
              {m.version && <div className="text-xs text-slate-500">{m.version}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
