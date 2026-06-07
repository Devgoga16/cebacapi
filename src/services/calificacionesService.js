const Calificacion = require('../models/calificacion');
const TipoCalificacion = require('../models/tipoCalificacion');
const AulaAlumno = require('../models/aulaalumno');
const Aula = require('../models/aula');

/**
 * Obtiene el roster de un aula con sus tipos de calificación y notas existentes
 * Similar a getRosterDeAulaParaAsistencia pero para calificaciones
 */
exports.getRosterDeAulaParaCalificaciones = async (id_aula) => {
  // Validar que el aula existe
  const aulaDoc = await Aula.findById(id_aula)
    .populate([
      { path: 'id_curso', populate: { path: 'id_nivel' } },
      { path: 'id_ciclo' },
      { path: 'id_profesor', select: '-imagen' },
    ])
    .lean();

  if (!aulaDoc) {
    const err = new Error('Aula no encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Obtener tipos de calificación configurados para esta aula
  const tiposCalificacion = await TipoCalificacion.find({ id_aula })
    .sort({ orden: 1 })
    .lean();

  // Obtener todos los alumnos del aula
  const alumnosAA = await AulaAlumno.find({ id_aula })
    .populate({
      path: 'id_alumno',
      select: 'nombres apellido_paterno apellido_materno numero_documento',
    })
    .lean();

  // Si no hay tipos de calificación, devolver solo los alumnos sin calificaciones
  if (tiposCalificacion.length === 0) {
    const rosterSinNotas = alumnosAA.map((aa) => ({
      id_alumno: String(aa.id_alumno?._id || aa.id_alumno),
      alumno: aa.id_alumno,
      estado_inscripcion: aa.estado,
      calificaciones: [],
      promedio_ponderado: null,
    }));

    return { 
      aula: aulaDoc, 
      tipos_calificacion: [],
      alumnos: rosterSinNotas,
      mensaje: 'El aula no tiene tipos de calificación configurados. Configure los tipos antes de registrar notas.'
    };
  }

  const alumnoIds = alumnosAA.map((x) => x.id_alumno?._id || x.id_alumno).filter(Boolean);

  // Obtener todas las calificaciones existentes para estos alumnos en esta aula
  const calificaciones = await Calificacion.find({ 
    id_aula, 
    id_alumno: { $in: alumnoIds } 
  }).lean();

  // Crear un mapa de calificaciones: alumno -> tipo -> nota
  const mapCalificaciones = new Map();
  calificaciones.forEach((cal) => {
    const key = `${cal.id_alumno}_${cal.id_tipo_calificacion}`;
    mapCalificaciones.set(key, cal);
  });

  // Construir el roster con calificaciones
  const roster = alumnosAA.map((aa) => {
    const aid = String(aa.id_alumno?._id || aa.id_alumno);
    
    // Para cada tipo de calificación, buscar si existe una nota
    const calificaciones = tiposCalificacion.map((tipo) => {
      const key = `${aid}_${tipo._id}`;
      const calExistente = mapCalificaciones.get(key);
      
      return {
        id_tipo_calificacion: tipo._id,
        nombre_tipo: tipo.nombre,
        porcentaje: tipo.porcentaje,
        nota: calExistente?.nota ?? null,
        observacion: calExistente?.observacion || '',
      };
    });

    // Usar la nota_ponderada guardada en aulaalumno
    // Si no existe o es null, calcular en el momento
    let promedioPonderado = aa.nota_ponderada;
    
    if (promedioPonderado === null || promedioPonderado === undefined) {
      const todasLasNotas = calificaciones.every(c => c.nota !== null);
      
      if (todasLasNotas) {
        promedioPonderado = calificaciones.reduce((sum, cal) => {
          return sum + (cal.nota * cal.porcentaje / 100);
        }, 0);
        promedioPonderado = Math.round(promedioPonderado * 100) / 100; // 2 decimales
      }
    }

    return {
      id_alumno: aid,
      alumno: aa.id_alumno,
      estado_inscripcion: aa.estado,
      calificaciones,
      promedio_ponderado: promedioPonderado,
    };
  });

  return { 
    aula: aulaDoc, 
    tipos_calificacion: tiposCalificacion,
    alumnos: roster 
  };
};

/**
 * Registra calificaciones en lote
 * items: [{id_aula, id_alumno, id_tipo_calificacion, nota, observacion}]
 */
exports.registrarCalificaciones = async ({ items, registrado_por }) => {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('items debe ser un arreglo con al menos un elemento');
    err.statusCode = 400;
    throw err;
  }

  // Validar cada item
  for (const it of items) {
    if (!it.id_aula || !it.id_alumno || !it.id_tipo_calificacion) {
      const err = new Error('Cada item requiere id_aula, id_alumno y id_tipo_calificacion');
      err.statusCode = 400;
      throw err;
    }
    
    if (it.nota === undefined || it.nota === null) {
      const err = new Error('Cada item requiere una nota');
      err.statusCode = 400;
      throw err;
    }

    const nota = Number(it.nota);
    if (isNaN(nota) || nota < 0 || nota > 100) {
      const err = new Error(`La nota debe estar entre 0 y 100. Valor recibido: ${it.nota}`);
      err.statusCode = 400;
      throw err;
    }
  }

  // Validar que los tipos de calificación existen y pertenecen a las aulas correctas
  const tipoIds = [...new Set(items.map(it => it.id_tipo_calificacion))];
  const tipos = await TipoCalificacion.find({ _id: { $in: tipoIds } });
  
  const tiposMap = new Map(tipos.map(t => [String(t._id), t]));
  
  for (const it of items) {
    const tipo = tiposMap.get(String(it.id_tipo_calificacion));
    if (!tipo) {
      const err = new Error(`Tipo de calificación no encontrado: ${it.id_tipo_calificacion}`);
      err.statusCode = 404;
      throw err;
    }
    if (String(tipo.id_aula) !== String(it.id_aula)) {
      const err = new Error(`El tipo de calificación ${tipo.nombre} no pertenece al aula especificada`);
      err.statusCode = 400;
      throw err;
    }
  }

  // Upsert por (id_aula, id_alumno, id_tipo_calificacion)
  const ops = items.map((it) => ({
    updateOne: {
      filter: { 
        id_aula: it.id_aula, 
        id_alumno: it.id_alumno, 
        id_tipo_calificacion: it.id_tipo_calificacion 
      },
      update: {
        $set: {
          nota: Number(it.nota),
          observacion: it.observacion || '',
          registrado_por: registrado_por || null,
        }
      },
      upsert: true,
    }
  }));

  const result = await Calificacion.bulkWrite(ops, { ordered: false });
  
  // Actualizar promedios ponderados de los alumnos afectados
  const alumnosAfectados = [...new Set(items.map(it => ({
    id_aula: it.id_aula,
    id_alumno: it.id_alumno
  })))];

  // Recalcular promedio para cada alumno afectado
  for (const { id_aula, id_alumno } of alumnosAfectados) {
    try {
      await exports.calcularYActualizarPromedioPonderado(id_aula, id_alumno);
    } catch (error) {
      console.error(`Error al actualizar promedio ponderado para alumno ${id_alumno}:`, error);
      // No lanzar error, continuar con los demás
    }
  }
  
  return {
    matched: result.matchedCount || 0,
    modified: result.modifiedCount || 0,
    upserts: result.upsertedCount || 0,
  };
};

/**
 * Obtiene las calificaciones de un alumno específico en un aula
 */
exports.getCalificacionesDeAlumno = async (id_aula, id_alumno) => {
  const calificaciones = await Calificacion.find({ id_aula, id_alumno })
    .populate('id_tipo_calificacion')
    .populate('id_alumno', 'nombres apellido_paterno apellido_materno numero_documento')
    .populate('registrado_por', 'nombres apellido_paterno apellido_materno')
    .lean();

  // Calcular promedio ponderado
  const tipos = await TipoCalificacion.find({ id_aula }).lean();
  const totalTipos = tipos.length;
  const calificacionesRegistradas = calificaciones.length;

  let promedioPonderado = null;
  if (calificacionesRegistradas === totalTipos && totalTipos > 0) {
    promedioPonderado = calificaciones.reduce((sum, cal) => {
      const porcentaje = cal.id_tipo_calificacion?.porcentaje || 0;
      return sum + (cal.nota * porcentaje / 100);
    }, 0);
    promedioPonderado = Math.round(promedioPonderado * 100) / 100;
  }

  return {
    id_alumno,
    alumno: calificaciones[0]?.id_alumno || null,
    calificaciones,
    promedio_ponderado: promedioPonderado,
    completado: calificacionesRegistradas === totalTipos,
  };
};

/**
 * Obtiene el resumen de calificaciones de todos los alumnos de un aula
 * Incluye promedio ponderado final
 */
exports.getResumenCalificacionesAula = async (id_aula) => {
  const roster = await exports.getRosterDeAulaParaCalificaciones(id_aula);
  
  // Agregar estadísticas del aula
  const promedios = roster.alumnos
    .filter(a => a.promedio_ponderado !== null)
    .map(a => a.promedio_ponderado);

  const estadisticas = {
    total_alumnos: roster.alumnos.length,
    alumnos_con_promedio: promedios.length,
    promedio_aula: promedios.length > 0 
      ? Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 100) / 100
      : null,
    promedio_maximo: promedios.length > 0 ? Math.max(...promedios) : null,
    promedio_minimo: promedios.length > 0 ? Math.min(...promedios) : null,
  };

  return {
    ...roster,
    estadisticas,
  };
};

/**
 * Calcula el promedio ponderado de un alumno en un aula y lo guarda en aulaalumno
 * @param {string} id_aula - ID del aula
 * @param {string} id_alumno - ID del alumno
 * @returns {number|null} El promedio ponderado calculado o null si no está completo
 */
exports.calcularYActualizarPromedioPonderado = async (id_aula, id_alumno) => {
  try {
    // Obtener todos los tipos de calificación del aula
    const tipos = await TipoCalificacion.find({ id_aula }).lean();
    
    if (tipos.length === 0) {
      // No hay tipos de calificación configurados, poner null
      await AulaAlumno.updateOne(
        { id_aula, id_alumno },
        { $set: { nota_ponderada: null } }
      );
      return null;
    }

    // Obtener todas las calificaciones del alumno en esta aula
    const calificaciones = await Calificacion.find({ id_aula, id_alumno }).lean();

    // Verificar si tiene todas las calificaciones
    if (calificaciones.length !== tipos.length) {
      // Faltan calificaciones, poner null
      await AulaAlumno.updateOne(
        { id_aula, id_alumno },
        { $set: { nota_ponderada: null } }
      );
      return null;
    }

    // Crear un mapa de calificaciones por tipo
    const mapCalificaciones = new Map();
    calificaciones.forEach(cal => {
      mapCalificaciones.set(String(cal.id_tipo_calificacion), cal.nota);
    });

    // Calcular promedio ponderado
    let sumaPonderada = 0;
    let sumaPesos = 0;

    for (const tipo of tipos) {
      const nota = mapCalificaciones.get(String(tipo._id));
      if (nota === undefined || nota === null) {
        // Falta una calificación, no se puede calcular
        await AulaAlumno.updateOne(
          { id_aula, id_alumno },
          { $set: { nota_ponderada: null } }
        );
        return null;
      }
      sumaPonderada += nota * (tipo.porcentaje / 100);
      sumaPesos += tipo.porcentaje;
    }

    // Calcular el promedio final (normalizado si los pesos no suman exactamente 100)
    let promedioPonderado;
    if (sumaPesos > 0) {
      promedioPonderado = (sumaPonderada * 100) / sumaPesos;
    } else {
      promedioPonderado = 0;
    }

    // Redondear a 2 decimales
    promedioPonderado = Math.round(promedioPonderado * 100) / 100;

    // Actualizar en aulaalumno
    await AulaAlumno.updateOne(
      { id_aula, id_alumno },
      { $set: { nota_ponderada: promedioPonderado } }
    );

    return promedioPonderado;
  } catch (error) {
    console.error('Error al calcular promedio ponderado:', error);
    throw error;
  }
};

/**
 * Recalcula y actualiza los promedios ponderados de todos los alumnos de un aula
 * Útil para migración o recálculo masivo
 * @param {string} id_aula - ID del aula
 * @returns {object} Resumen del recálculo
 */
exports.recalcularPromediosPonderadosAula = async (id_aula) => {
  try {
    // Obtener todos los alumnos del aula
    const alumnosAula = await AulaAlumno.find({ id_aula }).select('id_alumno').lean();

    const resultados = {
      total: alumnosAula.length,
      actualizados: 0,
      con_promedio: 0,
      sin_promedio: 0,
    };

    // Recalcular para cada alumno
    for (const aa of alumnosAula) {
      const promedio = await exports.calcularYActualizarPromedioPonderado(
        id_aula, 
        aa.id_alumno
      );
      
      resultados.actualizados++;
      
      if (promedio !== null) {
        resultados.con_promedio++;
      } else {
        resultados.sin_promedio++;
      }
    }

    return resultados;
  } catch (error) {
    console.error('Error al recalcular promedios del aula:', error);
    throw error;
  }
};

/**
 * Elimina una calificación específica
 */
exports.deleteCalificacion = async (id_aula, id_alumno, id_tipo_calificacion) => {
  const result = await Calificacion.deleteOne({ 
    id_aula, 
    id_alumno, 
    id_tipo_calificacion 
  });
  
  if (result.deletedCount === 0) {
    const err = new Error('Calificación no encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Recalcular promedio ponderado después de eliminar
  await exports.calcularYActualizarPromedioPonderado(id_aula, id_alumno);
  
  return result;
};
