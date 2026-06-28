const ExcelJS = require('exceljs');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Aula = require('../models/aula');
const AulaAlumno = require('../models/aulaalumno');
const Asistencia = require('../models/asistencia');
const Ciclo = require('../models/ciclo');

async function generarReporteResumenCiclo(idCiclo) {
  const ciclo = await Ciclo.findById(idCiclo).lean();
  if (!ciclo) throw new Error('Ciclo no encontrado');

  const aulas = await Aula.find({ id_ciclo: idCiclo })
    .populate('id_curso', 'nombre_curso')
    .populate('id_profesor', 'nombres apellido_paterno')
    .lean();

  const aulaIds = aulas.map(a => a._id);

  const profesoresUnicos = new Set(
    aulas.map(a => a.id_profesor?._id?.toString()).filter(Boolean)
  );

  // Cada documento de AulaAlumno es una MATRÍCULA: un alumno inscrito en un
  // curso/aula puntual. Un mismo alumno puede tener varias matrículas si
  // lleva más de un curso en el ciclo — por eso "matrículas" y "alumnos
  // únicos" son números distintos y ambos se reportan por separado.
  const aulaAlumnos = await AulaAlumno.find({ id_aula: { $in: aulaIds } })
    .populate({
      path: 'id_alumno',
      select: 'nombres apellido_paterno apellido_materno genero id_ministerio',
      populate: {
        path: 'id_ministerio',
        select: 'nombre_ministerio id_iglesia',
        populate: { path: 'id_iglesia', select: 'nombre_iglesia' },
      },
    })
    .lean();

  const cursoPorAula = new Map(
    aulas.map((a) => [String(a._id), a.id_curso?.nombre_curso || 'Sin curso'])
  );

  // Alumnos únicos + cuántos cursos lleva cada uno
  const cursosPorAlumno = new Map();
  for (const aa of aulaAlumnos) {
    const idAlumno = aa.id_alumno?._id?.toString();
    if (!idAlumno) continue;
    if (!cursosPorAlumno.has(idAlumno)) cursosPorAlumno.set(idAlumno, new Set());
    cursosPorAlumno.get(idAlumno).add(cursoPorAula.get(String(aa.id_aula)) || 'Sin curso');
  }
  const totalAlumnosUnicos = cursosPorAlumno.size;
  const totalMatriculas = aulaAlumnos.length;
  const alumnosConMasDeUnCurso = Array.from(cursosPorAlumno.values()).filter((s) => s.size > 1).length;

  // Estado a nivel de MATRÍCULA (cada curso que lleva un alumno tiene su
  // propio estado: puede tener "aprobado" en uno y "en curso" en otro).
  // Contar aquí sobre todas las matrículas, sin deduplicar por alumno, es lo
  // correcto — y es exactamente lo que se lista fila por fila en la Hoja 2,
  // así que ambas hojas son consistentes por construcción.
  const estadosCount = { aprobado: 0, reprobado: 0, 'en curso': 0, retirado: 0 };
  for (const aa of aulaAlumnos) {
    if (Object.prototype.hasOwnProperty.call(estadosCount, aa.estado)) {
      estadosCount[aa.estado]++;
    }
  }

  const asistencias = await Asistencia.find({ id_aula: { $in: aulaIds } }).lean();
  const presentes = asistencias.filter(a => a.estado === 'presente').length;
  const porcentajeAsistencia =
    asistencias.length > 0 ? ((presentes / asistencias.length) * 100).toFixed(1) : '0.0';

  // Gráfico de barras
  const chartCanvas = new ChartJSNodeCanvas({ width: 520, height: 320, backgroundColour: 'white' });
  const chartBuffer = await chartCanvas.renderToBuffer({
    type: 'bar',
    data: {
      labels: ['Aprobados', 'Reprobados', 'En Curso', 'Retirados'],
      datasets: [
        {
          label: 'Matrículas',
          data: [
            estadosCount.aprobado,
            estadosCount.reprobado,
            estadosCount['en curso'],
            estadosCount.retirado,
          ],
          backgroundColor: ['#4CAF50', '#F44336', '#2196F3', '#FF9800'],
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Estado de Matrículas (alumno × curso)',
          font: { size: 14, weight: 'bold' },
        },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CEBAC Sistema';

  // ===== HOJA 1: RESUMEN GENERAL =====
  const ws1 = workbook.addWorksheet('Resumen General');
  ws1.columns = [{ width: 30 }, { width: 18 }, { width: 18 }, { width: 18 }];

  // Título principal
  ws1.mergeCells('A1:D1');
  const titleCell = ws1.getCell('A1');
  titleCell.value = `REPORTE GENERAL — ${ciclo.nombre_ciclo} (${ciclo.año})`;
  titleCell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(1).height = 32;

  ws1.addRow([]);

  // Nota aclaratoria: por qué "matrículas" puede ser mayor que "alumnos únicos"
  const notaRow = ws1.addRow([
    'Nota: un mismo alumno puede llevar más de un curso en el ciclo. "Alumnos Únicos" cuenta personas; "Matrículas" cuenta inscripciones (alumno × curso).',
  ]);
  ws1.mergeCells(`A${notaRow.number}:D${notaRow.number}`);
  notaRow.height = 28;
  notaRow.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF616161' } };
  notaRow.getCell(1).alignment = { wrapText: true, vertical: 'middle' };

  ws1.addRow([]);

  // KPIs
  const kpis = [
    { label: 'Alumnos Únicos', value: totalAlumnosUnicos, color: 'FFBBDEFB' },
    { label: 'Total Matrículas (alumno × curso)', value: totalMatriculas, color: 'FFD1C4E9' },
    { label: 'Alumnos con más de un curso', value: alumnosConMasDeUnCurso, color: 'FFB2DFDB' },
    { label: 'Profesores Asignados', value: profesoresUnicos.size, color: 'FFC8E6C9' },
    { label: 'Aulas Creadas', value: aulas.length, color: 'FFFFE0B2' },
    { label: 'Nivel de Asistencia General', value: `${porcentajeAsistencia}%`, color: 'FFE1BEE7' },
  ];

  for (const kpi of kpis) {
    const row = ws1.addRow([kpi.label, kpi.value]);
    row.height = 22;
    row.getCell(1).font = { bold: true };
    row.getCell(1).alignment = { vertical: 'middle' };
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.color } };
    row.getCell(2).font = { bold: true, size: 12 };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  }

  ws1.addRow([]);

  // Tabla de estados por matrícula
  const estadoRows = [
    { label: 'Aprobados', key: 'aprobado', color: 'FFE8F5E9' },
    { label: 'Reprobados', key: 'reprobado', color: 'FFFFEBEE' },
    { label: 'En Curso', key: 'en curso', color: 'FFE3F2FD' },
    { label: 'Retirados', key: 'retirado', color: 'FFFFF3E0' },
  ];

  const tblTitleRow = ws1.addRow(['Estado de Matrículas (cada curso que lleva un alumno cuenta por separado)']);
  ws1.mergeCells(`A${tblTitleRow.number}:D${tblTitleRow.number}`);
  tblTitleRow.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF616161' } };

  const tblHeader = ws1.addRow(['Estado', 'Cantidad', 'Porcentaje']);
  tblHeader.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3949AB' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });
  tblHeader.height = 20;

  for (const e of estadoRows) {
    const pct =
      totalMatriculas > 0 ? ((estadosCount[e.key] / totalMatriculas) * 100).toFixed(1) : '0.0';
    const row = ws1.addRow([e.label, estadosCount[e.key], `${pct}%`]);
    row.height = 20;
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: e.color } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  }

  // Imagen del gráfico
  const imageId = workbook.addImage({ buffer: chartBuffer, extension: 'png' });
  const chartStartRow = ws1.lastRow.number + 2;
  ws1.addImage(imageId, {
    tl: { col: 0, row: chartStartRow - 1 },
    ext: { width: 520, height: 320 },
  });

  // ===== HOJA 2: REPORTE DE MATRÍCULAS =====
  // Una fila por matrícula (alumno × curso), no por alumno: así el estado y
  // la nota mostrados son siempre los reales de ESE curso, sin tener que
  // adivinar cuál mostrar cuando un alumno lleva más de uno.
  const ws2 = workbook.addWorksheet('Reporte de Alumnos');
  ws2.columns = [
    { header: 'N°', key: 'num', width: 6 },
    { header: 'Apellido Paterno', key: 'ap', width: 22 },
    { header: 'Apellido Materno', key: 'am', width: 22 },
    { header: 'Nombres', key: 'nombres', width: 24 },
    { header: 'Género', key: 'genero', width: 12 },
    { header: 'Iglesia', key: 'iglesia', width: 28 },
    { header: 'Ministerio', key: 'ministerio', width: 28 },
    { header: 'Curso', key: 'curso', width: 30 },
    { header: 'N° Cursos en el Ciclo', key: 'numCursos', width: 18 },
    { header: 'Estado', key: 'estado', width: 18 },
    { header: 'Nota Ponderada', key: 'nota', width: 16 },
  ];

  // Estilo header hoja 2
  const h2 = ws2.getRow(1);
  h2.height = 22;
  h2.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  const estadoColorMap = {
    aprobado: 'FFE8F5E9',
    reprobado: 'FFFFEBEE',
    'en curso': 'FFE3F2FD',
    retirado: 'FFFFF3E0',
    inscrito: 'FFFCE4EC',
    pendiente: 'FFF3E5F5',
    'solicitud de retiro': 'FFFFF8E1',
  };

  // Ordenar por alumno (apellido paterno, materno, nombres) y luego por curso,
  // para que las matrículas de un mismo alumno con varios cursos queden juntas.
  const matriculasOrdenadas = [...aulaAlumnos].sort((a, b) => {
    const pa = (a.id_alumno?.apellido_paterno || '').localeCompare(b.id_alumno?.apellido_paterno || '', 'es');
    if (pa !== 0) return pa;
    const ma = (a.id_alumno?.apellido_materno || '').localeCompare(b.id_alumno?.apellido_materno || '', 'es');
    if (ma !== 0) return ma;
    const na = (a.id_alumno?.nombres || '').localeCompare(b.id_alumno?.nombres || '', 'es');
    if (na !== 0) return na;
    return (cursoPorAula.get(String(a.id_aula)) || '').localeCompare(cursoPorAula.get(String(b.id_aula)) || '', 'es');
  });

  let num = 1;
  for (const aa of matriculasOrdenadas) {
    const p = aa.id_alumno;
    const min = p?.id_ministerio;
    const igl = min?.id_iglesia;
    const idAlumno = p?._id?.toString();
    const numCursos = idAlumno ? cursosPorAlumno.get(idAlumno)?.size || 1 : 1;

    const row = ws2.addRow({
      num: num++,
      ap: p?.apellido_paterno || '',
      am: p?.apellido_materno || '',
      nombres: p?.nombres || '',
      genero: p?.genero === 'M' ? 'Masculino' : 'Femenino',
      iglesia: igl?.nombre_iglesia || 'Sin iglesia',
      ministerio: min?.nombre_ministerio || 'Sin ministerio',
      curso: cursoPorAula.get(String(aa.id_aula)) || 'Sin curso',
      numCursos,
      estado: aa.estado || '',
      nota: aa.nota_ponderada ?? '',
    });

    const bg = estadoColorMap[aa.estado] || 'FFFFFFFF';
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });
    row.getCell('ap').alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell('am').alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell('nombres').alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell('curso').alignment = { horizontal: 'left', vertical: 'middle' };
    if (numCursos > 1) {
      row.getCell('numCursos').font = { bold: true, color: { argb: 'FFD32F2F' } };
    }
  }

  // Filtros nativos de Excel en todas las columnas
  ws2.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 11 },
  };

  // Congelar la fila de encabezado
  ws2.views = [{ state: 'frozen', ySplit: 1 }];

  return workbook;
}

module.exports = { generarReporteResumenCiclo };
