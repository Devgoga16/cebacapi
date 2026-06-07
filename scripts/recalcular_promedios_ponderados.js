/**
 * Script para recalcular todos los promedios ponderados de todas las aulas
 * 
 * Este script:
 * 1. Obtiene todas las aulas existentes
 * 2. Para cada aula, recalcula los promedios ponderados de todos sus alumnos
 * 3. Actualiza el campo nota_ponderada en aulaalumno
 * 
 * Uso:
 *   node scripts/recalcular_promedios_ponderados.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Aula = require('../src/models/aula');
const calificacionesService = require('../src/services/calificacionesService');

async function recalcularTodosLosPromedios() {
  try {
    console.log('🚀 Iniciando recálculo de promedios ponderados...\n');

    // Conectar a la base de datos
    const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cebacdb';
    await mongoose.connect(dbUri);
    console.log('✅ Conectado a MongoDB:', dbUri);

    // Obtener todas las aulas
    const aulas = await Aula.find().select('_id nombre').populate('id_curso', 'nombre').lean();
    console.log(`\n📚 Total de aulas encontradas: ${aulas.length}\n`);

    let totalAlumnos = 0;
    let totalConPromedio = 0;
    let totalSinPromedio = 0;
    let aulasConError = [];

    // Procesar cada aula
    for (let i = 0; i < aulas.length; i++) {
      const aula = aulas[i];
      const numeroAula = i + 1;
      
      try {
        console.log(`[${numeroAula}/${aulas.length}] Procesando aula: ${aula.nombre || aula.id_curso?.nombre || aula._id}`);
        
        const resultado = await calificacionesService.recalcularPromediosPonderadosAula(String(aula._id));
        
        totalAlumnos += resultado.total;
        totalConPromedio += resultado.con_promedio;
        totalSinPromedio += resultado.sin_promedio;
        
        console.log(`    ✓ Alumnos: ${resultado.total} | Con promedio: ${resultado.con_promedio} | Sin promedio: ${resultado.sin_promedio}`);
      } catch (error) {
        console.error(`    ✗ Error en aula ${aula._id}:`, error.message);
        aulasConError.push({
          id: aula._id,
          nombre: aula.nombre,
          error: error.message
        });
      }
    }

    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(70));
    console.log(`Total de aulas procesadas: ${aulas.length}`);
    console.log(`Total de alumnos procesados: ${totalAlumnos}`);
    console.log(`  ✓ Alumnos con promedio calculado: ${totalConPromedio}`);
    console.log(`  ⚠ Alumnos sin promedio (faltan calificaciones): ${totalSinPromedio}`);
    
    if (aulasConError.length > 0) {
      console.log(`\n⚠️  Aulas con errores: ${aulasConError.length}`);
      aulasConError.forEach(ae => {
        console.log(`  - ${ae.nombre || ae.id}: ${ae.error}`);
      });
    }

    console.log('\n✅ Proceso completado exitosamente');

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar el script
recalcularTodosLosPromedios();
