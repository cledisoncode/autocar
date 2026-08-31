const express = require('express');
const router = express.Router();

const {
    listarCategorias,
    buscarCategoria,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria 
} = require('../controllers/categoriaController')

router.get('/', listarCategorias);
router.get('/:id', buscarCategoria);
router.post('/', criarCategoria);
router.put('/:id', atualizarCategoria);
router.delete('/:id', excluirCategoria);

module.exports = router;