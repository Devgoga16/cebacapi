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

  const estadosCount = { aprobado: 0, reprobado: 0, 'en curso': 0, retirado: 0 };
  for (const aa of aulaAlumnos) {
    if (Object.prototype.hasOwnProperty.call(estadosCount, aa.estado)) {
      estadosCount[aa.estado]++;
    }
  }
  const totalAlumnos = Object.values(estadosCount).reduce((a, b) => a + b, 0);

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
          label: 'Alumnos',
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
          text: 'Estado de Alumnos Matriculados',
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
  ws1.columns = [{ width: 28 }, { width: 18 }, { width: 18 }, { width: 18 }];

  // Título principal
  ws1.mergeCells('A1:D1');
  const titleCell = ws1.getCell('A1');
  titleCell.value = `REPORTE GENERAL — ${ciclo.nombre_ciclo} (${ciclo.año})`;
  titleCell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(1).height = 32;

  ws1.addRow([]);

  // KPIs
  const kpis = [
    { label: 'Total Alumnos Matriculados', value: totalAlumnos, color: 'FFBBDEFB' },
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

  // Tabla de estados
  const estadoRows = [
    { label: 'Aprobados', key: 'aprobado', color: 'FFE8F5E9' },
    { label: 'Reprobados', key: 'reprobado', color: 'FFFFEBEE' },
    { label: 'En Curso', key: 'en curso', color: 'FFE3F2FD' },
    { label: 'Retirados', key: 'retirado', color: 'FFFFF3E0' },
  ];

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
      totalAlumnos > 0 ? ((estadosCount[e.key] / totalAlumnos) * 100).toFixed(1) : '0.0';
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

  // ===== HOJA 2: REPORTE DE ALUMNOS =====
  const ws2 = workbook.addWorksheet('Reporte de Alumnos');
  ws2.columns = [
    { header: 'N°', key: 'num', width: 6 },
    { header: 'Apellido Paterno', key: 'ap', width: 22 },
    { header: 'Apellido Materno', key: 'am', width: 22 },
    { header: 'Nombres', key: 'nombres', width: 24 },
    { header: 'Género', key: 'genero', width: 12 },
    { header: 'Iglesia', key: 'iglesia', width: 28 },
    { header: 'Ministerio', key: 'ministerio', width: 28 },
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

  // Deduplicar alumnos (un alumno puede estar en múltiples aulas del ciclo)
  const alumnosVistos = new Set();
  const alumnosUnicos = [];
  for (const aa of aulaAlumnos) {
    const id = aa.id_alumno?._id?.toString();
    if (id && !alumnosVistos.has(id)) {
      alumnosVistos.add(id);
      alumnosUnicos.push(aa);
    }
  }

  const estadoColorMap = {
    aprobado: 'FFE8F5E9',
    reprobado: 'FFFFEBEE',
    'en curso': 'FFE3F2FD',
    retirado: 'FFFFF3E0',
    inscrito: 'FFFCE4EC',
    pendiente: 'FFF3E5F5',
    'solicitud de retiro': 'FFFFF8E1',
  };

  let num = 1;
  for (const aa of alumnosUnicos) {
    const p = aa.id_alumno;
    const min = p?.id_ministerio;
    const igl = min?.id_iglesia;

    const row = ws2.addRow({
      num: num++,
      ap: p?.apellido_paterno || '',
      am: p?.apellido_materno || '',
      nombres: p?.nombres || '',
      genero: p?.genero === 'M' ? 'Masculino' : 'Femenino',
      iglesia: igl?.nombre_iglesia || 'Sin iglesia',
      ministerio: min?.nombre_ministerio || 'Sin ministerio',
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
  }

  // Filtros nativos de Excel en todas las columnas
  ws2.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 9 },
  };

  // Congelar la fila de encabezado
  ws2.views = [{ state: 'frozen', ySplit: 1 }];

  return workbook;
}

module.exports = { generarReporteResumenCiclo };
