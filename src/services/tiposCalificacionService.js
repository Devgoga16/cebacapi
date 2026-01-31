const TipoCalificacion = require('../models/tipoCalificacion');
const Aula = require('../models/aula');

/**
 * Valida que los porcentajes sumen exactamente 100
 */
const validarPorcentajes = (tiposCalificacion) => {
  const totalPorcentaje = tiposCalificacion.reduce((sum, tipo) => sum + tipo.porcentaje, 0);
  
  if (Math.abs(totalPorcentaje - 100) > 0.01) { // tolerancia de 0.01 para decimales
    const err = new Error(`Los porcentajes deben sumar 100%. Total actual: ${totalPorcentaje}%`);
    err.statusCode = 400;
    throw err;
  }
  
  return true;
};

/**
 * Crea o actualiza los tipos de calificación para un aula
 */
exports.setTiposCalificacion = async (idAula, tiposData) => {
  // Validar que el aula existe
  const aula = await Aula.findById(idAula);
  if (!aula) {
    const err = new Error('Aula no encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Validar que hay al menos un tipo de calificación
  if (!tiposData || tiposData.length === 0) {
    const err = new Error('Debe proporcionar al menos un tipo de calificación');
    err.statusCode = 400;
    throw err;
  }

  // Validar que no hay nombres duplicados
  const nombres = tiposData.map(t => t.nombre.toLowerCase().trim());
  const nombresDuplicados = nombres.filter((nombre, index) => nombres.indexOf(nombre) !== index);
  if (nombresDuplicados.length > 0) {
    const err = new Error(`Nombres duplicados: ${nombresDuplicados.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // Validar que los porcentajes sumen 100
  validarPorcentajes(tiposData);

  // Validar que todos los porcentajes sean mayores a 0
  const porcentajesInvalidos = tiposData.filter(t => t.porcentaje <= 0);
  if (porcentajesInvalidos.length > 0) {
    const err = new Error('Todos los porcentajes deben ser mayores a 0');
    err.statusCode = 400;
    throw err;
  }

  // Eliminar tipos de calificación existentes para esta aula
  await TipoCalificacion.deleteMany({ id_aula: idAula });

  // Crear los nuevos tipos de calificación
  const tiposCalificacion = tiposData.map((tipo, index) => ({
    id_aula: idAula,
    nombre: tipo.nombre,
    porcentaje: tipo.porcentaje,
    descripcion: tipo.descripcion || '',
    orden: tipo.orden !== undefined ? tipo.orden : index
  }));

  const tiposCreados = await TipoCalificacion.insertMany(tiposCalificacion);

  return tiposCreados;
};

/**
 * Obtiene los tipos de calificación de un aula
 */
exports.getTiposCalificacionByAula = async (idAula) => {
  const tipos = await TipoCalificacion.find({ id_aula: idAula })
    .sort({ orden: 1 })
    .populate('id_aula', 'id_curso id_profesor');
  
  return tipos;
};

/**
 * Elimina los tipos de calificación de un aula
 */
exports.deleteTiposCalificacionByAula = async (idAula) => {
  const result = await TipoCalificacion.deleteMany({ id_aula: idAula });
  return result;
};

/**
 * Actualiza un tipo de calificación específico
 */
exports.updateTipoCalificacion = async (idTipo, updateData) => {
  const tipo = await TipoCalificacion.findById(idTipo);
  if (!tipo) {
    const err = new Error('Tipo de calificación no encontrado');
    err.statusCode = 404;
    throw err;
  }

  // Si se actualiza el porcentaje, validar que el total siga siendo 100
  if (updateData.porcentaje !== undefined) {
    const todosTipos = await TipoCalificacion.find({ id_aula: tipo.id_aula });
    const otrosTipos = todosTipos.filter(t => t._id.toString() !== idTipo);
    const totalOtros = otrosTipos.reduce((sum, t) => sum + t.porcentaje, 0);
    const nuevoTotal = totalOtros + updateData.porcentaje;
    
    if (Math.abs(nuevoTotal - 100) > 0.01) {
      const err = new Error(`Los porcentajes deben sumar 100%. Total con este cambio: ${nuevoTotal}%`);
      err.statusCode = 400;
      throw err;
    }
  }

  Object.assign(tipo, updateData);
  await tipo.save();

  return tipo;
};
