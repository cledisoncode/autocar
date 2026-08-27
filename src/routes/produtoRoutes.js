const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');

const autenticarToken = require('../middlewares/authMiddleware');

const {
    listarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    excluirProduto
} = require('../controllers/produtoController');


router.get(
    '/', 
    autenticarToken, 
    listarProdutos
);

router.get(
    '/:id',  
    autenticarToken, 
    buscarProduto
);

router.post(
    '/', 
    autenticarToken, 
    upload.single('imagem'), 
    criarProduto
);

router.put(
    '/:id', 
    autenticarToken, 
    upload.single('imagem'), 
    atualizarProduto
);

router.delete(
    '/:id', 
    autenticarToken, 
    excluirProduto
);

module.exports = router;