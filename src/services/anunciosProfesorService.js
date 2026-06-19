const AnuncioProfesor = require('../models/anuncioProfesor');
const Aula = require('../models/aula');
const Persona = require('../models/persona');
const AulaAlumno = require('../models/aulaalumno');
const { sendMultipleEmail } = require('../utils/emailNotifier');
const notificacionesService = require('./notificacionesService');

const ESTADOS_NO_NOTIFICABLES = ['retirado', 'solicitud de retiro', 'rechazado'];

/**
 * Construye el HTML del correo de notificación de un nuevo anuncio.
 */
function construirHtmlNuevoAnuncio({ nombreProfesor, nombreCurso, titulo, descripcion }) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nuevo anuncio — ${nombreCurso}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Encabezado -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a6e 0%,#2e6bbf 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">📢 Nuevo anuncio</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">CEBAC — Centro de Enseñanza Bíblica Alianza Comas</p>
            </td>
          </tr>
          <!-- Cuerpo -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#222;">Hola,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
                Tu profesor <strong>${nombreProfesor}</strong> ha publicado un nuevo anuncio en el curso <strong>${nombreCurso}</strong>.
              </p>
              <div style="background:#f0f5ff;border:1px solid #dde3ef;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1a3a6e;text-transform:uppercase;letter-spacing:0.5px;">${titulo}</p>
                <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">${descripcion}</p>
              </div>
              <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
                Para verlo completo, ingresa a la Plataforma → <strong>Mis Cursos</strong> → entra al curso y encontrarás el anuncio.
              </p>
              <p style="margin:0;font-size:15px;color:#444;">¡Que Dios bendiga tu preparación!</p>
            </td>
          </tr>
          <!-- Pie -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e8ecf0;">
              <p style="margin:0;font-size:13px;color:#999;">© ${new Date().getFullYear()} CEBAC — Centro de Estudios Bíblicos. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Notifica (correo + notificación in-app) a los alumnos activos de un aula sobre un nuevo anuncio.
 * Fire-and-forget: no interrumpe el flujo de creación del anuncio.
 */
async function notificarAlumnosNuevoAnuncio({ id_aula, id_anuncio, nombreProfesor, nombreCurso, titulo, descripcion }) {
  try {
    const aulaAlumnos = await AulaAlumno.find({
      id_aula,
      estado: { $nin: ESTADOS_NO_NOTIFICABLES },
    })
      .populate('id_alumno', 'email')
      .lean();

    const idsAlumnos = aulaAlumnos.map((aa) => aa.id_alumno?._id).filter(Boolean);
    const destinatarios = aulaAlumnos.map((aa) => aa.id_alumno?.email).filter(Boolean);

    if (idsAlumnos.length === 0) return;

    // Notificación in-app con confirmación de lectura (una por alumno)
    notificacionesService
      .crearNotificacionesMasivas(idsAlumnos, {
        tipo: 'ANUNCIO_PROFESOR',
        referencia_id: id_anuncio,
        id_aula,
        titulo: `Nuevo anuncio en ${nombreCurso}`,
        mensaje: `${nombreProfesor} publicó: "${titulo}"`,
      })
      .catch((err) => console.error('[notificarAlumnosNuevoAnuncio] Error creando notificaciones in-app:', err?.message || err));

    // Correo electrónico (best-effort, no bloquea si no hay emails)
    if (destinatarios.length > 0) {
      const html = construirHtmlNuevoAnuncio({ nombreProfesor, nombreCurso, titulo, descripcion });
      sendMultipleEmail(destinatarios, `Nuevo anuncio para ${nombreCurso}`, html);
    }
  } catch (err) {
    console.error('[notificarAlumnosNuevoAnuncio] Error preparando notificación:', err?.message || err);
  }
}

/**
 * Obtiene todos los anuncios de un aula
 */
exports.getAnunciosByAula = async (id_aula) => {
  const anuncios = await AnuncioProfesor.find({ id_aula })
    .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
    .populate('id_aula', 'dia hora_inicio hora_fin')
    .sort({ fecha_publicacion: -1 })
    .lean();

  return anuncios;
};

/**
 * Obtiene todos los anuncios creados por un profesor
 */
exports.getAnunciosByProfesor = async (id_profesor) => {
  const anuncios = await AnuncioProfesor.find({ id_profesor })
    .populate('id_aula', 'dia hora_inicio hora_fin')
    .populate({
      path: 'id_aula',
      populate: { path: 'id_curso', select: 'nombre_curso' }
    })
    .sort({ fecha_publicacion: -1 })
    .lean();

  return anuncios;
};

/**
 * Obtiene un anuncio por ID
 */
exports.getAnuncioById = async (id) => {
  const anuncio = await AnuncioProfesor.findById(id)
    .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
    .populate({
      path: 'id_aula',
      populate: { path: 'id_curso', select: 'nombre_curso' }
    })
    .lean();

  if (!anuncio) {
    const err = new Error('Anuncio no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return anuncio;
};

/**
 * Crea un nuevo anuncio
 */
exports.createAnuncio = async (data) => {
  const { id_profesor, id_aula, titulo, descripcion, color, fecha_publicacion } = data;

  // Validar que el profesor existe
  const profesor = await Persona.findById(id_profesor);
  if (!profesor) {
    const err = new Error('Profesor no encontrado');
    err.statusCode = 404;
    throw err;
  }

  // Validar que el aula existe
  const aula = await Aula.findById(id_aula).populate('id_curso', 'nombre_curso');
  if (!aula) {
    const err = new Error('Aula no encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Validar que el profesor es el asignado al aula (opcional, puedes remover si no es necesario)
  if (String(aula.id_profesor) !== String(id_profesor)) {
    const err = new Error('El profesor no está asignado a esta aula');
    err.statusCode = 403;
    throw err;
  }

  const nuevoAnuncio = new AnuncioProfesor({
    id_profesor,
    id_aula,
    titulo,
    descripcion,
    color: color || '#3B82F6',
    fecha_publicacion: fecha_publicacion || new Date()
  });

  await nuevoAnuncio.save();

  // Notificar (correo + in-app) a los alumnos activos del aula (fire-and-forget)
  notificarAlumnosNuevoAnuncio({
    id_aula,
    id_anuncio: nuevoAnuncio._id,
    nombreProfesor: `${profesor.nombres} ${profesor.apellido_paterno}`.trim(),
    nombreCurso: aula.id_curso?.nombre_curso || 'tu curso',
    titulo,
    descripcion,
  });

  // Retornar con populate
  return await AnuncioProfesor.findById(nuevoAnuncio._id)
    .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
    .populate('id_aula')
    .lean();
};

/**
 * Actualiza un anuncio existente
 */
exports.updateAnuncio = async (id, data) => {
  const anuncio = await AnuncioProfesor.findById(id);
  
  if (!anuncio) {
    const err = new Error('Anuncio no encontrado');
    err.statusCode = 404;
    throw err;
  }

  // Actualizar campos permitidos
  const camposActualizables = ['titulo', 'descripcion', 'color', 'fecha_publicacion'];
  
  camposActualizables.forEach(campo => {
    if (data[campo] !== undefined) {
      anuncio[campo] = data[campo];
    }
  });

  await anuncio.save();

  // Retornar con populate
  return await AnuncioProfesor.findById(id)
    .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
    .populate('id_aula')
    .lean();
};

/**
 * Elimina un anuncio
 */
exports.deleteAnuncio = async (id, id_profesor) => {
  const anuncio = await AnuncioProfesor.findById(id);
  
  if (!anuncio) {
    const err = new Error('Anuncio no encontrado');
    err.statusCode = 404;
    throw err;
  }

  // Validar que el profesor que elimina es el creador (seguridad)
  if (id_profesor && String(anuncio.id_profesor) !== String(id_profesor)) {
    const err = new Error('No tienes permiso para eliminar este anuncio');
    err.statusCode = 403;
    throw err;
  }

  await AnuncioProfesor.findByIdAndDelete(id);

  return { message: 'Anuncio eliminado exitosamente' };
};

/**
 * Obtiene anuncios recientes de todas las aulas de un profesor
 */
exports.getAnunciosRecientesByProfesor = async (id_profesor, limite = 10) => {
  const anuncios = await AnuncioProfesor.find({ id_profesor })
    .populate('id_aula', 'dia hora_inicio hora_fin')
    .populate({
      path: 'id_aula',
      populate: { path: 'id_curso', select: 'nombre_curso' }
    })
    .sort({ fecha_publicacion: -1 })
    .limit(limite)
    .lean();

  return anuncios;
};
