const express = require('express');
const router = express.Router();

const autenticarToken = require('../middlewares/authMiddleware');

const {
    criarMovimentacao,
    listarMovimentacoes
} = require('../controllers/movimentacaoEstoqueController');


router.get(
    '/',
    autenticarToken,
    listarMovimentacoes
);

router.post(
    '/',
    autenticarToken,
    criarMovimentacao
);

module.exports = router;