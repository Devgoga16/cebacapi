const AulaAlumno = require('../models/aulaalumno');

exports.getAllAulaAlumnos = async () => {
  return await AulaAlumno.find().populate('id_aula id_alumno');
};

exports.getAulaAlumnoById = async (id) => {
  return await AulaAlumno.findById(id).populate('id_aula id_alumno');
};

exports.createAulaAlumno = async (data) => {
  const aulaAlumno = new AulaAlumno(data);
  return await aulaAlumno.save();
};

exports.updateAulaAlumno = async (id, data) => {
  return await AulaAlumno.findByIdAndUpdate(id, data, { new: true }).populate('id_aula id_alumno');
};

exports.deleteAulaAlumno = async (id) => {
  const result = await AulaAlumno.findByIdAndDelete(id);
  return !!result;
};

// Lista todos los registros de AulaAlumno de una persona, con la mayor cantidad de datos poblados
exports.getAulaAlumnosPorPersona = async (id_persona) => {
  return await AulaAlumno.find({ id_alumno: id_persona })
    .populate({
      path: 'id_aula',
      populate: [
        { path: 'id_curso', populate: { path: 'id_nivel' } },
        { path: 'id_ciclo' },
        { path: 'id_profesor' }
      ]
    })
    .populate({
      path: 'id_alumno',
      populate: [
        { path: 'id_user', populate: { path: 'roles' } },
        { path: 'id_ministerio', populate: { path: 'id_iglesia' } }
      ]
    });
};
