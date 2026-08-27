const express = require('express');

const {
    cadastrarUsuario,
    loginUsuario
} = require('../controllers/usuarioController');

const router = express.Router();

router.post('/', cadastrarUsuario);
router.post('/login', loginUsuario);

module.exports = router;