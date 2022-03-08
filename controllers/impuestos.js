const bcrypt = require('bcrypt');

//acceder a coneccion de mysql configurada
const consql = require('../database/database');
const { generarJWT } = require('../helpers/jwt');


// ==========================================
// obtener todos los impuestos
// ==========================================
const getImpuestos = async(req, res) => {

    try {
        const obtenerRegistros = await consultar_datos_impuestos(req, res);

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


function consultar_datos_impuestos(req, res) {
    const query = `
    SELECT impuestoID, valor_igv, valor_iva
        from impuesto `;

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
// modificar un impuesto
// ==========================================
const actualizarImpuesto = async(req, res = response) => {

    try {
        const p_igv = req.body.igv;
        const p_iva = req.body.iva;

        let arreglo = {
            igv: p_igv,
            iva: p_iva
        }

        const p_axion_actualizar_impuesto = await axion_actualizar_impuesto(req, res, arreglo);

        if ( p_axion_actualizar_impuesto.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se modificó los datos del impuesto'
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

 function axion_actualizar_impuesto(req, res, arreglo) {
    const p_igv = arreglo.igv;
    const p_iva = arreglo.iva;

    const query = `
    UPDATE impuesto
    SET valor_igv = "${p_igv}",
    valor_iva = "${p_iva}"
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
    getImpuestos,
    actualizarImpuesto
}