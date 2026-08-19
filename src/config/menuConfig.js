// Configuración central del sidebar.
// "proximamente: true" = el ítem se muestra pero al clickear abre el cartel de "Disponible próximamente"
// en vez de navegar a una pantalla funcional.

export const menuConfig = [
  {
    tipo: 'item',
    nombre: 'Dashboard',
    path: '/dashboard',
    icono: 'LayoutDashboard',
  },
  {
    tipo: 'grupo',
    nombre: 'Inventario',
    icono: 'Warehouse',
    items: [
      { nombre: 'Peritaje', path: '/inventario/peritaje', proximamente: true },
      { nombre: 'Vehículo', path: '/inventario/vehiculos', proximamente: false },
      { nombre: 'Marca y Modelos', path: '/inventario/marcas-modelos', proximamente: false },
      { nombre: 'Colores de Vehículo', path: '/inventario/colores', proximamente: false },
      { nombre: 'Clasificación de Vehículo', path: '/inventario/clasificaciones', proximamente: false },
      { nombre: 'Checklist Peritaje', path: '/inventario/checklist-peritaje', proximamente: true },
    ],
  },
  {
    tipo: 'grupo',
    nombre: 'Ventas',
    icono: 'ShoppingCart',
    items: [
      { nombre: 'Clientes', path: '/ventas/clientes', proximamente: false },
      { nombre: 'Consultas', path: '/ventas/consultas', proximamente: false },
      { nombre: 'Presupuesto', path: '/ventas/presupuestos', proximamente: false },
      { nombre: 'Gestión de Ventas', path: '/ventas/gestion', proximamente: false },
      { nombre: 'Ítems Adicionales', path: '/ventas/items-adicionales', proximamente: false },
      { nombre: 'Canales de Origen', path: '/ventas/canales-origen', proximamente: false },
    ],
  },
  {
    tipo: 'grupo',
    nombre: 'Finanzas',
    icono: 'DollarSign',
    items: [
      { nombre: 'Facturas', path: '/finanzas/facturas', proximamente: true },
      { nombre: 'Planes de Pago', path: '/finanzas/planes-pago', proximamente: true },
      { nombre: 'Financieras', path: '/finanzas/financieras', proximamente: true },
      { nombre: 'Cuentas Corrientes', path: '/finanzas/cuentas-corrientes', proximamente: true },
    ],
  },
  {
    tipo: 'grupo',
    nombre: 'Compras',
    icono: 'Package',
    items: [
      { nombre: 'Proveedores', path: '/compras/proveedores', proximamente: true },
      { nombre: 'Órdenes de Compra', path: '/compras/ordenes', proximamente: true },
      { nombre: 'Comprobantes de Compra', path: '/compras/comprobantes', proximamente: true },
      { nombre: 'Categorías de Compra', path: '/compras/categorias', proximamente: true },
      { nombre: 'Pagos a Proveedores', path: '/compras/pagos-proveedores', proximamente: true },
    ],
  },
  {
    tipo: 'grupo',
    nombre: 'Caja y Bancos',
    icono: 'Landmark',
    items: [
      { nombre: 'Cuentas Bancarias', path: '/caja-bancos/cuentas-bancarias', proximamente: true },
      { nombre: 'Movimientos Bancarios', path: '/caja-bancos/movimientos-bancarios', proximamente: true },
      { nombre: 'Caja', path: '/caja-bancos/caja', proximamente: true },
      { nombre: 'Caja Registradora', path: '/caja-bancos/caja-registradora', proximamente: true },
      { nombre: 'Cheques', path: '/caja-bancos/cheques', proximamente: true },
      { nombre: 'Planilla de Caja', path: '/caja-bancos/planilla-caja', proximamente: true },
    ],
  },
  {
    tipo: 'grupo',
    nombre: 'Gestoría',
    icono: 'FileText',
    items: [
      { nombre: 'Legajos', path: '/gestoria/legajos', proximamente: true },
      { nombre: 'Checklist Legajos', path: '/gestoria/checklist-legajos', proximamente: true },
    ],
  },
  {
    tipo: 'grupo',
    nombre: 'Configuración',
    icono: 'Settings',
    items: [
      { nombre: 'Usuarios', path: '/configuracion/usuarios', proximamente: false },
      { nombre: 'Configuración General', path: '/configuracion/general', proximamente: false },
      { nombre: 'Auditoría', path: '/configuracion/auditoria', proximamente: true },
      { nombre: 'Titulares de Stock', path: '/configuracion/titulares-stock', proximamente: false },
    ],
  },
]
