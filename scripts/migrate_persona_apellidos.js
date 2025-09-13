// Migration: Rename 'apellidos' to 'apellido_paterno' and add 'apellido_materno'
// Safe operation: only renames when 'apellido_paterno' doesn't exist; ensures 'apellido_materno' exists.

const mongoose = require('../src/config/db');

async function run() {
  try {
    const collection = mongoose.connection.collection('personas');

    // 1) Rename legacy field 'apellidos' -> 'apellido_paterno' when needed
    const renameFilter = { apellidos: { $exists: true }, apellido_paterno: { $exists: false } };
    const resRename = await collection.updateMany(renameFilter, { $rename: { apellidos: 'apellido_paterno' } });

    // 2) Ensure 'apellido_materno' exists (empty string by default)
    const ensureMaternoFilter = { apellido_materno: { $exists: false } };
    const resMaterno = await collection.updateMany(ensureMaternoFilter, { $set: { apellido_materno: '' } });

    const renamedCount = resRename.modifiedCount ?? resRename.nModified ?? 0;
    const addedMaternoCount = resMaterno.modifiedCount ?? resMaterno.nModified ?? 0;
    console.log(`Migration complete. Renamed: ${renamedCount}, Added apellido_materno: ${addedMaternoCount}`);
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
