const bcrypt = require('bcrypt');

//acceder a coneccion de mysql configurada
const consql = require('../database/database');
const { generarJWT } = require('../helpers/jwt');


// ==========================================
// obtener total de deportes actuales
// ==========================================
const getTotalRegistros = async(req, res) => {

    try {
        const obtenerRegistros = await consultar_total_deportes(req, res);

        if ( obtenerRegistros == '' ) {
            return res.status(200).json({
                ok: true,
                data: obtenerRegistros,
                mensaje: 'Aún no existen registros'
            })
        }

        return res.status(200).json({
                ok: true,
                data: obtenerRegistros,
                //uid: req.uid
            }) 
        
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }
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

module.exports = {
    getTotalRegistros
}