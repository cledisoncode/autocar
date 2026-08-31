const express = require('express');
const router = express.Router();
const { resumoFinanceiro } = require('../controllers/relatorioController');

router.get('/financeiro', resumoFinanceiro);

module.exports = router;
