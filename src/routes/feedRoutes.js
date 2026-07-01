const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/feedController');

// Rutas con segmentos estáticos primero (evitar conflictos con /:id_persona)
router.get('/mis-aulas/:id_persona', ctrl.getMisAulas);
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

// Reacciones
router.post('/:id/reaccionar', ctrl.reaccionar);
router.get('/:id/reacciones/resumen', ctrl.getReaccionesSummary);
router.get('/:id/reacciones/detalle', ctrl.getReaccionesDetalle);

module.exports = router;
