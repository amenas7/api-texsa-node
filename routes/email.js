
/*
    Ruta : /api/clientes
*/

const { Router } = require('express');
const { check } = require ('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const { 
    crearCorreo } = require('../controllers/email');


const router = Router();

router.post('/', 
            [
                //check('nombre', 'El nombre del deporte es obligatorio').not().isEmpty(),
                //validarCampos,
            ],
            //validarJWT,
            crearCorreo 
);


// router.get('/', 
//             validarJWT, 
//             getClientes
// );

// router.get('/:id', 
//             validarJWT,
//             getClienteByID 
// );



// router.put('/:id', 
//             [    
//                  //check('nombre', 'El nombre del deporte es obligatorio').not().isEmpty(),
//                  //check('role', 'El role es obligatorio').not().isEmpty(),
//                  //check('usuario', 'El usuario es obligatorio').not().isEmpty(),
//                 validarCampos,
//             ],
//             validarJWT,
//             actualizarCliente 
// );

// router.delete('/:id', 
//             validarJWT,
//             borrarCliente
// );

module.exports = router;