const Ciclo = require('../models/ciclo');
const Aula = require('../models/aula');
const AulaAlumno = require('../models/aulaalumno');
const Persona = require('../models/persona');
const Nivel = require('../models/nivel');
const Curso = require('../models/curso');
const mongoose = require('mongoose');

/**
 * Obtiene los alumnos del ciclo actual o de un ciclo específico
 * @param {string} id_ciclo - ID del ciclo (opcional, si no se proporciona usa el ciclo actual)
 * @param {string} id_nivel - ID del nivel (opcional, para filtrar por nivel)
 * @param {string} id_curso - ID del curso (opcional, para filtrar por curso específico)
 * @returns {Array} Lista de alumnos con su información
 */
exports.getAlumnosPorCiclo = async (id_ciclo, id_nivel, id_curso) => {
  try {
    let cicloId = id_ciclo;

    // Si no se proporciona ciclo, buscar el ciclo actual
    if (!cicloId) {
      const cicloBuscado = await Ciclo.findOne({ actual: true }).lean();
      if (!cicloBuscado) {
        return [];
      }
      cicloId = cicloBuscado._id;
    }

    // Construir el filtro de aulas
    const filtroAulas = { id_ciclo: new mongoose.Types.ObjectId(cicloId) };

    // Si se proporciona id_curso, filtrar por ese curso
    if (id_curso) {
      filtroAulas.id_curso = new mongoose.Types.ObjectId(id_curso);
    }
    // Si se proporciona id_nivel (pero no id_curso), obtener todos los cursos de ese nivel
    else if (id_nivel) {
      const cursosDelNivel = await Curso.find({ id_nivel: new mongoose.Types.ObjectId(id_nivel) }).select('_id').lean();
      const cursoIds = cursosDelNivel.map(c => c._id);
      if (cursoIds.length === 0) {
        return [];
      }
      filtroAulas.id_curso = { $in: cursoIds };
    }

    // Obtener todas las aulas que coinciden con los filtros
    const aulas = await Aula.find(filtroAulas).select('_id').lean();
    const aulasIds = aulas.map(aula => aula._id);

    if (aulasIds.length === 0) {
      return [];
    }

    // Obtener todos los alumnos inscritos en esas aulas
    const alumnosAulas = await AulaAlumno.aggregate([
      {
        $match: {
          id_aula: { $in: aulasIds },
          estado: { $in: ['aprobado', 'reprobado', 'en curso', 'inscrito'] }
        }
      },
      {
        $group: {
          _id: '$id_alumno',
          estados: { $push: '$estado' },
          aulasCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'personas',
          localField: '_id',
          foreignField: '_id',
          as: 'alumno',
          pipeline: [
            {
              $project: {
                nombres: 1,
                apellido_paterno: 1,
                apellido_materno: 1,
                genero: 1,
                email: 1,
                telefono: 1,
                numero_documento: 1,
                direccion: 1,
                fecha_nacimiento: 1
              }
            }
          ]
        }
      },
      {
        $unwind: '$alumno'
      },
      {
        $project: {
          _id: 0,
          id_alumno: '$_id',
          nombres: '$alumno.nombres',
          apellido_paterno: '$alumno.apellido_paterno',
          apellido_materno: '$alumno.apellido_materno',
          genero: '$alumno.genero',
          email: '$alumno.email',
          telefono: '$alumno.telefono',
          numero_documento: '$alumno.numero_documento',
          direccion: '$alumno.direccion',
          fecha_nacimiento: '$alumno.fecha_nacimiento',
          estados: 1,
          aulasCount: 1
        }
      },
      {
        $sort: { apellido_paterno: 1, apellido_materno: 1, nombres: 1 }
      }
    ]);

    return alumnosAulas;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene los docentes del ciclo actual o de un ciclo específico
 * @param {string} id_ciclo - ID del ciclo (opcional, si no se proporciona usa el ciclo actual)
 * @param {string} id_nivel - ID del nivel (opcional, para filtrar por nivel)
 * @param {string} id_curso - ID del curso (opcional, para filtrar por curso específico)
 * @returns {Array} Lista de docentes con su información
 */
exports.getDocentesPorCiclo = async (id_ciclo, id_nivel, id_curso) => {
  try {
    let cicloId = id_ciclo;

    // Si no se proporciona ciclo, buscar el ciclo actual
    if (!cicloId) {
      const cicloBuscado = await Ciclo.findOne({ actual: true }).lean();
      if (!cicloBuscado) {
        return [];
      }
      cicloId = cicloBuscado._id;
    }

    // Construir el filtro de aulas
    const filtroAulas = { id_ciclo: new mongoose.Types.ObjectId(cicloId) };

    // Si se proporciona id_curso, filtrar por ese curso
    if (id_curso) {
      filtroAulas.id_curso = new mongoose.Types.ObjectId(id_curso);
    }
    // Si se proporciona id_nivel (pero no id_curso), obtener todos los cursos de ese nivel
    else if (id_nivel) {
      const cursosDelNivel = await Curso.find({ id_nivel: new mongoose.Types.ObjectId(id_nivel) }).select('_id').lean();
      const cursoIds = cursosDelNivel.map(c => c._id);
      if (cursoIds.length === 0) {
        return [];
      }
      filtroAulas.id_curso = { $in: cursoIds };
    }

    // Obtener todos los docentes únicos del ciclo con los filtros aplicados
    const docentes = await Aula.aggregate([
      {
        $match: filtroAulas
      },
      {
        $group: {
          _id: '$id_profesor',
          aulasCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'personas',
          localField: '_id',
          foreignField: '_id',
          as: 'docente',
          pipeline: [
            {
              $project: {
                nombres: 1,
                apellido_paterno: 1,
                apellido_materno: 1,
                genero: 1,
                email: 1,
                telefono: 1,
                numero_documento: 1,
                direccion: 1,
                fecha_nacimiento: 1
              }
            }
          ]
        }
      },
      {
        $unwind: '$docente'
      },
      {
        $project: {
          _id: 0,
          id_docente: '$_id',
          nombres: '$docente.nombres',
          apellido_paterno: '$docente.apellido_paterno',
          apellido_materno: '$docente.apellido_materno',
          genero: '$docente.genero',
          email: '$docente.email',
          telefono: '$docente.telefono',
          numero_documento: '$docente.numero_documento',
          direccion: '$docente.direccion',
          fecha_nacimiento: '$docente.fecha_nacimiento',
          aulasCount: 1
        }
      },
      {
        $sort: { apellido_paterno: 1, apellido_materno: 1, nombres: 1 }
      }
    ]);

    return docentes;
  } catch (error) {
    throw error;
  }
};
