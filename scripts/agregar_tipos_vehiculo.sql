-- Agrega el catálogo "tipos_vehiculo" (Auto / Moto) y lo conecta a la tabla vehiculos.
-- Sigue el mismo patrón que condiciones_vehiculo / transmisiones / combustibles.

CREATE TABLE IF NOT EXISTS tipos_vehiculo (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tipos_vehiculo (nombre) VALUES ('Auto'), ('Moto')
ON CONFLICT (nombre) DO NOTHING;

ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS tipo_vehiculo_id INTEGER REFERENCES tipos_vehiculo(id);

-- Todos los vehículos ya cargados quedan como "Auto" por defecto
UPDATE vehiculos
  SET tipo_vehiculo_id = (SELECT id FROM tipos_vehiculo WHERE nombre = 'Auto')
  WHERE tipo_vehiculo_id IS NULL;
