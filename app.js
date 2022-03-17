// requires
var express = require('express');
var bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const fileUpload = require("express-fileupload");

// var fileUpload = require('express-fileupload');

// inicializar variables
var app = express();
// habilitar CORS
// app.use(function(req, res, next) {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
//     res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
//     next();
// });

// configurar nuevos cors
app.use( cors({ origin: true, credentials: true }) );

// app.use(cors({
//     allowedHeaders: [
//         'Content-Type',
//         'Authorization',
//         'x-access-token'
//     ],
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     origin: '*'
// }))


//app.use(fileUpload());



// body parser
// parse application/x-www-form-urlencoded
// app.use(express.json({limit: '50mb'}));
// app.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
//app.use('/public', express.static(path.join(__dirname, 'public'))); 

// app.use(fileUpload({
//     useTempFiles : true,
//     tempFileDir : '/tmp/',
//     createParentPath: true
// }));


// importar rutas
// app.use( '/usuario', require('./routes/usuario') );
// app.use( '/login', require('./routes/login') );
// app.use( '/upload', require('./routes/upload') );
// app.use( '/', require('./routes/app') );





/* ---- funcional ---- */
app.use( '/api/login', require('./routes/auth') );
app.use('/api/deportes', require('./routes/deportes') );
app.use('/api/deportes_total', require('./routes/deportes_total') );
app.use('/api/telas', require('./routes/telas') );
app.use('/api/telas_total', require('./routes/telas_total') );
app.use('/api/impuestos', require('./routes/impuestos') );
app.use('/api/tipos_cambio', require('./routes/tipos_cambio') );
app.use('/api/clientes', require('./routes/clientes') );
app.use('/api/productos', require('./routes/productos') );
app.use('/api/coti', require('./routes/coti') );
app.use('/api/dashboard', require('./routes/dashboard') );
app.use('/api/reportepdf', require('./routes/reportepdf') );
app.use('/api/reporteotropdf', require('./routes/reporteotropdf') );
app.use('/api/tallas', require('./routes/tallas') );
app.use('/api/dproductos', require('./routes/dproductos') );

app.use('/api/email', require('./routes/email') );
// app.use('/api/usuarios', require('./routes/usuarios') );

// escuchar peticiones
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Express server puerto ${port}: \x1b[32m%s\x1b[0m`, `online`);
});