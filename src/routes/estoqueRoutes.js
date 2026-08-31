const express = require('express');
const router = express.Router();
const {
    listarEstoque,
    listarAlertas
} = require('../controllers/estoqueController');

router.get('/alertas', listarAlertas)
router.get('/', listarEstoque);

module.exports = router;