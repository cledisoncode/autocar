const express = require('express');
const router = express.Router();

const autenticarToken = require('../middlewares/authMiddleware');

const {
    listarEstoque,
    listarAlertas
} = require('../controllers/estoqueController');

router.get(
    '/alertas',
    autenticarToken,
    listarAlertas
);

router.get(
    '/',
    autenticarToken,
    listarEstoque
);

module.exports = router;