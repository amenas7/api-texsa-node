
/*
    Ruta : /api/telas
*/

const { Router } = require('express');
const { check } = require ('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const { 
    getTelas, getTelaByID, crearTela, actualizarTela, borrarTela } = require('../controllers/telas');


const router = Router();

router.get('/', 
            validarJWT, 
            getTelas
);

router.get('/:id', 
            validarJWT,
            getTelaByID 
);

router.post('/', 
            [
                check('nombre', 'El nombre de la tela es obligatorio').not().isEmpty(),
                validarCampos,
            ],
            validarJWT,
            crearTela 
);

router.put('/:id', 
            [    
                check('nombre', 'El nombre de la tela es obligatorio').not().isEmpty(),
                 //check('role', 'El role es obligatorio').not().isEmpty(),
                 //check('usuario', 'El usuario es obligatorio').not().isEmpty(),
                validarCampos,
            ],
            validarJWT,
            actualizarTela 
);

router.delete('/:id', 
            validarJWT,
            borrarTela
);

module.exports = router;