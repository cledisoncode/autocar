const express           = require('express');
const router            = express.Router();

const autenticarToken   = require('../middlewares/authMiddleware');

const {
    criarServico,
    listarServicos,
    buscarServico,
    atualizarServico,
    excluirServico,
    resumoServicos,
    resumoServicoDiario
} = require('../controllers/servicoController');

router.get(
    '/',
    autenticarToken,
    listarServicos
);

router.get(
    '/resumo',
    autenticarToken,
    resumoServicos
)

router.get(
    '/resumo/hoje',
    autenticarToken,
    resumoServicoDiario
);

router.get(
    '/:id',
    autenticarToken,
    buscarServico
);

router.post(
    '/',
    autenticarToken,
    criarServico
);

router.put(
    '/:id',
    autenticarToken,
    atualizarServico
);

router.delete(
    '/:id',
    autenticarToken,
    excluirServico
)






module.exports = router;