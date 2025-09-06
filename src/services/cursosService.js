const Curso = require('../models/curso');

exports.getAllCursos = async () => {
  return await Curso.find()
    .populate('id_nivel')
    .populate('prerequisitos.ref_id');
};

exports.getCursoById = async (id) => {
  return await Curso.findById(id)
    .populate('id_nivel')
    .populate('prerequisitos.ref_id');
};

exports.createCurso = async (data) => {
  const curso = new Curso(data);
  return await curso.save(); 
};

exports.updateCurso = async (id, data) => {
  return await Curso.findByIdAndUpdate(id, data, { new: true })
    .populate('id_nivel')
    .populate('prerequisitos.ref_id');
};

exports.deleteCurso = async (id) => {
  const result = await Curso.findByIdAndDelete(id);
  return !!result;
};
