const Nivel = require('../models/nivel');
const Curso = require('../models/curso');

exports.getAllNiveles = async () => {
  return await Nivel.find();
};

exports.getNivelById = async (id) => {
  return await Nivel.findById(id);
};

exports.createNivel = async (data) => {
  const nivel = new Nivel(data);
  return await nivel.save();
};

exports.updateNivel = async (id, data) => {
  return await Nivel.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteNivel = async (id) => {
  // Verificar si existen cursos que referencian este nivel
  const cursosAsociados = await Curso.countDocuments({ id_nivel: id });
  if (cursosAsociados > 0) {
    const err = new Error(`No se puede eliminar el nivel porque existen ${cursosAsociados} curso(s) asociados.`);
    err.statusCode = 400; // Bad Request / Regla de negocio
    throw err;
  }

  const result = await Nivel.findByIdAndDelete(id);
  return !!result;
};
