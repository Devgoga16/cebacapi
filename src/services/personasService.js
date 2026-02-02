const Persona = require('../models/persona');
const { compressBase64Image } = require('../utils/image');
function normalizePersonaNames(data = {}) {
  if (typeof data.nombres === 'string') data.nombres = data.nombres.toUpperCase();
  if (typeof data.apellido_paterno === 'string') data.apellido_paterno = data.apellido_paterno.toUpperCase();
  if (typeof data.apellido_materno === 'string') data.apellido_materno = data.apellido_materno.toUpperCase();
  return data;
}
function escapeRegExp(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
    })
    // Ordenar alfabéticamente por apellidos y nombres
    .sort({ apellido_paterno: 1, apellido_materno: 1, nombres: 1 });
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
  normalizePersonaNames(data);
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
  normalizePersonaNames(data);
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
  return await Persona.findByIdAndUpdate(id, data, { new: true, runValidators: true })
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

// Búsqueda por número de documento o por nombres/apellidos
// Params admitidos:
// - q: búsqueda global; si es numérica, matchea prefijo en numero_documento; si es texto, matchea prefijo en nombres/apellidos por token
// - numero_documento: prefijo por defecto; exact=true para match exacto
// - nombres, apellido_paterno, apellido_materno: prefijo individual por campo
// - page (1..), limit (1..100), sort ('apellidos' por defecto)
exports.buscarPersonas = async (params = {}) => {
  const {
    q,
    numero_documento,
    nombres,
    apellido_paterno,
    apellido_materno,
    exact,
    page = 1,
    limit = 20,
    sort = 'apellidos',
  } = params;

  const pg = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const ands = [];

  // Filtro por numero_documento
  if (numero_documento) {
    if (String(exact) === 'true') {
      ands.push({ numero_documento: String(numero_documento) });
    } else {
      ands.push({ numero_documento: { $regex: '^' + escapeRegExp(String(numero_documento)), $options: 'i' } });
    }
  }

  // Filtros por campo individual (prefijo case-insensitive)
  if (nombres) ands.push({ nombres: { $regex: '^' + escapeRegExp(String(nombres)), $options: 'i' } });
  if (apellido_paterno) ands.push({ apellido_paterno: { $regex: '^' + escapeRegExp(String(apellido_paterno)), $options: 'i' } });
  if (apellido_materno) ands.push({ apellido_materno: { $regex: '^' + escapeRegExp(String(apellido_materno)), $options: 'i' } });

  // Búsqueda global q: tokenizar; si token es numérico -> documento; si texto -> nombres/apellidos
  if (q && String(q).trim().length > 0) {
    const tokens = String(q).trim().split(/\s+/);
    for (const t of tokens) {
      const isNum = /^\d+$/.test(t);
      const escaped = escapeRegExp(t);
      if (isNum) {
        ands.push({ numero_documento: { $regex: '^' + escaped } });
      } else {
        ands.push({
          $or: [
            { nombres: { $regex: '^' + escaped, $options: 'i' } },
            { apellido_paterno: { $regex: '^' + escaped, $options: 'i' } },
            { apellido_materno: { $regex: '^' + escaped, $options: 'i' } },
          ],
        });
      }
    }
  }

  const filter = ands.length ? { $and: ands } : {};

  // Sort options
  let sortObj = {};
  switch (String(sort)) {
    case 'nombres':
      sortObj = { nombres: 1, apellido_paterno: 1, apellido_materno: 1 };
      break;
    case 'documento':
      sortObj = { numero_documento: 1 };
      break;
    case 'recientes':
      sortObj = { createdAt: -1 };
      break;
    case 'apellidos':
    default:
      sortObj = { apellido_paterno: 1, apellido_materno: 1, nombres: 1 };
  }

  const [items, total] = await Promise.all([
    Persona.find(filter)
      .select('-imagen')
      .sort(sortObj)
      .collation({ locale: 'es', strength: 1 })
      .skip((pg - 1) * lim)
      .limit(lim)
      .lean(),
    Persona.countDocuments(filter),
  ]);

  const pages = Math.max(Math.ceil(total / lim), 1);
  return {
    items,
    pagination: { total, page: pg, pages, limit: lim },
  };
};
