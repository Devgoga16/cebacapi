const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatAulaController');

router.get('/:aulaId',                        ctrl.getMensajes);
router.post('/:aulaId',                       ctrl.enviarMensaje);
router.delete('/:aulaId/mensajes/:mensajeId', ctrl.eliminarMensaje);

module.exports = router;
