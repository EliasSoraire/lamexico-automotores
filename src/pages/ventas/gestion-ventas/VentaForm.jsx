import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Search, X, FileText, CreditCard, Package, Plus } from 'lucide-react'
import { api } from '../../../lib/api'
import { useAuth } from '../../../context/AuthContext'
import BuscadorCliente from '../../../components/consultas/BuscadorCliente'

const TABS = ['Información Básica', 'Financiación', 'Adicionales y Costos']

export default function VentaForm() {
  const { id } = useParams()
  const esEdicion = !!id
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [tab, setTab] = useState('Información Básica')

  // Información Básica
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [prioridadId, setPrioridadId] = useState('')
  const [fechaReserva, setFechaReserva] = useState('')
  const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().slice(0, 10))
  const [monedaId, setMonedaId] = useState('')
  const [estadoId, setEstadoId] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Financiación
  const [precioVehiculo, setPrecioVehiculo] = useState(0)
  const [descuento, setDescuento] = useState(0)
  const [anticipo, setAnticipo] = useState(0)
  const [pagoEfectivo, setPagoEfectivo] = useState(0)
  const [pagoCheque, setPagoCheque] = useState(0)
  const [pagoTarjetaCredito, setPagoTarjetaCredito] = useState(0)
  const [pagoTarjetaDebito, setPagoTarjetaDebito] = useState(0)
  const [pagoTransferencia, setPagoTransferencia] = useState(0)
  const [pagoPlanAhorro, setPagoPlanAhorro] = useState(0)
  const [metodoPagoId, setMetodoPagoId] = useState('')
  const [metodosPago, setMetodosPago] = useState([])

  // Financiación Propia (informativo)
  const [importeFinanciar, setImporteFinanciar] = useState('')
  const [cantidadCuotas, setCantidadCuotas] = useState('')
  const [importeCuota, setImporteCuota] = useState('')
  const [tasaInteres, setTasaInteres] = useState('')
  const [primeraCuota, setPrimeraCuota] = useState('')

  // Financiación Bancaria (informativo)
  const [importeFinanciacionBancaria, setImporteFinanciacionBancaria] = useState('')
  const [bancoNombre, setBancoNombre] = useState('')
  const [numeroCredito, setNumeroCredito] = useState('')
  const [fechaAprobacionBancaria, setFechaAprobacionBancaria] = useState('')

  // Adicionales
  const [items, setItems] = useState([])
  const [mostrarSelectorItem, setMostrarSelectorItem] = useState(false)
  const [guardandoItem, setGuardandoItem] = useState(false)

  const [prioridades, setPrioridades] = useState([])
  const [monedas, setMonedas] = useState([])
  const [estados, setEstados] = useState([])

  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/api/catalogos-venta?tipo=prioridades-venta'),
      api.get('/api/monedas'),
      api.get('/api/catalogos-venta?tipo=estados-venta'),
      api.get('/api/catalogos-venta?tipo=metodos-pago'),
    ]).then(([prio, mon, est, metodos]) => {
      setPrioridades(prio.data)
      setMonedas(mon.data)
      setEstados(est.data)
      setMetodosPago(metodos.data)
      if (!esEdicion) {
        const ars = mon.data.find((m) => m.codigo === 'ARS')
        if (ars) setMonedaId(ars.id)
        const media = prio.data.find((p) => p.nombre === 'Media')
        if (media) setPrioridadId(media.id)
        const activa = est.data.find((e) => e.nombre === 'Activa')
        if (activa) setEstadoId(activa.id)
      }
    }).catch((err) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!esEdicion) return
    async function cargar() {
      try {
        const res = await api.get(`/api/ventas/detalle?id=${id}`)
        const v = res.data
        setVehiculoSeleccionado(res.vehiculo)
        setClienteSeleccionado(v.clientes)
        setPrioridadId(v.prioridad_id || '')
        setFechaReserva(v.fecha_reserva || '')
        setFechaVenta(v.fecha_venta || '')
        setMonedaId(v.moneda_id || '')
        setEstadoId(v.estado_id || '')
        setObservaciones(v.observaciones || '')
        setPrecioVehiculo(v.precio_vehiculo || 0)
        setDescuento(v.descuento || 0)
        setAnticipo(v.anticipo || 0)
        setPagoEfectivo(v.pago_efectivo || 0)
        setPagoCheque(v.pago_cheque || 0)
        setPagoTarjetaCredito(v.pago_tarjeta_credito || 0)
        setPagoTarjetaDebito(v.pago_tarjeta_debito || 0)
        setPagoTransferencia(v.pago_transferencia || 0)
        setPagoPlanAhorro(v.pago_plan_ahorro || 0)
        setMetodoPagoId(v.metodo_pago_id || '')
        setImporteFinanciar(v.importe_financiar ?? '')
        setCantidadCuotas(v.cantidad_cuotas ?? '')
        setImporteCuota(v.importe_cuota ?? '')
        setTasaInteres(v.tasa_interes ?? '')
        setPrimeraCuota(v.primera_cuota || '')
        setImporteFinanciacionBancaria(v.importe_financiacion_bancaria ?? '')
        setBancoNombre(v.banco_nombre || '')
        setNumeroCredito(v.numero_credito || '')
        setFechaAprobacionBancaria(v.fecha_aprobacion_bancaria || '')
        setItems((res.items || []).map((it) => ({
          id: it.id, // presente = ya guardado en el servidor
          item_catalogo_id: it.item_catalogo_id,
          descripcion: it.descripcion || it.items_catalogo?.nombre || '',
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
        })))
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id, esEdicion])

  const totalOperacion = Number(precioVehiculo) - Number(descuento) + items.reduce((acc, it) => acc + (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0), 0)
  const totalCubierto = Number(anticipo) + Number(pagoEfectivo) + Number(pagoCheque) + Number(pagoTarjetaCredito) + Number(pagoTarjetaDebito) + Number(pagoTransferencia) + Number(pagoPlanAhorro) + (Number(importeFinanciar) || 0) + (Number(importeFinanciacionBancaria) || 0)
  const saldoPendiente = totalOperacion - totalCubierto

  async function recargarItems() {
    try {
      const res = await api.get(`/api/ventas/items?venta_id=${id}`)
      setItems(res.data.map((it) => ({
        id: it.id,
        item_catalogo_id: it.item_catalogo_id,
        descripcion: it.descripcion || it.items_catalogo?.nombre || '',
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
      })))
    } catch (err) {
      setError(err.message)
    }
  }

  async function agregarItem(item) {
    setMostrarSelectorItem(false)
    if (esEdicion) {
      setGuardandoItem(true)
      try {
        await api.post('/api/ventas/items', {
          venta_id: id,
          item_catalogo_id: item.id,
          descripcion: item.nombre,
          cantidad: 1,
          precio_unitario: Number(item.precio) || 0,
        })
        await recargarItems()
      } catch (err) {
        setError(err.message)
      } finally {
        setGuardandoItem(false)
      }
    } else {
      setItems((prev) => [...prev, { item_catalogo_id: item.id, descripcion: item.nombre, cantidad: 1, precio_unitario: Number(item.precio) || 0 }])
    }
  }

  function actualizarItemLocal(idx, campo, valor) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)))
  }

  async function guardarCambioItemGuardado(idx) {
    const item = items[idx]
    if (!item.id) return // todavía no está guardado en el servidor, no hace falta pegarle a la API
    try {
      await api.put(`/api/ventas/items?id=${item.id}`, {
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })
      await recargarItems()
    } catch (err) {
      setError(err.message)
    }
  }

  async function quitarItem(idx) {
    const item = items[idx]
    if (esEdicion && item.id) {
      setGuardandoItem(true)
      try {
        await api.delete(`/api/ventas/items?id=${item.id}`)
        await recargarItems()
      } catch (err) {
        setError(err.message)
      } finally {
        setGuardandoItem(false)
      }
    } else {
      setItems((prev) => prev.filter((_, i) => i !== idx))
    }
  }

  function validar() {
    if (!vehiculoSeleccionado) return 'Seleccioná un Vehículo (pestaña Información Básica)'
    if (!clienteSeleccionado) return 'Seleccioná un Cliente (pestaña Información Básica)'
    if (!fechaVenta) return 'La Fecha de Venta es obligatoria (pestaña Información Básica)'
    if (!monedaId) return 'La Moneda es obligatoria (pestaña Información Básica)'
    if (!estadoId) return 'El Estado de la Venta es obligatorio (pestaña Información Básica)'
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const mensaje = validar()
    if (mensaje) { setError(mensaje); setTab('Información Básica'); return }
    guardar()
  }

  async function guardar() {
    setGuardando(true)
    try {
      const payload = {
        vehiculo_id: vehiculoSeleccionado.id,
        cliente_id: clienteSeleccionado.id,
        prioridad_id: prioridadId || null,
        fecha_reserva: fechaReserva || null,
        fecha_venta: fechaVenta,
        moneda_id: monedaId,
        estado_id: estadoId,
        observaciones: observaciones || null,
        precio_vehiculo: precioVehiculo,
        descuento,
        anticipo,
        pago_efectivo: pagoEfectivo,
        pago_cheque: pagoCheque,
        pago_tarjeta_credito: pagoTarjetaCredito,
        pago_tarjeta_debito: pagoTarjetaDebito,
        pago_transferencia: pagoTransferencia,
        pago_plan_ahorro: pagoPlanAhorro,
        metodo_pago_id: metodoPagoId || null,
        importe_financiar: importeFinanciar || null,
        cantidad_cuotas: cantidadCuotas || null,
        importe_cuota: importeCuota || null,
        tasa_interes: tasaInteres || null,
        primera_cuota: primeraCuota || null,
        importe_financiacion_bancaria: importeFinanciacionBancaria || null,
        banco_nombre: bancoNombre || null,
        numero_credito: numeroCredito || null,
        fecha_aprobacion_bancaria: fechaAprobacionBancaria || null,
      }

      if (esEdicion) {
        await api.put(`/api/ventas/detalle?id=${id}`, payload)
      } else {
        const res = await api.post('/api/ventas', payload)
        for (const it of items) {
          await api.post('/api/ventas/items', {
            venta_id: res.data.id,
            item_catalogo_id: it.item_catalogo_id,
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            precio_unitario: it.precio_unitario,
          })
        }
      }
      navigate('/ventas/gestion')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-800">{esEdicion ? 'Editar Venta' : 'Nueva Venta'}</h1>
        <button type="button" onClick={() => navigate('/ventas/gestion')} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-lg px-3 py-1.5 hover:bg-slate-50">
          <ArrowLeft size={14} /> Volver
        </button>
      </div>

      <div className="bg-white border border-slate-400 rounded-xl p-6">
        <div className="flex gap-6 border-b border-slate-200 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5 ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-700'}`}>
              {t === 'Información Básica' && <FileText size={14} />}
              {t === 'Financiación' && <CreditCard size={14} />}
              {t === 'Adicionales y Costos' && <Package size={14} />}
              {t}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          {tab === 'Información Básica' && (
            <div className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Vehículo *</label>
                  <BuscadorVehiculoVenta vehiculoSeleccionado={vehiculoSeleccionado} onSeleccionar={setVehiculoSeleccionado} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Cliente *</label>
                  <BuscadorCliente clienteSeleccionado={clienteSeleccionado} onSeleccionar={setClienteSeleccionado} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Vendedor *</label>
                  <input disabled value={usuario?.nombre_completo || ''} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 bg-slate-50 text-slate-600" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Prioridad</label>
                  <select value={prioridadId} onChange={(e) => setPrioridadId(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
                    <option value="">Seleccionar</option>
                    {prioridades.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Fecha de Reserva</label>
                  <input type="date" value={fechaReserva} onChange={(e) => setFechaReserva(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Fecha de Venta *</label>
                  <input type="date" value={fechaVenta} onChange={(e) => setFechaVenta(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Moneda *</label>
                  <select value={monedaId} onChange={(e) => setMonedaId(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
                    <option value="">Seleccionar</option>
                    {monedas.map((m) => <option key={m.id} value={m.id}>{m.codigo} ({m.simbolo})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Estado de la Venta *</label>
                  <select value={estadoId} onChange={(e) => setEstadoId(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
                    <option value="">Seleccionar</option>
                    {estados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Observaciones</label>
                <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3}
                  className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
              </div>
            </div>
          )}

          {tab === 'Financiación' && (
            <div className="max-w-3xl space-y-5">
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Total de la operación</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <CampoMonto label="Precio del Vehículo *" value={precioVehiculo} onChange={setPrecioVehiculo} />
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Ítems Adicionales</label>
                    <input disabled value={`$${items.reduce((acc, it) => acc + (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0), 0).toLocaleString('es-AR')}`}
                      className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2 bg-slate-50 text-slate-600" />
                    <p className="text-xs text-slate-500 mt-1">Calculado automáticamente desde Ítems Adicionales.</p>
                  </div>
                  <CampoMonto label="Descuento" value={descuento} onChange={setDescuento} />
                </div>
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex justify-between text-sm">
                  <span className="text-slate-600">Total operación</span>
                  <span className="font-bold text-slate-800">${totalOperacion.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Anticipo / Pago Inicial</h3>
                <CampoMonto label="Anticipo / Pago Inicial" value={anticipo} onChange={setAnticipo} />
                <p className="text-xs text-slate-500 mt-1">El anticipo puede ser en efectivo, cheque, transferencia, etc. Se descuenta del total de la operación.</p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Formas de Pago Propuestas</h3>
                <div className={`rounded-lg px-3 py-2 mb-4 text-sm ${saldoPendiente === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  Anticipo: ${Number(anticipo).toLocaleString('es-AR')} + Total formas de pago: ${(totalCubierto - Number(anticipo)).toLocaleString('es-AR')} = Total propuesto: ${totalCubierto.toLocaleString('es-AR')}
                  <br />
                  Total operación: ${totalOperacion.toLocaleString('es-AR')} — {saldoPendiente === 0 ? 'Cubierto completo' : `Falta cubrir $${saldoPendiente.toLocaleString('es-AR')}`}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <CampoMonto label="Efectivo" value={pagoEfectivo} onChange={setPagoEfectivo} />
                  <CampoMonto label="Cheque" value={pagoCheque} onChange={setPagoCheque} />
                  <CampoMonto label="Tarjeta de Crédito" value={pagoTarjetaCredito} onChange={setPagoTarjetaCredito} />
                  <CampoMonto label="Tarjeta de Débito" value={pagoTarjetaDebito} onChange={setPagoTarjetaDebito} />
                  <CampoMonto label="Transferencia Bancaria" value={pagoTransferencia} onChange={setPagoTransferencia} />
                  <CampoMonto label="Plan de Ahorro" value={pagoPlanAhorro} onChange={setPagoPlanAhorro} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Medio de pago</label>
                  <select value={metodoPagoId} onChange={(e) => setMetodoPagoId(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2">
                    <option value="">Seleccionar</option>
                    {metodosPago.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Financiación Propia</h3>
                <p className="text-xs text-slate-500 mb-3">Datos informativos. La gestión real de cuotas se suma más adelante (Planes de Pago).</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CampoMonto label="Importe a Financiar" value={importeFinanciar} onChange={setImporteFinanciar} placeholder="Importe a financiar" />
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Cantidad de Cuotas</label>
                    <input type="number" value={cantidadCuotas} onChange={(e) => setCantidadCuotas(e.target.value)} placeholder="Ej: 12" className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
                  </div>
                  <CampoMonto label="Importe de la Cuota" value={importeCuota} onChange={setImporteCuota} />
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Tasa de Interés (% anual)</label>
                    <input type="number" value={tasaInteres} onChange={(e) => setTasaInteres(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Primera Cuota</label>
                    <input type="date" value={primeraCuota} onChange={(e) => setPrimeraCuota(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
                  </div>
                </div>
              </div>

              <div className="border border-green-200 bg-green-50/40 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Financiación Bancaria</h3>
                <p className="text-xs text-slate-500 mb-3">El banco gestiona las cuotas. Solo se registran los datos para seguimiento.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CampoMonto label="Importe de Financiación Bancaria" value={importeFinanciacionBancaria} onChange={setImporteFinanciacionBancaria} />
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Banco</label>
                    <input value={bancoNombre} onChange={(e) => setBancoNombre(e.target.value)} placeholder="Nombre del banco o financiera" className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Número de Crédito</label>
                    <input value={numeroCredito} onChange={(e) => setNumeroCredito(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Fecha de Aprobación</label>
                    <input type="date" value={fechaAprobacionBancaria} onChange={(e) => setFechaAprobacionBancaria(e.target.value)} className="w-full text-sm border border-slate-400 rounded-lg px-3 py-2" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'Adicionales y Costos' && (
            <div className="max-w-3xl space-y-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-800">Ítems Adicionales</h3>
                  <button type="button" onClick={() => setMostrarSelectorItem(true)} disabled={guardandoItem}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-3 py-1.5">
                    <Plus size={15} /> Agregar item
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-lg py-6 text-center text-sm text-slate-500">
                    No hay ítems adicionales cargados.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-3 px-3 py-2">
                        <span className="flex-1 min-w-[140px] text-sm text-slate-800">{it.descripcion}</span>
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-slate-500">Cant.</label>
                          <input type="number" min="1" value={it.cantidad}
                            onChange={(e) => actualizarItemLocal(idx, 'cantidad', Number(e.target.value) || 1)}
                            onBlur={() => guardarCambioItemGuardado(idx)}
                            className="w-16 text-sm border border-slate-300 rounded-md px-2 py-1" />
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-slate-500">Precio unit.</label>
                          <input type="number" min="0" value={it.precio_unitario}
                            onChange={(e) => actualizarItemLocal(idx, 'precio_unitario', Number(e.target.value) || 0)}
                            onBlur={() => guardarCambioItemGuardado(idx)}
                            className="w-24 text-sm border border-slate-300 rounded-md px-2 py-1" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 w-24 text-right">
                          ${(it.cantidad * it.precio_unitario).toLocaleString('es-AR')}
                        </span>
                        <button type="button" onClick={() => quitarItem(idx)} disabled={guardandoItem} className="text-slate-400 hover:text-red-600 disabled:opacity-40">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {!esEdicion && items.length > 0 && (
                  <p className="text-xs text-amber-600 mt-2">Estos ítems se guardan recién cuando confirmes "Guardar Venta".</p>
                )}
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Resumen</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Precio del vehículo</span><span className="text-slate-800">${Number(precioVehiculo).toLocaleString('es-AR')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Ítems Adicionales</span><span className="text-slate-800">+ ${items.reduce((acc, it) => acc + (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0), 0).toLocaleString('es-AR')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Descuento</span><span className="text-slate-800">- ${Number(descuento).toLocaleString('es-AR')}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold"><span className="text-slate-700">= Total operación</span><span className="text-slate-800">${totalOperacion.toLocaleString('es-AR')}</span></div>
                  <div className="flex justify-between font-semibold"><span className="text-slate-700">= Saldo Pendiente</span><span className={saldoPendiente > 0 ? 'text-amber-600' : 'text-green-600'}>${saldoPendiente.toLocaleString('es-AR')}</span></div>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-3xl bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6 flex justify-between gap-4 text-sm">
            <span className="text-slate-600">Total operación</span>
            <span className="font-bold text-slate-800">${totalOperacion.toLocaleString('es-AR')}</span>
            <span className="text-slate-600">Saldo Pendiente</span>
            <span className={`font-bold ${saldoPendiente > 0 ? 'text-amber-600' : 'text-green-600'}`}>${saldoPendiente.toLocaleString('es-AR')}</span>
          </div>

          <div className="flex justify-end gap-2 pt-6 max-w-3xl">
            <button type="button" onClick={() => navigate('/ventas/gestion')} className="px-4 py-2 text-sm rounded-lg border border-slate-400 text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg px-4 py-2">
              <Save size={15} />
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Venta' : 'Guardar Venta'}
            </button>
          </div>
        </form>
      </div>

      {mostrarSelectorItem && (
        <SelectorItemAdicionalVenta onSeleccionar={agregarItem} onCerrar={() => setMostrarSelectorItem(false)} />
      )}
    </div>
  )
}

function SelectorItemAdicionalVenta({ onSeleccionar, onCerrar }) {
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
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por nombre o código..."
            className="w-full text-sm border border-slate-400 rounded-lg pl-8 pr-3 py-2" autoFocus />
        </div>
        <div className="overflow-y-auto flex-1 -mx-2 px-2">
          {cargando && <p className="text-sm text-slate-500 text-center py-4">Buscando...</p>}
          {!cargando && resultados.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No se encontraron ítems.</p>}
          {!cargando && resultados.map((item) => (
            <button type="button" key={item.id} onClick={() => onSeleccionar(item)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 border-b border-slate-100 last:border-0">
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

function CampoMonto({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>
      <div className="flex">
        <span className="flex items-center px-3 border border-r-0 border-slate-400 rounded-l-lg bg-slate-50 text-slate-600 text-sm">$</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          placeholder={placeholder}
          className="flex-1 text-sm border border-slate-400 rounded-r-lg px-3 py-2"
        />
      </div>
    </div>
  )
}

function BuscadorVehiculoVenta({ vehiculoSeleccionado, onSeleccionar }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrando, setMostrando] = useState(false)

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
        <span className="text-sm text-slate-800 font-medium">
          {vehiculoSeleccionado.marcas?.nombre} {vehiculoSeleccionado.modelos?.nombre} ({vehiculoSeleccionado.patente || `ID ${vehiculoSeleccionado.id}`})
        </span>
        <button type="button" onClick={() => onSeleccionar(null)} className="text-slate-500 hover:text-red-600"><X size={16} /></button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={texto} onChange={(e) => setTexto(e.target.value)} onFocus={() => resultados.length > 0 && setMostrando(true)}
          placeholder="Buscar vehículo por chasis, identificador, marca/modelo..."
          className="w-full text-sm border border-slate-400 rounded-lg pl-8 pr-3 py-2" />
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
