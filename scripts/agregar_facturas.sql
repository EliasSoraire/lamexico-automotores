-- 1) Columna nueva en facturas para "Tipo de Documento" (DNI/CUIT/CUIL/Pasaporte/Otro).
--    Texto libre, no tiene catálogo propio (se decidió así porque no había ninguna
--    tabla/columna previa para esto en el esquema original).
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR;

-- 2) Catálogo de Tipos de Comprobante (tabla ya existía, solo le faltan los valores).
INSERT INTO tipos_comprobante (nombre)
SELECT v.nombre FROM (VALUES
  ('Factura A'), ('Factura B'), ('Factura C'), ('Factura de Exportación E'), ('Factura M'),
  ('Nota de Crédito A'), ('Nota de Crédito B'), ('Nota de Crédito C'),
  ('Nota de Débito A'), ('Nota de Débito B'), ('Nota de Débito C'),
  ('Recibo A'), ('Recibo B'), ('Recibo C'),
  ('Remito'), ('Presupuesto'), ('Cpbte. Interno de Venta X')
) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM tipos_comprobante t WHERE t.nombre = v.nombre);

-- 3) Un Punto de Venta inicial (tabla ya existía, solo le falta al menos una fila).
INSERT INTO puntos_venta (numero, descripcion)
SELECT '00001', 'Casa Central'
WHERE NOT EXISTS (SELECT 1 FROM puntos_venta);

-- 4) Catálogo de Estados de Factura (tabla ya existía, solo le faltan los valores).
INSERT INTO estados_factura (nombre)
SELECT v.nombre FROM (VALUES ('Emitida'), ('Anulada')) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM estados_factura e WHERE e.nombre = v.nombre);
