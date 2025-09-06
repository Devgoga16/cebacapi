const Persona = require('../models/persona');

exports.getAllPersonas = async () => {
  return await Persona.find()
    .populate('id_user') // primer populate normal
    .populate({
      path: 'id_ministerio',
      populate: {
        path: 'id_iglesia'
      }
    });
};

exports.getPersonaById = async (id) => {
  return await Persona.findById(id).populate('id_user id_ministerio');
};

exports.createPersona = async (data) => {
  const persona = new Persona(data);
  return await persona.save();
};

exports.updatePersona = async (id, data) => {
  return await Persona.findByIdAndUpdate(id, data, { new: true }).populate('id_user id_ministerio');
};

exports.deletePersona = async (id) => {
  const result = await Persona.findByIdAndDelete(id);
  return !!result;
};
