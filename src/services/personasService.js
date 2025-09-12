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

exports.getPersonasByRol = async (nombreRol) => {
  const personas = await Persona.aggregate([
    {
      $lookup: {
        from: "usuarios",
        localField: "id_user",
        foreignField: "_id",
        as: "usuario"
      }
    },
    { $unwind: "$usuario" },
    {
      $lookup: {
        from: "roles",
        localField: "usuario.roles",
        foreignField: "_id",
        as: "roles"
      }
    },
    { $unwind: "$roles" },
    {
      $match: { "roles.nombre_rol": nombreRol }
    },
    {
      $project: {
        _id: 1,
        nombres: 1,
        apellidos: 1,
        numero_documento: 1,
        usuario: "$usuario.username",
        rol: "$roles.nombre_rol"
      }
    }
  ]);
  return personas;
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
