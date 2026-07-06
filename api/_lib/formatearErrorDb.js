// Traduce errores de Postgres/Supabase a mensajes específicos y entendibles,
// en vez de mostrar siempre un genérico "Error al guardar".
export function formatearErrorDb(error, contexto = '') {
  if (!error) return 'Ocurrió un error inesperado'

  switch (error.code) {
    case '23505': // unique_violation
      return 'Ya existe un registro con ese mismo valor único (por ejemplo, patente, código o nombre repetido)'
    case '22003': // numeric_value_out_of_range
      return 'Uno de los valores numéricos ingresados es demasiado grande (por ejemplo, kilometraje o precio). Revisá que no tenga dígitos de más.'
    case '22P02': // invalid_text_representation
      return 'Uno de los valores ingresados no tiene el formato correcto (revisá números, fechas o selecciones vacías)'
    case '23502': // not_null_violation
      return `Falta completar un campo obligatorio${error.column ? `: ${error.column}` : ''}`
    case '23503': // foreign_key_violation
      return 'Uno de los valores seleccionados (marca, modelo, color, etc.) no es válido o fue eliminado'
    default:
      console.error(`Error de base de datos${contexto ? ` (${contexto})` : ''}:`, error)
      return error.message || 'Ocurrió un error al guardar los datos'
  }
}
