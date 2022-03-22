
/*
    Ruta : /api/deportes
*/

const { Router } = require('express');
const { check } = require ('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const { 
    getDashboard } = require('../controllers/dashboard');


const router = Router();

router.get('/',
            [
                check('desde','La fecha de inicio es obligatoria').not().isEmpty(),
                check('hasta','La fecha de fin es obligatoria').not().isEmpty(),
            ],
            validarCampos,
            validarJWT, 
            getDashboard
);

// router.get('/:id', 
//             validarJWT,
//             getDeporteByID 
// );

// router.post('/', 
//             [
//                 check('nombre', 'El nombre del deporte es obligatorio').not().isEmpty(),
//                 validarCampos,
//             ],
//             validarJWT,
//             crearDeporte 
// );

// router.put('/:id', 
//             [    
//                  check('nombre', 'El nombre del deporte es obligatorio').not().isEmpty(),
//                  //check('role', 'El role es obligatorio').not().isEmpty(),
//                  //check('usuario', 'El usuario es obligatorio').not().isEmpty(),
//                 validarCampos,
//             ],
//             validarJWT,
//             actualizarDeporte 
// );

// router.delete('/:id', 
//             validarJWT,
//             borrarDeporte
// );

module.exports = router;