
/*
    Ruta : /api/productos
*/

const { Router } = require('express');
const { check } = require ('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');
const multer = require("multer");

const storage = multer.diskStorage({
    filename: function (res, file, cb) {
      const ext = file.originalname.split(".").pop(); //TODO pdf / jpeg / mp3
      const fileName = Date.now(); //TODO 12312321321
      cb(null, `${fileName}.${ext}`); //TODO 123123213232.pdf
    },
    destination: function (res, file, cb) {
      cb(null, `./public`);
    },
});

const upload = multer({ storage: storage });

const { 
    getProductos, getProductoByID, crearProducto, actualizarProducto, borrarProducto } = require('../controllers/productos');


const router = Router();

router.get('/', 
            validarJWT, 
            getProductos
);

router.get('/:id', 
            validarJWT,
            getProductoByID 
);

router.post('/', 
            [
                //check('nombre', 'El nombre del deporte es obligatorio').not().isEmpty(),
                validarCampos,
            ],
            validarJWT,
            upload.single('archivo'),
            crearProducto 
);

router.put('/:id', 
            [    
                 //check('nombre', 'El nombre del deporte es obligatorio').not().isEmpty(),
                 //check('role', 'El role es obligatorio').not().isEmpty(),
                 //check('usuario', 'El usuario es obligatorio').not().isEmpty(),
                validarCampos,
            ],
            validarJWT,
            upload.single('archivo'),
            actualizarProducto 
);

router.delete('/:id', 
            validarJWT,
            borrarProducto
);

module.exports = router;