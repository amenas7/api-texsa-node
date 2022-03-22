
/*
    Ruta : /api/deportes_total
*/

const { Router } = require('express');
const { check } = require ('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const { 
    getTotalRegistros } = require('../controllers/deportes_total');


const router = Router();

router.get('/', 
            validarJWT, 
            getTotalRegistros
);

module.exports = router;