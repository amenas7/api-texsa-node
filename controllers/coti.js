const bcrypt = require('bcrypt');
//acceder a coneccion de mysql configurada
const consql = require('../database/database');
const { generarJWT } = require('../helpers/jwt');


// ==========================================
// obtener todas las cotizaciones
// ==========================================
const getCotis = async(req, res) => {

    try {
        const obtenerRegistros = await consultar_datos_cotizaciones(req, res);

        if ( obtenerRegistros == '' ) {
            return res.status(200).json({
                ok: true,
                data: obtenerRegistros,
                mensaje: 'Aún no existen registros'
            })
        }
        /* ---------------- */
        const p_estado = req.query.estado;
        const p_moneda = req.query.moneda;
        const p_comodin = req.query.comodin;
        /* ---------------- */
        const totalRegistros = await consultar_total_cotizaciones(req, res, p_estado, p_moneda, p_comodin);

        const ResultadosPorPagina = parseInt(req.query.limit) ? Number(req.query.limit) : 10;
        let page = req.query.page ? Number(req.query.page) : 1;

        const numeroDePaginas = Math.ceil(totalRegistros / ResultadosPorPagina);
        
        if(page > numeroDePaginas){
            page = numeroDePaginas;
        }else if(page < 1){
            page = 1;
        }

        const startingLimit = Math.abs( (page - 1) * ResultadosPorPagina );
        
        const p_cotis_paginados = await consultar_total_cotis_paginados(req, res, startingLimit, ResultadosPorPagina,
            p_estado, p_moneda, p_comodin);
        
        return res.status(200).json({
            ok: true,
            data: p_cotis_paginados,
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

function consultar_total_cotizaciones(req, res, p_estado, p_moneda, p_comodin) {
    var query = `
    select 
    cot.codigo, cot.cotiID, date_format(cot.fecha_reg, "%d-%m-%Y") as fecha_reg, cot.estado as estado,
    cot.tipo_moneda, cot.total_g_sol, cot.total_g_peso, cot.total_g_dolar, cli.nombrecompleto,
    cot.tipo_impuesto, cot.cotizacion, cot.abono, cot.restante, cot.imp_g_sol, cot.imp_g_peso,
	cot.imp_g_dolar
    from
    coti cot
    inner join cliente cli
    on cli.clienteID = cot.clienteID
    where 1=1 
    `;

    //return console.log(query);
    if ( p_estado != '' ) {
        var primera_cond = ` AND estado LIKE '%${p_estado}%' ` ;
        query = query + primera_cond;
    }
    if ( p_moneda != '' ) {
        var segunda_cond = ` AND tipo_moneda LIKE '%${p_moneda}%' ` ;
        query = query + segunda_cond;
    }
    if ( p_comodin != '' ) {
        var tercera_cond = ` AND codigo LIKE '%${p_comodin}%' OR nombrecompleto LIKE '%${p_comodin}%' 
         ` ;
        query = query + tercera_cond;
    }
        // var final = ` `;
        // query = query + final;

    //return console.log(query);

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows.length);
        });
    });
}

function consultar_total_cotis_paginados(req, res, page, limit, p_estado, p_moneda, p_comodin) {
    var query = `
    select 
    cot.codigo, cot.cotiID, date_format(cot.fecha_reg, "%d-%m-%Y") as fecha_reg, cot.estado as estado,
    cot.tipo_moneda, cot.total_g_sol, cot.total_g_peso, cot.total_g_dolar, cli.nombrecompleto,
    cot.tipo_impuesto, cot.cotizacion, cot.abono, cot.restante, cot.imp_g_sol, cot.imp_g_peso,
	cot.imp_g_dolar
    from
    coti cot
    inner join cliente cli
    on cli.clienteID = cot.clienteID
    where 1=1 
    `;

    //return console.log(p_ruc);
    if ( p_estado != '' ) {
        var primera_cond = ` AND estado LIKE '%${p_estado}%' ` ;
        query = query + primera_cond;
    }
    if ( p_moneda != '' ) {
        var segunda_cond = ` AND tipo_moneda LIKE '%${p_moneda}%' ` ;
        query = query + segunda_cond;
    }
    if ( p_comodin != '' ) {
        var tercera_cond = ` AND codigo LIKE '%${p_comodin}%' OR nombrecompleto LIKE '%${p_comodin}%' 
         ` ;
        query = query + tercera_cond;
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
// obtener una cotizacion por el ID
// ==========================================
const getCotiByID = async(req, res) => {

    try {
        const id = req.params.id;

    const obtenerReg = await consultar_existe_coti(req, res, id);

    if ( !obtenerReg ) {
        return res.status(500).json({
            ok: false,
            mensaje: 'No existe una cotizacion con el parametro buscado'
        })
    }

    const reg_cabecera = await consultar_cabecera(req, res, id);
    // //return console.log(reg[0]['nit']);

    const reg_detalle = await consultar_detalle_productos(req, res, id);
    
    let cabecera = {
        compraID : id,
        codigo: reg_cabecera[0]['codigo'],
        clienteID: reg_cabecera[0]['clienteID'],
        fecha_reg: reg_cabecera[0]['fecha_registro_compra'],
        pu_sol: reg_cabecera[0]['pu_sol'],
        pu_peso: reg_cabecera[0]['pu_peso'],
        pu_dolar: reg_cabecera[0]['pu_dolar'],
        forma_pago: reg_cabecera[0]['forma_pago'],
        tipo_impuesto: reg_cabecera[0]['tipo_impuesto'],
        validez_oferta: reg_cabecera[0]['validez_oferta'],
        sub_total_g_sol: reg_cabecera[0]['sub_total_g_sol'],
        sub_total_g_peso: reg_cabecera[0]['sub_total_g_peso'],
        sub_total_g_dolar: reg_cabecera[0]['sub_total_g_dolar'],
        imp_g_sol: reg_cabecera[0]['imp_g_sol'],
        imp_g_peso: reg_cabecera[0]['imp_g_peso'],
        imp_g_dolar: reg_cabecera[0]['imp_g_dolar'],
        total_g_sol: reg_cabecera[0]['total_g_sol'],
        total_g_peso: reg_cabecera[0]['total_g_peso'],
        total_g_dolar: reg_cabecera[0]['total_g_dolar'],
        tipo_moneda: reg_cabecera[0]['tipo_moneda'],
        cotizacion: reg_cabecera[0]['cotizacion'],
        abono: reg_cabecera[0]['abono'],
        restante: reg_cabecera[0]['restante'],
        actual_dolar: reg_cabecera[0]['actual_dolar'],
        actual_peso: reg_cabecera[0]['actual_peso'],

        productos:reg_detalle
    }

    return res.status(200).json({
        ok: true,
        data : cabecera
    });

    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }
}

function consultar_cabecera(req, res, id) {
    const query = `select 
    *, date_format(fecha_reg, "%d-%m-%Y") as fecha_registro_compra from coti
    where cotiID = "${id}"  `;

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

function consultar_detalle_productos(req, res, id) {
    const query = `select
    de.productoID, de.cantidad, de.pu_sol, de.pu_peso, de.pu_dolar, de.tipo_envio, de.ce_sol,
    de.ce_peso, de.ce_dolar, de.sub_total_pu_sol, de.sub_total_pu_peso, de.sub_total_pu_dolar, arc.base as base64,
		concat(prod.descripcion, ', deporte: ', dep.nombre_deporte, ', tela: ',tel.nombre_tela, 
		', talla: ',ta.descripcion_talla) as descripcion, prod.marca_producto, prod.modelo_producto
    from coti_detalle de
    inner join producto prod
    on prod.productoID = de.productoID
    inner join archivo arc
    on arc.productoID = prod.productoID
		inner join deporte dep
    on dep.deporteID = prod.deporteID
    inner join tela tel
    on tel.telaID = prod.telaID
    inner join talla ta
    where de.cotiID = "${id}"  `;

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
// crear una cotizacion
// ==========================================
const crearCoti = async(req, res) => {
    try {
        const p_clienteID= req.body.clienteID;
        const p_pu_sol = req.body.pu_sol;
        const p_pu_peso = req.body.pu_peso;
        const p_pu_dolar = req.body.pu_dolar;
        const p_forma_pago = req.body.forma_pago;
        const p_tipo_impuesto = req.body.tipo_impuesto;
        const p_validez_oferta = req.body.validez_oferta;
        const p_sub_total_g_sol = req.body.sub_total_g_sol;
        const p_sub_total_g_peso = req.body.sub_total_g_peso;
        const p_sub_total_g_dolar = req.body.sub_total_g_dolar;
        const p_imp_g_sol = req.body.imp_g_sol;
        const p_imp_g_peso = req.body.imp_g_peso;
        const p_imp_g_dolar = req.body.imp_g_dolar;

        const p_total_g_sol = req.body.total_g_sol;
        const p_total_g_peso = req.body.total_g_peso;
        const p_total_g_dolar = req.body.total_g_dolar;

        const p_tipo_moneda = req.body.tipo_moneda;
        const p_cotizacion = req.body.cotizacion;
        const p_abono = req.body.abono;
        const p_restante = req.body.restante;
        const p_registradoPorID = req.uid;

        const p_arreglo = req.body.productos;

        const p_actual_dolar = req.body.actual_dolar;
        const p_actual_peso = req.body.actual_peso;

        // const query = `insert into compra ( proveedorID, area_solicitanteID, pu_peso, 
        //     fecha_reg, pu_dolar, forma_pago, tipo_impuesto, validez_oferta, sub_total_g_sol, sub_total_g_peso,
        //     sub_total, descuento, total_compra, estado, estado_autorizado, reg_fisico, estado_autorizacion ) VALUES (
        //      "${p_proveedorID}", "${p_area_solicitanteID}", "${p_pu_peso}", now(), "${p_pu_dolar}", 
        //      "${p_forma_pago}", "${p_tipo_impuesto}", "${p_validez_oferta}", "${p_sub_total_g_sol}", "${p_sub_total_g_peso}", 
        //      "${p_sub_total}", "${p_descuento}", "${p_total_compra}", "Creado", "Pendiente", "1", "Pendiente" )  `;
        const query = `CALL USP_REG_COTI( "${p_clienteID}", "${p_pu_sol}", "${p_pu_peso}", "${p_pu_dolar}", 
            "${p_forma_pago}", "${p_tipo_impuesto}", "${p_validez_oferta}", "${p_sub_total_g_sol}", "${p_sub_total_g_peso}", 
            "${p_sub_total_g_dolar}", "${p_imp_g_sol}", "${p_imp_g_peso}", "${p_imp_g_dolar}", "${p_total_g_sol}", 
            "${p_total_g_peso}", "${p_total_g_dolar}", "${p_tipo_moneda}", "${p_cotizacion}", "${p_abono}",
            "${p_restante}", "${p_registradoPorID}", "${p_actual_dolar}", "${p_actual_peso}" )  `;

    
        const reg = await registrar_coti(req, res, query);
        //const cotiID = reg.id;
        if ( reg < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear cotizacion'
            })
        }
        else{
            const regdetalle = await registrar_coti_detalle(p_arreglo, res, reg);
            if ( regdetalle.insertId == '' ) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al crear detalle de cotizacion'
                })
            }else{
                return res.status(201).json({
                    ok: true,
                    mensaje: 'cotizacion registrada'
                })
            }
        }        
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }    

}

function registrar_coti(req, res, query) {
    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                // consql.rollback(()=>{
                //     return reject(err);
                // });
                return reject(err);
            }
            resolve(rows[0][0]['id']);
        });
    });
}

function registrar_coti_detalle(p_arreglo, res, cotiID) {
    return new Promise((resolve, reject) => {
        p_arreglo.forEach(element => {
            consql.query(` insert into coti_detalle ( cotiID, productoID, cantidad, pu_sol,
                pu_peso, pu_dolar, tipo_envio, ce_sol, ce_peso, ce_dolar, sub_total_pu_sol,
                sub_total_pu_peso, sub_total_pu_dolar ) VALUES (
                "${cotiID}" , "${element.productoID}", "${element.cantidad}", "${element.pu_sol}"
                , "${element.pu_peso}", "${element.pu_dolar}", "${element.tipo_envio}", "${element.ce_sol}"
                , "${element.ce_peso}", "${element.ce_dolar}", "${element.sub_total_pu_sol}", 
                "${element.sub_total_pu_peso}", "${element.sub_total_pu_dolar}"
                 );
            `, ( err, rows, fields ) =>{
                if (err) {
                    // consql.rollback(()=>{
                    //     return reject(err);
                    // });
                    return reject(err);
                }
                resolve(rows);
            });
        });
    });
}


// ==========================================
// modificar una orden de compra
// ==========================================
const actualizarOcompra = async(req, res = response) => {
    try {
        const id = req.params.id;

        const p_clienteID= req.body.clienteID;
        const p_pu_sol = req.body.pu_sol;
        const p_pu_peso = req.body.pu_peso;
        const p_pu_dolar = req.body.pu_dolar;
        const p_forma_pago = req.body.forma_pago;
        const p_tipo_impuesto = req.body.tipo_impuesto;
        const p_validez_oferta = req.body.validez_oferta;
        const p_sub_total_g_sol = req.body.sub_total_g_sol;
        const p_sub_total_g_peso = req.body.sub_total_g_peso;
        const p_sub_total_g_dolar = req.body.sub_total_g_dolar;
        const p_imp_g_sol = req.body.imp_g_sol;
        const p_imp_g_peso = req.body.imp_g_peso;
        const p_imp_g_dolar = req.body.imp_g_dolar;

        const p_total_g_sol = req.body.total_g_sol;
        const p_total_g_peso = req.body.total_g_peso;
        const p_total_g_dolar = req.body.total_g_dolar;

        const p_tipo_moneda = req.body.tipo_moneda;
        const p_cotizacion = req.body.cotizacion;
        const p_abono = req.body.abono;
        const p_restante = req.body.restante;
        const p_registradoPorID = req.uid;

        const p_arreglo = req.body.productos;

        const obtenerReg = await consultar_existe_coti(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe una cotizacion con el parametro buscado'
            })
        }

        let arreglo = {
            idc: id,
            clienteID: p_clienteID,
            pu_sol: p_pu_sol,
            pu_peso: p_pu_peso,
            pu_dolar: p_pu_dolar,
            forma_pago: p_forma_pago,
            tipo_impuesto: p_tipo_impuesto,
            validez_oferta: p_validez_oferta,
            sub_total_g_sol: p_sub_total_g_sol,
            sub_total_g_peso: p_sub_total_g_peso,
            sub_total_g_dolar: p_sub_total_g_dolar,
            imp_g_sol: p_imp_g_sol,
            imp_g_peso: p_imp_g_peso,
            imp_g_dolar: p_imp_g_dolar,

            total_g_sol: p_total_g_sol,
            total_g_peso: p_total_g_peso,
            total_g_dolar: p_total_g_dolar,

            tipo_moneda: p_tipo_moneda,
            cotizacion: p_cotizacion,
            abono: p_abono,
            restante: p_restante,

            detalle: p_arreglo
        }

        const p_uno_eliminar_detalle = await uno_eliminar_detalle(req, res, arreglo);

        if ( p_uno_eliminar_detalle.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar cotizacion'
            });
        }

        const p_dos_actualizar_coti = await dos_actualizar_coti(req, res, arreglo);

        if ( p_dos_actualizar_coti.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se modificó los datos de la cotizacion cuerpo'
            });
        }

        const p_tres_actualizar_coti_detalle = await tres_actualizar_coti_detalle(arreglo, res, id);

        if ( p_tres_actualizar_coti_detalle.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se modificó los datos de la cotizacion detalle'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: "Cotizacion modificada"
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }  
 };

 // ==========================================
// modificar estado de una cotizacion
// ==========================================
const actualizarEstadoCoti = async(req, res = response) => {
    try {
        const id = req.params.id;

        const p_estado = req.body.estado;
        const obtenerReg = await consultar_existe_coti(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe una cotizacion con el parametro buscado'
            })
        }

        const p_actualizar_estado_coti = await axion_actualizar_estado_coti(req, res, id, p_estado);

        if ( p_actualizar_estado_coti.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se modificó los datos de la cotizacion'
            });
        }

        return res.status(200).json({
            ok: true,
            mensaje: "Cotizacion modificada"
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }  
 };

 function consultar_existe_coti(req, res, id) {
    const query = `
    select count(cot.cotiID) as cantidad from
    coti cot
    inner join coti_detalle de
    on de.cotiID = cot.cotiID
    where cot.cotiID = "${id}" `;

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

function uno_eliminar_detalle(req, res, arreglo) {
    const p_idc = arreglo.idc;

    // eliminar los detalles de cotizacion
    const query_eliminar = `
    delete FROM coti_detalle
    where cotiID = "${p_idc}"
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

function dos_actualizar_coti(req, res, arreglo) {
    const p_idc = arreglo.idc;

    const p_clienteID= arreglo.clienteID;
    const p_pu_sol = arreglo.pu_sol;
    const p_pu_peso = arreglo.pu_peso;
    const p_pu_dolar = arreglo.pu_dolar;
    const p_forma_pago = arreglo.forma_pago;
    const p_tipo_impuesto = arreglo.tipo_impuesto;
    const p_validez_oferta = arreglo.validez_oferta;
    const p_sub_total_g_sol = arreglo.sub_total_g_sol;
    const p_sub_total_g_peso = arreglo.sub_total_g_peso;
    const p_sub_total_g_dolar = arreglo.sub_total_g_dolar;
    const p_imp_g_sol = arreglo.imp_g_sol;
    const p_imp_g_peso = arreglo.imp_g_peso;
    const p_imp_g_dolar = arreglo.imp_g_dolar;

    const p_total_g_sol = arreglo.total_g_sol;
    const p_total_g_peso = arreglo.total_g_peso;
    const p_total_g_dolar = arreglo.total_g_dolar;

    const p_tipo_moneda = arreglo.tipo_moneda;
    const p_cotizacion = arreglo.cotizacion;
    const p_abono = arreglo.abono;
    const p_restante = arreglo.restante;

    // modificar el cuerpo principal de la orden de compra
    const query = `
    UPDATE coti
    SET clienteID = "${p_clienteID}",
    pu_sol = "${p_pu_sol}",
    pu_peso = "${p_pu_peso}",
    pu_dolar = ${p_pu_dolar},
    forma_pago = "${p_forma_pago}",
    tipo_impuesto = "${p_tipo_impuesto}",
    validez_oferta = "${p_validez_oferta}",
    sub_total_g_sol = "${p_sub_total_g_sol}",
    sub_total_g_peso = "${p_sub_total_g_peso}",
    sub_total_g_dolar = "${p_sub_total_g_dolar}",
    imp_g_sol = "${p_imp_g_sol}",
    imp_g_peso = "${p_imp_g_peso}",
    imp_g_dolar = "${p_imp_g_dolar}",
    total_g_sol = "${p_total_g_sol}",
    total_g_peso = "${p_total_g_peso}",
    total_g_dolar = "${p_total_g_dolar}",
    tipo_moneda = "${p_tipo_moneda}",
    cotizacion = "${p_cotizacion}",
    abono = "${p_abono}",
    restante = "${p_restante}"
    WHERE cotiID = "${p_idc}"
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

function tres_actualizar_coti_detalle(arreglo, res, cotiID) {

    // arreglo de productos en la compra
    const p_detalle = arreglo.detalle;

    return new Promise((resolve, reject) => {
        p_detalle.forEach(element => {
            consql.query(` insert into coti_detalle ( cotiID, productoID, cantidad, pu_sol,
                pu_peso, pu_dolar, tipo_envio, ce_sol, ce_peso, ce_dolar, sub_total_pu_sol,
                sub_total_pu_peso, sub_total_pu_dolar ) VALUES (
                "${cotiID}" , "${element.productoID}", "${element.cantidad}", "${element.pu_sol}"
                , "${element.pu_peso}", "${element.pu_dolar}", "${element.tipo_envio}", "${element.ce_sol}"
                , "${element.ce_peso}", "${element.ce_dolar}", "${element.sub_total_pu_sol}", 
                "${element.sub_total_pu_peso}", "${element.sub_total_pu_dolar}"
                 );
            `, ( err, rows, fields ) =>{
                if (err) {
                    // consql.rollback(()=>{
                    //     return reject(err);
                    // });
                    return reject(err);
                }
                resolve(rows);
            });
        });
    });
}

function axion_actualizar_estado_coti(req, res, id, p_estado) {
    const query = `
    UPDATE coti
    SET estado = "${p_estado}"
    WHERE cotiID = "${id}"
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
// borrar una cotizacion
// ==========================================
const borrarCoti = async(req, res = response) => {
    const reg = req.params.id;

    const obtenerReg = await consultar_existe_coti(req, res, reg);

    if ( !obtenerReg ) {
        return res.status(500).json({
            ok: false,
            mensaje: 'No existe una cotizacion con el parametro buscado'
        })
    }

    let arreglo = {
        idc: reg
    }
    const p_uno_eliminar_detalle = await uno_eliminar_detalle(req, res, arreglo);

    if ( p_uno_eliminar_detalle.affectedRows < 1 ) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Error al eliminar cotizacion'
        });
    }

    const p_uno_eliminar_cuerpo = await eliminar(req, res, reg);

    if ( p_uno_eliminar_cuerpo.affectedRows < 1 ) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Error al eliminar cotizacion'
        });
    }
    else{
        return res.status(200).json({
            ok: true,
            mensaje: "Cotizacion eliminada"
        });
    }
}

function eliminar(req, res, reg) {
    const p_id = reg;

    // eliminar
    const query_eliminar = `
    delete FROM coti
    where cotiID = "${p_id}"
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
    getCotis,
    getCotiByID,
    crearCoti,
    actualizarOcompra,
    borrarCoti,
    actualizarEstadoCoti
}