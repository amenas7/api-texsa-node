
/*
    Ruta : /api/impuestos
*/

const { Router } = require('express');
const { check } = require ('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const { 
    getImpuestos, actualizarImpuesto } = require('../controllers/impuestos');


const router = Router();

router.get('/', 
            validarJWT, 
            getImpuestos
);

router.put('/', 
            [    
                //check('nombre', 'El nombre de la tela es obligatorio').not().isEmpty(),
                 //check('role', 'El role es obligatorio').not().isEmpty(),
                 //check('usuario', 'El usuario es obligatorio').not().isEmpty(),
                //validarCampos,
            ],
            validarJWT,
            actualizarImpuesto 
);


module.exports = router;