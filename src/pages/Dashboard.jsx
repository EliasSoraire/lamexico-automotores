import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Warehouse, Users, TrendingUp, Phone, Calendar, DollarSign, FileText, History, CheckCircle2 } from 'lucide-react'
import { api } from '../lib/api'

const COLORES_ESTADO = {
  'Disponible': '#22c55e',
  'En Tránsito': '#3b82f6',
  'Reservado': '#f59e0b',
  'En Preparación': '#f97316',
  'De Baja': '#94a3b8',
}

export default function Dashboard() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/dashboard').then(setDatos).catch((err) => setError(err.message))
  }, [])

  if (error) return <div className="text-sm text-red-600 py-10 text-center">{error}</div>
  if (!datos) return <div className="text-sm text-slate-600 py-10 text-center">Cargando...</div>

  const dataEstados = datos.estados_vehiculos.filter((e) => e.cantidad > 0)

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-1">Dashboard - Panel de Control</h1>
      <p className="text-sm text-slate-700 mb-6">La México Automotores</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <TarjetaKpi icono={<Warehouse size={18} className="text-blue-600" />} label="Vehículos Disponibles" valor={datos.vehiculos_disponibles} link="/inventario/vehiculos" textoLink="Ver todos los vehículos" />
        <TarjetaKpi icono={<Users size={18} className="text-purple-600" />} label="Clientes Activos" valor={datos.clientes_activos} textoLink="Ver todos los clientes" />
        <TarjetaKpi icono={<TrendingUp size={18} className="text-green-600" />} label="Ventas del Mes" valor={datos.ventas_del_mes} textoLink="Ver todas las ventas" />
        <TarjetaKpi icono={<Phone size={18} className="text-amber-600" />} label="Consultas Nuevas" valor={datos.consultas_nuevas} textoLink="Ver todas las consultas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-slate-400 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Ventas por Mes</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={datos.ventas_por_mes}>
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="cantidad" name="Cantidad de Ventas" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-400 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Estado de Vehículos</h3>
          {dataEstados.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-sm text-slate-600">
              Todavía no hay vehículos cargados.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={dataEstados} dataKey="cantidad" nameKey="estado" innerRadius={55} outerRadius={85}>
                  {dataEstados.map((e) => (
                    <Cell key={e.estado} fill={COLORES_ESTADO[e.estado]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-slate-400 rounded-xl p-5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-4">
            <Calendar size={15} className="text-slate-700" /> Cuotas por Vencer (7 días)
          </h3>
          <div className="flex flex-col items-center justify-center py-4">
            {datos.cuotas_por_vencer === 0 ? (
              <>
                <CheckCircle2 size={28} className="text-green-500 mb-2" />
                <p className="font-semibold text-slate-700">Todo al día</p>
                <p className="text-xs text-slate-600">No hay cuotas por vencer</p>
              </>
            ) : (
              <p className="text-2xl font-bold text-amber-600">{datos.cuotas_por_vencer}</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-400 rounded-xl p-5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-4">
            <FileText size={15} className="text-slate-700" /> Resumen de Gestoría
          </h3>
          <div className="flex justify-around text-center py-2">
            <div>
              <p className="text-2xl font-bold text-purple-600">{datos.resumen_gestoria.activos}</p>
              <p className="text-xs text-slate-700">Legajos Activos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{datos.resumen_gestoria.requieren_atencion}</p>
              <p className="text-xs text-slate-700">Requieren Atención</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-400 rounded-xl p-5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-4">
            <DollarSign size={15} className="text-green-600" /> Resumen Financiero
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-700">Ingresos del Mes</dt><dd className="text-green-600 font-semibold">${datos.resumen_financiero.ingresos.toLocaleString('es-AR')}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-700">Egresos del Mes</dt><dd className="text-red-500 font-semibold">${datos.resumen_financiero.egresos.toLocaleString('es-AR')}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-2"><dt className="text-slate-700 font-medium">Balance</dt><dd className="font-bold text-slate-800">${datos.resumen_financiero.balance.toLocaleString('es-AR')}</dd></div>
          </dl>
        </div>

        <div className="bg-white border border-slate-400 rounded-xl p-5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-4">
            <History size={15} className="text-slate-700" /> Actividad Reciente
          </h3>
          {datos.actividad_reciente.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-slate-600">
              <History size={24} className="mb-2 text-slate-700" />
              <p className="text-sm">No hay actividad reciente</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {datos.actividad_reciente.map((a) => (
                <li key={a.id} className="py-2 text-slate-600">
                  {a.descripcion || `${a.accion_nombre} en ${a.modulo_nombre}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function TarjetaKpi({ icono, label, valor, link, textoLink }) {
  return (
    <div className="bg-white border border-slate-400 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icono}
        <p className="text-xs text-slate-700">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-2">{valor}</p>
      {link ? (
        <Link to={link} className="text-xs text-blue-600 hover:underline">{textoLink}</Link>
      ) : (
        <span className="text-xs text-slate-700">{textoLink}</span>
      )}
    </div>
  )
}
