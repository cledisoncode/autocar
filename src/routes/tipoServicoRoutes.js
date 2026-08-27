const express = require('express');
const router = express.Router();

const autenticarToken = require('../middlewares/authMiddleware');

const {
    listarTiposServico,
    buscarTipoServico,
    criarTipoServico,
    atualizarTipoServico,
    excluirTipoServico
} = require('../controllers/tipoServicoController')

router.get(
    '/', 
    autenticarToken, 
    listarTiposServico
);

router.get(
    '/:id', 
    autenticarToken, 
    buscarTipoServico
);

router.post(
    '/', 
    autenticarToken, 
    criarTipoServico
);

router.put(
    '/:id', 
    autenticarToken, 
    atualizarTipoServico
);

router.delete(
    '/:id',
    autenticarToken,
    excluirTipoServico
);

module.exports = router;