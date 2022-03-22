
/*
    Ruta : /api/ocompra
*/

const { Router } = require('express');
const { check } = require ('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const { 
    getCotis, getCotiByID, crearCoti, actualizarOcompra, borrarCoti, actualizarEstadoCoti } = require('../controllers/coti');


const router = Router();

router.get('/', 
            validarJWT, 
            getCotis
);

router.get('/:id', 
            validarJWT,
            getCotiByID 
);

router.post('/', 
            [
                //check('nombres', 'El nombre es obligatorio').not().isEmpty(),
                //check('password', 'El password es obligatorio').not().isEmpty(),
                //check('usuario', 'El usuario es obligatorio').not().isEmpty(),
                //validarCampos,
            ],
            validarJWT,
            crearCoti 
);

router.put('/:id', 
            [    //validarJWT,
                 //check('nombres', 'El nombre es obligatorio').not().isEmpty(),
                 //check('role', 'El role es obligatorio').not().isEmpty(),
                 //check('usuario', 'El usuario es obligatorio').not().isEmpty(),
                //validarCampos,
            ],
            validarJWT,
            actualizarOcompra 
);

router.put('/estado/:id', 
            [    //validarJWT,
                 //check('nombres', 'El nombre es obligatorio').not().isEmpty(),
                 //check('role', 'El role es obligatorio').not().isEmpty(),
                 //check('usuario', 'El usuario es obligatorio').not().isEmpty(),
                //validarCampos,
            ],
            validarJWT,
            actualizarEstadoCoti 
);

router.delete('/:id', 
            validarJWT,
            borrarCoti
);

module.exports = router;