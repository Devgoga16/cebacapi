const RequerimientoAula = require('../models/requerimientoAula');

exports.crearRequerimiento = async (data) => {
  return await RequerimientoAula.create(data);
};

exports.listarTodosRequerimientos = async () => {
  return await RequerimientoAula.find()
    .populate({
      path: 'id_aula',
      select: 'nombre_aula',
      populate: {
        path: 'id_curso',
        select: 'nombre_curso'
      }
    })
    .populate('id_persona', 'nombres apellido_paterno apellido_materno')
    .populate('atendido_por', 'nombres apellido_paterno apellido_materno')
    .sort({ fecha: -1 });
};

exports.listarRequerimientosPorAula = async (id_aula) => {
  return await RequerimientoAula.find({ id_aula }).populate('id_persona', 'nombres apellido_paterno apellido_materno').sort({ fecha: -1 });
};

exports.marcarComoRevisado = async (id) => {
  return await RequerimientoAula.findByIdAndUpdate(
    id,
    { estado: 'revisado' },
    { new: true }
  ).populate('id_persona', 'nombres apellido_paterno apellido_materno');
};

exports.atenderRequerimiento = async (id, evidencia, atendido_por) => {
  return await RequerimientoAula.findByIdAndUpdate(
    id,
    {
      estado: 'atendido',
      evidencia,
      atendido_por,
      fecha_atencion: new Date()
    },
    { new: true }
  ).populate('id_persona atendido_por', 'nombres apellido_paterno apellido_materno');
};