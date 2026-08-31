const express = require('express');
const router = express.Router();

const {
    criarMovimentacao,
    listarMovimentacoes
} = require('../controllers/movimentacaoEstoqueController');


router.get('/', listarMovimentacoes);
router.post('/', criarMovimentacao);

module.exports = router;