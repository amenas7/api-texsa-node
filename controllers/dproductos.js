const bcrypt = require('bcrypt');

//acceder a coneccion de mysql configurada
const consql = require('../database/database');
const { generarJWT } = require('../helpers/jwt');

// manejar archivos
// const path = require('path');
// const { subirArchivo } = require('../helpers/subir-archivo');
var fs = require('fs');


// ==========================================
// duplicar un producto
// ==========================================
const duplicarProducto = async(req, res = response) => {

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

        const imagen_anterior = p_consultar_datos_productoID.imagen64;
        // data:////
        if ( req.file.originalname == 'imageFileName.png' ) {
            //console.log("mantener imagen");

            const p_deporteID = req.body.deporteID;
            const p_telaID = req.body.telaID;
            const p_sexo_producto = req.body.sexo_producto;
            const p_modelo_producto = req.body.modelo_producto;
            const p_talla_productoID = req.body.talla_productoID;
            const p_marca_producto = req.body.marca_producto;
            const p_costo_producto = req.body.costo_producto;
            const p_codigo_producto = req.body.codigo_producto;
            const p_descripcion = req.body.descripcion;

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

            return res.status(200).json({
                ok: true,
                mensaje: "Producto modificado"
            });
        }
        else{
            const p_deporteID = req.body.deporteID;
            const p_telaID = req.body.telaID;
            const p_sexo_producto = req.body.sexo_producto;
            const p_modelo_producto = req.body.modelo_producto;
            const p_talla_productoID = req.body.talla_productoID;
            const p_marca_producto = req.body.marca_producto;
            const p_costo_producto = req.body.costo_producto;
            const p_codigo_producto = req.body.codigo_producto;
            const p_descripcion = req.body.descripcion;
            const p_foto = req.file.path;
            const p_tipado = req.file.mimetype;

            // read binary data
            var bitmap = fs.readFileSync(p_foto, 'base64');
            const p_imagen_final = 'data:'+p_tipado+';base64,'+bitmap;

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

            await axion_actualizar_foto_producto( req, res, id, p_imagen_final );

            // Delete the file like normal
            if ( fs.existsSync(p_foto) ) {
                fs.unlinkSync(p_foto);
            }

            return res.status(200).json({
                ok: true,
                mensaje: "Producto modificado"
            });
        }

    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
            error: error.message
        });
    }
    

 };

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

    //return console.log(query);

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

function axion_actualizar_foto_producto(req, res, id, p_imagen64) {
    const query = `
    UPDATE archivo
    SET base = "${p_imagen64}",
    fecha_mod = NOW(),
    modificadoPorID = "${req.uid}" 
    WHERE productoID = "${id}"
    `;
    //return console.log(query);
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
    duplicarProducto
}