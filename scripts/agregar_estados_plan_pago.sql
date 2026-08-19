-- Carga los estados posibles de un Plan de Pago.
-- La tabla estados_plan_pago ya existe en el esquema original, solo le faltan los valores.
-- Usamos WHERE NOT EXISTS en vez de ON CONFLICT porque no hay certeza de que "nombre" tenga UNIQUE.

INSERT INTO estados_plan_pago (nombre)
SELECT v.nombre FROM (VALUES ('Vigente'), ('Pagado'), ('Vencido'), ('Cancelado')) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM estados_plan_pago e WHERE e.nombre = v.nombre);
