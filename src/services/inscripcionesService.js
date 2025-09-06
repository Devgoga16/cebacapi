const Inscripcion = require('../models/inscripcion');

exports.getAllInscripciones = async () => {
  return await Inscripcion.find().populate('id_aula id_alumno');
};

exports.getInscripcionById = async (id) => {
  return await Inscripcion.findById(id).populate('id_aula id_alumno');
};

exports.createInscripcion = async (data) => {
  const inscripcion = new Inscripcion(data);
  return await inscripcion.save();
};

exports.updateInscripcion = async (id, data) => {
  return await Inscripcion.findByIdAndUpdate(id, data, { new: true }).populate('id_aula id_alumno');
};

exports.deleteInscripcion = async (id) => {
  const result = await Inscripcion.findByIdAndDelete(id);
  return !!result;
};
