const Asistencia = require('../models/asistencia');
const Aula = require('../models/aula');
const Persona = require('../models/persona');
const Calificacion = require('../models/calificacion');
const TipoCalificacion = require('../models/tipoCalificacion');
const Ciclo = require('../models/ciclo');
const Nivel = require('../models/nivel');
const Curso = require('../models/curso');
const ExcelJS = require('exceljs');
const AdmZip = require('adm-zip');

/**
 * Genera un reporte de asistencias de un aula en formato Excel
 * @param {String} idAula - ID del aula
 * @returns {ExcelJS.Workbook} - Libro de Excel con el reporte
 */
const generarReporteAsistencias = async (idAula) => {
  try {
    // 1. Obtener información del aula con todas las relaciones
    const aula = await Aula.findById(idAula)
      .populate('id_curso', 'nombre_curso')
      .populate('id_ciclo', 'nombre_ciclo')
      .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
      .lean();

    if (!aula) {
      throw new Error('Aula no encontrada');
    }

    // 2. Obtener todas las asistencias del aula
    const asistencias = await Asistencia.find({ id_aula: idAula })
      .populate('id_alumno', 'nombres apellido_paterno apellido_materno')
      .lean();

    if (asistencias.length === 0) {
      throw new Error('No hay asistencias registradas para esta aula');
    }

    // 3. Extraer fechas únicas y ordenarlas
    const fechasSet = new Set();
    asistencias.forEach(asist => {
      const fecha = new Date(asist.fecha);
      fechasSet.add(fecha.toISOString().split('T')[0]);
    });
    const fechasOrdenadas = Array.from(fechasSet).sort();

    // 4. Obtener lista única de alumnos
    const alumnosMap = new Map();
    asistencias.forEach(asist => {
      if (asist.id_alumno) {
        const alumnoId = asist.id_alumno._id.toString();
        if (!alumnosMap.has(alumnoId)) {
          alumnosMap.set(alumnoId, {
            id: alumnoId,
            nombres: asist.id_alumno.nombres || '',
            apellido_paterno: asist.id_alumno.apellido_paterno || '',
            apellido_materno: asist.id_alumno.apellido_materno || '',
            nombreCompleto: `${asist.id_alumno.apellido_paterno || ''} ${asist.id_alumno.apellido_materno || ''} ${asist.id_alumno.nombres || ''}`.trim()
          });
        }
      }
    });

    // Ordenar alumnos por apellido
    const alumnos = Array.from(alumnosMap.values()).sort((a, b) => 
      a.nombreCompleto.localeCompare(b.nombreCompleto)
    );

    // 5. Crear estructura de datos para el reporte
    const matrizAsistencias = new Map();
    asistencias.forEach(asist => {
      if (asist.id_alumno) {
        const alumnoId = asist.id_alumno._id.toString();
        const fecha = new Date(asist.fecha).toISOString().split('T')[0];
        const key = `${alumnoId}-${fecha}`;
        
        // Mapear estados a letras
        let marca = '';
        switch (asist.estado) {
          case 'presente':
            marca = 'P';
            break;
          case 'ausente':
            marca = 'A';
            break;
          case 'justificado':
            marca = 'J';
            break;
          case 'tarde':
            marca = 'T';
            break;
          default:
            marca = '-';
        }
        matrizAsistencias.set(key, marca);
      }
    });

    // 6. Crear el libro de Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CEBAC API';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Reporte de Asistencias', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // 7. Crear cabecera con información del curso
    const nombreProfesor = aula.id_profesor 
      ? `${aula.id_profesor.apellido_paterno || ''} ${aula.id_profesor.apellido_materno || ''} ${aula.id_profesor.nombres || ''}`.trim()
      : 'No asignado';

    // Fila 1: Título
    worksheet.mergeCells('A1', String.fromCharCode(65 + fechasOrdenadas.length) + '1');
    const tituloCell = worksheet.getCell('A1');
    tituloCell.value = 'REPORTE DE ASISTENCIAS';
    tituloCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    tituloCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Fila 2: Vacía
    worksheet.getRow(2).height = 10;

    // Fila 3-5: Información del curso
    const infoCells = [
      { cell: 'A3', label: 'Curso:', value: aula.id_curso?.nombre_curso || 'No disponible' },
      { cell: 'A4', label: 'Ciclo:', value: aula.id_ciclo?.nombre_ciclo || 'No disponible' },
      { cell: 'A5', label: 'Docente:', value: nombreProfesor }
    ];

    infoCells.forEach(({ cell, label, value }) => {
      const labelCell = worksheet.getCell(cell);
      labelCell.value = label;
      labelCell.font = { bold: true, size: 11 };
      
      const valueCell = worksheet.getCell(String.fromCharCode(cell.charCodeAt(0) + 1) + cell.charAt(1));
      valueCell.value = value;
      valueCell.font = { size: 11 };
      
      worksheet.mergeCells(
        valueCell.address, 
        String.fromCharCode(65 + Math.min(fechasOrdenadas.length, 5)) + cell.charAt(1)
      );
    });

    // Fila 6: Vacía
    worksheet.getRow(6).height = 10;

    // Fila 7: Encabezados de la tabla
    const headerRow = 7;
    const dataStartRow = 8;

    // Columna A: Alumno
    const headerAlumno = worksheet.getCell(`A${headerRow}`);
    headerAlumno.value = 'ALUMNO';
    headerAlumno.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerAlumno.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerAlumno.alignment = { vertical: 'middle', horizontal: 'center' };
    headerAlumno.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Columnas de fechas
    fechasOrdenadas.forEach((fecha, index) => {
      const col = String.fromCharCode(66 + index); // B, C, D...
      const cell = worksheet.getCell(`${col}${headerRow}`);
      
      // Formatear fecha dd/mm/yyyy
      const [year, month, day] = fecha.split('-');
      cell.value = `${day}/${month}/${year}`;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', textRotation: 90 };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    worksheet.getRow(headerRow).height = 80;

    // 8. Llenar datos de alumnos y asistencias
    alumnos.forEach((alumno, index) => {
      const row = dataStartRow + index;
      
      // Nombre del alumno
      const nombreCell = worksheet.getCell(`A${row}`);
      nombreCell.value = alumno.nombreCompleto;
      nombreCell.font = { size: 10 };
      nombreCell.alignment = { vertical: 'middle', horizontal: 'left' };
      nombreCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Asistencias por fecha
      fechasOrdenadas.forEach((fecha, fechaIndex) => {
        const col = String.fromCharCode(66 + fechaIndex);
        const cell = worksheet.getCell(`${col}${row}`);
        const key = `${alumno.id}-${fecha}`;
        const marca = matrizAsistencias.get(key) || '-';
        
        cell.value = marca;
        cell.font = { size: 11, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Colorear según el estado
        switch (marca) {
          case 'P':
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF92D050' } // Verde
            };
            break;
          case 'A':
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFF6B6B' } // Rojo
            };
            break;
          case 'J':
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFD966' } // Amarillo
            };
            break;
          case 'T':
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC000' } // Naranja
            };
            break;
        }
      });
    });

    // 9. Ajustar anchos de columnas
    worksheet.getColumn('A').width = 40;
    for (let i = 0; i < fechasOrdenadas.length; i++) {
      worksheet.getColumn(String.fromCharCode(66 + i)).width = 5;
    }

    // 10. Agregar leyenda al final
    const leyendaRow = dataStartRow + alumnos.length + 2;
    worksheet.getCell(`A${leyendaRow}`).value = 'Leyenda:';
    worksheet.getCell(`A${leyendaRow}`).font = { bold: true, size: 10 };
    
    const leyendas = [
      { letra: 'P', significado: 'Presente', color: 'FF92D050' },
      { letra: 'A', significado: 'Ausente', color: 'FFFF6B6B' },
      { letra: 'J', significado: 'Justificado', color: 'FFFFD966' },
      { letra: 'T', significado: 'Tarde', color: 'FFFFC000' }
    ];

    leyendas.forEach((ley, index) => {
      const row = leyendaRow + index + 1;
      const letraCell = worksheet.getCell(`A${row}`);
      letraCell.value = ley.letra;
      letraCell.font = { bold: true, size: 10 };
      letraCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: ley.color }
      };
      letraCell.alignment = { vertical: 'middle', horizontal: 'center' };
      letraCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      const sigCell = worksheet.getCell(`B${row}`);
      sigCell.value = ley.significado;
      sigCell.font = { size: 10 };
      sigCell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    // ============================================
    // SEGUNDA PESTAÑA: CALIFICACIONES
    // ============================================
    
    // 1. Obtener los tipos de calificación del aula
    const tiposCalificacion = await TipoCalificacion.find({ id_aula: idAula })
      .sort({ orden: 1, nombre: 1 })
      .lean();

    // 2. Obtener todas las calificaciones del aula
    const calificaciones = await Calificacion.find({ id_aula: idAula })
      .populate('id_alumno', 'nombres apellido_paterno apellido_materno')
      .populate('id_tipo_calificacion', 'nombre porcentaje')
      .lean();

    // Solo crear la pestaña si hay calificaciones registradas
    if (calificaciones.length > 0 && tiposCalificacion.length > 0) {
      const sheetCalificaciones = workbook.addWorksheet('Calificaciones', {
        pageSetup: { paperSize: 9, orientation: 'landscape' }
      });

      // 3. Crear estructura de datos
      const alumnosCalif = new Map();
      calificaciones.forEach(calif => {
        if (calif.id_alumno && calif.id_tipo_calificacion) {
          const alumnoId = calif.id_alumno._id.toString();
          if (!alumnosCalif.has(alumnoId)) {
            alumnosCalif.set(alumnoId, {
              id: alumnoId,
              nombreCompleto: `${calif.id_alumno.apellido_paterno || ''} ${calif.id_alumno.apellido_materno || ''} ${calif.id_alumno.nombres || ''}`.trim(),
              calificaciones: new Map()
            });
          }
          const tipoId = calif.id_tipo_calificacion._id.toString();
          alumnosCalif.get(alumnoId).calificaciones.set(tipoId, calif.nota);
        }
      });

      const alumnosArray = Array.from(alumnosCalif.values()).sort((a, b) => 
        a.nombreCompleto.localeCompare(b.nombreCompleto)
      );

      // 4. Cabecera - Título
      const numColsCalif = tiposCalificacion.length + 2; // Alumno + tipos + promedio
      const lastColLetter = String.fromCharCode(64 + numColsCalif);
      
      sheetCalificaciones.mergeCells('A1', `${lastColLetter}1`);
      const tituloCalif = sheetCalificaciones.getCell('A1');
      tituloCalif.value = 'REPORTE DE CALIFICACIONES';
      tituloCalif.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      tituloCalif.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0066CC' }
      };
      tituloCalif.alignment = { vertical: 'middle', horizontal: 'center' };
      sheetCalificaciones.getRow(1).height = 25;

      // Fila 2: Vacía
      sheetCalificaciones.getRow(2).height = 10;

      // Filas 3-5: Información del curso (igual que en asistencias)
      const infoCalifCells = [
        { cell: 'A3', label: 'Curso:', value: aula.id_curso?.nombre_curso || 'No disponible' },
        { cell: 'A4', label: 'Ciclo:', value: aula.id_ciclo?.nombre_ciclo || 'No disponible' },
        { cell: 'A5', label: 'Docente:', value: nombreProfesor }
      ];

      infoCalifCells.forEach(({ cell, label, value }) => {
        const labelCell = sheetCalificaciones.getCell(cell);
        labelCell.value = label;
        labelCell.font = { bold: true, size: 11 };
        
        const valueCell = sheetCalificaciones.getCell(String.fromCharCode(cell.charCodeAt(0) + 1) + cell.charAt(1));
        valueCell.value = value;
        valueCell.font = { size: 11 };
        
        sheetCalificaciones.mergeCells(
          valueCell.address, 
          `${String.fromCharCode(Math.min(64 + numColsCalif, 70))}${cell.charAt(1)}`
        );
      });

      // Fila 6: Vacía
      sheetCalificaciones.getRow(6).height = 10;

      // Fila 7: Encabezados
      const headerRowCalif = 7;
      const dataStartRowCalif = 8;

      // Columna A: Alumno
      const headerAlumnoCalif = sheetCalificaciones.getCell(`A${headerRowCalif}`);
      headerAlumnoCalif.value = 'ALUMNO';
      headerAlumnoCalif.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerAlumnoCalif.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerAlumnoCalif.alignment = { vertical: 'middle', horizontal: 'center' };
      headerAlumnoCalif.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Columnas de tipos de calificación
      tiposCalificacion.forEach((tipo, index) => {
        const col = String.fromCharCode(66 + index); // B, C, D...
        const cell = sheetCalificaciones.getCell(`${col}${headerRowCalif}`);
        
        cell.value = `${tipo.nombre}\n(${tipo.porcentaje}%)`;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Última columna: Promedio Ponderado
      const colPromedio = String.fromCharCode(66 + tiposCalificacion.length);
      const headerPromedio = sheetCalificaciones.getCell(`${colPromedio}${headerRowCalif}`);
      headerPromedio.value = 'PROMEDIO\nPONDERADO';
      headerPromedio.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerPromedio.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6B00' }
      };
      headerPromedio.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerPromedio.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      sheetCalificaciones.getRow(headerRowCalif).height = 40;

      // 5. Llenar datos de alumnos y calificaciones
      alumnosArray.forEach((alumno, index) => {
        const row = dataStartRowCalif + index;
        
        // Nombre del alumno
        const nombreCell = sheetCalificaciones.getCell(`A${row}`);
        nombreCell.value = alumno.nombreCompleto;
        nombreCell.font = { size: 10 };
        nombreCell.alignment = { vertical: 'middle', horizontal: 'left' };
        nombreCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Calificaciones por tipo
        let sumaPonderada = 0;
        let sumaPorcentajes = 0;

        tiposCalificacion.forEach((tipo, tipoIndex) => {
          const col = String.fromCharCode(66 + tipoIndex);
          const cell = sheetCalificaciones.getCell(`${col}${row}`);
          const tipoId = tipo._id.toString();
          const nota = alumno.calificaciones.get(tipoId);
          
          if (nota !== undefined) {
            // Usar la nota tal cual está en la BD
            cell.value = nota;
            cell.numFmt = '0.00';
            
            // Calcular ponderado
            sumaPonderada += nota * (tipo.porcentaje / 100);
            sumaPorcentajes += tipo.porcentaje;
          } else {
            cell.value = '-';
          }
          
          cell.font = { size: 10 };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        // Calcular y mostrar promedio ponderado
        const cellPromedio = sheetCalificaciones.getCell(`${colPromedio}${row}`);
        
        if (sumaPorcentajes > 0) {
          const promedioPonderado = sumaPonderada;
          cellPromedio.value = promedioPonderado;
          cellPromedio.numFmt = '0.00';
          cellPromedio.font = { size: 11, bold: true };
          
          // Colorear según si aprobó o no (11 es el mínimo para aprobar)
          if (promedioPonderado >= 11) {
            cellPromedio.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF92D050' } // Verde - Aprobado
            };
          } else {
            cellPromedio.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFF6B6B' } // Rojo - Desaprobado
            };
          }
        } else {
          cellPromedio.value = '-';
          cellPromedio.font = { size: 11 };
        }
        
        cellPromedio.alignment = { vertical: 'middle', horizontal: 'center' };
        cellPromedio.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // 6. Ajustar anchos de columnas
      sheetCalificaciones.getColumn('A').width = 40;
      for (let i = 0; i < tiposCalificacion.length; i++) {
        sheetCalificaciones.getColumn(String.fromCharCode(66 + i)).width = 15;
      }
      sheetCalificaciones.getColumn(colPromedio).width = 15;

      // 7. Agregar nota al final
      const notaRow = dataStartRowCalif + alumnosArray.length + 2;
      sheetCalificaciones.getCell(`A${notaRow}`).value = 'Nota: Escala vigesimal (0-20). Mínimo aprobatorio: 11';
      sheetCalificaciones.getCell(`A${notaRow}`).font = { italic: true, size: 10 };
      
      const leyendaColorRow = notaRow + 1;
      sheetCalificaciones.getCell(`A${leyendaColorRow}`).value = 'Leyenda:';
      sheetCalificaciones.getCell(`A${leyendaColorRow}`).font = { bold: true, size: 10 };
      
      const leyendasCalif = [
        { texto: 'Verde: Aprobado (≥ 11)', color: 'FF92D050' },
        { texto: 'Rojo: Desaprobado (< 11)', color: 'FFFF6B6B' }
      ];
      
      leyendasCalif.forEach((ley, index) => {
        const row = leyendaColorRow + index + 1;
        const cell = sheetCalificaciones.getCell(`A${row}`);
        cell.value = ley.texto;
        cell.font = { size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: ley.color }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }

    return workbook;

  } catch (error) {
    console.error('Error en generarReporteAsistencias:', error);
    throw error;
  }
};

/**
 * Genera un ZIP con reportes de todas las aulas de un ciclo, organizados por nivel y curso
 * @param {String} idCiclo - ID del ciclo
 * @returns {Promise<archiver.Archiver>} - Stream del archivo ZIP
 */
const generarReporteCicloCompleto = async (idCiclo) => {
  try {
    // 1. Obtener información del ciclo
    const ciclo = await Ciclo.findById(idCiclo).lean();
    if (!ciclo) {
      throw new Error('Ciclo no encontrado');
    }

    // 2. Obtener todas las aulas del ciclo con sus relaciones
    const aulas = await Aula.find({ id_ciclo: idCiclo })
      .populate('id_curso', 'nombre_curso id_nivel')
      .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
      .populate('id_ciclo', 'nombre_ciclo')
      .lean();

    if (aulas.length === 0) {
      throw new Error('No hay aulas registradas para este ciclo');
    }

    // 3. Obtener todos los niveles únicos de los cursos
    const niveles = await Nivel.find().sort({ orden: 1 }).lean();
    const nivelesMap = new Map(niveles.map(n => [n._id.toString(), n]));

    // 4. Organizar aulas por nivel y curso
    const estructura = new Map(); // nivel -> curso -> [aulas]

    for (const aula of aulas) {
      if (!aula.id_curso) continue;

      const curso = await Curso.findById(aula.id_curso._id).populate('id_nivel', 'nombre_nivel orden').lean();
      if (!curso || !curso.id_nivel) continue;

      const nivelId = curso.id_nivel._id.toString();
      const cursoId = curso._id.toString();

      if (!estructura.has(nivelId)) {
        estructura.set(nivelId, new Map());
      }
      if (!estructura.get(nivelId).has(cursoId)) {
        estructura.get(nivelId).set(cursoId, {
          nombre: curso.nombre_curso,
          aulas: []
        });
      }
      estructura.get(nivelId).get(cursoId).aulas.push(aula);
    }

    // 5. Crear el archivo ZIP
    const zip = new AdmZip();

    // 6. Generar reportes y agregarlos al ZIP
    const nombreCiclo = ciclo.nombre_ciclo.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Ordenar niveles por orden
    const nivelesOrdenados = Array.from(estructura.keys())
      .map(id => ({ id, nivel: nivelesMap.get(id) }))
      .filter(item => item.nivel)
      .sort((a, b) => (a.nivel.orden || 0) - (b.nivel.orden || 0));

    for (const { id: nivelId, nivel } of nivelesOrdenados) {
      const cursos = estructura.get(nivelId);
      const nombreNivel = nivel.nombre_nivel.replace(/[^a-zA-Z0-9]/g, '_');

      for (const [cursoId, cursoData] of cursos) {
        const nombreCurso = cursoData.nombre.replace(/[^a-zA-Z0-9]/g, '_');
        
        for (const aula of cursoData.aulas) {
          try {
            // Generar el workbook para esta aula
            const workbook = await generarReporteAsistencias(aula._id.toString());
            
            // Crear nombre del archivo
            const dia = aula.dia || 'Sin_Dia';
            const nombreProfesor = aula.id_profesor 
              ? `${aula.id_profesor.apellido_paterno || ''}_${aula.id_profesor.apellido_materno || ''}`.replace(/[^a-zA-Z0-9]/g, '_')
              : 'Profesor';
            
            const nombreArchivo = `Reporte_${dia}_${nombreProfesor}.xlsx`;
            const rutaCompleta = `${nombreNivel}/${nombreCurso}/${nombreArchivo}`;

            // Convertir workbook a buffer
            const buffer = await workbook.xlsx.writeBuffer();
            
            // Agregar al ZIP
            zip.addFile(rutaCompleta, Buffer.from(buffer));
            
            console.log(`✓ Reporte generado: ${rutaCompleta}`);
          } catch (error) {
            console.error(`Error generando reporte para aula ${aula._id}:`, error.message);
            // Continuar con las demás aulas aunque una falle
          }
        }
      }
    }

    // 7. Generar y retornar el buffer del ZIP
    const zipBuffer = zip.toBuffer();
    
    console.log(`✓ ZIP generado con ${zip.getEntries().length} archivos`);
    
    return zipBuffer;

  } catch (error) {
    console.error('Error en generarReporteCicloCompleto:', error);
    throw error;
  }
};

module.exports = {
  generarReporteAsistencias,
  generarReporteCicloCompleto
};
