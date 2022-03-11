//acceder a coneccion de mysql configurada
const consql = require('../database/database');
const { generarJWT } = require('../helpers/jwt');
const path = require('path');
const { subirArchivo } = require('../helpers/subir-archivo');
const fs = require('fs');
const pdf = require("html-pdf");
const { dirname } = require('path');

// Constantes propias del programa
// const ubicacionPlantilla = require.resolve("../plantilla/demo.html");
// let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');

// =======================================================
// Generar reporte pdf a una orden de compra
// =======================================================
const getReporteByID = async (req, res) => {

    const id = req.params.id;
    //return console.log(id);

    const obtenerReg = await consultar_existe_coti(req, res, id);
    const p_opciones = req.body.opciones;

    if ( !obtenerReg ) {
        return res.status(500).json({
            ok: false,
            mensaje: 'No existe una cotizacion con el parametro buscado'
        })
    }

    const resp_sol   = p_opciones[0]['sol'];
    const resp_peso  = p_opciones[1]['peso'];
    const resp_dolar = p_opciones[2]['dolar']

    //sol
    if ( resp_sol == 1 && resp_peso == 0 && resp_dolar == 0 ) {
        var condicion = await consultar_igv(req, res, id);
        if (condicion == 'SI') {
            await reporte_soles_con_igv(req, res, id);
        }else{
            await reporte_soles_sin_igv(req, res, id);
        }
    }
    //peso
    else if ( resp_sol == 0 && resp_peso == 1 && resp_dolar == 0 ){
        var condicion = await consultar_igv(req, res, id);
        if (condicion == 'SI') {
            await reporte_pesos_con_igv(req, res, id);
        }else{
            await reporte_pesos_sin_igv(req, res, id);
        }
    }
    //dolar
    else if ( resp_sol == 0 && resp_peso == 0 && resp_dolar == 1 ){
        var condicion = await consultar_igv(req, res, id);
        if (condicion == 'SI') {
            await reporte_dolar_con_igv(req, res, id);
        }else{
            await reporte_dolar_sin_igv(req, res, id);
        }
    }
    //sol y peso
    else if ( resp_sol == 1 && resp_peso == 1 && resp_dolar == 0 ){
        var condicion = await consultar_igv(req, res, id);
        if (condicion == 'SI') {
            await reporte_soles_pesos_con_igv(req, res, id);
        }else{
            await reporte_soles_pesos_sin_igv(req, res, id);
        }
    }
    //sol y dolar
    else if ( resp_sol == 1 && resp_peso == 0 && resp_dolar == 1 ){
        var condicion = await consultar_igv(req, res, id);
        if (condicion == 'SI') {
            await reporte_soles_dolar_con_igv(req, res, id);
        }else{
            await reporte_soles_dolar_sin_igv(req, res, id);
        }
    }
    //peso y dolar
    else if ( resp_sol == 0 && resp_peso == 1 && resp_dolar == 1 ){
        var condicion = await consultar_igv(req, res, id);
        if (condicion == 'SI') {
            await reporte_pesos_dolar_con_igv(req, res, id);
        }else{
            await reporte_pesos_dolar_sin_igv(req, res, id);
        }
    }
    //sol, peso y dolar
    else if ( resp_sol == 1 && resp_peso == 1 && resp_dolar == 1 ){
        var condicion = await consultar_igv(req, res, id);
        if (condicion == 'SI') {
            await reporte_soles_pesos_dolar_con_igv(req, res, id);
        }else{
            await reporte_soles_pesos_dolar_sin_igv(req, res, id);
        }
    }
}

const consultar_igv = async(req, res, id) =>{
    const query = `
    select tipo_impuesto from coti where cotiID = "${id}" `;

    //return console.log(query);
    return new Promise((resolve, reject) => {
        consql.query(query, (err, rows, fields) => {
            if (err) {
                return reject(err);
            }
            resolve(rows[0]['tipo_impuesto']);
        });
    });
}

const reporte_soles_con_igv = async(req, res, id) =>{
    const config = {
        "format": "A4",
        //border: "0",
        // "width": "21cm", 
        // "height": "29.7cm",
        "border": "0"
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_sol_con.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_sol}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_sol}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //fotter uno
    contenidoHtml = contenidoHtml.replace("{{sub_total_g_sol}}", reg_cabecera[0]['sub_total_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{imp_g_sol}}", reg_cabecera[0]['imp_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{total_g_sol}}", reg_cabecera[0]['total_g_sol']);

    //footer dos
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);

    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}

const reporte_soles_sin_igv = async(req, res, id) =>{
    const config = {
        format: 'A4',
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_sol_sin.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        
        var basi = path.join(__dirname , '../public/', producto.nombre_archivo_original );
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="file:\\\ ${basi}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_sol}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_sol}</td>
        </tr>`;
        console.log(`<img src="file:\\\ ${basi}">`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])
    contenidoHtml = contenidoHtml.replace("{{total_g_sol}}", reg_cabecera[0]['total_g_sol']);

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //footer uno
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);


    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}



const reporte_pesos_con_igv = async(req, res, id) =>{
    const config = {
        format: 'A4',
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_peso_con.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_peso}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_peso}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //fotter uno
    contenidoHtml = contenidoHtml.replace("{{sub_total_g_peso}}", reg_cabecera[0]['sub_total_g_peso']);
    contenidoHtml = contenidoHtml.replace("{{imp_g_peso}}", reg_cabecera[0]['imp_g_peso']);
    contenidoHtml = contenidoHtml.replace("{{total_g_peso}}", reg_cabecera[0]['total_g_peso']);

    //footer dos
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);

    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}

const reporte_pesos_sin_igv = async(req, res, id) =>{
    const config = {
        format: 'A4',
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_peso_sin.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_peso}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_peso}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])
    contenidoHtml = contenidoHtml.replace("{{total_g_peso}}", reg_cabecera[0]['total_g_peso']);

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //footer uno
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);


    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}



const reporte_dolar_con_igv = async(req, res, id) =>{
    const config = {
        format: 'A4',
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_dolar_con.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_dolar}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_dolar}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //fotter uno
    contenidoHtml = contenidoHtml.replace("{{sub_total_g_dolar}}", reg_cabecera[0]['sub_total_g_dolar']);
    contenidoHtml = contenidoHtml.replace("{{imp_g_dolar}}", reg_cabecera[0]['imp_g_dolar']);
    contenidoHtml = contenidoHtml.replace("{{total_g_dolar}}", reg_cabecera[0]['total_g_dolar']);

    //footer dos
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);

    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}

const reporte_dolar_sin_igv = async(req, res, id) =>{
    const config = {
        format: 'A4',
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_dolar_sin.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_dolar}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_dolar}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])
    contenidoHtml = contenidoHtml.replace("{{total_g_dolar}}", reg_cabecera[0]['total_g_dolar']);

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //footer uno
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);


    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}



const reporte_soles_pesos_con_igv = async(req, res, id) =>{
    const config = {
        format: 'A4',
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_sol_peso_con.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_sol}</td>
            <td style="vertical-align: middle">${producto.pu_peso}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_sol}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_peso}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //fotter uno
    contenidoHtml = contenidoHtml.replace("{{sub_total_g_sol}}", reg_cabecera[0]['sub_total_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{imp_g_sol}}", reg_cabecera[0]['imp_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{total_g_sol}}", reg_cabecera[0]['total_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{sub_total_g_peso}}", reg_cabecera[0]['sub_total_g_peso']);
    contenidoHtml = contenidoHtml.replace("{{imp_g_peso}}", reg_cabecera[0]['imp_g_peso']);
    contenidoHtml = contenidoHtml.replace("{{total_g_peso}}", reg_cabecera[0]['total_g_peso']);

    //footer dos
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);

    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}

const reporte_soles_pesos_sin_igv = async(req, res, id) =>{
    const config = {
        format: 'A4',
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_sol_peso_sin.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_sol}</td>
            <td style="vertical-align: middle">${producto.pu_peso}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_sol}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_peso}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //fotter uno
    contenidoHtml = contenidoHtml.replace("{{total_g_sol}}", reg_cabecera[0]['total_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{total_g_peso}}", reg_cabecera[0]['total_g_peso']);

    //footer dos
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);

    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}



const reporte_soles_dolar_con_igv = async(req, res, id) =>{
    const config = {
        format: 'A4',
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_sol_dolar_con.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_sol}</td>
            <td style="vertical-align: middle">${producto.pu_dolar}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_sol}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_dolar}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //fotter uno
    contenidoHtml = contenidoHtml.replace("{{sub_total_g_sol}}", reg_cabecera[0]['sub_total_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{imp_g_sol}}", reg_cabecera[0]['imp_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{total_g_sol}}", reg_cabecera[0]['total_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{sub_total_g_dolar}}", reg_cabecera[0]['sub_total_g_dolar']);
    contenidoHtml = contenidoHtml.replace("{{imp_g_dolar}}", reg_cabecera[0]['imp_g_dolar']);
    contenidoHtml = contenidoHtml.replace("{{total_g_dolar}}", reg_cabecera[0]['total_g_dolar']);

    //footer dos
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);

    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}

const reporte_soles_dolar_sin_igv = async(req, res, id) =>{
    const config = {
        format: 'A4',
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_sol_dolar_sin.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_sol}</td>
            <td style="vertical-align: middle">${producto.pu_dolar}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_sol}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_dolar}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //fotter uno
    contenidoHtml = contenidoHtml.replace("{{total_g_sol}}", reg_cabecera[0]['total_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{total_g_dolar}}", reg_cabecera[0]['total_g_dolar']);

    //footer dos
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);

    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}



const reporte_pesos_dolar_con_igv = async(req, res, id) =>{
    const config = {
        format: 'A4',
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_peso_dolar_con.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_peso}</td>
            <td style="vertical-align: middle">${producto.pu_dolar}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_peso}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_dolar}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //fotter uno
    contenidoHtml = contenidoHtml.replace("{{sub_total_g_peso}}", reg_cabecera[0]['sub_total_g_peso']);
    contenidoHtml = contenidoHtml.replace("{{imp_g_peso}}", reg_cabecera[0]['imp_g_peso']);
    contenidoHtml = contenidoHtml.replace("{{total_g_peso}}", reg_cabecera[0]['total_g_peso']);
    contenidoHtml = contenidoHtml.replace("{{sub_total_g_dolar}}", reg_cabecera[0]['sub_total_g_dolar']);
    contenidoHtml = contenidoHtml.replace("{{imp_g_dolar}}", reg_cabecera[0]['imp_g_dolar']);
    contenidoHtml = contenidoHtml.replace("{{total_g_dolar}}", reg_cabecera[0]['total_g_dolar']);

    //footer dos
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);

    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}

const reporte_pesos_dolar_sin_igv = async(req, res, id) =>{
    const config = {
        format: 'A4',
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_peso_dolar_sin.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_peso}</td>
            <td style="vertical-align: middle">${producto.pu_dolar}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_peso}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_dolar}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //fotter uno
    contenidoHtml = contenidoHtml.replace("{{total_g_peso}}", reg_cabecera[0]['total_g_peso']);
    contenidoHtml = contenidoHtml.replace("{{total_g_dolar}}", reg_cabecera[0]['total_g_dolar']);

    //footer dos
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);

    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}



const reporte_soles_pesos_dolar_con_igv = async(req, res, id) =>{
    const options = {
        format: 'A4',
        orientation: 'landscape'
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_sol_peso_dolar_con.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_sol}</td>
            <td style="vertical-align: middle">${producto.pu_peso}</td>
            <td style="vertical-align: middle">${producto.pu_dolar}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_sol}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_peso}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_dolar}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var campos = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", campos)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //fotter uno
    contenidoHtml = contenidoHtml.replace("{{sub_total_g_sol}}", reg_cabecera[0]['sub_total_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{imp_g_sol}}", reg_cabecera[0]['imp_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{total_g_sol}}", reg_cabecera[0]['total_g_sol']);

    contenidoHtml = contenidoHtml.replace("{{sub_total_g_peso}}", reg_cabecera[0]['sub_total_g_peso']);
    contenidoHtml = contenidoHtml.replace("{{imp_g_peso}}", reg_cabecera[0]['imp_g_peso']);
    contenidoHtml = contenidoHtml.replace("{{total_g_peso}}", reg_cabecera[0]['total_g_peso']);

    contenidoHtml = contenidoHtml.replace("{{sub_total_g_dolar}}", reg_cabecera[0]['sub_total_g_dolar']);
    contenidoHtml = contenidoHtml.replace("{{imp_g_dolar}}", reg_cabecera[0]['imp_g_dolar']);
    contenidoHtml = contenidoHtml.replace("{{total_g_dolar}}", reg_cabecera[0]['total_g_dolar']);

    //footer dos
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);

    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, options).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}

const reporte_soles_pesos_dolar_sin_igv = async(req, res, id) =>{
    const config = {
        format: 'A4',
        orientation: 'landscape'
        //border: '0.2cm'
    }
    const ubicacionPlantilla = require.resolve("../plantilla/coti_sol_peso_dolar_sin.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');
    const reg_cabecera = await consultar_cabecera(req, res, id);
    const reg_detalle = await consultar_detalle_productos(req, res, id);

    let tabla = "";
    //let subtotal = 0;
    let contador = 0;
    for (const producto of reg_detalle) {
        contador ++;
        tabla += `<tr>
            <td style="vertical-align: middle">${contador}</td>
            <td style="vertical-align: middle"><img style="width: 88%" src="${producto.base}"></td>
            <td style="vertical-align: middle">${producto.cantidad}</td>
            <td style="vertical-align: middle">${producto.descripcion}</td>
            <td style="vertical-align: middle">${producto.marca_producto}</td>
            <td style="vertical-align: middle">${producto.modelo_producto}</td>
            <td style="vertical-align: middle">${producto.pu_sol}</td>
            <td style="vertical-align: middle">${producto.pu_peso}</td>
            <td style="vertical-align: middle">${producto.pu_dolar}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_sol}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_peso}</td>
            <td style="vertical-align: middle">${producto.sub_total_pu_dolar}</td>
        </tr>`;
        //console.log(`${imagen}`);
    }
    
    // const descuento = 0;
    // const subtotalConDescuento = subtotal - descuento;
    // const impuestos = subtotalConDescuento * 0.16
    // const total = subtotalConDescuento + impuestos;
    // Remplazar el valor {{tablaProductos}} por el verdadero valor

    //datos del cliente
    contenidoHtml = contenidoHtml.replace("{{nombre_cliente}}", reg_cabecera[0]['nombrecompleto']);
    contenidoHtml = contenidoHtml.replace("{{direccion}}", reg_cabecera[0]['direccion']);
    contenidoHtml = contenidoHtml.replace("{{ruc}}", reg_cabecera[0]['ruc']);
    contenidoHtml = contenidoHtml.replace("{{telefono}}", reg_cabecera[0]['telefono']);
    contenidoHtml = contenidoHtml.replace("{{email}}", reg_cabecera[0]['email']);
    contenidoHtml = contenidoHtml.replace("{{codigo}}", reg_cabecera[0]['codigo']);
    contenidoHtml = contenidoHtml.replace("{{usuario}}", reg_cabecera[0]['nombrecompleto'])

    //fecha de la cotizacion
    const fecha = reg_cabecera[0]['otra_fecha'];
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha_formateada = fecha.toLocaleDateString("es-ES", options)
    contenidoHtml = contenidoHtml.replace("{{fecha_registro_coti}}", fecha_formateada); 

    //listado de productos
    contenidoHtml = contenidoHtml.replace( "{{tablaProductos}}", tabla );

    //fotter uno
    contenidoHtml = contenidoHtml.replace("{{total_g_sol}}", reg_cabecera[0]['total_g_sol']);
    contenidoHtml = contenidoHtml.replace("{{total_g_peso}}", reg_cabecera[0]['total_g_peso']);
    contenidoHtml = contenidoHtml.replace("{{total_g_dolar}}", reg_cabecera[0]['total_g_dolar']);

    //footer dos
    let p_forma_pago = reg_cabecera[0]['forma_pago'];
    let p_contado = '';
    let p_credito = '';
    p_forma_pago == 'Contado' ? p_contado = 'X' : p_credito = 'X';
    contenidoHtml = contenidoHtml.replace("{{p_contado}}", p_contado);
    contenidoHtml = contenidoHtml.replace("{{p_credito}}", p_credito);


    let p_tipo_moneda = reg_cabecera[0]['tipo_moneda'];
    let p_resp_sol = '';
    let p_resp_peso = '';
    let p_resp_dolar = '';

    if (p_tipo_moneda == 'Sol') {
        p_resp_sol = 'X';
    }
    else if (p_tipo_moneda == 'Peso'){
        p_resp_peso = 'X';
    }
    else if (p_tipo_moneda == 'Dolar'){
        p_resp_dolar = 'X';
    }
    contenidoHtml = contenidoHtml.replace("{{p_resp_sol}}", p_resp_sol);
    contenidoHtml = contenidoHtml.replace("{{p_resp_peso}}", p_resp_peso);
    contenidoHtml = contenidoHtml.replace("{{p_resp_dolar}}", p_resp_dolar);

    contenidoHtml = contenidoHtml.replace("{{validez_oferta}}", reg_cabecera[0]['validez_oferta']);


    let p_impuesto = reg_cabecera[0]['tipo_impuesto'];
    let p_impuesto_si = '';
    let p_impuesto_no = '';

    if (p_impuesto == 'SI') {
        p_impuesto_si = 'X';
    }
    else{
        p_impuesto_no = 'X';
    }

    contenidoHtml = contenidoHtml.replace("{{p_impuesto_si}}", p_impuesto_si);
    contenidoHtml = contenidoHtml.replace("{{p_impuesto_no}}", p_impuesto_no);

    // Y también los otros valores
    // contenidoHtml = contenidoHtml.replace("{{descuento}}", formateador.format(descuento));
    // contenidoHtml = contenidoHtml.replace("{{subtotalConDescuento}}", formateador.format(subtotalConDescuento));
    // contenidoHtml = contenidoHtml.replace("{{impuestos}}", formateador.format(impuestos));
    // contenidoHtml = contenidoHtml.replace("{{total}}", formateador.format(total));
    //contenidoHtml = contenidoHtml.replace("{{firma_texsa}}", firma_texsa);
    pdf.create(contenidoHtml, config).toStream((error, stream) => {
        if (error) {
            return res.end('Errir creando el pPDF: '+err.stack)
        } else {
            res.setHeader("Content-Type", "application/pdf");
            stream.pipe(res);
        }
    });
}


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

function consultar_cabecera(req, res, id) {
    const query = `select 
    cot.cotiID, cot.codigo, cli.nombrecompleto, cli.direccion, cli.telefono, cli.ruc, cli.email,
    date_format(cot.fecha_reg, "%d-%m-%Y") as fecha_registro_coti, cot.fecha_reg as otra_fecha,
    cot.total_g_sol, cot.forma_pago, cot.validez_oferta, cot.tipo_impuesto, cot.total_g_peso,
    cot.total_g_dolar, cot.sub_total_g_sol, cot.sub_total_g_peso, cot.sub_total_g_dolar,
    cot.imp_g_sol, cot.imp_g_peso, cot.imp_g_dolar, cot.tipo_moneda, per.nombrecompleto
    from coti cot
    inner join cliente cli
    on cli.clienteID = cot.clienteID
    inner join usuario usu
    on usu.usuarioID = cot.registradoPorID
    inner join persona per
    on per.IDpersona = usu.IDpersona
    where cot.cotiID = "${id}"  `;

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
    de.cotiID,
    arc.nombre_archivo_server as imagen, de.cantidad, concat(pro.descripcion, ', deporte: ', dep.nombre_deporte,
    ', tela: ',tel.nombre_tela, ', talla: ',ta.descripcion_talla) as descripcion, pro.marca_producto, 
    pro.modelo_producto, (de.pu_sol + de.ce_sol) as pu_sol, (de.pu_peso + de.ce_peso) as pu_peso, 
    (de.pu_dolar + de.ce_dolar) pu_dolar, de.sub_total_pu_sol, de.sub_total_pu_peso, 
    de.sub_total_pu_dolar,arc.base, arc.nombre_archivo_original, arc.nombre_archivo_server
    from coti_detalle de
    inner join producto pro
    on pro.productoID = de.productoID
    inner join archivo arc
    on arc.productoID = pro.productoID
    inner join deporte dep
    on dep.deporteID = pro.deporteID
    inner join tela tel
    on tel.telaID = pro.telaID
    inner join talla ta
    on ta.tallaID = pro.talla_productoID
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


module.exports = {
    getReporteByID
}