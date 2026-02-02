const alumnosService = require('../services/alumnosService');
const { sendResponse } = require('../utils/helpers');

/**
 * Obtiene los alumnos del ciclo actual por defecto, o de un ciclo específico si se proporciona
 * Opcionalmente filtra por nivel y/o curso
 * GET /alumnos?id_ciclo=xxx&id_nivel=xxx&id_curso=xxx (todos opcionales)
 */
exports.getAlumnosPorCiclo = async (req, res, next) => {
  try {
    const { id_ciclo, id_nivel, id_curso } = req.query;
    const alumnos = await alumnosService.getAlumnosPorCiclo(id_ciclo, id_nivel, id_curso);
    
    if (alumnos.length === 0) {
      return sendResponse(res, { 
        state: 'success',
        data: [], 
        message: 'No hay alumnos en el ciclo especificado',
        action_code: 200 
      });
    }
    
    sendResponse(res, { 
      data: alumnos,
      message: `Se encontraron ${alumnos.length} alumnos`
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Obtiene los docentes del ciclo actual por defecto, o de un ciclo específico si se proporciona
 * Opcionalmente filtra por nivel y/o curso
 * GET /alumnos/docentes?id_ciclo=xxx&id_nivel=xxx&id_curso=xxx (todos opcionales)
 */
exports.getDocentesPorCiclo = async (req, res, next) => {
  try {
    const { id_ciclo, id_nivel, id_curso } = req.query;
    const docentes = await alumnosService.getDocentesPorCiclo(id_ciclo, id_nivel, id_curso);
    
    if (docentes.length === 0) {
      return sendResponse(res, { 
        state: 'success',
        data: [], 
        message: 'No hay docentes en el ciclo especificado',
        action_code: 200 
      });
    }
    
    sendResponse(res, { 
      data: docentes,
      message: `Se encontraron ${docentes.length} docentes`
    });
  } catch (err) {
    next(err);
  }
};
