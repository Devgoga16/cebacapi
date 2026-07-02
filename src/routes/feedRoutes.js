const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/feedController');

// Rutas con segmentos estáticos primero (evitar conflictos con /:id_persona)
router.get('/mis-aulas/:id_persona', ctrl.getMisAulas);
router.get('/post/:id', ctrl.getPublicacion);
router.delete('/comentarios/:comentarioId', ctrl.eliminarComentario);

// Feed
router.get('/:id_persona', ctrl.getFeed);
router.post('/', ctrl.crearPublicacion);
router.delete('/:id', ctrl.eliminarPublicacion);

// Comentarios
router.get('/:id/comentarios', ctrl.getComentarios);
router.post('/:id/comentarios', ctrl.agregarComentario);

// Anuncios
router.post('/:id/visto', ctrl.marcarAnuncioVisto);

// Encuestas
router.post('/:id/votar', ctrl.votarEncuesta);

// Fijar
router.patch('/:id/fijar', ctrl.fijarPublicacion);

// Reacciones
router.post('/:id/reaccionar', ctrl.reaccionar);
router.get('/:id/reacciones/resumen', ctrl.getReaccionesSummary);
router.get('/:id/reacciones/detalle', ctrl.getReaccionesDetalle);

module.exports = router;
