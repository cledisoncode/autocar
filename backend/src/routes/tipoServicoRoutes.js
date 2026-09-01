const express = require('express');
const router = express.Router();

const {
    listarTiposServico,
    buscarTipoServico,
    criarTipoServico,
    atualizarTipoServico,
    excluirTipoServico
} = require('../controllers/tipoServicoController')

router.get('/', listarTiposServico);
router.get('/:id', buscarTipoServico);
router.post('/', criarTipoServico);
router.put('/:id', atualizarTipoServico);
router.delete('/:id', excluirTipoServico);

module.exports = router;