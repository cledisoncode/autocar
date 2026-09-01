const express = require('express');
const router = express.Router();
const {
    criarAtendimento,
    listarAtendimentos
} = require('../controllers/atendimentoController');

router.get('/', listarAtendimentos);
router.post('/', criarAtendimento);

module.exports = router;
