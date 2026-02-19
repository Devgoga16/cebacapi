const Persona = require('../models/persona');
const Usuario = require('../models/usuario');
const Rol = require('../models/rol');
const bcrypt = require('bcrypt');
const XLSX = require('xlsx');
const { compressBase64Image } = require('../utils/image');

function normalizeHeader(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

function pickValueByHeaders(row = {}, candidates = []) {
  const normalizedCandidates = candidates.map(normalizeHeader);
  for (const key of Object.keys(row)) {
    if (normalizedCandidates.includes(normalizeHeader(key))) {
      return row[key];
    }
  }
  return undefined;
}

function toSafeString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  return String(value).trim();
}

function parseExcelDate(value) {
  if (!value && value !== 0) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const dmy = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10);
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += 2000;
    const dt = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) return dt;
  return null;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = normalizeHeader(value);
  return ['si', 'sí', 's', 'true', '1', 'x', 'yes'].includes(normalized);
}

function splitApellidos(apellidosCompletos = '') {
  const tokens = toSafeString(apellidosCompletos).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { apellido_paterno: '', apellido_materno: '' };
  if (tokens.length === 1) return { apellido_paterno: tokens[0], apellido_materno: '' };

  const half = Math.ceil(tokens.length / 2);
  return {
    apellido_paterno: tokens.slice(0, half).join(' '),
    apellido_materno: tokens.slice(half).join(' '),
  };
}

async function getUniqueUsername(baseUsername) {
  let candidate = baseUsername;
  let i = 1;
  while (await Usuario.findOne({ username: candidate })) {
    i += 1;
    candidate = `${baseUsername}.${i}`;
  }
  return candidate;
}
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

exports.importarPersonasDesdeExcel = async ({ file, options = {} }) => {
  if (!file || !file.buffer) {
    const err = new Error('Debe adjuntar un archivo Excel en el campo file');
    err.status = 400;
    throw err;
  }

  const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    const err = new Error('El archivo Excel no contiene hojas');
    err.status = 400;
    throw err;
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const createUsers = String(options.create_users || '').toLowerCase() === 'true';
  const defaultGenero = toSafeString(options.default_genero || 'M').toUpperCase();
  const defaultDireccion = toSafeString(options.default_direccion || 'SIN DIRECCION');
  const defaultEstadoCivil = toSafeString(options.default_estado_civil || 'Otro');
  const defaultFechaConversion = parseExcelDate(options.default_fecha_conversion) || new Date();
  const defaultFechaBautismo = parseExcelDate(options.default_fecha_bautismo) || defaultFechaConversion;

  if (!['M', 'F'].includes(defaultGenero)) {
    const err = new Error('default_genero debe ser M o F');
    err.status = 400;
    throw err;
  }

  const estadoCivilPermitido = ['Soltero', 'Casado', 'Divorciado', 'Viudo', 'Otro'];
  if (!estadoCivilPermitido.includes(defaultEstadoCivil)) {
    const err = new Error('default_estado_civil debe ser uno de: Soltero, Casado, Divorciado, Viudo, Otro');
    err.status = 400;
    throw err;
  }

  let rolEstudiante = null;
  if (createUsers) {
    rolEstudiante = await Rol.findOne({ nombre_rol: { $regex: /^estudiante$/i } });
    if (!rolEstudiante) {
      rolEstudiante = await new Rol({ nombre_rol: 'estudiante' }).save();
    }
  }

  const summary = {
    total_filas: rows.length,
    personas_insertadas: 0,
    usuarios_insertados: 0,
    filas_sin_documento_para_usuario: 0,
    filas_omitidas: 0,
    errores: [],
  };

  const hardDefaults = {
    apellido_paterno: 'NO DEFINIDO',
    apellido_materno: 'NO DEFINIDO',
    nombres: 'SIN NOMBRE',
    telefono: '000000000',
    emailDomain: 'cebac.local',
    fecha_nacimiento: new Date(Date.UTC(1900, 0, 1)),
  };

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const row = rows[index] || {};

    try {
      const apellidoPaternoRaw = pickValueByHeaders(row, ['Apellido paterno']);
      const apellidoMaternoRaw = pickValueByHeaders(row, ['Apellido materno']);
      const apellidosCompletosRaw = pickValueByHeaders(row, ['Apellidos completos']);
      const nombresRaw = pickValueByHeaders(row, ['Nombres completos']);
      const fechaNacimientoRaw = pickValueByHeaders(row, ['Fecha de Nacimiento']);
      const numeroDocumentoRaw = pickValueByHeaders(row, ['DNI']);
      const telefonoRaw = pickValueByHeaders(row, ['Phone']);
      const correoRaw = pickValueByHeaders(row, ['Correo']);
      const bautizadoRaw = pickValueByHeaders(row, ['Bautizado']);

      const apellidosSplit = splitApellidos(apellidosCompletosRaw);

      const apellido_paterno = toSafeString(apellidoPaternoRaw || apellidosSplit.apellido_paterno) || hardDefaults.apellido_paterno;
      const apellido_materno = toSafeString(apellidoMaternoRaw || apellidosSplit.apellido_materno) || hardDefaults.apellido_materno;
      const nombres = toSafeString(nombresRaw) || hardDefaults.nombres;
      const numeroDocumentoLimpio = toSafeString(numeroDocumentoRaw).replace(/\.0$/, '');
      let numero_documento = numeroDocumentoLimpio;

      if (createUsers && !numeroDocumentoLimpio) {
        summary.filas_omitidas += 1;
        summary.filas_sin_documento_para_usuario += 1;
        summary.errores.push({
          fila: rowNumber,
          motivo: 'Sin número de documento: no se creó usuario ni persona',
        });
        continue;
      }

      if (!numero_documento) {
        numero_documento = `TMP-${Date.now()}-${rowNumber}`;
      }
      const telefono = toSafeString(telefonoRaw).replace(/\.0$/, '') || hardDefaults.telefono;
      const emailRaw = toSafeString(correoRaw).toLowerCase();
      const email = emailRaw || `sin-correo-${rowNumber}@${hardDefaults.emailDomain}`;
      const fecha_nacimiento = parseExcelDate(fechaNacimientoRaw) || hardDefaults.fecha_nacimiento;
      const bautizado = parseBoolean(bautizadoRaw);

      const personaExistente = await Persona.findOne({ numero_documento });
      if (personaExistente) {
        summary.filas_omitidas += 1;
        summary.errores.push({ fila: rowNumber, motivo: `Documento duplicado: ${numero_documento}` });
        continue;
      }

      const personaPayload = normalizePersonaNames({
        nombres,
        email,
        apellido_paterno,
        apellido_materno,
        genero: defaultGenero,
        telefono,
        direccion: defaultDireccion,
        fecha_nacimiento,
        numero_documento,
        estado_civil: defaultEstadoCivil,
        fecha_bautismo: bautizado ? defaultFechaBautismo : defaultFechaConversion,
        fecha_conversion: defaultFechaConversion,
      });

      if (createUsers) {
        const usernameBase = numeroDocumentoLimpio;
        const username = await getUniqueUsername(usernameBase);
        const passwordPlano = numeroDocumentoLimpio;
        const hashed = await bcrypt.hash(passwordPlano, 10);
        const usuario = await new Usuario({
          username,
          password: hashed,
          roles: [rolEstudiante._id],
          permissions: [],
          active: true,
          validado: true,
        }).save();

        try {
          const persona = await new Persona({ ...personaPayload, id_user: usuario._id }).save();
          summary.personas_insertadas += 1;
          summary.usuarios_insertados += 1;
          if (!persona) {
            throw new Error('No se pudo crear la persona');
          }
        } catch (personaErr) {
          await Usuario.findByIdAndDelete(usuario._id).catch(() => {});
          throw personaErr;
        }
      } else {
        await new Persona(personaPayload).save();
        summary.personas_insertadas += 1;
      }
    } catch (rowError) {
      summary.filas_omitidas += 1;
      summary.errores.push({
        fila: rowNumber,
        motivo: rowError.message || 'Error desconocido al importar fila',
      });
    }
  }

  return summary;
};
