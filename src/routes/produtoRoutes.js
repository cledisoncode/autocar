const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');

const {
    criarCompraProduto,
    listarProdutosComCompras,
    listarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    excluirProduto,
    excluirCompraProduto
} = require('../controllers/produtoController');



router.post('/compras', upload.single('foto'), criarCompraProduto);
router.get('/compras', listarProdutosComCompras);
router.get('/', listarProdutos);
router.get('/:id', buscarProduto);
router.post('/', upload.single('imagem'), criarProduto);
router.put('/:id', upload.single('imagem'), atualizarProduto);
router.delete('/:id/compras/:idCompra', excluirCompraProduto);
router.delete('/:id', excluirProduto);

module.exports = router;
