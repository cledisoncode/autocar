const express = require('express');
const router = express.Router();
const autenticarToken = require('../middlewares/authMiddleware');

const {
    listarCategorias,
    buscarCategoria,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria 
} = require('../controllers/categoriaController')

router.get(
    '/', 
    autenticarToken,
    listarCategorias
);

router.get(
    '/:id',  
    autenticarToken, 
    buscarCategoria
);

router.post(
    '/',  
    autenticarToken, 
    criarCategoria
);
router.put(
    '/:id', 
    autenticarToken, 
    atualizarCategoria
);
router.delete(
    '/:id', 
    autenticarToken, 
    excluirCategoria
);

module.exports = router;