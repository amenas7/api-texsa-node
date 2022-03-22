
/*
    Ruta : /api/tipos_cambio
*/

const { Router } = require('express');
const { check } = require ('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const { 
    getTiposDeCambio, actualizarTiposDeCambio } = require('../controllers/tipos_cambio');


const router = Router();

router.get('/', 
            validarJWT, 
            getTiposDeCambio
);

router.put('/', 
            [    
                //check('nombre', 'El nombre de la tela es obligatorio').not().isEmpty(),
                 //check('role', 'El role es obligatorio').not().isEmpty(),
                 //check('usuario', 'El usuario es obligatorio').not().isEmpty(),
                //validarCampos,
            ],
            validarJWT,
            actualizarTiposDeCambio 
);


module.exports = router;