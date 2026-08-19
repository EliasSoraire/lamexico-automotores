-- Carga los catálogos de Cuentas Corrientes (tipo de cuenta / entidad y estado de saldo).
-- Ambas tablas ya existen en el esquema original, solo les faltan los valores.

INSERT INTO tipos_cuenta_corriente (nombre)
SELECT v.nombre FROM (VALUES ('Cliente'), ('Proveedor'), ('Socio')) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM tipos_cuenta_corriente t WHERE t.nombre = v.nombre);

INSERT INTO estados_saldo_cuenta (nombre)
SELECT v.nombre FROM (VALUES ('Saldo a Favor'), ('Saldo Deudor'), ('Saldo Cero')) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM estados_saldo_cuenta e WHERE e.nombre = v.nombre);
