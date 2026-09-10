const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');

const {
    criarCompraProduto,
    listarProdutosComCompras,
    buscarProdutoComCompras,
    listarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    excluirProduto,
    excluirCompraProduto
} = require('../controllers/produtoController');



router.post('/', upload.single('foto'), criarCompraProduto);
router.get('/', listarProdutosComCompras);
router.post('/compras', upload.single('foto'), criarCompraProduto);
router.get('/compras', listarProdutosComCompras);
router.get('/catalogo', listarProdutos);
router.post('/catalogo', upload.single('imagem'), criarProduto);
router.get('/catalogo/:id', buscarProduto);
router.put('/catalogo/:id', upload.single('imagem'), atualizarProduto);
router.delete('/:id/compras/:idCompra', excluirCompraProduto);
router.delete('/:id', excluirProduto);
router.get('/:id', buscarProdutoComCompras);

module.exports = router;
