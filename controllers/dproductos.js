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

        const imagen_anterior = p_consultar_datos_productoID['imagen64'];
        // data:////
        if ( req.file.originalname == 'imageFileName.png' ) {
            console.log("manteneniendo imagen del duplicado");
            console.log(imagen_anterior);
            console.log(p_consultar_datos_productoID.imagen64);
            // const p_deporteID = req.body.deporteID;
            // const p_telaID = req.body.telaID;
            // const p_sexo_producto = req.body.sexo_producto;
            // const p_modelo_producto = req.body.modelo_producto;
            // const p_talla_productoID = req.body.talla_productoID;
            // const p_marca_producto = req.body.marca_producto;
            // const p_costo_producto = req.body.costo_producto;
            // const p_codigo_producto = req.body.codigo_producto;
            // const p_descripcion = req.body.descripcion;

            // const p_imagen_final = imagen_anterior;
            // //console.log(p_consultar_datos_productoID);
            // console.log(p_imagen_final);

            // const reg = await registrar_producto( req, res, p_deporteID, p_telaID, p_sexo_producto, 
            //     p_modelo_producto, p_talla_productoID, p_marca_producto, p_costo_producto, p_codigo_producto,
            //     p_descripcion );
    
            // if ( reg.insertId == '' ) {
            //     return res.status(400).json({
            //         ok: false,
            //         mensaje: 'Error al crear el producto'
            //     })
            // }

            // const idproducto_subido = reg.insertId;
            // await registrar_foto_producto( req, res, idproducto_subido, p_imagen_final );

            // return res.status(200).json({
            //     ok: true,
            //     mensaje: "Producto duplicado con exito"
            // });
        }
        else{
            console.log("imagen nueva");
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
            await registrar_foto_producto( req, res, idproducto_subido, p_imagen_final );

            // Delete the file like normal
            if ( fs.existsSync(p_foto) ) {
                fs.unlinkSync(p_foto);
            }

            return res.status(200).json({
                ok: true,
                mensaje: "Producto duplicado con exito"
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
                // consql.rollback(()=>{
                //     return reject(err);
                // });
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function registrar_foto_producto(req, res, idproducto_subido, p_imagen64) {
    const query = `
    insert into archivo ( productoID, fecha_reg, registradoPorID, base ) values 
    ( "${idproducto_subido}", now(), "${req.uid}", "${p_imagen64}" ) `;

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


module.exports = {
    duplicarProducto
}