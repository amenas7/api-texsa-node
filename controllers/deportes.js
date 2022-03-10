const bcrypt = require('bcrypt');

//acceder a coneccion de mysql configurada
const consql = require('../database/database');
const { generarJWT } = require('../helpers/jwt');


// ==========================================
// obtener todos los deportes
// ==========================================
const getDeportes = async(req, res) => {

    try {
        const obtenerRegistros = await consultar_datos_deportes(req, res);

        if ( obtenerRegistros == '' ) {
            return res.status(200).json({
                ok: true,
                data: obtenerRegistros,
                mensaje: 'Aún no existen registros'
            })
        }

        const totalRegistros = await consultar_total_deportes(req, res);
        
        const ResultadosPorPagina = parseInt(req.query.limit) ? Number(req.query.limit) : 10;
        let page = req.query.page ? Number(req.query.page) : 1;

        const numeroDePaginas = Math.ceil(totalRegistros / ResultadosPorPagina);
        
        if(page > numeroDePaginas){
            page = numeroDePaginas;
        }else if(page < 1){
            page = 1;
        }

        const startingLimit = (page - 1) * ResultadosPorPagina;

        const p_deportes_paginados = await consultar_total_deportes_paginados(req, res, startingLimit, ResultadosPorPagina);

        return res.status(200).json({
            ok: true,
            data: p_deportes_paginados,
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
// obtener un deporte por el ID
// ==========================================
const getDeporteByID = async(req, res) => {

    try {
        const id = req.params.id;

        const obtenerReg = await consultar_existe_deporte(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe un deporte con el parametro buscado'
            })
        }

        const p_consultar_datos_deporteID = await consultar_datos_deporteID(req, res, id);

        return res.status(200).json({
                ok: true,
                data: p_consultar_datos_deporteID,
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

function consultar_datos_deportes(req, res) {
    const query = `
    SELECT deporteID, nombre_deporte
        from deporte
        ORDER BY deporteID DESC `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function consultar_datos_deporteID(req, res, id) {
    const query = `
    SELECT deporteID, nombre_deporte
        from deporte
        where deporteID = "${id}" `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function consultar_existe_deporte(req, res, id) {
    const query = `
    select count(deporteID) as cantidad from deporte
    where deporteID = "${id}" `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows[0]['cantidad']);
        });
    });
}

function consultar_total_deportes(req, res) {
    const query = `
    select count(deporteID) as cantidad from deporte`;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows[0]['cantidad']);
        });
    });
}

function consultar_total_deportes_paginados(req, res, page, limit) {
    const query = `
    SELECT * FROM deporte ORDER BY deporteID DESC LIMIT ${page}, ${limit}`;

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
// crear un deporte
// ==========================================
const crearDeporte = async(req, res) => {
    try {
        const p_nombre = req.body.nombre;
        const reg = await registrar_deporte(req, res, p_nombre);

        if ( reg.insertId == '' ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear el deporte'
            })
        }
        
        return res.status(201).json({
            ok: true,
            mensaje: 'Deporte agregado con éxito'
        })
        
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }
}

function registrar_deporte(req, res, p_nombre) {
    const query = `insert into deporte ( nombre_deporte ) VALUES ( "${p_nombre}" )  `;
    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                consql.rollback(()=>{
                    return reject(err);
                });
            }
            resolve(rows);
        });
    });
}




// ==========================================
// modificar un deporte
// ==========================================
const actualizarDeporte = async(req, res = response) => {

    try {
        const id = req.params.id;
        const p_nombre = req.body.nombre;

        const obtenerReg = await consultar_existe_deporte(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe un deporte con el parametro buscado'
            })
        }

        let arreglo = {
            idd: id,
            nombre: p_nombre
        }

        const p_axion_actualizar_deporte = await axion_actualizar_deporte(req, res, arreglo);

        if ( p_axion_actualizar_deporte.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se modificó los datos del deporte'
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

 function axion_actualizar_deporte(req, res, arreglo) {
    const p_idd = arreglo.idd;
    const p_nombre = arreglo.nombre;

    const query = `
    UPDATE deporte
    SET nombre_deporte = "${p_nombre}"
    WHERE deporteID = "${p_idd}"
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
// borrar un deporte
// ==========================================
const borrarDeporte = async(req, res = response) => {

    try {
        const id = req.params.id;

        const obtenerReg = await consultar_existe_deporte(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe un deporte con el parametro buscado'
            })
        }

        let arreglo = {
            idd: id
        }

        const p_axion_eliminar = await axion_eliminar(req, res, arreglo);

        if ( p_axion_eliminar.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al eliminar deporte'
            });
        }
        else{
            return res.status(200).json({
                ok: true,
                mensaje: "Deporte eliminado"
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
    delete FROM deporte
    where deporteID = "${ p_id }"
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
    getDeportes,
    getDeporteByID,
    crearDeporte,
    actualizarDeporte,
    borrarDeporte
}