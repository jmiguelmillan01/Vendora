const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/authMiddleware');

router.get('/login', redirectIfAuthenticated, authController.showLogin);
router.post('/login', redirectIfAuthenticated, authController.login);
router.post('/logout', authController.logout);

router.get('/registro', redirectIfAuthenticated, authController.showRegister);
router.post('/registro', redirectIfAuthenticated, authController.register);

router.get('/recuperar', redirectIfAuthenticated, authController.showForgotForm);
router.post('/recuperar', redirectIfAuthenticated, authController.requestReset);
router.get('/recuperar/restablecer', redirectIfAuthenticated, authController.showResetForm);
router.post('/recuperar/restablecer', redirectIfAuthenticated, authController.resetPassword);

module.exports = router;
