const bcrypt = require('bcrypt');

//acceder a coneccion de mysql configurada
const consql = require('../database/database');
const { generarJWT } = require('../helpers/jwt');

// manejar archivos
const path = require('path');
const { subirArchivo } = require('../helpers/subir-archivo');
var fs = require('fs');


// ==========================================
// obtener todos los productos
// ==========================================
const getProductos = async(req, res) => {

    try {
        const obtenerRegistros = await consultar_datos_productos(req, res);

        if ( obtenerRegistros == '' ) {
            return res.status(200).json({
                ok: true,
                data: obtenerRegistros,
                mensaje: 'Aún no existen registros'
            })
        }

        /* ---------------- */
        const p_deporte = req.query.deporte;
        const p_talla = req.query.talla;
        const p_tela = req.query.tela;
        const p_sexo = req.query.sexo;
        const p_comodin = req.query.comodin;

        /* ---------------- */

        const totalRegistros = await consultar_total_productos(req, res, p_deporte, p_talla, p_tela, p_sexo, p_comodin);

        //return console.log(totalRegistros);
        
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

        const p_clientes_paginados = await consultar_total_productos_paginados(req, res, startingLimit, ResultadosPorPagina,
            p_deporte, p_talla, p_tela, p_sexo, p_comodin);

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
// obtener un producto por el ID
// ==========================================
const getProductoByID = async(req, res) => {

    try {
        const id = req.params.id;

        const obtenerReg = await consultar_existe_producto(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe un producto con el parametro buscado'
            })
        }

        const p_consultar_datos_productoID = await consultar_datos_productoID(req, res, id);

        return res.status(200).json({
                ok: true,
                data: p_consultar_datos_productoID,
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

function consultar_datos_productos(req, res) {
    const query = `
    SELECT *
        from producto
        ORDER BY productoID DESC `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function consultar_datos_productoID(req, res, id) {
    const query = `
    select 
    prod.productoID, de.nombre_deporte, tel.nombre_tela, ta.descripcion_talla as nombre_talla, 
    prod.sexo_producto, prod.modelo_producto, prod.marca_producto, prod.costo_producto,
    prod.codigo_producto, prod.descripcion, arc.base as imagen64, de.deporteID, tel.telaID,
    ta.tallaID
    from producto prod
    inner join deporte de
    on de.deporteID = prod.deporteID
    inner join tela tel
    on tel.telaID = prod.telaID
    inner join talla ta
    on ta.tallaID = prod.talla_productoID
    inner join archivo arc  
    on arc.productoID = prod.productoID
    where prod.productoID = "${id}" `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function consultar_existe_producto(req, res, id) {
    const query = `
    select count(productoID) as cantidad from producto
    where productoID = "${id}" `;

    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows[0]['cantidad']);
        });
    });
}

function consultar_total_productos(req, res, p_deporte, p_talla, p_tela, p_sexo, p_comodin) {
    var query = `
    select 
    prod.productoID, de.nombre_deporte, tel.nombre_tela, ta.descripcion_talla as nombre_talla, 
    prod.sexo_producto, prod.modelo_producto, prod.marca_producto, prod.costo_producto,
    prod.codigo_producto, prod.descripcion, arc.base as imagen64, tel.telaID, ta.tallaID,
    de.deporteID
    from producto prod
    inner join deporte de
    on de.deporteID = prod.deporteID
    inner join tela tel
    on tel.telaID = prod.telaID
    inner join talla ta
    on ta.tallaID = prod.talla_productoID
    inner join archivo arc
    on arc.productoID = prod.productoID
    where 1=1 
    `;

    //return console.log(p_ruc);
    if ( p_deporte != '' ) {
        var primera_cond = ` AND de.nombre_deporte LIKE '%${p_deporte}%' ` ;
        query = query + primera_cond;
    }
    if ( p_talla != '' ) {
        var segunda_cond = ` AND ta.descripcion_talla LIKE '%${p_talla}%' ` ;
        query = query + segunda_cond;
    }
    if ( p_tela != '' ) {
        var tercera_cond = ` AND tel.nombre_tela LIKE '%${p_tela}%' ` ;
        query = query + tercera_cond;
    }
    if ( p_sexo != '' ) {
        var cuarta_cond = ` AND prod.sexo_producto LIKE '%${p_sexo}%' ` ;
        query = query + cuarta_cond;
    }
    if ( p_comodin != '' ) {
        var quinta_cond = ` AND productoID LIKE '%${p_comodin}%' OR modelo_producto LIKE '%${p_comodin}%' 
        OR marca_producto LIKE '%${p_comodin}%' OR codigo_producto LIKE '%${p_comodin}%' ` ;
        query = query + quinta_cond;
    }
         var final = ` ORDER BY prod.productoID DESC `;
         query = query + final;

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

function consultar_total_productos_paginados(req, res, page, limit, p_deporte, p_talla, p_tela, p_sexo, p_comodin) {
    var query = `
    select 
    prod.productoID, de.nombre_deporte, tel.nombre_tela, ta.descripcion_talla as nombre_talla, 
    prod.sexo_producto, prod.modelo_producto, prod.marca_producto, prod.costo_producto,
    prod.codigo_producto, prod.descripcion, arc.base as imagen64, tel.telaID, ta.tallaID,
    de.deporteID
    from producto prod
    inner join deporte de
    on de.deporteID = prod.deporteID
    inner join tela tel
    on tel.telaID = prod.telaID
    inner join talla ta
    on ta.tallaID = prod.talla_productoID
    inner join archivo arc
    on arc.productoID = prod.productoID
    where 1=1 
    `;

    //return console.log(p_ruc);
    if ( p_deporte != '' ) {
        var primera_cond = ` AND de.nombre_deporte LIKE '%${p_deporte}%' ` ;
        query = query + primera_cond;
    }
    if ( p_talla != '' ) {
        var segunda_cond = ` AND ta.descripcion_talla LIKE '%${p_talla}%' ` ;
        query = query + segunda_cond;
    }
    if ( p_tela != '' ) {
        var tercera_cond = ` AND tel.nombre_tela LIKE '%${p_tela}%' ` ;
        query = query + tercera_cond;
    }
    if ( p_sexo != '' ) {
        var cuarta_cond = ` AND prod.sexo_producto LIKE '%${p_sexo}%' ` ;
        query = query + cuarta_cond;
    }
    if ( p_comodin != '' ) {
        var quinta_cond = ` AND productoID LIKE '%${p_comodin}%' OR modelo_producto LIKE '%${p_comodin}%' 
        OR marca_producto LIKE '%${p_comodin}%' OR codigo_producto LIKE '%${p_comodin}%' ` ;
        query = query + quinta_cond;
    }

    //return console.log(query);

    var paginacion = ` ORDER BY prod.productoID DESC LIMIT ${page}, ${limit} `;
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
// crear un producto
// ==========================================
const crearProducto = async(req, res) => {
    try {
        const p_deporteID = req.body.deporteID;
        const p_telaID = req.body.telaID;
        const p_sexo_producto = req.body.sexo_producto;
        const p_modelo_producto = req.body.modelo_producto;
        const p_talla_productoID = req.body.talla_productoID;
        const p_marca_producto = req.body.marca_producto;
        const p_costo_producto = req.body.costo_producto;
        const p_codigo_producto = req.body.codigo_producto;
        const p_descripcion = req.body.descripcion;
        const p_foto_imagen = req.file.filename;
        const p_imagen64 = req.body.imagen64;

        //return console.log(p_deporteID);
        const reg = await registrar_producto( req, res, p_deporteID, p_telaID, p_sexo_producto, 
            p_modelo_producto, p_talla_productoID, p_marca_producto, p_costo_producto, p_codigo_producto,
            p_descripcion );

        if ( reg.insertId == '' ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear el producto'
            })
        }

        const idproducto_subido = reg.insertId;
        await registrar_foto_producto( req, res, idproducto_subido, p_foto_imagen, p_imagen64 );
        
        return res.status(201).json({
            ok: true,
            mensaje: 'Producto agregado con éxito'
        })
        
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }
}

function registrar_producto(req, res, p_deporteID, p_telaID, p_sexo_producto, 
    p_modelo_producto, p_talla_productoID, p_marca_producto, p_costo_producto, p_codigo_producto,
    p_descripcion ) {
    const query = `insert into producto ( deporteID, telaID, sexo_producto, modelo_producto, talla_productoID, 
        marca_producto, costo_producto, codigo_producto, descripcion ) 
    VALUES ( "${p_deporteID}", "${p_telaID}", "${p_sexo_producto}", "${p_modelo_producto}", 
    "${p_talla_productoID}", "${p_marca_producto}", "${p_costo_producto}", "${p_codigo_producto}", "${p_descripcion}" )  `;
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

function registrar_foto_producto(req, res, idproducto_subido, p_foto_imagen, p_imagen64) {
    const query = `
    insert into archivo ( productoID, nombre_archivo_original, nombre_archivo_server, fecha_reg, registradoPorID, base ) values 
    ( "${idproducto_subido}", "${p_foto_imagen}", "${p_foto_imagen}", now(), "${req.uid}", "${p_imagen64}" ) `;

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
// modificar un producto
// ==========================================
const actualizarProducto = async(req, res = response) => {

    try {
        const id = req.params.id;
        const p_deporteID = req.body.deporteID;
        const p_telaID = req.body.telaID;
        const p_sexo_producto = req.body.sexo_producto;
        const p_modelo_producto = req.body.modelo_producto;
        const p_talla_productoID = req.body.talla_productoID;
        const p_marca_producto = req.body.marca_producto;
        const p_costo_producto = req.body.costo_producto;
        const p_codigo_producto = req.body.codigo_producto;
        const p_descripcion = req.body.descripcion;
        const p_foto_imagen = req.file.filename;

        const obtenerReg = await consultar_existe_producto(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe un producto con el parametro buscado'
            })
        }

        let arreglo = {
            idd: id,
            deporteID : p_deporteID,
            telaID : p_telaID,
            sexo_producto : p_sexo_producto,
            modelo_producto : p_modelo_producto,
            talla_productoID : p_talla_productoID,
            marca_producto : p_marca_producto,
            costo_producto : p_costo_producto,
            codigo_producto : p_codigo_producto,
            descripcion : p_descripcion
        }

        const p_axion_actualizar_producto = await axion_actualizar_producto(req, res, arreglo);

        if ( p_axion_actualizar_producto.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se modificó los datos del producto'
            });
        }

        await axion_actualizar_foto_producto( req, res, id, p_foto_imagen );

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

 function axion_actualizar_producto(req, res, arreglo) {
    const p_idd = arreglo.idd;
    const p_deporteID = arreglo.deporteID;
    const p_telaID = arreglo.telaID;
    const p_sexo_producto = arreglo.sexo_producto;
    const p_modelo_producto = arreglo.modelo_producto;
    const p_talla_productoID = arreglo.talla_productoID;
    const p_marca_producto = arreglo.marca_producto;
    const p_costo_producto = arreglo.costo_producto;
    const p_codigo_producto = arreglo.codigo_producto;
    const p_descripcion = arreglo.descripcion;

    const query = `
    UPDATE producto
    SET deporteID = "${p_deporteID}",
    telaID = "${p_telaID}",
    sexo_producto = "${p_sexo_producto}",
    modelo_producto = "${p_modelo_producto}",
    talla_productoID = "${p_talla_productoID}",
    marca_producto = "${p_marca_producto}",
    costo_producto = "${p_costo_producto}",
    codigo_producto = "${p_codigo_producto}",
    descripcion = "${p_descripcion}" 
    WHERE productoID = "${p_idd}"
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

function axion_actualizar_foto_producto(req, res, id, p_foto_imagen) {
    const query = `
    UPDATE archivo
    SET nombre_archivo_original = "${p_foto_imagen}",
    nombre_archivo_server = "${p_foto_imagen}",
    fecha_mod = NOW(),
    modificadoPorID = "${req.uid}" 
    WHERE productoID = "${id}"
    `;
    //return console.log(query);
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
// borrar un producto
// ==========================================
const borrarProducto = async(req, res = response) => {

    try {
        const id = req.params.id;

        const obtenerReg = await consultar_existe_producto(req, res, id);

        if ( !obtenerReg ) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No existe un producto con el parametro buscado'
            })
        }

        let arreglo = {
            idd: id
        }

        const p_axion_eliminar = await axion_eliminar(req, res, arreglo);

        if ( p_axion_eliminar.affectedRows < 1 ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al eliminar producto'
            });
        }
        else{
            return res.status(200).json({
                ok: true,
                mensaje: "Producto eliminado"
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
    delete FROM producto
    where productoID = "${ p_id }"
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
    getProductos,
    getProductoByID,
    crearProducto,
    actualizarProducto,
    borrarProducto
}