const bcrypt = require('bcrypt');

//acceder a coneccion de mysql configurada
const consql = require('../database/database');
const { generarJWT } = require('../helpers/jwt');


// ==========================================
// obtener todos los tipos de cambio
// ==========================================
const getTiposDeCambio = async(req, res) => {

    try {
        const obtenerRegistros = await consultar_datos_tipos_cambio(req, res);

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


function consultar_datos_tipos_cambio(req, res) {
    const query = `
    SELECT tipo_cambioID, cambio_dolar, cambio_peso
        from tipo_cambio `;

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
// modificar tipos de cambio
// ==========================================
const actualizarTiposDeCambio = async(req, res = response) => {

    try {
        const p_dolar = req.body.dolar;
        const p_peso = req.body.peso;

        let arreglo = {
            dolar: p_dolar,
            peso: p_peso
        }

        const p_axion_actualizar_tipos_de_cambio = await axion_actualizar_tipos_de_cambio(req, res, arreglo);

        if ( p_axion_actualizar_tipos_de_cambio.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se modificó los datos del tipo de cambio'
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

 function axion_actualizar_tipos_de_cambio(req, res, arreglo) {
    const p_dolar = arreglo.dolar;
    const p_peso = arreglo.peso;

    const query = `
    UPDATE tipo_cambio
    SET cambio_dolar = "${p_dolar}",
    cambio_peso = "${p_peso}"
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


module.exports = {
    getTiposDeCambio,
    actualizarTiposDeCambio
}