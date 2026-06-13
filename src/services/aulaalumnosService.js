const AulaAlumno = require('../models/aulaalumno');
const Aula = require('../models/aula');
const Persona = require('../models/persona');
const Ciclo = require('../models/ciclo');
const Curso = require('../models/curso');
const { compressBase64Image } = require('../utils/image');
const https = require('https');
const http = require('http');

/**
 * Envía un correo electrónico usando el servicio de notificaciones centralizado.
 * Fire-and-forget: los errores se loguean pero no interrumpen el flujo principal.
 * @param {string} to - Correo destino
 * @param {string} subject - Asunto del correo
 * @param {string} html - Cuerpo HTML del correo
 */
function sendEmail(to, subject, html) {
  if (!to) return;
  const baseUrl = process.env.NOTIFICATIONS_API_URL || 'https://bot-cebac.iglesia-360.com/api';
  const apiKey = process.env.NOTIFICATIONS_API_KEY || '';
  const body = JSON.stringify({ to, subject, html });

  const url = new URL(`${baseUrl}/email/send`);
  const isHttps = url.protocol === 'https:';
  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'accept': '*/*',
      'x-api-key': apiKey,
    },
  };

  const transport = isHttps ? https : http;
  const req = transport.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        console.error(`[sendEmail] Respuesta no exitosa (${res.statusCode}):`, data);
      }
    });
  });
  req.on('error', (err) => {
    console.error('[sendEmail] Error al enviar correo de bienvenida:', err?.message || err);
  });
  req.write(body);
  req.end();
}

exports.getAllAulaAlumnos = async () => {
  return await AulaAlumno.find().populate('id_aula id_alumno');
};

exports.getAulaAlumnoById = async (id) => {
  return await AulaAlumno.findById(id).populate('id_aula id_alumno');
};

exports.createAulaAlumno = async (data) => {
  // Si viene carta_pastoral base64, comprimimos antes de guardar
  if (data && data.carta_pastoral && data.carta_pastoral.data) {
    try {
      const { base64, mimetype, size } = await compressBase64Image(data.carta_pastoral.data, { maxWidth: 1024, quality: 75, format: 'jpeg' });
      data.carta_pastoral.data = base64;
      data.carta_pastoral.mimetype = data.carta_pastoral.mimetype || mimetype;
      data.carta_pastoral.size = size;
      // Si el filename apunta a .png u otro, opcionalmente podríamos cambiar a .jpg, pero mantenemos si viene
    } catch (e) {
      console.error('Fallo al comprimir carta_pastoral en createAulaAlumno:', e?.message || e);
    }
  }
  const aulaAlumno = new AulaAlumno(data);
  return await aulaAlumno.save();
};

exports.updateAulaAlumno = async (id, data) => {
  // Comprimir carta_pastoral si viene nueva imagen
  if (data && data.carta_pastoral && data.carta_pastoral.data) {
    try {
      const { base64, mimetype, size } = await compressBase64Image(data.carta_pastoral.data, { maxWidth: 1024, quality: 75, format: 'jpeg' });
      data.carta_pastoral.data = base64;
      data.carta_pastoral.mimetype = data.carta_pastoral.mimetype || mimetype;
      data.carta_pastoral.size = size;
    } catch (e) {
      console.error('Fallo al comprimir carta_pastoral en updateAulaAlumno:', e?.message || e);
    }
  }
  return await AulaAlumno.findByIdAndUpdate(id, data, { new: true }).populate('id_aula id_alumno');
};

exports.deleteAulaAlumno = async (id) => {
  const result = await AulaAlumno.findByIdAndDelete(id);
  return !!result;
};

// Lista todos los registros de AulaAlumno de una persona, con la mayor cantidad de datos poblados
exports.getAulaAlumnosPorPersona = async (id_persona, options = {}) => {
  const { groupBy } = options || {};
  const registros = await AulaAlumno.find({ id_alumno: id_persona })
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

  if (groupBy === 'ciclo') {
    const grupos = new Map();
    for (const reg of registros) {
      const cicloDoc = reg?.id_aula?.id_ciclo || null;
      const key = cicloDoc ? String(cicloDoc._id || cicloDoc) : 'sin_ciclo';
      if (!grupos.has(key)) grupos.set(key, { ciclo: cicloDoc, registros: [] });
      grupos.get(key).registros.push(reg);
    }
    // Ordenar: primero ciclos con inscripcionesabiertas=true, luego actual=true, luego por fecha_inicio desc; 'sin_ciclo' al final
    return Array.from(grupos.values()).sort((a, b) => {
      if (!a.ciclo && !b.ciclo) return 0;
      if (!a.ciclo) return 1;
      if (!b.ciclo) return -1;
      const rank = (c) => (c.inscripcionesabiertas ? 2 : (c.actual ? 1 : 0));
      const ra = rank(a.ciclo);
      const rb = rank(b.ciclo);
      if (ra !== rb) return rb - ra; // mayor prioridad primero
      const ad = a.ciclo.fecha_inicio ? new Date(a.ciclo.fecha_inicio).getTime() : 0;
      const bd = b.ciclo.fecha_inicio ? new Date(b.ciclo.fecha_inicio).getTime() : 0;
      return bd - ad; // más reciente primero
    });
  }

  return registros;
};

// Inserción masiva de AulaAlumno: recibe id_alumno y lista de id_aulas y crea registros con estado 'inscrito'
// También puede recibir carta_pastoral como array (uno por cada aula) o como objeto único (aplicado a todos)
// Omite pares que ya existan (id_alumno + id_aula) y devuelve un resumen
exports.bulkCreateAulaAlumnos = async (id_alumno, id_aulas, additionalData = {}) => {
  if (!id_alumno) {
    const err = new Error('id_alumno es requerido');
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(id_aulas) || id_aulas.length === 0) {
    const err = new Error('id_aulas debe ser un arreglo con al menos un elemento');
    err.statusCode = 400;
    throw err;
  }

  // Normalizar y deduplicar ids de aulas
  const requestedIds = Array.from(new Set(id_aulas.filter(Boolean).map(String)));
  if (requestedIds.length === 0) {
    return { insertedCount: 0, insertedIds: [], skippedExisting: [], totalRequested: 0 };
  }

  // Buscar existentes para no duplicar
  const existentes = await AulaAlumno.find({ id_alumno, id_aula: { $in: requestedIds } })
    .select('id_aula')
    .lean();
  const existentesSet = new Set(existentes.map(e => String(e.id_aula)));

  const toInsertIds = requestedIds.filter(id => !existentesSet.has(id));

  // Verificar si los cursos requieren carta_pastoral
  const aulasConCursos = await Aula.find({ _id: { $in: toInsertIds } })
    .populate('id_curso', 'carta_pastoral nombre_curso') // Poblar solo los campos necesarios
    .lean();

  for (let index = 0; index < toInsertIds.length; index++) {
    const aula = aulasConCursos.find(a => String(a._id) === toInsertIds[index]);
    if (!aula) continue; // Si no se encuentra el aula, saltar (aunque debería existir)

    const requiereCartaPastoral = aula.id_curso?.carta_pastoral === true;
    if (requiereCartaPastoral) {
      // Verificar si carta_pastoral está proporcionada para este índice
      let cartaPastoralProporcionada = false;
      if (Array.isArray(additionalData.carta_pastoral)) {
        cartaPastoralProporcionada = !!additionalData.carta_pastoral[index];
      } else {
        cartaPastoralProporcionada = !!additionalData.carta_pastoral;
      }

      if (!cartaPastoralProporcionada) {
        const err = new Error(`El curso "${aula.id_curso.nombre_curso}" requiere carta_pastoral, pero no se proporcionó para el aula ${toInsertIds[index]}.`);
        err.statusCode = 400;
        throw err;
      }
    }
  }

  // Preparar documentos con carta_pastoral específica por aula
  // carta_pastoral puede ser:
  // - Objeto único: aplicado a todos los registros
  // - Array: carta_pastoral[index] asignada al registro correspondiente
  const docs = [];
  for (let index = 0; index < toInsertIds.length; index++) {
    const id_aula = toInsertIds[index];
    const aula = aulasConCursos.find(a => String(a._id) === id_aula);
    const requiereCartaPastoral = aula?.id_curso?.carta_pastoral === true;
    const doc = { id_aula, id_alumno, estado: requiereCartaPastoral ? 'pendiente' : 'inscrito' };

    // Procesar carta_pastoral si existe
    if (additionalData.carta_pastoral) {
      let cartaPastoralData = null;

      if (Array.isArray(additionalData.carta_pastoral)) {
        // Si hay carta_pastoral para este índice, usarla
        if (additionalData.carta_pastoral[index]) {
          cartaPastoralData = additionalData.carta_pastoral[index];
        }
      } else {
        // Si es un objeto único, aplicarlo a todos
        cartaPastoralData = additionalData.carta_pastoral;
      }

      // Si tenemos datos de carta_pastoral, comprimir la imagen base64
      if (cartaPastoralData && cartaPastoralData.data) {
        try {
          const { base64, mimetype, size } = await compressBase64Image(cartaPastoralData.data, { maxWidth: 1024, quality: 75, format: 'jpeg' });
          doc.carta_pastoral = {
            data: base64,
            filename: cartaPastoralData.filename,
            mimetype: cartaPastoralData.mimetype || mimetype,
            size: size
          };
        } catch (e) {
          console.error('Fallo al comprimir carta_pastoral en bulkCreateAulaAlumnos:', e?.message || e);
          // Si falla la compresión, guardar los datos originales
          doc.carta_pastoral = cartaPastoralData;
        }
      } else if (cartaPastoralData) {
        // Si no hay data pero sí otros campos, guardarlos
        doc.carta_pastoral = cartaPastoralData;
        doc.estado = 'inscrito';
      }
    }

    docs.push(doc);
  }

  // Validar aforo para las aulas que serán 'inscrito' antes de insertar
  const newInscritosMap = {};
  for (const d of docs) {
    if (d.estado === 'inscrito') {
      const key = String(d.id_aula);
      newInscritosMap[key] = (newInscritosMap[key] || 0) + 1;
    }
  }

  const aulasToCheck = Object.keys(newInscritosMap);
  if (aulasToCheck.length > 0) {
    const problemas = [];
    for (const aulaId of aulasToCheck) {
      // Intentar obtener el documento de aula desde las aulas ya consultadas
      const aulaDoc = aulasConCursos.find(a => String(a._id) === aulaId);
      const aforo = (aulaDoc && typeof aulaDoc.aforo === 'number') ? aulaDoc.aforo : Infinity;

      // Contar inscritos actuales
      const inscritosCount = await AulaAlumno.countDocuments({ id_aula: aulaId, estado: 'inscrito' });

      if (inscritosCount + newInscritosMap[aulaId] > aforo) {
        problemas.push({ aulaId, nombre: aulaDoc?.nombre || aulaId, aforo, actuales: inscritosCount, intentan: newInscritosMap[aulaId] });
      }
    }

    if (problemas.length > 0) {
      const mensaje = problemas.map(p => `Aula ${p.nombre} (aforo=${p.aforo}) tiene ${p.actuales} inscritos; se intentan inscribir ${p.intentan}`).join('; ');
      const err = new Error(`No hay suficiente aforo: ${mensaje}`);
      err.statusCode = 400;
      throw err;
    }
  }

  let inserted = [];
  if (docs.length > 0) {
    const result = await AulaAlumno.insertMany(docs, { ordered: false });
    inserted = result.map(d => String(d._id));
  }

  // ── Correo de bienvenida (fire-and-forget) ──────────────────────────────────
  // Solo se envía si hubo inserciones nuevas
  if (inserted.length > 0) {
    try {

      console.log("entra al correo")
      // 1. Email del alumno
      const personaDoc = await Persona.findById(id_alumno).select('nombres apellido_paterno email').lean();
      const emailDestino = personaDoc?.email;
      const nombreAlumno = personaDoc
        ? `${personaDoc.nombres} ${personaDoc.apellido_paterno}`.trim()
        : 'Estudiante';
      console.log("datos", personaDoc)

      if (emailDestino) {
        // 2. Datos de las aulas insertadas con curso, ciclo y profesor
        const aulasInscritas = await Aula.find({ _id: { $in: toInsertIds } })
          .populate('id_curso', 'nombre_curso')
          .populate('id_ciclo', 'nombre_ciclo')
          .populate('id_profesor', 'nombres apellido_paterno')
          .lean();

        // 3. Nombre del ciclo (tomamos el del primer aula con ciclo definido)
        const cicloNombre = aulasInscritas.find(a => a.id_ciclo?.nombre_ciclo)?.id_ciclo?.nombre_ciclo || 'Nuevo Ciclo';

        // 4. Tarjetas de cada aula: curso, profesor, día y horario
        const aulasHtml = aulasInscritas.length > 0
          ? aulasInscritas.map(a => {
            const nombreCurso = a.id_curso?.nombre_curso || 'Curso';
            const nombreProf = a.id_profesor
              ? `${a.id_profesor.nombres} ${a.id_profesor.apellido_paterno}`.trim()
              : 'Por asignar';
            const dia = a.dia || '—';
            const horaInicio = a.hora_inicio || '—';
            const horaFin = a.hora_fin || '—';
            return `
              <div style="background:#ffffff;border:1px solid #dde3ef;border-radius:8px;padding:16px 20px;margin-bottom:12px;">
                <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1a3a6e;">${nombreCurso}</p>
                <table cellpadding="0" cellspacing="0" style="width:100%;">
                  <tr>
                    <td style="width:20px;vertical-align:top;padding-top:2px;">
                      <span style="display:inline-block;width:16px;height:16px;background:#2e6bbf;border-radius:50%;text-align:center;line-height:16px;color:#fff;font-size:10px;">&#128100;</span>
                    </td>
                    <td style="padding-left:8px;font-size:13px;color:#555;"><strong>Profesor:</strong> ${nombreProf}</td>
                  </tr>
                  <tr style="margin-top:4px;">
                    <td style="width:20px;vertical-align:top;padding-top:6px;">
                      <span style="display:inline-block;width:16px;height:16px;background:#2e6bbf;border-radius:50%;text-align:center;line-height:16px;color:#fff;font-size:10px;">&#128197;</span>
                    </td>
                    <td style="padding-left:8px;padding-top:4px;font-size:13px;color:#555;"><strong>Día:</strong> ${dia}</td>
                  </tr>
                  <tr>
                    <td style="width:20px;vertical-align:top;padding-top:6px;">
                      <span style="display:inline-block;width:16px;height:16px;background:#2e6bbf;border-radius:50%;text-align:center;line-height:16px;color:#fff;font-size:10px;">&#128336;</span>
                    </td>
                    <td style="padding-left:8px;padding-top:4px;font-size:13px;color:#555;"><strong>Horario:</strong> ${horaInicio} – ${horaFin}</td>
                  </tr>
                </table>
              </div>`;
          }).join('')
          : '<p style="color:#666;">Sin cursos registrados</p>';

        const htmlCorreo = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido al ${cicloNombre}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Encabezado -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a6e 0%,#2e6bbf 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">¡Bienvenido al ${cicloNombre}!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">CEBAC — Centro de Enseñanza Bíblica Alianza Comas</p>
            </td>
          </tr>
          <!-- Cuerpo -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#222;">Hola, <strong>${nombreAlumno}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
                Tu inscripción ha sido completada exitosamente. A continuación encontrarás el resumen de los cursos en los que te has matriculado para este ciclo:
              </p>
              <!-- Tarjetas de cursos -->
              <div style="margin-bottom:28px;">
                <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#1a3a6e;text-transform:uppercase;letter-spacing:0.5px;">Cursos Matriculados</p>
                ${aulasHtml}
              </div>
              <p style="margin:0 0 8px;font-size:15px;color:#444;line-height:1.6;">
                Si tienes alguna duda o consulta, no dudes en comunicarte con nosotros.
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

        sendEmail(emailDestino, `Bienvenido al ${cicloNombre}`, htmlCorreo);
      }
    } catch (emailErr) {
      // El error de correo nunca debe afectar la respuesta de inscripción
      console.error('[bulkCreateAulaAlumnos] Error preparando correo de bienvenida:', emailErr?.message || emailErr);
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  return {
    insertedCount: inserted.length,
    insertedIds: inserted,
    skippedExisting: Array.from(existentesSet),
    totalRequested: requestedIds.length,
  };
};

// Inscribe un AulaAlumno cambiando su estado a 'inscrito'
exports.inscribirAulaAlumno = async (id) => {
  // Obtener el registro para comprobar aforo y estado actual
  const existing = await AulaAlumno.findById(id);
  if (!existing) {
    const err = new Error('AulaAlumno no encontrado');
    err.statusCode = 404;
    throw err;
  }

  // Si ya está inscrito, devolver el documento poblado
  if (existing.estado === 'inscrito') {
    return await AulaAlumno.findById(id).populate('id_aula id_alumno');
  }

  // Obtener aforo del aula
  const aulaDoc = await Aula.findById(existing.id_aula).select('aforo nombre').lean();
  const aforo = (aulaDoc && typeof aulaDoc.aforo === 'number') ? aulaDoc.aforo : Infinity;

  const inscritosCount = await AulaAlumno.countDocuments({ id_aula: existing.id_aula, estado: 'inscrito' });
  if (inscritosCount >= aforo) {
    const err = new Error(`El aula "${aulaDoc?.nombre || existing.id_aula}" ya alcanzó su aforo (${aforo}). No es posible inscribir más alumnos.`);
    err.statusCode = 400;
    throw err;
  }

  const aulaAlumno = await AulaAlumno.findByIdAndUpdate(
    id,
    { estado: 'inscrito' },
    { new: true }
  ).populate('id_aula id_alumno');

  return aulaAlumno;
};

/**
 * Actualiza el estado de los alumnos de un aula basándose en su nota_ponderada
 * También cambia el estado del aula a "terminada"
 * Si nota_ponderada >= 11 → estado = 'aprobado'
 * Si nota_ponderada < 11 → estado = 'reprobado'
 * Si nota_ponderada es null → estado = 'retirado'
 * @param {string} id_aula - ID del aula
 * @returns {object} Resumen de la actualización
 */
exports.actualizarEstadosPorNotaPonderada = async (id_aula) => {
  try {
    // Validar que el aula existe
    const aulaDoc = await Aula.findById(id_aula).lean();
    if (!aulaDoc) {
      const err = new Error('Aula no encontrada');
      err.statusCode = 404;
      throw err;
    }

    // Obtener todos los alumnos del aula
    const alumnosAula = await AulaAlumno.find({ id_aula }).lean();

    if (alumnosAula.length === 0) {
      // Aun sin alumnos, actualizar el estado del aula a terminada
      await Aula.updateOne(
        { _id: id_aula },
        { $set: { estado: 'terminada' } }
      );

      return {
        total: 0,
        aprobados: 0,
        reprobados: 0,
        retirados: 0,
        actualizados: 0,
        aula_estado: 'terminada',
      };
    }

    let aprobados = 0;
    let reprobados = 0;
    let retirados = 0;
    let actualizados = 0;

    // Actualizar cada alumno según su nota_ponderada
    for (const alumno of alumnosAula) {
      let nuevoEstado;

      if (alumno.nota_ponderada === null || alumno.nota_ponderada === undefined) {
        // Sin nota → retirado
        nuevoEstado = 'retirado';
        retirados++;
      } else if (alumno.nota_ponderada >= 11) {
        // Nota >= 11 → aprobado
        nuevoEstado = 'aprobado';
        aprobados++;
      } else {
        // Nota < 11 → reprobado
        nuevoEstado = 'reprobado';
        reprobados++;
      }

      // Solo actualizar si el estado cambió
      if (alumno.estado !== nuevoEstado) {
        await AulaAlumno.updateOne(
          { _id: alumno._id },
          { $set: { estado: nuevoEstado } }
        );
        actualizados++;
      }
    }

    // Actualizar el estado del aula a "terminada"
    await Aula.updateOne(
      { _id: id_aula },
      { $set: { estado: 'terminada' } }
    );

    return {
      total: alumnosAula.length,
      aprobados,
      reprobados,
      retirados,
      actualizados,
      aula_estado: 'terminada',
    };
  } catch (error) {
    console.error('Error al actualizar estados por nota ponderada:', error);
    throw error;
  }
};

/**
 * Obtiene todas las solicitudes de retiro con información completa
 * Busca en aulaalumno donde estado = 'solicitud de retiro'
 * y retorna datos del alumno, profesor, curso y ciclo
 * @returns {Array} Lista de solicitudes de retiro con datos completos
 */
exports.getSolicitudesDeRetiro = async () => {
  try {
    const solicitudes = await AulaAlumno.find({ estado: 'solicitud de retiro' })
      .populate('id_alumno', 'nombres apellido_paterno apellido_materno') // Datos del alumno
      .populate({
        path: 'id_aula',
        populate: [
          { path: 'id_profesor', select: 'nombres apellido_paterno apellido_materno' }, // Datos del profesor
          { path: 'id_curso', select: 'nombre_curso' }, // Nombre del curso
          { path: 'id_ciclo', select: 'nombre_ciclo' } // Nombre del ciclo
        ]
      })
      .lean();

    // Formatear la respuesta con los datos solicitados
    const solicitudesFormateadas = solicitudes.map(solicitud => {
      const alumno = solicitud.id_alumno;
      const aula = solicitud.id_aula;
      const profesor = aula?.id_profesor;
      const curso = aula?.id_curso;
      const ciclo = aula?.id_ciclo;

      return {
        id_aulaalumno: solicitud._id,
        nombre_alumno: alumno ? `${alumno.nombres} ${alumno.apellido_paterno} ${alumno.apellido_materno}`.trim() : 'N/A',
        nombre_profesor: profesor ? `${profesor.nombres} ${profesor.apellido_paterno} ${profesor.apellido_materno}`.trim() : 'N/A',
        nombre_curso: curso?.nombre_curso || 'N/A',
        nombre_ciclo: ciclo?.nombre_ciclo || 'N/A'
      };
    });

    return solicitudesFormateadas;
  } catch (error) {
    console.error('Error al obtener solicitudes de retiro:', error);
    throw error;
  }
};

