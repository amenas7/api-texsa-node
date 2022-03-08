const bcrypt = require('bcrypt');

//acceder a coneccion de mysql configurada
const consql = require('../database/database');
const { generarJWT } = require('../helpers/jwt');


// ==========================================
// obtener todas las telas
// ==========================================
const getTelas = async(req, res) => {

    try {
        const obtenerRegistros = await consultar_datos_telas(req, res);

        if ( obtenerRegistros == '' ) {
            return res.status(200).json({
                ok: true,
                data: obtenerRegistros,
                mensaje: 'Aún no existen registros'
            })
        }

        const totalRegistros = await consultar_total_telas(req, res);
        
        const ResultadosPorPagina = parseInt(req.query.limit) ? Number(req.query.limit) : 10;
        let page = req.query.page ? Number(req.query.page) : 1;

        const numeroDePaginas = Math.ceil(totalRegistros / ResultadosPorPagina);
        
        if(page > numeroDePaginas){
            page = numeroDePaginas;
        }else if(page < 1){
            page = 1;
        }

        const startingLimit = (page - 1) * ResultadosPorPagina;

        const p_telas_paginados = await consultar_total_telas_paginados(req, res, startingLimit, ResultadosPorPagina);

        return res.status(200).json({
            ok: true,
            data: p_telas_paginados,
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
// obtener una tela por el ID
// ==========================================
const getTelaByID = async(req, res) => {

    try {
        const id = req.params.id;

        const obtenerReg = await consultar_existe_tela(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe una tela con el parametro buscado'
            })
        }

        const p_consultar_datos_telaID = await consultar_datos_telaID(req, res, id);

        return res.status(200).json({
                ok: true,
                data: p_consultar_datos_telaID,
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

function consultar_datos_telas(req, res) {
    const query = `
    SELECT telaID, nombre_tela
        from tela
        ORDER BY telaID DESC `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function consultar_datos_telaID(req, res, id) {
    const query = `
    SELECT telaID, nombre_tela
        from tela
        where telaID = "${id}" `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function consultar_existe_tela(req, res, id) {
    const query = `
    select count(telaID) as cantidad from tela
    where telaID = "${id}" `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows[0]['cantidad']);
        });
    });
}

function consultar_total_telas(req, res) {
    const query = `
    select count(telaID) as cantidad from tela`;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows[0]['cantidad']);
        });
    });
}

function consultar_total_telas_paginados(req, res, page, limit) {
    const query = `
    SELECT * FROM tela LIMIT ${page}, ${limit}`;

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
// crear una tela
// ==========================================
const crearTela = async(req, res) => {
    try {
        const p_nombre = req.body.nombre;
        const reg = await registrar_tela(req, res, p_nombre);

        if ( reg.insertId == '' ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear la tela'
            })
        }
        
        return res.status(201).json({
            ok: true,
            mensaje: 'Tela agregada con éxito'
        })
        
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }
}

function registrar_tela(req, res, p_nombre) {
    const query = `insert into tela ( nombre_tela ) VALUES ( "${p_nombre}" )  `;
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
// modificar una tela
// ==========================================
const actualizarTela = async(req, res = response) => {

    try {
        const id = req.params.id;
        const p_nombre = req.body.nombre;

        const obtenerReg = await consultar_existe_tela(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe una tela con el parametro buscado'
            })
        }

        let arreglo = {
            idd: id,
            nombre: p_nombre
        }

        const p_axion_actualizar_tela = await axion_actualizar_tela(req, res, arreglo);

        if ( p_axion_actualizar_tela.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se modificó los datos de la tela'
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

 function axion_actualizar_tela(req, res, arreglo) {
    const p_idd = arreglo.idd;
    const p_nombre = arreglo.nombre;

    const query = `
    UPDATE tela
    SET nombre_tela = "${p_nombre}"
    WHERE telaID = "${p_idd}"
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
// borrar una tela
// ==========================================
const borrarTela = async(req, res = response) => {

    try {
        const id = req.params.id;

        const obtenerReg = await consultar_existe_tela(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe una tela con el parametro buscado'
            })
        }

        let arreglo = {
            idd: id
        }

        const p_axion_eliminar = await axion_eliminar(req, res, arreglo);

        if ( p_axion_eliminar.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al eliminar tela'
            });
        }
        else{
            return res.status(200).json({
                ok: true,
                mensaje: "Tela eliminada"
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
    delete FROM tela
    where telaID = "${ p_id }"
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
    getTelas,
    getTelaByID,
    crearTela,
    actualizarTela,
    borrarTela
}