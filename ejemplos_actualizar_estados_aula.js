/**
 * Ejemplo de uso del endpoint para actualizar estados según nota ponderada
 * 
 * Este endpoint actualiza automáticamente el estado de los alumnos de un aula
 * y marca el aula como terminada:
 * - Si nota_ponderada >= 11 → estado = "aprobado"
 * - Si nota_ponderada < 11 → estado = "reprobado"
 * - Si nota_ponderada es null → estado = "retirado"
 * - Aula → estado = "terminada"
 */

const BASE_URL = 'http://localhost:3000/api';

// ============================================================================
// EJEMPLO 1: Actualizar estados de un aula completa
// ============================================================================

async function actualizarEstadosAula() {
  const id_aula = '507f1f77bcf86cd799439011'; // Reemplazar con un ID real
  
  const response = await fetch(
    `${BASE_URL}/aulaalumnos/actualizar-estados-aula/${id_aula}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Agregar token de autenticación si es necesario
      }
    }
  );

  const result = await response.json();
  
  console.log('\n=== ACTUALIZACIÓN DE ESTADOS ===');
  console.log(`Total de alumnos: ${result.data.total}`);
  console.log(`Aprobados (nota >= 11): ${result.data.aprobados}`);
  console.log(`Reprobados (nota < 11): ${result.data.reprobados}`);
  console.log(`Retirados (sin nota): ${result.data.retirados}`);
  console.log(`Registros actualizados: ${result.data.actualizados}`);
  console.log(`Estado del aula: ${result.data.aula_estado}`);
  
  return result;
}

// ============================================================================
// EJEMPLO 2: Flujo completo - Registrar notas y actualizar estados
// ============================================================================

async function flujoCompletoCalificaciones() {
  const id_aula = '507f1f77bcf86cd799439011';
  
  console.log('Paso 1: Registrar calificaciones...');
  
  // Registrar calificaciones (esto calcula automáticamente nota_ponderada)
  await fetch(`${BASE_URL}/calificaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        {
          id_aula: id_aula,
          id_alumno: 'alumno1_id',
          id_tipo_calificacion: 'tipo1_id',
          nota: 85
        },
        {
          id_aula: id_aula,
          id_alumno: 'alumno1_id',
          id_tipo_calificacion: 'tipo2_id',
          nota: 90
        },
        // ... más calificaciones
      ]
    })
  });
  
  console.log('✓ Calificaciones registradas');
  console.log('✓ Promedios ponderados calculados automáticamente');
  
  console.log('\nPaso 2: Actualizar estados según promedios...');
  
  // Actualizar estados según nota_ponderada
  const response = await fetch(
    `${BASE_URL}/aulaalumnos/actualizar-estados-aula/${id_aula}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }
  );
  
  const result = await response.json();
  
  console.log('✓ Estados actualizados');
  console.log(`  - Aprobados: ${result.data.aprobados}`);
  console.log(`  - Reprobados: ${result.data.reprobados}`);
  
  console.log('\n✨ Proceso completado exitosamente');
}

// ============================================================================
// EJEMPLO 3: Verificar cambios en la base de datos (desde backend)
// ============================================================================

async function verificarCambiosEnDB() {
  const AulaAlumno = require('../src/models/aulaalumno');
  
  const id_aula = '507f1f77bcf86cd799439011';
  
  // Antes de actualizar
  console.log('\n=== ANTES DE ACTUALIZAR ===');
  const alumnosAntes = await AulaAlumno.find({ id_aula })
    .populate('id_alumno', 'nombres apellido_paterno')
    .lean();
  
  alumnosAntes.forEach(a => {
    const nombre = `${a.id_alumno.nombres} ${a.id_alumno.apellido_paterno}`;
    console.log(`${nombre}: nota=${a.nota_ponderada}, estado=${a.estado}`);
  });
  
  // Actualizar estados
  const aulaalumnosService = require('../src/services/aulaalumnosService');
  await aulaalumnosService.actualizarEstadosPorNotaPonderada(id_aula);
  
  // Después de actualizar
  console.log('\n=== DESPUÉS DE ACTUALIZAR ===');
  const alumnosDespues = await AulaAlumno.find({ id_aula })
    .populate('id_alumno', 'nombres apellido_paterno')
    .lean();
  
  alumnosDespues.forEach(a => {
    const nombre = `${a.id_alumno.nombres} ${a.id_alumno.apellido_paterno}`;
    const badge = a.estado === 'aprobado' ? '✓' : (a.estado === 'reprobado' ? '✗' : '○');
    console.log(`${badge} ${nombre}: nota=${a.nota_ponderada}, estado=${a.estado}`);
  });
}

// ============================================================================
// EJEMPLO 4: Automatización - Actualizar al finalizar el ciclo
// ============================================================================

async function finalizarCicloYActualizarEstados(id_ciclo) {
  const Aula = require('../src/models/aula');
  const aulaalumnosService = require('../src/services/aulaalumnosService');
  
  console.log(`\n📚 Finalizando ciclo ${id_ciclo}...`);
  
  // Obtener todas las aulas del ciclo
  const aulas = await Aula.find({ id_ciclo }).select('_id nombre').lean();
  
  console.log(`Total de aulas: ${aulas.length}\n`);
  
  let totalAprobados = 0;
  let totalReprobados = 0;
  
  // Actualizar estados en cada aula
  for (const aula of aulas) {
    console.log(`Procesando: ${aula.nombre}`);
    
    const resultado = await aulaalumnosService.actualizarEstadosPorNotaPonderada(
      String(aula._id)
    );
    
    totalAprobados += resultado.aprobados;
    totalReprobados += resultado.reprobados;
    
    console.log(`  ✓ Aprobados: ${resultado.aprobados}`);
    console.log(`  ✗ Reprobados: ${resultado.reprobados}`);
    console.log(`  🚫 Retirados: ${resultado.retirados}\n`);
  }
  
  console.log('='.repeat(50));
  console.log(`RESUMEN DEL CICLO`);
  console.log('='.repeat(50));
  console.log(`Total aprobados: ${totalAprobados}`);
  console.log(`Total reprobados: ${totalReprobados}`);
  console.log(`\n✅ Ciclo finalizado y estados actualizados`);
}

// ============================================================================
// EJEMPLO 5: Consultar alumnos aprobados/reprobados después de actualizar
// ============================================================================

async function consultarAlumnosActualizados(id_aula) {
  const AulaAlumno = require('../src/models/aulaalumno');
  
  // Obtener alumnos aprobados
  const aprobados = await AulaAlumno.find({ 
    id_aula, 
    estado: 'aprobado' 
  })
  .populate('id_alumno', 'nombres apellido_paterno apellido_materno')
  .select('id_alumno nota_ponderada')
  .lean();
  
  // Obtener alumnos reprobados
  const reprobados = await AulaAlumno.find({ 
    id_aula, 
    estado: 'reprobado' 
  })
  .populate('id_alumno', 'nombres apellido_paterno apellido_materno')
  .select('id_alumno nota_ponderada')
  .lean();
  
  console.log('\n✅ ALUMNOS APROBADOS (nota >= 11):');
  aprobados.forEach(a => {
    const nombre = `${a.id_alumno.nombres} ${a.id_alumno.apellido_paterno}`;
    console.log(`  ${nombre}: ${a.nota_ponderada.toFixed(2)}`);
  });
  
  console.log('\n❌ ALUMNOS REPROBADOS (nota < 11):');
  reprobados.forEach(a => {
    const nombre = `${a.id_alumno.nombres} ${a.id_alumno.apellido_paterno}`;
    console.log(`  ${nombre}: ${a.nota_ponderada.toFixed(2)}`);
  });
}

// ============================================================================
// EJEMPLO 6: Actualizar estados con nota mínima personalizada
// ============================================================================

// Nota: Si en algún momento necesitas cambiar el criterio de 11 a otro valor,
// tendrías que modificar el servicio o agregar un parámetro opcional.
// Por ahora, el sistema usa 11 como nota mínima de aprobación.

async function verificarNotaMinima() {
  console.log(`
📋 CRITERIO DE APROBACIÓN ACTUAL:
─────────────────────────────────
• Nota mínima: 11
• Aprobado: nota_ponderada >= 11
• Reprobado: nota_ponderada < 11
• Retirado: nota_ponderada = null

💡 EJEMPLOS:
• Alumno con 19.30 → APROBADO ✅
• Alumno con 11.00 → APROBADO ✅
• Alumno con 10.99 → REPROBADO ❌
• Alumno con 5.50 → REPROBADO ❌
• Alumno sin nota → RETIRADO 🚫
  `);
}

// ============================================================================
// EJECUTAR EJEMPLOS
// ============================================================================

// Descomentar la función que quieras probar:

// actualizarEstadosAula();
// flujoCompletoCalificaciones();
// verificarCambiosEnDB();
// finalizarCicloYActualizarEstados('id_ciclo');
// consultarAlumnosActualizados('id_aula');
// verificarNotaMinima();
