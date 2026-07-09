const express = require('express');
const multer = require('multer');
const ctrl = require('../controllers/recursosController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB máx
  fileFilter(req, file, cb) {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Recursos de un aula
router.get('/aulas/:id/recursos',            ctrl.listarRecursos);
router.post('/aulas/:id/recursos',           upload.single('archivo'), ctrl.subirRecurso);

// Recurso individual
router.get('/recursos/:id/download',         ctrl.obtenerUrlDescarga);
router.delete('/recursos/:id',               ctrl.eliminarRecurso);

// Comentarios de un recurso
router.get('/recursos/:id/comentarios',      ctrl.listarComentarios);
router.post('/recursos/:id/comentarios',     ctrl.crearComentario);
router.delete('/comentarios-recurso/:id',    ctrl.eliminarComentario);

module.exports = router;
