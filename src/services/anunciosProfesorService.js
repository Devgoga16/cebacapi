const AnuncioProfesor = require('../models/anuncioProfesor');
const Aula = require('../models/aula');
const Persona = require('../models/persona');

/**
 * Obtiene todos los anuncios de un aula
 */
exports.getAnunciosByAula = async (id_aula) => {
  const anuncios = await AnuncioProfesor.find({ id_aula })
    .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
    .populate('id_aula', 'dia hora_inicio hora_fin')
    .sort({ fecha_publicacion: -1 })
    .lean();

  return anuncios;
};

/**
 * Obtiene todos los anuncios creados por un profesor
 */
exports.getAnunciosByProfesor = async (id_profesor) => {
  const anuncios = await AnuncioProfesor.find({ id_profesor })
    .populate('id_aula', 'dia hora_inicio hora_fin')
    .populate({
      path: 'id_aula',
      populate: { path: 'id_curso', select: 'nombre' }
    })
    .sort({ fecha_publicacion: -1 })
    .lean();

  return anuncios;
};

/**
 * Obtiene un anuncio por ID
 */
exports.getAnuncioById = async (id) => {
  const anuncio = await AnuncioProfesor.findById(id)
    .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
    .populate({
      path: 'id_aula',
      populate: { path: 'id_curso', select: 'nombre' }
    })
    .lean();

  if (!anuncio) {
    const err = new Error('Anuncio no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return anuncio;
};

/**
 * Crea un nuevo anuncio
 */
exports.createAnuncio = async (data) => {
  const { id_profesor, id_aula, titulo, descripcion, color, fecha_publicacion } = data;

  // Validar que el profesor existe
  const profesor = await Persona.findById(id_profesor);
  if (!profesor) {
    const err = new Error('Profesor no encontrado');
    err.statusCode = 404;
    throw err;
  }

  // Validar que el aula existe
  const aula = await Aula.findById(id_aula);
  if (!aula) {
    const err = new Error('Aula no encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Validar que el profesor es el asignado al aula (opcional, puedes remover si no es necesario)
  if (String(aula.id_profesor) !== String(id_profesor)) {
    const err = new Error('El profesor no está asignado a esta aula');
    err.statusCode = 403;
    throw err;
  }

  const nuevoAnuncio = new AnuncioProfesor({
    id_profesor,
    id_aula,
    titulo,
    descripcion,
    color: color || '#3B82F6',
    fecha_publicacion: fecha_publicacion || new Date()
  });

  await nuevoAnuncio.save();

  // Retornar con populate
  return await AnuncioProfesor.findById(nuevoAnuncio._id)
    .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
    .populate('id_aula')
    .lean();
};

/**
 * Actualiza un anuncio existente
 */
exports.updateAnuncio = async (id, data) => {
  const anuncio = await AnuncioProfesor.findById(id);
  
  if (!anuncio) {
    const err = new Error('Anuncio no encontrado');
    err.statusCode = 404;
    throw err;
  }

  // Actualizar campos permitidos
  const camposActualizables = ['titulo', 'descripcion', 'color', 'fecha_publicacion'];
  
  camposActualizables.forEach(campo => {
    if (data[campo] !== undefined) {
      anuncio[campo] = data[campo];
    }
  });

  await anuncio.save();

  // Retornar con populate
  return await AnuncioProfesor.findById(id)
    .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
    .populate('id_aula')
    .lean();
};

/**
 * Elimina un anuncio
 */
exports.deleteAnuncio = async (id, id_profesor) => {
  const anuncio = await AnuncioProfesor.findById(id);
  
  if (!anuncio) {
    const err = new Error('Anuncio no encontrado');
    err.statusCode = 404;
    throw err;
  }

  // Validar que el profesor que elimina es el creador (seguridad)
  if (id_profesor && String(anuncio.id_profesor) !== String(id_profesor)) {
    const err = new Error('No tienes permiso para eliminar este anuncio');
    err.statusCode = 403;
    throw err;
  }

  await AnuncioProfesor.findByIdAndDelete(id);

  return { message: 'Anuncio eliminado exitosamente' };
};

/**
 * Obtiene anuncios recientes de todas las aulas de un profesor
 */
exports.getAnunciosRecientesByProfesor = async (id_profesor, limite = 10) => {
  const anuncios = await AnuncioProfesor.find({ id_profesor })
    .populate('id_aula', 'dia hora_inicio hora_fin')
    .populate({
      path: 'id_aula',
      populate: { path: 'id_curso', select: 'nombre' }
    })
    .sort({ fecha_publicacion: -1 })
    .limit(limite)
    .lean();

  return anuncios;
};
