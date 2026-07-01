const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificacionesController');

router.get('/:id_persona', ctrl.getNotificaciones);
router.get('/:id_persona/count', ctrl.contarNoLeidas);
router.patch('/:id_persona/leer-todas', ctrl.marcarTodasLeidas);
router.patch('/:id/leer', ctrl.marcarLeida);

module.exports = router;
