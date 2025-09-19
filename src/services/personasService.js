const Persona = require('../models/persona');
const { compressBase64Image } = require('../utils/image');

exports.getAllPersonas = async () => {
  return await Persona.find()
    // Populate usuario y, dentro, sus roles
    .populate({
      path: 'id_user',
      populate: { path: 'roles' }
    })
    // Populate ministerio y su iglesia
    .populate({
      path: 'id_ministerio',
      populate: { path: 'id_iglesia' }
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
        email: 1,
        apellido_paterno: 1,
        apellido_materno: 1,
        numero_documento: 1,
        usuario: "$usuario.username",
        rol: "$roles.nombre_rol"
      }
    }
  ]);
  return personas;
};

exports.getPersonaById = async (id) => {
  return await Persona.findById(id)
    .populate({
      path: 'id_user',
      populate: { path: 'roles' }
    })
    .populate({
      path: 'id_ministerio',
      populate: { path: 'id_iglesia' }
    });
};

exports.createPersona = async (data) => {
  // Si viene una imagen base64, comprimimos antes de guardar
  if (data && data.imagen && data.imagen.data) {
    try {
      const { base64, mimetype, size } = await compressBase64Image(data.imagen.data, { maxWidth: 1024, quality: 75, format: 'jpeg' });
      data.imagen.data = base64;
      data.imagen.mimetype = data.imagen.mimetype || mimetype;
      data.imagen.size = size;
      // Si el filename apunta a .png u otro, opcionalmente podríamos cambiar a .jpg, pero mantenemos si viene
    } catch (e) {
      console.error('Fallo al comprimir imagen en createPersona:', e?.message || e);
    }
  }
  const persona = new Persona(data);
  return await persona.save();
};

exports.updatePersona = async (id, data) => {
  // Comprimir si viene nueva imagen
  if (data && data.imagen && data.imagen.data) {
    try {
      const { base64, mimetype, size } = await compressBase64Image(data.imagen.data, { maxWidth: 1024, quality: 75, format: 'jpeg' });
      data.imagen.data = base64;
      data.imagen.mimetype = data.imagen.mimetype || mimetype;
      data.imagen.size = size;
    } catch (e) {
      console.error('Fallo al comprimir imagen en updatePersona:', e?.message || e);
    }
  }
  return await Persona.findByIdAndUpdate(id, data, { new: true })
    .populate({
      path: 'id_user',
      populate: { path: 'roles' }
    })
    .populate({
      path: 'id_ministerio',
      populate: { path: 'id_iglesia' }
    });
};

exports.deletePersona = async (id) => {
  const result = await Persona.findByIdAndDelete(id);
  return !!result;
};
