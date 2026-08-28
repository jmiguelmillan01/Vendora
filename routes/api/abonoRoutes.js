const express = require('express');
const router = express.Router();
const abonoApiController = require('../../controllers/api/abonoApiController');

router.get('/', abonoApiController.index);
router.post('/', abonoApiController.create);
router.post('/:id/anular', abonoApiController.anular);

module.exports = router;
