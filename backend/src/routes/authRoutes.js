const express = require('express');
const router = express.Router();
const autenticar = require('../middlewares/authMiddleware');
const {
    cadastrar,
    login,
    perfil,
    verificarEmail
} = require('../controllers/authController');

router.post('/cadastro', cadastrar);
router.post('/login', login);
router.post('/verificar-email', verificarEmail);
router.get('/me', autenticar, perfil);

module.exports = router;
