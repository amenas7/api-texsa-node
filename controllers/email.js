"use strict";
const nodemailer = require("nodemailer");



const bcrypt = require('bcrypt');

//acceder a coneccion de mysql configurada
const consql = require('../database/database');
const { generarJWT } = require('../helpers/jwt');





// ==========================================
// obtener todos los clientes
// ==========================================
const getClientes = async(req, res) => {

    try {
        const obtenerRegistros = await consultar_datos_clientes(req, res);

        if ( obtenerRegistros == '' ) {
            return res.status(200).json({
                ok: true,
                data: obtenerRegistros,
                mensaje: 'Aún no existen registros'
            })
        }

        /* ---------------- */
        const p_razon = req.query.razon;
        const p_codigo = req.query.codigo;
        const p_ruc = req.query.ruc;
        const p_comodin = req.query.comodin;

        /* ---------------- */

        const totalRegistros = await consultar_total_clientes(req, res, p_razon, p_codigo, p_ruc, p_comodin);
        
        const ResultadosPorPagina = parseInt(req.query.limit) ? Number(req.query.limit) : 10;
        let page = req.query.page ? Number(req.query.page) : 1;

        //return console.log(page);

        const numeroDePaginas = Math.ceil(totalRegistros / ResultadosPorPagina);
        
        if(page > numeroDePaginas){
            page = numeroDePaginas;
        }else if(page < 1){
            page = 1;
        }

        //return console.log(page);

        const startingLimit = Math.abs( (page - 1) * ResultadosPorPagina );
        
        //return console.log(startingLimit);

        const p_clientes_paginados = await consultar_total_clientes_paginados(req, res, startingLimit, ResultadosPorPagina,
            p_razon, p_codigo, p_ruc, p_comodin);

        return res.status(200).json({
            ok: true,
            data: p_clientes_paginados,
            page,
            numeroDePaginas,
            ResultadosPorPagina,
            totalRegistros,
            uid: req.uid
        })

    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    } 
}

// ==========================================
// obtener un cliente por el ID
// ==========================================
const getClienteByID = async(req, res) => {

    try {
        const id = req.params.id;

        const obtenerReg = await consultar_existe_cliente(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe un cliente con el parametro buscado'
            })
        }

        const p_consultar_datos_clienteID = await consultar_datos_clientesID(req, res, id);

        return res.status(200).json({
                ok: true,
                data: p_consultar_datos_clienteID,
                uid: req.uid
            }) 
        
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }
}

function consultar_datos_clientes(req, res) {
    const query = `
    SELECT *
        from cliente
        ORDER BY clienteID DESC `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function consultar_datos_clientesID(req, res, id) {
    const query = `
    SELECT *
        from cliente
        where clienteID = "${id}" `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function consultar_existe_cliente(req, res, id) {
    const query = `
    select count(clienteID) as cantidad from cliente
    where clienteID = "${id}" `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows[0]['cantidad']);
        });
    });
}

function consultar_total_clientes(req, res, p_razon, p_codigo, p_ruc, p_comodin) {
    var query = `
    select count(clienteID) as cantidad from cliente
    where 1=1 
    `;

    //return console.log(p_ruc);
    if ( p_razon != '' ) {
        var primera_cond = ` AND razon_social LIKE '%${p_razon}%' ` ;
        query = query + primera_cond;
    }
    if ( p_codigo != '' ) {
        var segunda_cond = ` AND clienteID LIKE '%${p_codigo}%' ` ;
        query = query + segunda_cond;
    }
    if ( p_ruc != '' ) {
        var tercera_cond = ` AND ruc LIKE '%${p_ruc}%' ` ;
        query = query + tercera_cond;
    }
    if ( p_comodin != '' ) {
        var cuarta_cond = ` AND nombrecompleto LIKE '%${p_comodin}%' OR direccion LIKE '%${p_comodin}%' 
        OR telefono LIKE '%${p_comodin}%' OR email LIKE '%${p_comodin}%' ` ;
        query = query + cuarta_cond;
    }
        // var final = ` `;
        // query = query + final;

    //return console.log(query);

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows[0]['cantidad']);
        });
    });
}

function consultar_total_clientes_paginados(req, res, page, limit, p_razon, p_codigo, p_ruc, p_comodin) {
    var query = `
    SELECT * FROM cliente 
    where 1=1 `;
    
    if ( p_razon != '' ) {
        var primera_cond = ` AND razon_social LIKE '%${p_razon}%' ` ;
        query = query + primera_cond;
    }
    if ( p_codigo != '' ) {
        var segunda_cond = ` AND clienteID LIKE '%${p_codigo}%' ` ;
        query = query + segunda_cond;
    }
    if ( p_ruc != '' ) {
        var tercera_cond = ` AND ruc LIKE '%${p_ruc}%' ` ;
        query = query + tercera_cond;
    }
    if ( p_comodin != '' ) {
        var cuarta_cond = ` AND nombrecompleto LIKE '%${p_comodin}%' OR direccion LIKE '%${p_comodin}%' 
        OR telefono LIKE '%${p_comodin}%' OR email LIKE '%${p_comodin}%' ` ;
        query = query + cuarta_cond;
    }

    //return console.log(query);

    var paginacion = ` LIMIT ${page}, ${limit} `;
    query = query + paginacion;
    //return console.log(query);

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}


// ==========================================
// enviar correo demo
// ==========================================
const crearCorreo = async(req, res) => {

    // async..await is not allowed in global scope, must use a wrapper
    async function main() {
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        let testAccount = await nodemailer.createTestAccount();
    
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
        host: "email-smtp.us-east-1.amazonaws.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'AKIAUKBIQ63CIWYCN36V', // generated ethereal user
            pass: 'BLIaMiuzRhig3PChcz5D/QNVFobwNbBCQkCjDceIrIcY', // generated ethereal password
        },
        });
    
        // send mail with defined transport object
        let info = await transporter.sendMail({
        from: 'amenas94@gmail.com', // sender address
        to: "ing.mena94@gmail.com", // list of receivers
        subject: "Asunto Hello ✔", // Subject line
        text: "Funcionamiento correcto", // plain text body
        html: "<b>Hello world con html</b>", // html body
        });
    
        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    
        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    }
    
    main().catch(console.error);

    res.status(200).json({
        ok: true,
        message: "Correo enviado"
    })

    // try {
    //     const p_nombre = req.body.nombre;
    //     const p_razon_social = req.body.razon_social;
    //     const p_ruc = req.body.ruc;
    //     const p_direccion = req.body.direccion;
    //     const p_telefono = req.body.telefono;
    //     const p_email = req.body.email;
    //     const reg = await registrar_cliente(req, res, p_nombre, p_razon_social, p_ruc, p_direccion, p_telefono, p_email);

    //     if ( reg.insertId == '' ) {
    //         return res.status(400).json({
    //             ok: false,
    //             mensaje: 'Error al crear el cliente'
    //         })
    //     }
        
    //     return res.status(201).json({
    //         ok: true,
    //         mensaje: 'Cliente agregado con éxito'
    //     })
        
    // } catch (error) {
    //     res.status(500).json({
    //         ok: false,
    //         mensaje: 'Error en el servidor',
    //         error: error.message
    //     });
    // }
}

function registrar_cliente(req, res, p_nombre, p_razon_social, p_ruc, p_direccion, p_telefono, p_email) {
    const query = `insert into cliente ( nombrecompleto, razon_social, ruc, direccion, telefono, email ) 
    VALUES ( "${p_nombre}", "${p_razon_social}", "${p_ruc}", "${p_direccion}", "${p_telefono}", "${p_email}" )  `;
    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                // consql.rollback(()=>{
                //     return reject(err);
                // });
                return reject(err);
            }
            resolve(rows);
        });
    });
}




// ==========================================
// modificar un cliente
// ==========================================
const actualizarCliente = async(req, res = response) => {

    try {
        const id = req.params.id;
        const p_nombre = req.body.nombre;
        const p_razon_social = req.body.razon_social;
        const p_ruc = req.body.ruc;
        const p_direccion = req.body.direccion;
        const p_telefono = req.body.telefono;
        const p_email = req.body.email;

        const obtenerReg = await consultar_existe_cliente(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe un cliente con el parametro buscado'
            })
        }

        let arreglo = {
            idd: id,
            nombre: p_nombre,
            razon_social: p_razon_social,
            ruc: p_ruc,
            direccion: p_direccion,
            telefono: p_telefono,
            email: p_email
        }

        const p_axion_actualizar_cliente = await axion_actualizar_cliente(req, res, arreglo);

        if ( p_axion_actualizar_cliente.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se modificó los datos del cliente'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: "Se guardaron los cambios exitosamente"
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }
    

 };

 function axion_actualizar_cliente(req, res, arreglo) {
    const p_idd = arreglo.idd;
    const p_nombre = arreglo.nombre;
    const p_razon_social = arreglo.razon_social;
    const p_ruc = arreglo.ruc;
    const p_direccion = arreglo.direccion;
    const p_telefono = arreglo.telefono;
    const p_email = arreglo.email;

    const query = `
    UPDATE cliente
    SET nombrecompleto = "${p_nombre}",
    razon_social = "${p_razon_social}",
    ruc = "${p_ruc}",
    direccion = "${p_direccion}",
    telefono = "${p_telefono}",
    email = "${p_email}" 
    WHERE clienteID = "${p_idd}"
    `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                console.log("Error: " + err.message);
                throw err;
            }
            resolve(rows);
        });
    });
}

// ==========================================
// borrar un cliente
// ==========================================
const borrarCliente = async(req, res = response) => {

    try {
        const id = req.params.id;

        const obtenerReg = await consultar_existe_cliente(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe un cliente con el parametro buscado'
            })
        }

        let arreglo = {
            idd: id
        }

        const p_axion_eliminar = await axion_eliminar(req, res, arreglo);

        if ( p_axion_eliminar.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al eliminar cliente'
            });
        }
        else{
            return res.status(200).json({
                ok: true,
                mensaje: "Cliente eliminado"
            });
        }
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }
    
}

function axion_eliminar(req, res, arreglo) {
    const p_id = arreglo.idd;

    // eliminar
    const query_eliminar = `
    delete FROM cliente
    where clienteID = "${ p_id }"
    `;

    return new Promise((resolve, reject) => {
        consql.query(query_eliminar, (err, rows, fields) => {
            if (err) {
                console.log("Error: " + err.message);
                throw err;
            }
            resolve(rows);
        });
    });
}

module.exports = {
    crearCorreo
}