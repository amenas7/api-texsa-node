
/*
    Ruta : /api/telas_total
*/

const { Router } = require('express');
const { check } = require ('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const { 
    getTotalRegistros } = require('../controllers/telas_total');


const router = Router();

router.get('/', 
            validarJWT, 
            getTotalRegistros
);

module.exports = router;