/**
 * Ejemplos de uso del sistema de promedios ponderados
 * 
 * Estos ejemplos muestran cómo usar los endpoints relacionados
 * con el cálculo de promedios ponderados.
 */

const BASE_URL = 'http://localhost:3000/api';

// ============================================================================
// EJEMPLO 1: Registrar Calificaciones (actualiza automáticamente el promedio)
// ============================================================================

async function registrarCalificacionesEjemplo() {
  const response = await fetch(`${BASE_URL}/calificaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Agregar token de autenticación si es necesario
    },
    body: JSON.stringify({
      items: [
        {
          id_aula: '507f1f77bcf86cd799439011',
          id_alumno: '507f1f77bcf86cd799439012',
          id_tipo_calificacion: '507f1f77bcf86cd799439013', // Examen Final (40%)
          nota: 85,
          observacion: 'Muy buen desempeño'
        },
        {
          id_aula: '507f1f77bcf86cd799439011',
          id_alumno: '507f1f77bcf86cd799439012',
          id_tipo_calificacion: '507f1f77bcf86cd799439014', // Tareas (30%)
          nota: 90,
          observacion: ''
        },
        {
          id_aula: '507f1f77bcf86cd799439011',
          id_alumno: '507f1f77bcf86cd799439012',
          id_tipo_calificacion: '507f1f77bcf86cd799439015', // Participación (30%)
          nota: 95,
          observacion: 'Excelente participación en clase'
        }
      ],
      registrado_por: '507f1f77bcf86cd799439016'
    })
  });

  const result = await response.json();
  console.log('Calificaciones registradas:', result);
  // El promedio ponderado del alumno se calcula automáticamente
  // Promedio = (85×0.4) + (90×0.3) + (95×0.3) = 34 + 27 + 28.5 = 89.50
}

// ============================================================================
// EJEMPLO 2: Obtener Roster con Promedios Ponderados
// ============================================================================

async function obtenerRosterConPromedios() {
  const id_aula = '507f1f77bcf86cd799439011';
  
  const response = await fetch(`${BASE_URL}/calificaciones/roster/${id_aula}`, {
    headers: {
      // Agregar token de autenticación si es necesario
    }
  });

  const { data } = await response.json();
  
  console.log('\n=== ROSTER DEL AULA ===');
  console.log(`Aula: ${data.aula.nombre}`);
  console.log(`Total alumnos: ${data.alumnos.length}\n`);
  
  console.log('Tipos de Calificación:');
  data.tipos_calificacion.forEach(tipo => {
    console.log(`  - ${tipo.nombre}: ${tipo.porcentaje}%`);
  });
  
  console.log('\nAlumnos y sus promedios:');
  data.alumnos.forEach((alumno, index) => {
    const nombre = `${alumno.alumno.nombres} ${alumno.alumno.apellido_paterno}`;
    const promedio = alumno.promedio_ponderado !== null 
      ? alumno.promedio_ponderado.toFixed(2)
      : 'Pendiente';
    
    console.log(`${index + 1}. ${nombre}: ${promedio}`);
    
    // Mostrar desglose de calificaciones
    alumno.calificaciones.forEach(cal => {
      const nota = cal.nota !== null ? cal.nota : 'Sin nota';
      console.log(`     - ${cal.nombre_tipo} (${cal.porcentaje}%): ${nota}`);
    });
  });
}

// ============================================================================
// EJEMPLO 3: Recalcular Promedios de un Aula Completa
// ============================================================================

async function recalcularPromediosAula() {
  const id_aula = '507f1f77bcf86cd799439011';
  
  const response = await fetch(`${BASE_URL}/calificaciones/recalcular-promedios/${id_aula}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Agregar token de autenticación si es necesario
    }
  });

  const result = await response.json();
  
  console.log('\n=== RECÁLCULO DE PROMEDIOS ===');
  console.log(`Total de alumnos: ${result.data.total}`);
  console.log(`Alumnos actualizados: ${result.data.actualizados}`);
  console.log(`Con promedio calculado: ${result.data.con_promedio}`);
  console.log(`Sin promedio (faltan notas): ${result.data.sin_promedio}`);
}

// ============================================================================
// EJEMPLO 4: Obtener Resumen con Estadísticas del Aula
// ============================================================================

async function obtenerResumenConEstadisticas() {
  const id_aula = '507f1f77bcf86cd799439011';
  
  const response = await fetch(`${BASE_URL}/calificaciones/resumen/${id_aula}`, {
    headers: {
      // Agregar token de autenticación si es necesario
    }
  });

  const { data } = await response.json();
  
  console.log('\n=== RESUMEN Y ESTADÍSTICAS DEL AULA ===');
  console.log(`Aula: ${data.aula.nombre}\n`);
  
  console.log('Estadísticas Generales:');
  console.log(`  Total de alumnos: ${data.estadisticas.total_alumnos}`);
  console.log(`  Alumnos con promedio: ${data.estadisticas.alumnos_con_promedio}`);
  
  if (data.estadisticas.promedio_aula !== null) {
    console.log(`  Promedio del aula: ${data.estadisticas.promedio_aula.toFixed(2)}`);
    console.log(`  Promedio más alto: ${data.estadisticas.promedio_maximo.toFixed(2)}`);
    console.log(`  Promedio más bajo: ${data.estadisticas.promedio_minimo.toFixed(2)}`);
  } else {
    console.log('  No hay suficientes datos para calcular estadísticas');
  }
  
  // Mostrar top 5 alumnos
  const alumnosOrdenados = data.alumnos
    .filter(a => a.promedio_ponderado !== null)
    .sort((a, b) => b.promedio_ponderado - a.promedio_ponderado)
    .slice(0, 5);
  
  console.log('\nTop 5 Alumnos:');
  alumnosOrdenados.forEach((alumno, index) => {
    const nombre = `${alumno.alumno.nombres} ${alumno.alumno.apellido_paterno}`;
    console.log(`  ${index + 1}. ${nombre}: ${alumno.promedio_ponderado.toFixed(2)}`);
  });
}

// ============================================================================
// EJEMPLO 5: Obtener Calificaciones de un Alumno Específico
// ============================================================================

async function obtenerCalificacionesAlumno() {
  const id_aula = '507f1f77bcf86cd799439011';
  const id_alumno = '507f1f77bcf86cd799439012';
  
  const response = await fetch(
    `${BASE_URL}/calificaciones/${id_aula}/alumno/${id_alumno}`,
    {
      headers: {
        // Agregar token de autenticación si es necesario
      }
    }
  );

  const { data } = await response.json();
  
  const nombre = `${data.alumno.nombres} ${data.alumno.apellido_paterno}`;
  
  console.log('\n=== CALIFICACIONES DEL ALUMNO ===');
  console.log(`Alumno: ${nombre}\n`);
  
  console.log('Calificaciones:');
  data.calificaciones.forEach(cal => {
    console.log(`  - ${cal.id_tipo_calificacion.nombre} (${cal.id_tipo_calificacion.porcentaje}%): ${cal.nota}`);
    if (cal.observacion) {
      console.log(`    Observación: ${cal.observacion}`);
    }
  });
  
  console.log(`\nPromedio Ponderado: ${data.promedio_ponderado !== null ? data.promedio_ponderado.toFixed(2) : 'Pendiente'}`);
  console.log(`Estado: ${data.completado ? 'Completo' : 'Incompleto (faltan calificaciones)'}`);
}

// ============================================================================
// EJEMPLO 6: Consultar Promedio Directo desde aulaalumnos
// ============================================================================

// Este ejemplo muestra cómo consultar directamente el promedio guardado
// sin necesidad de recalcularlo (más eficiente para reportes)

async function consultarPromedioDirecto() {
  // Usando MongoDB directamente (desde el backend)
  const AulaAlumno = require('../src/models/aulaalumno');
  
  const registro = await AulaAlumno.findOne({
    id_aula: '507f1f77bcf86cd799439011',
    id_alumno: '507f1f77bcf86cd799439012'
  })
  .populate('id_alumno', 'nombres apellido_paterno apellido_materno')
  .lean();
  
  if (registro) {
    const nombre = `${registro.id_alumno.nombres} ${registro.id_alumno.apellido_paterno}`;
    const promedio = registro.nota_ponderada !== null 
      ? registro.nota_ponderada.toFixed(2) 
      : 'Sin promedio';
    
    console.log(`${nombre}: ${promedio}`);
  }
}

// ============================================================================
// EJEMPLO 7: Verificar si un Alumno Aprobó o Reprobó
// ============================================================================

async function verificarAprobacion(id_aula, id_alumno, notaMinima = 70) {
  const response = await fetch(
    `${BASE_URL}/calificaciones/${id_aula}/alumno/${id_alumno}`
  );

  const { data } = await response.json();
  
  if (data.promedio_ponderado === null) {
    console.log('Estado: Pendiente (faltan calificaciones)');
    return null;
  }
  
  const aprobo = data.promedio_ponderado >= notaMinima;
  const estado = aprobo ? 'APROBADO' : 'REPROBADO';
  
  console.log(`Promedio: ${data.promedio_ponderado.toFixed(2)}`);
  console.log(`Nota mínima: ${notaMinima}`);
  console.log(`Estado: ${estado}`);
  
  return aprobo;
}

// ============================================================================
// EJEMPLO 8: Generar Reporte de Alumnos por Rango de Notas
// ============================================================================

async function generarReportePorRango(id_aula) {
  const response = await fetch(`${BASE_URL}/calificaciones/resumen/${id_aula}`);
  const { data } = await response.json();
  
  const rangos = {
    excelente: [], // 90-100
    bueno: [],     // 80-89
    regular: [],   // 70-79
    deficiente: [], // 60-69
    reprobado: []  // 0-59
  };
  
  data.alumnos.forEach(alumno => {
    if (alumno.promedio_ponderado === null) return;
    
    const promedio = alumno.promedio_ponderado;
    const nombre = `${alumno.alumno.nombres} ${alumno.alumno.apellido_paterno}`;
    
    if (promedio >= 90) rangos.excelente.push({ nombre, promedio });
    else if (promedio >= 80) rangos.bueno.push({ nombre, promedio });
    else if (promedio >= 70) rangos.regular.push({ nombre, promedio });
    else if (promedio >= 60) rangos.deficiente.push({ nombre, promedio });
    else rangos.reprobado.push({ nombre, promedio });
  });
  
  console.log('\n=== REPORTE POR RANGOS ===');
  console.log(`\nExcelente (90-100): ${rangos.excelente.length} alumnos`);
  rangos.excelente.forEach(a => console.log(`  - ${a.nombre}: ${a.promedio.toFixed(2)}`));
  
  console.log(`\nBueno (80-89): ${rangos.bueno.length} alumnos`);
  rangos.bueno.forEach(a => console.log(`  - ${a.nombre}: ${a.promedio.toFixed(2)}`));
  
  console.log(`\nRegular (70-79): ${rangos.regular.length} alumnos`);
  rangos.regular.forEach(a => console.log(`  - ${a.nombre}: ${a.promedio.toFixed(2)}`));
  
  console.log(`\nDeficiente (60-69): ${rangos.deficiente.length} alumnos`);
  rangos.deficiente.forEach(a => console.log(`  - ${a.nombre}: ${a.promedio.toFixed(2)}`));
  
  console.log(`\nReprobado (0-59): ${rangos.reprobado.length} alumnos`);
  rangos.reprobado.forEach(a => console.log(`  - ${a.nombre}: ${a.promedio.toFixed(2)}`));
}

// ============================================================================
// EJECUTAR EJEMPLOS
// ============================================================================

// Descomentar la función que quieras probar:

// registrarCalificacionesEjemplo();
// obtenerRosterConPromedios();
// recalcularPromediosAula();
// obtenerResumenConEstadisticas();
// obtenerCalificacionesAlumno();
// verificarAprobacion('id_aula', 'id_alumno', 70);
// generarReportePorRango('id_aula');
