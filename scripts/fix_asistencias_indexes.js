const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    // Conectar a la base de datos
    const dbUri = process.env.MONGO_URI || process.env.DATABASE_URL;
    await mongoose.connect(dbUri);
    console.log('Conectado a la base de datos');

    const db = mongoose.connection.db;
    const collection = db.collection('asistencias');

    // Listar índices actuales
    console.log('\n📋 Índices actuales:');
    const currentIndexes = await collection.indexes();
    currentIndexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    // Eliminar índices problemáticos
    console.log('\n🗑️  Eliminando índices antiguos...');
    try {
      await collection.dropIndex('id_aula_1_id_alumno_1_fecha_1');
      console.log('  ✓ Eliminado: id_aula_1_id_alumno_1_fecha_1');
    } catch (err) {
      console.log('  ⚠️  No se pudo eliminar id_aula_1_id_alumno_1_fecha_1:', err.message);
    }

    try {
      await collection.dropIndex('id_aula_1_id_profesor_1_fecha_1');
      console.log('  ✓ Eliminado: id_aula_1_id_profesor_1_fecha_1');
    } catch (err) {
      console.log('  ⚠️  No se pudo eliminar id_aula_1_id_profesor_1_fecha_1:', err.message);
    }

    // Crear nuevo índice único simple
    console.log('\n✨ Creando nuevo índice...');
    
    await collection.createIndex(
      { id_aula: 1, id_alumno: 1, fecha: 1 },
      { 
        unique: true,
        name: 'id_aula_1_id_alumno_1_fecha_1'
      }
    );
    console.log('  ✓ Creado: id_aula_1_id_alumno_1_fecha_1 (único)');

    // Limpiar campos obsoletos (opcional)
    console.log('\n🧹 Limpiando campos obsoletos...');
    const updateResult = await collection.updateMany(
      {},
      { 
        $unset: { 
          tipo_persona: "",
          id_profesor: "" 
        } 
      }
    );
    console.log(`  ✓ Documentos actualizados: ${updateResult.modifiedCount}`);

    // Listar índices finales
    console.log('\n📋 Índices actualizados:');
    const updatedIndexes = await collection.indexes();
    updatedIndexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    console.log('\n✅ Migración completada exitosamente');
  } catch (error) {
    console.error('\n❌ Error en la migración:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de la base de datos');
  }
}

fixIndexes();
