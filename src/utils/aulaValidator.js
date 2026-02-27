// Validación para crear y actualizar Aula
// Puedes extender los required según la lógica de negocio

function validateAulaInput(body) {
  const errors = [];

  if (typeof body.es_presencial !== 'boolean') {
    errors.push('es_presencial debe ser booleano');
  }
  if (!body.id_profesor) {
    errors.push('id_profesor es requerido');
  }
  if (!body.id_curso) {
    errors.push('id_curso es requerido');
  }
  if (!body.dia) {
    errors.push('dia es requerido');
  }
  if (!body.hora_inicio) {
    errors.push('hora_inicio es requerido');
  }
  if (!body.hora_fin) {
    errors.push('hora_fin es requerido');
  }
  if (typeof body.aforo !== 'number') {
    errors.push('aforo debe ser numérico');
  }
  if (!body.id_ciclo) {
    errors.push('id_ciclo es requerido');
  }
  if (!body.fecha_inicio) {
    errors.push('fecha_inicio es requerido');
  }
  if (!body.fecha_fin) {
    errors.push('fecha_fin es requerido');
  }
  if (body.linkWhatsApp && typeof body.linkWhatsApp !== 'string') {
    errors.push('linkWhatsApp debe ser string');
  }
  if (body.numeroAula && typeof body.numeroAula !== 'string') {
    errors.push('numeroAula debe ser string');
  }

  return errors;
}

module.exports = { validateAulaInput };