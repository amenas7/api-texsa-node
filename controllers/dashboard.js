const bcrypt = require('bcrypt');

//acceder a coneccion de mysql configurada
const consql = require('../database/database');
const { generarJWT } = require('../helpers/jwt');


// ==========================================
// obtener todos los deportes
// ==========================================
const getDashboard = async(req, res) => {

    try {
        const obtenerRegistros = await consultar_datos_cotizaciones(req, res);

        if ( obtenerRegistros == '' ) {
            return res.status(200).json({
                ok: true,
                data: obtenerRegistros,
                mensaje: 'Aún no existen registros'
            })
        }

        const p_desde = req.query.desde;
        const p_hasta = req.query.hasta;

        const tabla_uno = await consultar_tabla_uno(req, res, p_desde, p_hasta);
        const tabla_dos = await consultar_tabla_dos(req, res, p_desde, p_hasta);
        const tabla_tres = await consultar_tabla_tres(req, res, p_desde, p_hasta);
        const tabla_cuatro = await consultar_tabla_cuatro(req, res, p_desde, p_hasta);
        const total_aceptadas = await consultar_tabla_cuatro_total_aceptadas(req, res, p_desde, p_hasta);

        return res.status(200).json({
            ok: true,
            data: [
                { tabla_uno : tabla_uno },
                { tabla_dos : tabla_dos },
                { tabla_tres : tabla_tres },
                { tabla_cuatro : tabla_cuatro, total_aceptadas }
            ]
            ,
            //totalRegistros,
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

function consultar_datos_cotizaciones(req, res) {
    const query = `
    select * from
    coti cot
    inner join coti_detalle de
    on de.cotiID = cot.cotiID
    GROUP BY cot.cotiID `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function consultar_tabla_uno(req, res, p_desde, p_hasta) {
    const query = `
    select 
    (select count(cotiID) from coti where date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}") as nro_cotizaciones_todas, 
    (select IFNULL(sum(total_g_sol),0) from coti where date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}") as total_pen_todas, 
    (select IFNULL(sum(total_g_peso),0) from coti where date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}") as total_peso_todas, 
    (select IFNULL(sum(total_g_dolar),0) from coti where date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}") as total_dolar_todas`;

    //return console.log(query);

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows[0]);
        });
    });
}

function consultar_tabla_dos(req, res, p_desde, p_hasta) {
    const query = `
    select 
    (select count(cotiID) from coti where estado = 'Enviado' AND date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}") as nro_cotizaciones_todas, 
    (select IFNULL(sum(total_g_sol),0) from coti where estado = 'Enviado' AND date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}") as total_pen_todas, 
    (select IFNULL(sum(total_g_peso),0) from coti where estado = 'Enviado' AND date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}") as total_peso_todas, 
    (select IFNULL(sum(total_g_dolar),0) from coti where estado = 'Enviado' AND date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}") as total_dolar_todas`;

    //return console.log(query);

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows[0]);
        });
    });
}

function consultar_tabla_tres(req, res, p_desde, p_hasta) {
    const query = `
    select 
    (select count(cotiID) from coti where estado = 'Rechazado' AND date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}") as nro_cotizaciones_todas, 
    (select IFNULL(sum(total_g_sol),0) from coti where estado = 'Rechazado' AND date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}") as total_pen_todas, 
    (select IFNULL(sum(total_g_peso),0) from coti where estado = 'Rechazado' AND date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}") as total_peso_todas, 
    (select IFNULL(sum(total_g_dolar),0) from coti where estado = 'Rechazado' AND date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}") as total_dolar_todas`;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows[0]);
        });
    });
}

function consultar_tabla_cuatro(req, res, p_desde, p_hasta) {
    const query = `
    (select IFNULL(sum(cotizacion),0) cotizacion, IFNULL(sum(abono),0) abono, IFNULL(sum(restante),0) restante
    from coti where estado = 'Aceptado' AND tipo_moneda = 'sol' AND date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}")
    UNION
    (select IFNULL(sum(cotizacion),0) cotizacion, IFNULL(sum(abono),0) abono, IFNULL(sum(restante),0) restante
    from coti where estado = 'Aceptado' AND tipo_moneda = 'peso' AND date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}")
    UNION
    (select IFNULL(sum(cotizacion),0) cotizacion, IFNULL(sum(abono),0) abono, IFNULL(sum(restante),0) restante
    from coti where estado = 'Aceptado' AND tipo_moneda = 'dolar' AND date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}");`;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function consultar_tabla_cuatro_total_aceptadas(req, res, p_desde, p_hasta) {
    const query = `
    select count(cotiID) nro_cotizaciones_aceptadas from coti where estado = 'Aceptado' AND date_format(fecha_reg, "%Y-%m-%d") BETWEEN "${p_desde}" 
    AND "${p_hasta}" ;`;

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

module.exports = {
    getDashboard
}