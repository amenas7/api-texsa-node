const mysql = require('mysql');

// coneccion a la BD
// const mysqlConnection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'app_texsa',
//     multipleStatements: true

//     // host: '161.35.100.169',
//     // user: 'TuUsuarioNombreAleatorio',
//     // password: '12Ghj8.,JhGf54%66f#235#4ffcJJ0)7kg56UuBv5#4ffcxda5Gr',
//     // database: 'app_vuela',
//     // insecureAuth : true,
//     // multipleStatements: true

// });


// mysqlConnection.connect(function(err) {
//     if (err) {
//         throw err;
//     };

//     console.log('Estado de BD : \x1b[32m%s\x1b[0m', 'online');

// });

var mysqlConnection = mysql.createPool({
    // connectionLimit: 10,
    // host: 'localhost',
    // user: 'root',
    // password: '',
    // database:'app_texsa'

    connectionLimit: 10,
    host: '143.198.115.230',
    user: 'TuUsuarioNombreAleatorio',
    password: '12Ghj8.,JhGf54%66f#235#4ffcJJ0)7kg56UuBv5#4ffcxda5Gr',
    database: 'app_texsa',

  });
  
  mysqlConnection.getConnection((err,connection)=> {
    if(err)
    throw err;
    console.log('Estado de BD : \x1b[32m%s\x1b[0m', 'online');
    connection.release();
  });

module.exports = mysqlConnection;