const express = require('express');
const router = express.Router();

const abonoController = require('../controllers/abonoController');

router.get('/', abonoController.index);
router.get('/nuevo', abonoController.showCreateForm);
router.post('/', abonoController.create);
router.post('/:id/anular', abonoController.anular);

module.exports = router;
